import os
from flask_sqlalchemy import SQLAlchemy
from flask import Flask, render_template, redirect, url_for, session, flash, jsonify, request
from flask_dance.contrib.google import make_google_blueprint, google
from flask_dance.contrib.facebook import make_facebook_blueprint, facebook
from flask_dance.contrib.github import make_github_blueprint, github
from dotenv import load_dotenv

import my_db

load_dotenv()

db = my_db.db

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY")

app.config["SQLALCHEMY_DATABASE_URI"] = 'mysql+pymysql://root:@127.0.0.1/posture_pal'
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

# Enable insecure transport (HTTP) for local development
# TODO: Remove or set to it to 0 in production for HTTPS only
if os.getenv("OAUTHLIB_INSECURE_TRANSPORT") == "1":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# Google OAuth Configuration
google_bp = make_google_blueprint(
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    redirect_to="google_login",  # TODO: Change the redirect link when moving to cloud
    scope=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
    ],
)
app.register_blueprint(google_bp, url_prefix="/login")

@app.route("/")
# Redirect to home if the user is already logged in
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
    print("User Info:", user_info)
    session["user"] = user_info.get("name", "Unknown User")
    session["email"] = user_info.get("email", "No email provided")
    session["google_client_id"] = user_info.get("id")

    return redirect(url_for("home"))



@app.route("/logout")
def logout():
    # Clear the session and display a logout message
    session.clear()
    flash("You have been logged out successfully.", "info")
    return redirect(url_for("index"))


@app.route("/home")
def home():
    user = session.get("user", "Guest")
    email = session.get("email", "No email provided")
    google_client_id = session.get("google_client_id", "No client_id provided")
    
    my_db.add_user_and_login(user, google_client_id, email)
    
    return render_template("home.html", user=user, google_client_id=google_client_id, email=email)

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
        threshold_data = request.json
        try:
            user_email = session.get("email")
            if not user_email:
                return jsonify({"error": "User not authenticated"}), 401
            
            user = my_db.get_user_by_email(user_email)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            user_id = user["id"]
            print(threshold_data)
            
            existing_threshold = my_db.Threshold.query.filter_by(user_id=user_id).first()
            
            if existing_threshold:
                existing_threshold.update_thresholds(
                    temp_overheat=threshold_data.get("temp_overheat"),
                    temp_cold=threshold_data.get("temp_cold"),
                    humid_high=threshold_data.get("humid_high"),
                    humid_low=threshold_data.get("humid_low"),
                    pitch=threshold_data.get("pitch"),
                    gravity=threshold_data.get("gravity")
                )
                return jsonify({"message": "Thresholds updated successfully."}), 200
            else:
                new_threshold = my_db.Threshold(
                    user_id=user_id,
                    temp_overheat=threshold_data.get("temp_overheat", 37.5),
                    temp_cold=threshold_data.get("temp_cold", 15.0),
                    humid_high=threshold_data.get("humid_high", 80.0),
                    humid_low=threshold_data.get("humid_low", 20.0),
                    pitch=threshold_data.get("pitch", 0.0),
                    gravity=threshold_data.get("gravity", [0.0, 0.0, 1.0])
                )
                db.session.add(new_threshold)
                db.session.commit()
                return jsonify({"message": "Thresholds saved successfully."}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@app.route("/statistics", methods=["GET"])
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
def information():
    return render_template("information.html")

@app.route("/api/latest_temperature", methods=["GET"])
def latest_temperature():
    try:
        user_email = session.get("email")
        if not user_email:
            return jsonify({"error": "User not authenticated"}), 401

        user = my_db.get_user_by_email(user_email)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = user["id"]
        sensor_data_list = my_db.get_sensor_data_by_user_id(user_id)

        if isinstance(sensor_data_list, list) and sensor_data_list:
            # Sort sensor data by timestamp (assuming timestamp is a datetime object)
            latest_entry = max(sensor_data_list, key=lambda x: x["timestamp"])  # Get the most recent entry
            latest_temperature = latest_entry.get("temperature", "N/A")
        else:
            return jsonify({"error": "No sensor data found for the user."}), 404

        return jsonify({"temperature": latest_temperature}), 200

    except Exception as e:
        print(f"Error in latest_temperature endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/settings")
def settings():
    
    try:
        user_email = session.get("email")
        
        if not user_email:
            return redirect(url_for("login"))

        user = my_db.get_user_by_email(user_email)
        if not user:
            return "User not found.", 404

        user_id = user["id"]
        sensor_data = my_db.get_sensor_data_by_user_id(user_id)

        if isinstance(sensor_data, list) and sensor_data:
            latest_temperature = sensor_data[-1].get("temperature", "N/A") 
        else:
            latest_temperature = "No data available"

        return render_template("settings.html", device_temp=latest_temperature)

    except Exception as e:
        print(f"Error in settings route: {e}")
        return "An error occurred.", 500

@app.route("/article1")
def article1():
    return render_template("article1.html")

@app.route("/article2")
def article2():
    return render_template("article2.html")

@app.route("/article3")
def article3():
    return render_template("article3.html")

@app.route("/article4")
def article4():
    return render_template("article4.html")

if __name__ == "__main__":
    app.run(debug=True)
