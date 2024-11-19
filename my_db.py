from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(30))
    user_id = db.Column(db.String(21))
    token = db.Column(db.String(255))
    login = db.Column(db.Integer)
    read_access = db.Column(db.Integer)
    write_access = db.Column(db.Integer)
    email = db.Column(db.String(30))

    
    def __init__(self, name, user_id, token, login, read_access, write_access, email):
        self.name = name
        self.user_id = user_id
        self.token = token
        self.login = login
        self.read_access = read_access
        self.write_access = write_access
        self.email = email



class SensorData(db.Model):
    __tablename__ = "sensors"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    yaw = db.Column(db.Float)
    pitch = db.Column(db.Float)
    roll = db.Column(db.Float)
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    timestamp = db.Column(db.DateTime)

class Threshold(db.Model):
    __tablename__ = "threshold"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    threshold_yaw = db.Column(db.Float)
    threshold_pitch = db.Column(db.Float)
    threshold_roll = db.Column(db.Float)
    threshold_temperature = db.Column(db.Float)
    threshold_humidity = db.Column(db.Float)
    
    
def get_user_row_if_exists(user_id):
    get_user_row = User.query.filter_by(user_id=user_id).first()
    if get_user_row is not None:
        return get_user_row
    else:
        print("That user does not exist")
        return False
    

def get_user_row_if_exists_using_id(id):
    get_user_row = User.query.filter_by(id=id).first()
    if get_user_row is not None:
        return get_user_row
    else:
        print("That user does not exist")
        return False


def add_user_and_login(name, user_id, email):
    row = get_user_row_if_exists(user_id)
    if row is not False:
        row.login = 1
        db.session.commit()
    else:
        new_user = User(name, user_id, None, 1, 0, 0, email)
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


def save_threshold(sensor_data, user_id):
    try:
        # check if the user already exists
        user_row = get_user_row_if_exists_using_id(user_id)
        existing_threshold = Threshold.query.filter_by(user_id=user_id).first()
        
        if user_row and existing_threshold:
           #update the existing threshold values
            existing_threshold.threshold_yaw = sensor_data.get('yaw')
            existing_threshold.threshold_pitch = sensor_data.get('pitch')
            existing_threshold.threshold_roll = sensor_data.get('roll')
            existing_threshold.threshold_temperature = sensor_data.get('temperature')
            existing_threshold.threshold_humidity = sensor_data.get('humidity')

            db.session.commit()  
            return "Sensor thresholds updated successfully."
        else:
        
            new_threshold = Threshold(
                user_id=user_id,
                threshold_yaw=sensor_data.get('yaw'),
                threshold_pitch=sensor_data.get('pitch'),
                threshold_roll=sensor_data.get('roll'),
                threshold_temperature=sensor_data.get('temperature'),
                threshold_humidity=sensor_data.get('humidity')
            )

            db.session.add(new_threshold)
            db.session.commit()
            return "Sensor thresholds saved successfully."

    except Exception as e:
        print(f"Error saving or updating sensor thresholds: {e}")
        return "Error saving or updating sensor thresholds."


def get_threshold_by_user_id(user_id):
    try:
        # Fetch the threshold entry for the given user ID
        threshold = Threshold.query.filter_by(user_id=user_id).first()

        if threshold:
            # Return threshold values as a JSON object
            return {
                "user_id": threshold.user_id,
                "threshold_yaw": threshold.threshold_yaw,
                "threshold_pitch": threshold.threshold_pitch,
                "threshold_roll": threshold.threshold_roll,
                "threshold_temperature": threshold.threshold_temperature,
                "threshold_humidity": threshold.threshold_humidity
            }
        else:
            # No threshold found for the user ID
            return {"error": "No threshold values found for the given user ID."}

    except Exception as e:
        print(f"Error retrieving threshold values: {e}")
        return {"error": "An error occurred while retrieving threshold values."}


def save_sensor_data(sensor_data, user_id):
    try:
        new_sensor_data = SensorData(
            user_id=user_id,
            yaw=sensor_data.get('yaw'),
            pitch=sensor_data.get('pitch'),
            roll=sensor_data.get('roll'),
            temperature=sensor_data.get('temperature'),
            humidity=sensor_data.get('humidity'),
            timestamp=datetime.utcnow(), 
        )
        db.session.add(new_sensor_data)
        db.session.commit()
        return "Sensor data saved successfully."

    except Exception as e:
        print(f"Error saving sensor data: {e}")
        return "Error saving sensor data."


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
