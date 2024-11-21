DROP DATABASE IF EXISTS posture_pal;

CREATE DATABASE posture_pal;

USE posture_pal;

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
