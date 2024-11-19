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

# Facebook OAuth Configuration
facebook_bp = make_facebook_blueprint(
    client_id=os.getenv("FACEBOOK_CLIENT_ID"),
    client_secret=os.getenv("FACEBOOK_CLIENT_SECRET"),
    redirect_to="facebook_login",  # TODO: Change the redirect link when moving to cloud
)
app.register_blueprint(facebook_bp, url_prefix="/login")

# GitHub OAuth Configuration
github_bp = make_github_blueprint(
    client_id=os.getenv("GITHUB_CLIENT_ID"),
    client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
    redirect_to="github_login",  # TODO: Change the redirect link when moving to cloud
)
app.register_blueprint(github_bp, url_prefix="/login")



@app.route("/")
# Redirect to home if the user is already logged in
def index():
    if "user" in session and session["user"] != "Guest":
        return redirect(url_for("home"))
    else:
        return render_template("index.html")


@app.route("/google_login")
def google_login():
    # Redirect to Google login if not authorized
    if not google.authorized:
        return redirect("/login/google")

    # Fetch user information from Google
    response = google.get("https://www.googleapis.com/oauth2/v1/userinfo")
    if not response.ok:
        print("Error response:", response.text)
        return "Error: Unable to fetch user information from Google."

    # Store user info in session
    user_info = response.json()
    print("User Info:", user_info)
    session["user"] = user_info.get("name", "Unknown User")
    session["email"] = user_info.get("email", "No email provided")
    session["google_client_id"] = user_info.get("id")

    return redirect(url_for("home"))


@app.route("/facebook_login")
def facebook_login():

    if not facebook.authorized:
        return redirect("/login/facebook")

    response = facebook.get("/me?fields=name,email")
    if not response.ok:
        print("Error response:", response.text)
        return "Error: Unable to fetch user information from Facebook."

    user_info = response.json()
    print("User Info:", user_info)
    session["user"] = user_info.get("name", "Unknown User")
    session["email"] = user_info.get("email", "No email provided")

    return redirect(url_for("home"))


@app.route("/github_login")
def github_login():

    if not github.authorized:
        return redirect("/login/github")

    response = github.get("/user")
    if not response.ok:
        print("Error response:", response.text)
        return "Error: Unable to fetch user information from GitHub."

    user_info = response.json()
    print("GitHub User Info:", user_info)

    session["user"] = user_info.get("name") or user_info.get("login") or "Unknown User"
    session["email"] = user_info.get("email", "No email provided")

    return redirect(url_for("home"))


@app.route("/logout")
def logout():
    # Clear the session and display a logout message
    session.clear()
    flash("You have been logged out successfully.", "info")
    return redirect(url_for("index"))


@app.route("/home")
# Display the home page with user info
def home():
    user = session.get("user", "Guest")
    email = session.get("email", "No email provided")
    client_id = session.get("google_client_id", "No client_id provided")
    my_db.add_user_and_login(user, client_id, email)
    return render_template("home.html", user=user, user_id= client_id, email=email)


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


@app.route("/settings")
def settings():
    return render_template("settings.html")

@app.route("/test", methods=["GET", "POST"])
def test():
    if request.method == "POST":
        sensor_data = request.json  
        try:
            user_email = session.get("email")
            print(session.get("google_client_id"))
            print(user_email)
            if not user_email:
                return jsonify({"error": "User not authenticated"}), 401
  
            user = my_db.get_user_by_email(user_email)
          
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            user_id = user["id"]
            
            message = my_db.save_threshold(sensor_data, user_id)
            
            return jsonify({"message": message}), 201
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return render_template("test.html")

@app.route("/threshold_values", methods=["GET"])
def threshold_values():
    try:
        user_email = session.get("email")
        if not user_email:
            return jsonify({"error": "User not authenticated"}), 401

        user = my_db.get_user_by_email(user_email)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = user["id"]

        threshold_data = my_db.get_threshold_by_user_id(user_id)

        if "error" in threshold_data:
            return jsonify(threshold_data), 404

        return render_template("threshold_values.html", threshold_data=threshold_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/store_sensor_data", methods=["POST"])
def store_sensor_data():
    if request.method == "POST":
        sensor_data = request.json
        # print(f"Received sensor data: {sensor_data}")
        try:
            user_email = session.get("email")
            if not user_email:
                return jsonify({"error": "User not authenticated"}), 401

            user = my_db.get_user_by_email(user_email)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            user_id = user["id"]

            my_db.save_sensor_data(sensor_data, user_id)

            return jsonify({"message": "Sensor data saved successfully"}), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
