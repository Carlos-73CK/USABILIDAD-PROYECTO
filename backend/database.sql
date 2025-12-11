-- Script para crear la base de datos y tablas en phpMyAdmin (MySQL)

CREATE DATABASE IF NOT EXISTS salud_asist_db;
USE salud_asist_db;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL
);

-- Tabla de Historial de Diagnósticos
CREATE TABLE IF NOT EXISTS history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symptoms TEXT NOT NULL, -- Guardado como JSON o texto separado por comas
    diagnosis_result TEXT, -- JSON con los resultados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Usuario de prueba (Password: 123456)
-- Nota: En producción las contraseñas deben insertarse hasheadas por la aplicación.
-- INSERT INTO users (email, password_hash, full_name) VALUES ('usuario1@gmail.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Usuario Prueba');
