from datetime import datetime, timedelta
import os
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from flask import Flask, render_template, redirect, url_for, session, flash, jsonify, request, abort
from flask_dance.contrib.google import make_google_blueprint, google
from dotenv import load_dotenv
import pymysql
import my_db, pb

load_dotenv()
db = my_db.db
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)


def check_database_credentials(uri):
    try:
        # parse URI
        user = uri.split('//')[1].split(':')[0]
        password = uri.split(':')[2].split('@')[0]
        
        # check for default or empty password
        if not password or password in ["root", "admin", "password", "", ""]:
            print("⚠️ Warning: The database is using a default or no password. Please secure your database!")
        
        connection = pymysql.connect(
            host=uri.split('@')[1].split('/')[0],
            user=user,
            password=password,
        )
        connection.close()
    except Exception as e:
        print("⚠️ Error while checking database credentials:", e)

check_database_credentials(app.config["SQLALCHEMY_DATABASE_URI"])


if os.getenv("OAUTHLIB_INSECURE_TRANSPORT") == "1":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

google_bp = make_google_blueprint(
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    redirect_to="google_login", 
    scope=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
    ],
)
app.register_blueprint(google_bp, url_prefix="/login")

@app.route("/")
def index():
    if "user" in session and session["user"] != "Guest":
        return redirect(url_for("home"))
    else:
        return render_template("index.html")

@app.route("/google_login")
def google_login():
    if not google.authorized:
        return redirect("/login/google")

    response = google.get("https://www.googleapis.com/oauth2/v1/userinfo")
    if not response.ok:
        print("Error response:", response.text)
        return "Error: Unable to fetch user information from Google."

    user_info = response.json()

    session["user"] = user_info.get("name", "Unknown User")
    session["email"] = user_info.get("email", "No email provided")
    session["google_client_id"] = user_info.get("id")

    my_db.add_user_and_login(user_info.get("name"), user_info.get("id"), user_info.get("email"))

    token = pb.generate_token(user_info.get("id"))

    if token:
        my_db.update_user_token(user_info.get("id"), token)
        session["token"] = token 

    return redirect(url_for("home"))

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user" not in session or session["user"] == "Guest":
            return redirect(url_for("not_authorized"))
        return f(*args, **kwargs)
    return decorated_function

@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out successfully.", "info")
    return redirect(url_for("index"))

@app.route("/home")
@login_required
def home():
    user = session.get("user", "Guest")
    email = session.get("email", "No email provided")
    google_client_id = session.get("google_client_id", "No client_id provided")

    show_calibrate_button = True
    user_data = my_db.get_user_by_email(email)

    usage_today = 0
    token = None
    if user_data:
        user_id = user_data.get("id")
        show_calibrate_button = not my_db.has_threshold_for_user(user_id)
        usage_today = my_db.calculate_daily_usage(user_id)
        user_record = my_db.get_user_row_if_exists(google_client_id)
        if user_record:
            token = user_record.token

    # get today's reminder count
    todays_reminders = my_db.count_todays_reminders()

    return render_template(
        "home.html",
        user=user,
        google_client_id=google_client_id,
        email=email,
        show_calibrate_button=show_calibrate_button,
        todays_reminders=todays_reminders,
        usage_today=usage_today,
        token=token,
    )

@app.route("/save_sensor_data", methods=["POST"])
def save_sensor_data():
    if request.method == "POST":
        sensor_data = request.json
        try:
            user_email = session.get("email")
            if not user_email:
                return jsonify({"error": "User not authenticated"}), 401
            
            user = my_db.get_user_by_email(user_email)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            user_id = user["id"]
            
            print(sensor_data.keys())
            required_keys = {"slouch", "temperature_status", "temperature", "humidity_status", "humidity", "pitch", "gravity_vector"}
            if not required_keys.issubset(sensor_data.keys()):
                return jsonify({"message": "Non-sensor data received, skipping save."}), 200
            
            message = my_db.save_sensor_data(sensor_data, user_id)
            return jsonify({"message": message}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route("/save_threshold_data", methods=["POST"])
def save_threshold_data():
    if request.method == "POST":
        threshold_data = request.json  # Data from PubNub
        try:
            user_email = session.get("email")
            if not user_email:
                return jsonify({"error": "User not authenticated"}), 401

            user = my_db.get_user_by_email(user_email)
            if not user:
                return jsonify({"error": "User not found"}), 404

            user_id = user["id"]
            print("Threshold data received:", threshold_data)

            # Check if real-time calibration data is available
            if threshold_data.get("calibration_data"):
                # Assuming calibration data contains the real-time values
                calibration_data = threshold_data["calibration_data"]
                existing_threshold = my_db.Threshold.query.filter_by(user_id=user_id).first()

                if existing_threshold:
                    existing_threshold.update_thresholds(
                        temp_overheat=calibration_data.get("temp_overheat"),
                        temp_cold=calibration_data.get("temp_cold"),
                        humid_high=calibration_data.get("humid_high"),
                        humid_low=calibration_data.get("humid_low"),
                        pitch=calibration_data.get("pitch"),
                        gravity=calibration_data.get("gravity")
                    )
                    return jsonify({"message": "Thresholds updated successfully."}), 200
                else:
                    new_threshold = my_db.Threshold(
                        user_id=user_id,
                        temp_overheat=calibration_data.get("temp_overheat", 37.5),
                        temp_cold=calibration_data.get("temp_cold", 15.0),
                        humid_high=calibration_data.get("humid_high", 80.0),
                        humid_low=calibration_data.get("humid_low", 20.0),
                        pitch=calibration_data.get("pitch", 0.0),
                        gravity=calibration_data.get("gravity", [0.0, 0.0, 1.0])
                    )
                    db.session.add(new_threshold)
                    db.session.commit()
                    return jsonify({"message": "Thresholds saved successfully."}), 201
            else:
                return jsonify({"error": "No calibration data received."}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route("/get_posture_data", methods=["GET"])
def get_posture_data():
    try:
        user_email = session.get("email")
        if not user_email:
            return jsonify({"success": False, "message": "User not authenticated"}), 401

        user = my_db.get_user_by_email(user_email)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        user_id = user["id"]
        selected_date = request.args.get("date")
        if not selected_date:
            return jsonify({"success": False, "message": "Date not provided"}), 400

        start_of_day = datetime.strptime(selected_date, "%Y-%m-%d")
        end_of_day = start_of_day + timedelta(days=1)

        # Fetch power sessions and slouch events
        power_sessions = my_db.PowerSessions.query.filter(
            my_db.PowerSessions.user_id == user_id,
            my_db.PowerSessions.timestamp >= start_of_day,
            my_db.PowerSessions.timestamp < end_of_day
        ).all()

        slouch_events = my_db.SensorData.query.filter(
            my_db.SensorData.user_id == user_id,
            my_db.SensorData.timestamp >= start_of_day,
            my_db.SensorData.timestamp < end_of_day
        ).all()

        slouch_data = [{"timestamp": event.timestamp.strftime("%H:%M:%S")} for event in slouch_events]

        power_data = [
            {
                "power_on": session.power_on,
                "timestamp": session.timestamp.strftime("%H:%M:%S")
            }
            for session in power_sessions
        ]

        return jsonify({
            "success": True,
            "slouchData": slouch_data,
            "powerData": power_data
        })
    except Exception as e:
        print(f"Error fetching posture data: {e}")
        return jsonify({"success": False, "message": "An error occurred."}), 500
    
@app.route("/get_last_available_data_date", methods=["GET"])
def get_last_available_data_date():
    try:
        user_email = session.get("email")
        if not user_email:
            return jsonify({"success": False, "message": "User not authenticated"}), 401

        user = my_db.get_user_by_email(user_email)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        user_id = user["id"]

        # Fetching the most recent power session and slouch event timestamps, excluding today's data
        today = datetime.today().date()
        yesterday = today - timedelta(days=1)

        last_power_session = my_db.PowerSessions.query.filter(
            my_db.PowerSessions.user_id == user_id,
            my_db.PowerSessions.timestamp < datetime.combine(today, datetime.min.time())
        ).order_by(my_db.PowerSessions.timestamp.desc()).first()

        last_slouch_event = my_db.SensorData.query.filter(
            my_db.SensorData.user_id == user_id,
            my_db.SensorData.timestamp < datetime.combine(today, datetime.min.time())
        ).order_by(my_db.SensorData.timestamp.desc()).first()

        last_timestamp = max(
            last_power_session.timestamp if last_power_session else datetime.min,
            last_slouch_event.timestamp if last_slouch_event else datetime.min
        )

        if last_timestamp == datetime.min:
            return jsonify({"success": False, "message": "No data available before today."}), 404

        most_recent_date = last_timestamp.strftime("%Y-%m-%d")  # Format as YYYY-MM-DD
        return jsonify({"success": True, "lastAvailableDate": most_recent_date})

    except Exception as e:
        print(f"Error fetching last available date: {e}")
        return jsonify({"success": False, "message": "An error occurred."}), 500

@app.route("/statistics", methods=["GET"])
@login_required
def statistics():
    try:
        user_email = session.get("email")
        if not user_email:
            return jsonify({"error": "User not authenticated"}), 401

        user = my_db.get_user_by_email(user_email)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = user["id"]

        sensor_data_list = my_db.get_sensor_data_by_user_id(user_id)

        if isinstance(sensor_data_list, dict) and "error" in sensor_data_list:
            return jsonify(sensor_data_list), 404

        return render_template("statistics.html", sensor_data=sensor_data_list)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/information")
@login_required
def information():
    return render_template("information.html")

@app.route("/last-slouch-temperature", methods=["GET"])
def last_slouch_temperature():
    try:
        user_email = session.get("email")
        if not user_email:
            return jsonify({"error": "User not authenticated"}), 401

        user = my_db.get_user_by_email(user_email)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = user["id"]

        last_slouch_entry = my_db.get_last_slouch_entry(user_id)

        if not last_slouch_entry:
            return jsonify({"error": "No slouch data available"}), 404
        
        print(last_slouch_entry)

        return jsonify({
            "temperature": last_slouch_entry["temperature"],
            "temperature_status": last_slouch_entry["temperature_status"],
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/settings")
@login_required
def settings(): 
    try:
        user_email = session.get("email")
        
        if not user_email:
            return redirect(url_for("login"))

        user = my_db.get_user_by_email(user_email)
        if not user:
            return "User not found.", 404

        user_id = user["id"]

        return render_template("settings.html")

    except Exception as e:
        print(f"Error in settings route: {e}")
        return "An error occurred.", 500 

@app.route("/article1")
@login_required
def article1():
    return render_template("article1.html")

@app.route("/article2")
@login_required
def article2():
    return render_template("article2.html")

@app.route("/article3")
@login_required
def article3():
    return render_template("article3.html")

@app.route("/article4")
@login_required
def article4():
    return render_template("article4.html")

@app.route("/article5")
@login_required
def article5():
    return render_template("article5.html")

@app.route("/shop")
def shop():
    return render_template("shop.html")

@app.route("/howto")
def howto():
    return render_template("howto.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/save_power_session", methods=["POST"])
def save_power_session():
    if request.method == "POST":
        try:
            user_email = session.get("email")
            if not user_email:
                return jsonify({"error": "User not authenticated"}), 401
            
            user = my_db.get_user_by_email(user_email)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            user_id = user["id"]
            power_data = request.json

            if "power_on" not in power_data:
                return jsonify({"error": "Missing 'power_on' key in request data"}), 400

            power_on = power_data["power_on"]
            message = my_db.save_power_session(user_id, power_on)
            return jsonify({"message": message}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route("/not_authorized")
def not_authorized():
    return render_template("not_authorized.html"), 403

@app.route("/refresh_user_token", methods=["POST"])
def refresh_user_token():
    try:
        user_uuid = session.get("google_client_id")
        if not user_uuid:
            return jsonify({"error": "User not logged in"}), 401

        new_token = pb.refresh_token(user_uuid, ttl=5)

        if not new_token:
            return jsonify({"error": "Failed to refresh token"}), 500

        my_db.update_user_token(user_uuid, new_token)

        session["token"] = new_token

        return jsonify({"success": True, "token": new_token}), 200
    except Exception as e:
        print(f"Error in refresh_token_endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=True)
