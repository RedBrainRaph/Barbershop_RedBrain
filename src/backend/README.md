### Шаг 1: Настройка MySQL базы данных

# Импортируйте схему
```bash
mysql -u root -p < go-backend-example/schema.sql
```

Это создаст:
- ✅ База данных `barbershop`
- ✅ Таблицы: `barbers`, `services`, `bookings`
- ✅ Тестовые данные (4 барбера, 10 услуг)

### Шаг 2: Запуск Go бэкенда

```bash
cd go-backend-example
```

# Установите зависимости
```go mod download```
или
```go mod tidy```

# Запустите (с вашим паролем MySQL)
```MySql
DB_DSN="root:YOUR_PASSWORD@tcp(localhost:3306)/barbershop?parseTime=true" go run main.go
```
# Или в бэкенд папке создать папку .env и туда прописать
```
# База данных
DB_DSN=root:PASWORD@tcp(localhost:3306)/barbershop?charset=utf8&parseTime=True

# Telegram Bot
TELEGRAM_BOT_TOKEN=Введи токен своего бота
TELEGRAM_ADMIN_CHAT_ID=Введи ид свой для админки, в тг @userinfobot

# Порт сервера
PORT=8080
```

```bash
cd go-backend-example
export DB_DSN="root:пароль@tcp(localhost:3306)/barbershop?charset=utf8&parseTime=True"
export TELEGRAM_BOT_TOKEN="твой_токен бота без ковычек"
export TELEGRAM_ADMIN_CHAT_ID="твой_id тг без ковычек"
go run main.go telegram.go 
```

**Готово!** Сервер запущен на `http://localhost:8080`
