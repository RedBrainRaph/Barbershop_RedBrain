-- Create database
CREATE DATABASE IF NOT EXISTS barbershop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barbershop;

-- Barbers table
CREATE TABLE barbers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    photo_url VARCHAR(255),
    specialty VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Services table
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price INT NOT NULL,
    duration INT NOT NULL,
    icon VARCHAR(50),
    category ENUM('main', 'additional') DEFAULT 'main',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_name VARCHAR(100) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    client_email VARCHAR(100) NOT NULL,
    service_id INT NOT NULL,
    barber_id INT,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE SET NULL,
    INDEX idx_date_time (booking_date, booking_time),
    INDEX idx_barber_date (barber_id, booking_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample barbers
INSERT INTO barbers (name, specialty) VALUES
('Иван Петров', 'Классические стрижки'),
('Александр Смирной', 'Современные стили'),
('Дмитрий Иванов', 'Бритье и борода'),
('Никита Гапоненко', 'Топ барбер');

-- Insert sample services
INSERT INTO services (title, description, price, duration, icon, category) VALUES
('Мужская стрижка', 'Классическая или современная стрижка от наших опытных мастеров', 2500, 60, 'scissors', 'main'),
('Моделирование бороды', 'Профессиональная укладка и моделирование бороды любой формы', 1800, 30, 'sparkles', 'main'),
('Королевское бритье', 'Традиционное бритье опасной бритвой с горячим полотенцем', 2000, 60, 'droplets', 'main'),
('Комплексный уход', 'Стрижка + моделирование бороды + уход за кожей лица', 3500, 90, 'heart', 'main'),
('Камуфлирование седины', '', 800, 30, '', 'additional'),
('Коррекция бровей', '', 500, 30, '', 'additional'),
('Детская стрижка (до 12 лет)', '', 1500, 60, '', 'additional'),
('Стрижка машинкой под одну насадку', '', 1200, 30, '', 'additional'),
('Укладка волос', '', 800, 30, '', 'additional'),
('Черная маска для лица', '', 800, 30, '', 'additional');
