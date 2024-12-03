from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import and_

db = SQLAlchemy()

# users table
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


# sensor data table
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

# threshold data table
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
    
    # function to update threshold values
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


# power sessions table
class PowerSessions(db.Model):
    __tablename__ = "power_sessions"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    power_on = db.Column(db.Boolean, nullable=False)  # True = Power On, False = Power Off
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())


    def __init__(self, user_id, power_on, timestamp=None):
        self.user_id = user_id
        self.power_on = power_on
        self.timestamp = timestamp if timestamp else db.func.current_timestamp()

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


def get_power_sessions_by_user_id(user_id):
    try:
        power_sessions = PowerSessions.query.filter_by(user_id=user_id).order_by(PowerSessions.timestamp).all()
        return [
            {
                "power_on": session.power_on,
                "timestamp": session.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            } for session in power_sessions
        ]
    except Exception as e:
        print(f"Error retrieving power sessions: {e}")
        return []



def get_sensor_data_by_user_id(user_id):
    try:
        sensor_data = SensorData.query.filter_by(user_id=user_id).order_by(SensorData.timestamp).all()
        return [
            {
                "temperature": data.temperature,
                "temperature_status": data.temperature_status,
                "humidity": data.humidity,
                "humidity_status": data.humidity_status,
                "pitch": data.pitch,
                "gravity_x": data.gravity_x,
                "gravity_y": data.gravity_y,
                "gravity_z": data.gravity_z,
                "timestamp": data.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            } for data in sensor_data
        ]
    except Exception as e:
        print(f"Error retrieving sensor data: {e}")
        return []

def has_threshold_for_user(user_id):
    try:
        count = Threshold.query.filter_by(user_id=user_id).count()
        return count > 0 
    except Exception as e:
        print(f"Error checking threshold existence: {e}")
        return False

def count_todays_reminders():
    try:
        start_of_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # query to count rows between start and end of today
        count = SensorData.query.filter(
            SensorData.timestamp >= start_of_day,
            SensorData.timestamp <= end_of_day
        ).count()
        
        return count
    except Exception as e:
        print(f"Error in count_todays_reminders: {e}")
        return 0

def calculate_daily_usage(user_id):
    try:
        from datetime import datetime, timedelta
        
        start_of_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)

        power_sessions = PowerSessions.query.filter(
            PowerSessions.user_id == user_id,
            PowerSessions.timestamp >= start_of_day,
            PowerSessions.timestamp <= end_of_day
        ).order_by(PowerSessions.timestamp).all()

        total_usage = timedelta()
        session_start = None

        for session in power_sessions:
            print(f"Session: {session.power_on}, Timestamp: {session.timestamp}")
            if session.power_on:
                session_start = session.timestamp
            elif session_start:  # Power off
                total_usage += session.timestamp - session_start
                session_start = None

        print(f"Total usage time in seconds: {total_usage.total_seconds()}") 
        return total_usage.total_seconds() / 3600  # convert to hours
    except Exception as e:
        print(f"Error calculating daily usage: {e}")
        return 0
    
def get_last_slouch_entry(user_id):
    try:
        slouch_entry = SensorData.query.filter_by(user_id=user_id).order_by(SensorData.timestamp.desc()).first()
        if not slouch_entry:
            return None

        # return temperature and status
        return {
            "temperature": slouch_entry.temperature,
            "temperature_status": slouch_entry.temperature_status,
            "timestamp": slouch_entry.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        }
    except Exception as e:
        print(f"Error retrieving last slouch entry: {e}")
        return None

def save_power_session(user_id, power_on):
    try:
        new_session = PowerSessions(user_id=user_id, power_on=power_on)
        db.session.add(new_session)
        db.session.commit()
        return "Power session saved successfully."
    except Exception as e:
        db.session.rollback()
        print(f"Error in save_power_session: {e}")
        raise Exception(f"Error saving power session: {e}")

def add_token(user_id, token):
    row = get_user_row_if_exists(user_id)
    if row is not False:
        row.token = token
        db.session.commit()
        
def get_token(user_id):
    row = get_user_row_if_exists(user_id)
    if row is not False:
        return row.token
    else:
        print("User with id: " + user_id + " doesn't exist")

def view_all():
    all_rows = User.query.all()
    print_results(all_rows)

def print_results(all_rows):
    for n in range(0, len(all_rows)):
        print(f"{all_rows[n].id} | {all_rows[n].name} | {all_rows[n].token} | {all_rows[n].login} | {all_rows[n].read_access} | {all_rows[n].write_access}")

def get_all_logged_in_users():
    rows = User.query.filter_by(login=1).all()
    print_results(rows)
    online_users = {"users":[]}
    for row in rows:
        if row.read_access == 0 and row.write_access == 0:
            read = "unchecked"
            write = "unchecked"
        elif row.read_access == 1 and row.write_access == 0:
            read = "checked"
            write = "unchecked"
        elif row.read_access == 0 and row.write_access == 1:
            read = "unchecked"
            write = "checked"
        else:
            read = "checked"
            write = "checked"
        online_users["users"].append([row.name, row.google_client_id, read, write])
    return online_users

def add_user_permission(google_client_id, read, write):
    row = get_user_row_if_exists(google_client_id)
    if row is not False:
        if read=="true":
            row.read_access=1
        elif read=="false":
            row.read_access=0
        if write=="true":
            row.write_access=1
        elif write=="false":
            row.write_access=0
        db.session.commit()