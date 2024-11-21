-------------------------------- SENSOR_DATA TABLE ---------------------------
-- DROP IF EXISTS
DROP TRIGGER IF EXISTS after_sensor_data_insert;
DROP TRIGGER IF EXISTS after_sensor_data_update;
DROP TRIGGER IF EXISTS after_sensor_data_delete;
DROP TABLE IF EXISTS sensor_data_log;

-- TBALE FOR SENSOR DATA LOGS

CREATE TABLE sensor_data_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50),
    action_type VARCHAR(10),  -- 'INSERT', 'UPDATE', 'DELETE'
    table_name VARCHAR(50),   -- Name of the table, e.g., 'sensor_data'
    timestamp DATETIME,
    affected_data JSON
);

-- TRIGGERS: INSERT, UPDATE, DELETE

DELIMITER $$

CREATE TRIGGER after_sensor_data_insert
AFTER INSERT ON sensor_data
FOR EACH ROW
BEGIN
    INSERT INTO sensor_data_log (
        user_name,
        action_type,
        table_name,
        timestamp,
        affected_data
    )
    VALUES (
        USER(),
        'INSERT',
        'sensor_data',
        NOW(),
        JSON_OBJECT(
            'user_id', NEW.user_id, 
            'temperature', NEW.temperature, 
            'temperature_status', NEW.temperature_status, 
            'humidity', NEW.humidity, 
            'humidity_status', NEW.humidity_status,
            'pitch', NEW.pitch,
            'gravity_x', NEW.gravity_x,
            'gravity_y', NEW.gravity_y,
            'gravity_z', NEW.gravity_z,
            'timestamp', NEW.timestamp
        )
    );
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER after_sensor_data_update
AFTER UPDATE ON sensor_data
FOR EACH ROW
BEGIN
    INSERT INTO sensor_data_log (
        user_name,
        action_type,
        table_name,
        timestamp,
        affected_data
    )
    VALUES (
        USER(),
        'UPDATE',
        'sensor_data',
        NOW(),
        JSON_OBJECT(
            'user_id', NEW.user_id, 
            'temperature', NEW.temperature, 
            'temperature_status', NEW.temperature_status, 
            'humidity', NEW.humidity, 
            'humidity_status', NEW.humidity_status,
            'pitch', NEW.pitch,
            'gravity_x', NEW.gravity_x,
            'gravity_y', NEW.gravity_y,
            'gravity_z', NEW.gravity_z,
            'timestamp', NEW.timestamp
        )
    );
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER after_sensor_data_delete
AFTER DELETE ON sensor_data
FOR EACH ROW
BEGIN
    INSERT INTO sensor_data_log (
        user_name,
        action_type,
        table_name,
        timestamp,
        affected_data
    )
    VALUES (
        USER(),
        'DELETE',
        'sensor_data',
        NOW(),
        JSON_OBJECT(
            'user_id', OLD.user_id, 
            'temperature', OLD.temperature, 
            'temperature_status', OLD.temperature_status, 
            'humidity', OLD.humidity, 
            'humidity_status', OLD.humidity_status,
            'pitch', OLD.pitch,
            'gravity_x', OLD.gravity_x,
            'gravity_y', OLD.gravity_y,
            'gravity_z', OLD.gravity_z,
            'timestamp', OLD.timestamp
        )
    );
END$$

DELIMITER ;


-- TEST DATA

INSERT INTO sensor_data (
    user_id, 
    temperature, 
    temperature_status, 
    humidity, 
    humidity_status, 
    pitch, 
    gravity_x, 
    gravity_y, 
    gravity_z, 
    timestamp
) 
VALUES (
    3, 
    21.2, 
    'normal', 
    63.2, 
    'normal', 
    -15.3125, 
    -2.59, 
    -1.27, 
    9.37, 
    '2024-11-21 18:58:32'
);

UPDATE sensor_data
SET temperature = 22.5
WHERE id = 399;

DELETE FROM sensor_data
WHERE id = 398;


SELECT * FROM sensor_data_log;

-------------------------------- USERS TABLE ---------------------------

CREATE TABLE user_data_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50),
    action_type VARCHAR(10),  -- 'INSERT', 'UPDATE', 'DELETE'
    table_name VARCHAR(50) DEFAULT 'users', -- Name of the affected table
    timestamp DATETIME,
    affected_data JSON  -- Store affected data (e.g., updated fields)
);

DELIMITER $$

CREATE TRIGGER after_users_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_data_log (
        user_name,
        action_type,
        table_name,
        timestamp,
        affected_data
    )
    VALUES (
        NEW.name,
        'INSERT',
        'users',
        NOW(),
        JSON_OBJECT(
            'id', NEW.id,
            'name', NEW.name,
            'google_client_id', NEW.google_client_id,
            'token', NEW.token,
            'login', NEW.login,
            'read_access', NEW.read_access,
            'write_access', NEW.write_access,
            'email', NEW.email
        )
    );
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER after_users_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_data_log (
        user_name,
        action_type,
        table_name,
        timestamp,
        affected_data
    )
    VALUES (
        NEW.name,
        'UPDATE',
        'users',
        NOW(),
        JSON_OBJECT(
            'id', NEW.id,
            'name', NEW.name,
            'google_client_id', NEW.google_client_id,
            'token', NEW.token,
            'login', NEW.login,
            'read_access', NEW.read_access,
            'write_access', NEW.write_access,
            'email', NEW.email
        )
    );
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER after_users_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_data_log (
        user_name,
        action_type,
        table_name,
        timestamp,
        affected_data
    )
    VALUES (
        OLD.name,
        'DELETE',
        'users',
        NOW(),
        JSON_OBJECT(
            'id', OLD.id,
            'name', OLD.name,
            'google_client_id', OLD.google_client_id,
            'token', OLD.token,
            'login', OLD.login,
            'read_access', OLD.read_access,
            'write_access', OLD.write_access,
            'email', OLD.email
        )
    );
END$$

DELIMITER ;

-- TEST DATA
INSERT INTO users (
    name,
    google_client_id,
    token,
    login,
    read_access,
    write_access,
    email
)
VALUES (
    'John Doe',
    '12345-google',
    'token123',
    1,
    1,
    1,
    'john.doe@example.com'
);

UPDATE users
SET token = 'updatedToken123',
    login = 2
WHERE id = 4;

DELETE FROM users
WHERE id = 4;

SELECT * FROM user_data_log;


-------------------------------- THRESHOLD TABLE ---------------------------
-- Table for Threshold Data Logs
CREATE TABLE threshold_data_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(10),  -- 'INSERT', 'UPDATE', 'DELETE'
    table_name VARCHAR(50) DEFAULT 'threshold',  -- Name of the affected table
    timestamp DATETIME,
    affected_data JSON  -- Store affected data (e.g., updated fields)
);

-- Trigger for INSERT
DELIMITER $$
CREATE TRIGGER after_threshold_insert
AFTER INSERT ON threshold
FOR EACH ROW
BEGIN
    INSERT INTO threshold_data_log (
        user_id,
        action_type,
        table_name,
        timestamp,
        affected_data
    )
    VALUES (
        NEW.user_id,
        'INSERT',
        'threshold',
        NOW(),
        JSON_OBJECT(
            'id', NEW.id,
            'temp_overheat', NEW.temp_overheat,
            'temp_cold', NEW.temp_cold,
            'humid_high', NEW.humid_high,
            'humid_low', NEW.humid_low,
            'pitch', NEW.pitch,
            'gravity_x', NEW.gravity_x,
            'gravity_y', NEW.gravity_y,
            'gravity_z', NEW.gravity_z
        )
    );
END$$
DELIMITER ;

-- Trigger for UPDATE
DELIMITER $$
CREATE TRIGGER after_threshold_update
AFTER UPDATE ON threshold
FOR EACH ROW
BEGIN
    INSERT INTO threshold_data_log (
        user_id,
        action_type,
        table_name,
        timestamp,
        affected_data
    )
    VALUES (
        NEW.user_id,
        'UPDATE',
        'threshold',
        NOW(),
        JSON_OBJECT(
            'id', NEW.id,
            'temp_overheat', NEW.temp_overheat,
            'temp_cold', NEW.temp_cold,
            'humid_high', NEW.humid_high,
            'humid_low', NEW.humid_low,
            'pitch', NEW.pitch,
            'gravity_x', NEW.gravity_x,
            'gravity_y', NEW.gravity_y,
            'gravity_z', NEW.gravity_z
        )
    );
END$$
DELIMITER ;

-- Trigger for DELETE
DELIMITER $$
CREATE TRIGGER after_threshold_delete
AFTER DELETE ON threshold
FOR EACH ROW
BEGIN
    INSERT INTO threshold_data_log (
        user_id,
        action_type,
        table_name,
        timestamp,
        affected_data
    )
    VALUES (
        OLD.user_id,
        'DELETE',
        'threshold',
        NOW(),
        JSON_OBJECT(
            'id', OLD.id,
            'temp_overheat', OLD.temp_overheat,
            'temp_cold', OLD.temp_cold,
            'humid_high', OLD.humid_high,
            'humid_low', OLD.humid_low,
            'pitch', OLD.pitch,
            'gravity_x', OLD.gravity_x,
            'gravity_y', OLD.gravity_y,
            'gravity_z', OLD.gravity_z
        )
    );
END$$
DELIMITER ;

-- Sample Queries
-- Insert Test Data
INSERT INTO threshold (
    id, user_id, temp_overheat, temp_cold, humid_high, humid_low, pitch, gravity_x, gravity_y, gravity_z
) VALUES (
    5, 3, 38.0, 14.0, 85.0, 18.0, 0.5, 1.0, 0.5, 0.8
);

-- Update Test Data
UPDATE threshold
SET temp_overheat = 39.0, humid_low = 15.0
WHERE id = 3;

-- Delete Test Data
DELETE FROM threshold
WHERE id = 3;

-- View Log Table
SELECT * FROM threshold_data_log;
