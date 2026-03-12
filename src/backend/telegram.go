package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/jmoiron/sqlx"
)

// TelegramBot структура для работы с ботом
type TelegramBot struct {
	Bot      *tgbotapi.BotAPI
	AdminID  int64
	Database *sqlx.DB
}

// BookingInfo структура для информации о записи
type BookingInfo struct {
	ID          int    `db:"id"`
	ClientName  string `db:"client_name"`
	ServiceName string `db:"service_name"`
	BarberName  string `db:"barber_name"`
	BookingDate string `db:"booking_date"`
	BookingTime string `db:"booking_time"`
	Status      string `db:"status"`
}

// InitTelegram инициализирует Telegram бота
func InitTelegram(db *sqlx.DB) (*TelegramBot, error) {
	token := os.Getenv("TELEGRAM_BOT_TOKEN")
	if token == "" {
		log.Println("⚠️ TELEGRAM_BOT_TOKEN не задан, бот не будет работать")
		return nil, nil
	}

	bot, err := tgbotapi.NewBotAPI(token)
	if err != nil {
		return nil, fmt.Errorf("ошибка создания бота: %v", err)
	}

	adminIDStr := os.Getenv("TELEGRAM_ADMIN_CHAT_ID")
	var adminID int64
	if adminIDStr != "" {
		adminID, _ = strconv.ParseInt(adminIDStr, 10, 64)
	}

	// Создаем таблицу для хранения chat_id клиентов
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS telegram_clients (
		username VARCHAR(100) PRIMARY KEY,
		chat_id BIGINT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	);`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Printf("⚠️ Ошибка создания таблицы telegram_clients: %v", err)
	}

	log.Println("✅ Telegram бот инициализирован:", bot.Self.UserName)

	return &TelegramBot{
		Bot:      bot,
		AdminID:  adminID,
		Database: db,
	}, nil
}

// StartListening запускает прослушивание сообщений от клиентов
func (tb *TelegramBot) StartListening() {
	if tb == nil || tb.Bot == nil {
		return
	}

	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60

	updates := tb.Bot.GetUpdatesChan(u)

	go func() {
		for update := range updates {
			if update.Message != nil {
				tb.handleMessage(update.Message)
			}
		}
	}()

	log.Println("👂 Telegram бот начал прослушивание сообщений")
}

// getLastBooking получает последнюю запись пользователя
func (tb *TelegramBot) getLastBooking(username string) (*BookingInfo, error) {
	var booking BookingInfo

	query := `
		SELECT 
			b.id,
			b.client_name,
			COALESCE(s.title, 'Услуга') as service_name,
			COALESCE(br.name, 'Любой барбер') as barber_name,
			b.booking_date,
			b.booking_time,
			b.status
		FROM bookings b
		LEFT JOIN services s ON b.service_id = s.id
		LEFT JOIN barbers br ON b.barber_id = br.id
		WHERE b.client_email = ?
		ORDER BY b.created_at DESC
		LIMIT 1
	`

	err := tb.Database.Get(&booking, query, username)
	if err != nil {
		return nil, err
	}

	return &booking, nil
}

// handleMessage обрабатывает входящие сообщения
func (tb *TelegramBot) handleMessage(message *tgbotapi.Message) {
	chatID := message.Chat.ID
	username := message.From.UserName
	text := message.Text

	log.Printf("📩 Получено сообщение от @%s: %s", username, text)

	// Сохраняем связь username -> chat_id
	if username != "" {
		_, err := tb.Database.Exec(`
			INSERT INTO telegram_clients (username, chat_id) 
			VALUES (?, ?) 
			ON DUPLICATE KEY UPDATE chat_id = ?
		`, "@"+username, chatID, chatID)

		if err != nil {
			log.Printf("❌ Ошибка сохранения chat_id для @%s: %v", username, err)
		}
	}

	// Получаем последнюю запись
	booking, err := tb.getLastBooking("@" + username)

	var response string

	if err == nil && booking != nil {
		// Форматируем дату
		dateFormatted, _ := time.Parse("2006-01-02", booking.BookingDate)
		dateStr := dateFormatted.Format("02.01.2006")

		// Определяем статус
		statusEmoji := "⏳"
		statusText := "ожидание"
		if booking.Status == "confirmed" {
			statusEmoji = "✅"
			statusText = "подтверждена"
		} else if booking.Status == "cancelled" {
			statusEmoji = "❌"
			statusText = "отменена"
		}

		response = fmt.Sprintf(
			"👋 *Здравствуйте, %s!*\n\n"+
				"📅 *Ваша последняя запись:*\n"+
				"💈 *Услуга:* %s\n"+
				"🧔 *Барбер:* %s\n"+
				"📆 *Дата:* %s\n"+
				"⏰ *Время:* %s\n"+
				"%s *Статус:* %s\n\n"+
				"✂️ Ждем вас в нашем барбершопе!",
			booking.ClientName,
			booking.ServiceName,
			booking.BarberName,
			dateStr,
			booking.BookingTime,
			statusEmoji,
			statusText,
		)
	} else {
		response = "👋 *Добро пожаловать!*\n\n" +
			"Я бот барбершопа. У вас пока нет записей.\n\n" +
			"✂️ Запишитесь на нашем сайте и я буду присылать вам уведомления!"
	}

	msg := tgbotapi.NewMessage(chatID, response)
	msg.ParseMode = "Markdown"

	_, err = tb.Bot.Send(msg)
	if err != nil {
		log.Printf("❌ Ошибка отправки сообщения: %v", err)
	}
}

// SendAdminNotification отправляет уведомление администратору
func (tb *TelegramBot) SendAdminNotification(booking BookingRequest, serviceName, barberName string) {
	if tb == nil || tb.Bot == nil || tb.AdminID == 0 {
		return
	}

	barberText := barberName
	if barberName == "" {
		barberText = "Любой барбер"
	}

	message := fmt.Sprintf(
		"✂️ *Новая запись в барбершоп!*\n\n"+
			"👤 *Клиент:* %s\n"+
			"📞 *Телефон:* %s\n"+
			"📱 *Telegram:* %s\n"+
			"💈 *Услуга:* %s\n"+
			"🧔 *Барбер:* %s\n"+
			"📅 *Дата:* %s\n"+
			"⏰ *Время:* %s",
		booking.ClientName,
		booking.ClientPhone,
		booking.ClientTelegram,
		serviceName,
		barberText,
		booking.BookingDate,
		booking.BookingTime,
	)

	msg := tgbotapi.NewMessage(tb.AdminID, message)
	msg.ParseMode = "Markdown"

	_, err := tb.Bot.Send(msg)
	if err != nil {
		log.Printf("❌ Ошибка отправки уведомления админу: %v", err)
	} else {
		log.Println("✅ Уведомление админу отправлено")
	}
}

// SendClientNotification отправляет уведомление клиенту
func (tb *TelegramBot) SendClientNotification(username string, booking BookingRequest, serviceName, barberName string) {
	if tb == nil || tb.Bot == nil || username == "" {
		return
	}

	// Ищем chat_id клиента в базе
	var chatID int64
	err := tb.Database.Get(&chatID, "SELECT chat_id FROM telegram_clients WHERE username = ?", username)
	if err != nil {
		log.Printf("Клиент %s еще не писал боту", username)
		return
	}

	barberText := barberName
	if barberName == "" {
		barberText = "Любой барбер"
	}

	message := fmt.Sprintf(
		"✅ *Запись подтверждена!*\n\n"+
			"💈 *Услуга:* %s\n"+
			"🧔 *Барбер:* %s\n"+
			"📅 *Дата:* %s\n"+
			"⏰ *Время:* %s\n\n"+
			"✂️ Ждем вас!",
		serviceName,
		barberText,
		booking.BookingDate,
		booking.BookingTime,
	)

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"

	_, err = tb.Bot.Send(msg)
	if err != nil {
		log.Printf("❌ Ошибка отправки уведомления клиенту %s: %v", username, err)
	} else {
		log.Printf("✅ Уведомление клиенту %s отправлено", username)
	}
}

// SendReminder отправляет напоминание о записи
func (tb *TelegramBot) SendReminder(username string, booking BookingRequest, serviceName, barberName string) {
	if tb == nil || tb.Bot == nil || username == "" {
		return
	}

	var chatID int64
	err := tb.Database.Get(&chatID, "SELECT chat_id FROM telegram_clients WHERE username = ?", username)
	if err != nil {
		log.Printf("Клиент %s еще не писал боту", username)
		return
	}

	barberText := barberName
	if barberName == "" {
		barberText = "Любой барбер"
	}

	message := fmt.Sprintf(
		"🔔 *Напоминание!*\n\n"+
			"Через час у вас запись:\n"+
			"💈 *Услуга:* %s\n"+
			"🧔 *Барбер:* %s\n"+
			"📅 *Дата:* %s\n"+
			"⏰ *Время:* %s\n\n"+
			"✂️ Ждем вас!",
		serviceName,
		barberText,
		booking.BookingDate,
		booking.BookingTime,
	)

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"

	_, err = tb.Bot.Send(msg)
	if err != nil {
		log.Printf("❌ Ошибка отправки напоминания: %v", err)
	}
}
