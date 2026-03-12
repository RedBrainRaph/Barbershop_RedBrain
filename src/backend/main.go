package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

var db *sqlx.DB
var telegramBot *TelegramBot // Telegram бот

// Модели данных
type Service struct {
	ID          int     `db:"id" json:"id"`
	Title       string  `db:"title" json:"title"`
	Description *string `db:"description" json:"description,omitempty"`
	Price       int     `db:"price" json:"price"`
	Duration    int     `db:"duration" json:"duration"`
	Icon        *string `db:"icon" json:"icon,omitempty"`
	Category    *string `db:"category" json:"category,omitempty"`
}

type Barber struct {
	ID       int     `db:"id" json:"id"`
	Name     string  `db:"name" json:"name"`
	PhotoURL *string `db:"photo_url" json:"photo_url,omitempty"`
}

// BookingRequest - используем Telegram вместо email
type BookingRequest struct {
	ClientName     string `json:"client_name" binding:"required"`
	ClientPhone    string `json:"client_phone" binding:"required"`
	ClientTelegram string `json:"client_telegram" binding:"required"`
	ServiceID      int    `json:"service_id" binding:"required"`
	BarberID       *int   `json:"barber_id"`
	BookingDate    string `json:"booking_date" binding:"required"`
	BookingTime    string `json:"booking_time" binding:"required"`
}

// Вспомогательные функции для получения имен
func getServiceName(serviceID int) (string, error) {
	var name string
	err := db.Get(&name, "SELECT title FROM services WHERE id = ?", serviceID)
	return name, err
}

func getBarberName(barberID *int) (string, error) {
	if barberID == nil {
		return "Любой барбер", nil
	}
	var name string
	err := db.Get(&name, "SELECT name FROM barbers WHERE id = ?", barberID)
	return name, err
}

// Обработчики API
func getServices(c *gin.Context) {
	var services []Service

	err := db.Select(&services, `
		SELECT id, title, description, price, duration, icon, category 
		FROM services 
		ORDER BY 
			CASE category 
				WHEN 'main' THEN 1 
				WHEN 'additional' THEN 2 
				ELSE 3 
			END, id
	`)
	if err != nil {
		log.Printf("Error fetching services: %v", err)
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if services == nil {
		services = []Service{}
	}

	c.JSON(200, services)
}

func getBarbers(c *gin.Context) {
	var barbers []Barber

	err := db.Select(&barbers, "SELECT id, name, photo_url FROM barbers ORDER BY name")
	if err != nil {
		log.Printf("Error fetching barbers: %v", err)
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if barbers == nil {
		barbers = []Barber{}
	}

	c.JSON(200, barbers)
}

func createBooking(c *gin.Context) {
	var req BookingRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Неверный формат данных"})
		return
	}

	// Проверка на конфликт времени
	var count int

	if req.BarberID != nil {
		err := db.Get(&count, `
			SELECT COUNT(*) FROM bookings 
			WHERE booking_date = ? AND booking_time = ? 
			AND barber_id = ?
			AND status != 'cancelled'
		`, req.BookingDate, req.BookingTime, req.BarberID)

		if err != nil {
			log.Printf("Error checking booking conflicts: %v", err)
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
	} else {
		err := db.Get(&count, `
			SELECT COUNT(*) FROM bookings 
			WHERE booking_date = ? AND booking_time = ? 
			AND status != 'cancelled'
		`, req.BookingDate, req.BookingTime)

		if err != nil {
			log.Printf("Error checking booking conflicts: %v", err)
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
	}

	if count > 0 {
		c.JSON(409, gin.H{"error": "Это время уже занято"})
		return
	}

	// Создание записи в БД (client_email хранит Telegram)
	var result interface{}
	var err error

	if req.BarberID != nil {
		result, err = db.Exec(`
			INSERT INTO bookings 
			(client_name, client_phone, client_email, service_id, barber_id, booking_date, booking_time, status)
			VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
		`, req.ClientName, req.ClientPhone, req.ClientTelegram, req.ServiceID, req.BarberID, req.BookingDate, req.BookingTime)
	} else {
		result, err = db.Exec(`
			INSERT INTO bookings 
			(client_name, client_phone, client_email, service_id, barber_id, booking_date, booking_time, status)
			VALUES (?, ?, ?, ?, NULL, ?, ?, 'pending')
		`, req.ClientName, req.ClientPhone, req.ClientTelegram, req.ServiceID, req.BookingDate, req.BookingTime)
	}

	if err != nil {
		log.Printf("Error creating booking: %v", err)
		c.JSON(500, gin.H{"error": "Не удалось создать запись: " + err.Error()})
		return
	}

	id, _ := result.(interface{ LastInsertId() (int64, error) }).LastInsertId()

	// Отправляем уведомления в Telegram (асинхронно)
	if telegramBot != nil {
		go func() {
			serviceName, _ := getServiceName(req.ServiceID)
			barberName, _ := getBarberName(req.BarberID)

			// Уведомление админу
			telegramBot.SendAdminNotification(req, serviceName, barberName)

			// Уведомление клиенту (если указан Telegram)
			if req.ClientTelegram != "" {
				telegramBot.SendClientNotification(req.ClientTelegram, req, serviceName, barberName)
			}
		}()
	}

	c.JSON(200, gin.H{
		"id":      id,
		"message": "Запись успешно создана",
	})
}

// ШТука чтобы не показывать занятое время
// GetAvailableSlots возвращает свободное время для выбранной даты и барбера
func getAvailableSlots(c *gin.Context) {
	date := c.Query("date")
	barberID := c.Query("barber_id")

	if date == "" {
		c.JSON(400, gin.H{"error": "Date is required"})
		return
	}

	// Все возможные слоты времени
	allSlots := []string{
		"10:00", "11:00", "12:00", "13:00", "14:00",
		"15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
	}

	// Получаем занятые слоты из БД
	var bookedSlots []string
	var err error

	if barberID != "" && barberID != "0" {
		// Для конкретного барбера
		err = db.Select(&bookedSlots, `
			SELECT booking_time FROM bookings 
			WHERE booking_date = ? AND barber_id = ? 
			AND status != 'cancelled'
		`, date, barberID)
	} else {
		// Для любого барбера (если клиенту все равно)
		err = db.Select(&bookedSlots, `
			SELECT booking_time FROM bookings 
			WHERE booking_date = ? 
			AND status != 'cancelled'
		`, date)
	}

	if err != nil {
		log.Printf("Error fetching booked slots: %v", err)
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Создаем map для быстрого поиска занятых слотов
	bookedMap := make(map[string]bool)
	for _, slot := range bookedSlots {
		bookedMap[slot] = true
	}

	// Формируем список свободных слотов
	availableSlots := []string{}
	for _, slot := range allSlots {
		if !bookedMap[slot] {
			availableSlots = append(availableSlots, slot)
		}
	}

	c.JSON(200, availableSlots)
}

func main() {
	// Подключение к базе данных
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("DB_DSN environment variable not set")
	}

	var err error
	db, err = sqlx.Connect("mysql", dsn)
	if err != nil {
		log.Fatal("Cannot connect to database:", err)
	}
	defer db.Close()

	// Проверяем подключение
	err = db.Ping()
	if err != nil {
		log.Fatal("Cannot ping database:", err)
	}
	log.Println("✅ Connected to database successfully")

	// Инициализация Telegram бота
	telegramBot, err = InitTelegram(db)
	if err != nil {
		log.Printf("⚠️ Telegram bot initialization failed: %v", err)
	}
	// Запуск прослушивания сообщений
	if telegramBot != nil {
		telegramBot.StartListening()
	}

	// Gin setup
	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Routes
	api := r.Group("/api")
	{
		api.GET("/services", getServices)
		api.GET("/barbers", getBarbers)
		api.POST("/bookings", createBooking)
		api.GET("/available-slots", getAvailableSlots) // штука чтобы не показывать время занятое
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	r.Run(":" + port)
}
