from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(30))
    google_client_id = db.Column(db.String(255), unique=True)
    token = db.Column(db.String(255))
    login = db.Column(db.Integer)
    read_access = db.Column(db.Integer)     # to change access permissions
    write_access = db.Column(db.Integer)    # to change access permissions
    email = db.Column(db.String(30))

    
    def __init__(self, name, google_client_id, token, login, read_access, write_access, email):
        self.name = name
        self.google_client_id = google_client_id
        self.token = token
        self.login = login
        self.read_access = read_access
        self.write_access = write_access
        self.email = email



class SensorData(db.Model):
    __tablename__ = "sensor_data"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  
    temperature = db.Column(db.Float, nullable=False)
    temperature_status = db.Column(db.String(10), nullable=False)
    humidity = db.Column(db.Float, nullable=False) 
    humidity_status = db.Column(db.String(10), nullable=False)
    pitch = db.Column(db.Float, nullable=False)  
    gravity_x = db.Column(db.Float, nullable=False) 
    gravity_y = db.Column(db.Float, nullable=False)  
    gravity_z = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())

    def __init__(self, user_id, temperature, temperature_status, humidity, humidity_status, pitch, gravity_x, gravity_y, gravity_z):
        self.user_id = user_id
        self.temperature = temperature
        self.temperature_status = temperature_status
        self.humidity = humidity
        self.humidity_status = humidity_status
        self.pitch = pitch
        self.gravity_x = gravity_x
        self.gravity_y = gravity_y
        self.gravity_z = gravity_z

class Threshold(db.Model):
    __tablename__ = "threshold"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    temp_overheat = db.Column(db.Float, default=37.5)
    temp_cold = db.Column(db.Float, default=15.0)      
    humid_high = db.Column(db.Float, default=80.0)    
    humid_low = db.Column(db.Float, default=20.0)      
    pitch = db.Column(db.Float, default=0.0)          
    gravity_x = db.Column(db.Float, default=0.0)       
    gravity_y = db.Column(db.Float, default=0.0)       
    gravity_z = db.Column(db.Float, default=1.0)       
    
    def __init__(self, user_id, temp_overheat=None, temp_cold=None, humid_high=None, humid_low=None, pitch=None, gravity=None):
        self.user_id = user_id
        if temp_overheat is not None:
            self.temp_overheat = temp_overheat
        if temp_cold is not None:
            self.temp_cold = temp_cold
        if humid_high is not None:
            self.humid_high = humid_high
        if humid_low is not None:
            self.humid_low = humid_low
        if pitch is not None:
            self.pitch = pitch
        if gravity is not None:
            self.gravity_x = gravity[0]
            self.gravity_y = gravity[1]
            self.gravity_z = gravity[2]
    
    def update_thresholds(self, temp_overheat=None, temp_cold=None, humid_high=None, humid_low=None, pitch=None, gravity=None):
        if temp_overheat is not None:
            self.temp_overheat = temp_overheat
        if temp_cold is not None:
            self.temp_cold = temp_cold
        if humid_high is not None:
            self.humid_high = humid_high
        if humid_low is not None:
            self.humid_low = humid_low
        if pitch is not None:
            self.pitch = pitch
        if gravity is not None:
            self.gravity_x = gravity[0]
            self.gravity_y = gravity[1]
            self.gravity_z = gravity[2]
        db.session.commit()

def get_user_row_if_exists(google_client_id):
    return User.query.filter_by(google_client_id=google_client_id).first()

def add_user_and_login(name, google_client_id, email):
    user = get_user_row_if_exists(google_client_id)
    
    if user:
        user.login = 1
        db.session.commit()
    else:
        new_user = User(name, google_client_id, None, 1, 0, 0, email)
        db.session.add(new_user)
        db.session.commit()

def get_user_by_email(email):
    try:
        user = User.query.filter_by(email=email).first()
        
        if user:
            return {"id": user.id, "name": user.name, "email": user.email}
        else:
            return None
    except Exception as e:
        print(f"Error retrieving user by email: {e}")
        return None

def get_threshold_by_user_id(user_id):
    try:
        threshold = Threshold.query.filter_by(user_id=user_id).first()

        if threshold:
            return {
                "user_id": threshold.user_id,
                "threshold_yaw": threshold.threshold_yaw,
                "threshold_pitch": threshold.threshold_pitch,
                "threshold_roll": threshold.threshold_roll,
                "threshold_temperature": threshold.threshold_temperature,
                "threshold_humidity": threshold.threshold_humidity
            }
        else:
            return {"error": "No threshold values found for the given user ID."}

    except Exception as e:
        print(f"Error retrieving threshold values: {e}")
        return {"error": "An error occurred while retrieving threshold values."}


def save_sensor_data(sensor_data, user_id):
    try:
        gravity_vector = sensor_data.get("gravity_vector", [None, None, None])
        gravity_x = gravity_vector[0] if len(gravity_vector) > 0 else None
        gravity_y = gravity_vector[1] if len(gravity_vector) > 1 else None
        gravity_z = gravity_vector[2] if len(gravity_vector) > 2 else None

        new_data = SensorData(
            user_id=user_id,
            temperature=sensor_data.get("temperature"),
            temperature_status=sensor_data.get("temperature_status"),
            humidity=sensor_data.get("humidity"),
            humidity_status=sensor_data.get("humidity_status"),
            pitch=sensor_data.get("pitch"),
            gravity_x=gravity_x,
            gravity_y=gravity_y,
            gravity_z=gravity_z,
        )
        db.session.add(new_data)
        db.session.commit()
        return "Sensor data saved successfully."
    except Exception as e:
        db.session.rollback()
        print(f"Error in save_sensor_data: {e}")
        raise Exception(f"Error saving sensor data: {e}")




def get_sensor_data_by_user_id(user_id):
    try:
        # fetch all sensor data entries for a given user 
        sensor_data_entries = SensorData.query.filter_by(user_id=user_id).all()

        if sensor_data_entries:
            # convert sensor data entries to a list of dictionaries
            sensor_data_list = [
                {
                    "id": entry.id,
                    "yaw": entry.yaw,
                    "pitch": entry.pitch,
                    "roll": entry.roll,
                    "temperature": entry.temperature,
                    "humidity": entry.humidity,
                    "timestamp": entry.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                }
                for entry in sensor_data_entries
            ]
            return sensor_data_list
        else:
            return {"error": "No sensor data found for the given user ID."}

    except Exception as e:
        print(f"Error retrieving sensor data: {e}")
        return {"error": "An error occurred while retrieving sensor data."}
