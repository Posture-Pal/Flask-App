-- Create Database
DROP DATABASE IF EXISTS posture_pal;

CREATE DATABASE posture_pal;

USE posture_pal;

-- Create required tables
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30),
    google_client_id VARCHAR(255) UNIQUE NOT NULL,
    token VARCHAR(255),
    login INT DEFAULT 0,
    read_access INT DEFAULT 0,
    write_access INT DEFAULT 0,
    email VARCHAR(255)
);

CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    temperature FLOAT NOT NULL,
    temperature_status VARCHAR(10) NOT NULL,
    humidity FLOAT NOT NULL,
    humidity_status VARCHAR(10) NOT NULL,
    pitch FLOAT NOT NULL,
    gravity_x FLOAT NOT NULL,
    gravity_y FLOAT NOT NULL,
    gravity_z FLOAT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE threshold (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    temp_overheat FLOAT DEFAULT 37.5,
    temp_cold FLOAT DEFAULT 15,
    humid_high FLOAT DEFAULT 80,
    humid_low FLOAT DEFAULT 20,
    pitch FLOAT DEFAULT 0,
    gravity_x FLOAT DEFAULT 0,
    gravity_y FLOAT DEFAULT 0,
    gravity_z FLOAT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE power_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,  
    user_id INT NOT NULL,             
    power_on BOOLEAN NOT NULL,           
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,  
    FOREIGN KEY (user_id) REFERENCES users(id)  
);


-- Sample User Account
INSERT INTO users (id, name, google_client_id, token, login, read_access, write_access, email)
VALUES (1, 'John', '103440899543345016347', NULL, 1, 0, 0, 'johnposturepal@gmail.com');

-- Threshold data
INSERT INTO threshold (user_id, temp_overheat, temp_cold, humid_high, humid_low, pitch, gravity_x, gravity_y, gravity_z) 
VALUES
(1, 37.8, 15.8, 85.2, 26.0, 5.0, 0.0, 0.0, 1.0);

-- Sensor data for Day 1
INSERT INTO sensor_data (user_id, temperature, temperature_status, humidity, humidity_status, pitch, gravity_x, gravity_y, gravity_z, timestamp) 
VALUES
(1, 18.6, 'normal', 41.7, 'normal', -2.4, -0.42, -0.02, 9.77, '2024-12-01 08:15:00'),
(1, 18.8, 'normal', 41.9, 'normal', -2.3, -0.41, -0.01, 9.76, '2024-12-01 08:45:00'),
(1, 19.1, 'normal', 42.0, 'normal', -2.2, -0.43, -0.02, 9.78, '2024-12-01 09:15:00'),
(1, 38.5, 'high', 86.5, 'high', -2.7, -0.43, -0.02, 9.74, '2024-12-01 09:45:00'), 
(1, 18.9, 'normal', 42.1, 'normal', -2.5, -0.40, -0.01, 9.79, '2024-12-01 10:00:00'),
(1, 19.3, 'normal', 42.3, 'normal', -2.1, -0.44, -0.01, 9.81, '2024-12-01 11:00:00'),
(1, 19.4, 'normal', 42.5, 'normal', -2.0, -0.45, -0.02, 9.82, '2024-12-01 12:00:00'),
(1, 18.7, 'normal', 41.8, 'normal', -2.3, -0.41, -0.01, 9.75, '2024-12-01 14:15:00'),
(1, 19.0, 'normal', 42.2, 'normal', -2.2, -0.42, -0.02, 9.78, '2024-12-01 16:30:00'),
(1, 19.2, 'normal', 42.4, 'normal', -2.0, -0.43, -0.01, 9.79, '2024-12-01 18:00:00');

-- Sensor data for Day 2
INSERT INTO sensor_data (user_id, temperature, temperature_status, humidity, humidity_status, pitch, gravity_x, gravity_y, gravity_z, timestamp) 
VALUES
(1, 19.0, 'normal', 42.0, 'normal', -2.6, -0.43, -0.02, 9.78, '2024-12-02 08:00:00'),
(1, 18.9, 'normal', 41.9, 'normal', -2.7, -0.42, -0.01, 9.76, '2024-12-02 08:30:00'),
(1, 19.1, 'normal', 42.1, 'normal', -2.5, -0.44, -0.02, 9.79, '2024-12-02 09:15:00'),
(1, 18.7, 'normal', 41.7, 'normal', -2.8, -0.41, -0.01, 9.75, '2024-12-02 10:15:00'),
(1, 19.2, 'normal', 42.3, 'normal', -2.4, -0.45, -0.02, 9.81, '2024-12-02 11:30:00'),
(1, 18.8, 'normal', 41.9, 'normal', -2.6, -0.42, -0.01, 9.78, '2024-12-02 13:00:00'),
(1, 19.3, 'normal', 42.5, 'normal', -2.3, -0.43, -0.02, 9.82, '2024-12-02 14:45:00'),
(1, 19.1, 'normal', 42.2, 'normal', -2.5, -0.42, -0.01, 9.79, '2024-12-02 16:30:00'),
(1, 18.6, 'normal', 41.8, 'normal', -2.9, -0.41, -0.02, 9.75, '2024-12-02 17:45:00');

-- Power sessions 
INSERT INTO power_sessions (user_id, power_on, timestamp) 
VALUES
(1, TRUE, '2024-12-01 07:45:00'), 
(1, FALSE, '2024-12-01 12:15:00'),
(1, TRUE, '2024-12-01 13:30:00'), 
(1, FALSE, '2024-12-01 18:15:00');

-- Power sessions for another day
INSERT INTO power_sessions (user_id, power_on, timestamp) 
VALUES
(1, TRUE, '2024-12-02 07:30:00'), 
(1, FALSE, '2024-12-02 12:00:00'),
(1, TRUE, '2024-12-02 14:00:00'), 
(1, FALSE, '2024-12-02 18:00:00');
