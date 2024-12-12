# Posture Pal

Welcome to **Posture Pal**, a Progressive Web App (PWA) designed to help students and professionals maintain proper posture and improve their overall health. This app uses real-time feedback, historical data and smart sensor integration to provide actionable insights for better posture habits.

## Live Demo
Check out the live website: [Posture Pal](https://posturepal.live/)

![Screenshot 2024-12-11 224706](https://github.com/user-attachments/assets/443c9241-d298-4f05-8b59-c921726cb55c)

---

## <img src="https://emojigraph.org/media/microsoft/woman-technologist_1f469-200d-1f4bb.png" alt="alt text" width="40"> Technologies Used 


<code><a href="https://flask.palletsprojects.com/" target="_blank"> <img height="100" src="https://www.vectorlogo.zone/logos/palletsprojects_flask/palletsprojects_flask-ar21~v2.svg"></a></code>
<code><a href="https://aws.amazon.com/" target="_blank"> <img height="100" src="https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-ar21.svg"></a></code>
<code><a href="https://pubnub.com/" target="_blank"> <img height="100" src="https://getvectorlogo.com/wp-content/uploads/2020/03/pubnub-vector-logo.png"></a></code>
<code><a href="https://www.anaconda.com/" target="_blank"> <img height="100" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXqvREgueCenWgK3AOYf2Ggyz-jOISn5uJfg&s"></a></code>
<code><a href="https://code.visualstudio.com/" target="_blank"> <img height="100" src="https://www.vectorlogo.zone/logos/visualstudio_code/visualstudio_code-ar21.svg"></a></code>
<code><a href="https://www.w3schools.com/html/" target="_blank"> <img height="100" src="https://www.vectorlogo.zone/logos/w3_html5/w3_html5-ar21.svg"></a></code>
<code><a href="https://www.w3schools.com/css/" target="_blank"> <img height="100" src="https://www.vectorlogo.zone/logos/w3_css/w3_css-ar21.svg"></a></code>
<code><a href="https://www.w3schools.com/js/" target="_blank"> <img height="100" src="https://www.vectorlogo.zone/logos/javascript/javascript-ar21.svg"></a></code>
<code><a href="https://nodejs.org/" target="_blank"> <img height="100" src="https://www.vectorlogo.zone/logos/nodejs/nodejs-ar21.svg"></a></code>
<code><a href="https://www.raspberrypi.org/" target="_blank"> <img height="100" src="https://www.vectorlogo.zone/logos/raspberrypi/raspberrypi-ar21.svg"></a></code>



---

## Features
- ✨ **Instant Access**: Open directly in a browser without the need for app store downloads.
- ✨ **Calibration**: Ensure accurate posture detection by calibrating the device to your specific sitting position and preferences.
- ✨ **Real-Time Alerts**: Receive immediate feedback via notifications, vibrations or sound whenever poor posture is detected.
- ✨ **Customizable Feedback**: Choose between vibration or sound alerts.
- ✨ **Device Health Check**: Monitor the temperature of the device.
- ✨ **History Tracking**: View past slouching trends and activity logs.
- ✨ **Statistics Dashboard**: Track your posture data over time with graphs and detailed statistics.
- ✨ **Tutorial Videos and Articles**: Enhance your knowledge with tutorial videos and articles on maintaining proper posture.
  
---

## Architecture
### Hardware Components
- **BNO055 Orientation Sensor**: Accurately tracks posture and orientation data.
- **DHT22 Sensor**: Monitors temperature and humidity within the device.
- **Piezo Buzzer**: Provides sound alerts for poor posture.
- **Vibration Motor**: Offers haptic feedback as an alert for slouching.
- **Raspberry Pi 4 Model B**: Serves as the central microcontroller for processing sensor data and managing actuators.

### Software Components
- **Frontend**: Progressive Web App (PWA) built with modern web technologies.
- **Backend**:
  - AWS: Stores user accounts and posture data securely.
  - PubNub: Manages real-time communication for posture updates.
  - Flask API: Processes and routes data from sensors to the PWA.

---

## Installation
### Prerequisites
- Flask Framework: Ensure Python is installed, and Flask is added to your environment.
>[!NOTE]
>Make sure you have the latest version of Python installed.
 
- Node.js and npm: For any frontend development.
- AWS: For backend data storage and hosting.
- PubNub: For real-time communication integration.

### Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Posture-Pal/UI-UX.git
   cd UI-UX
2. **Setup the Backend (Flask App)**:
   - Install required Python dependencies:
     ```bash
     pip install -r requirements.txt
     
   - Run the Flask development server:
     ```bash
     flask run --debug

   - Access the app at http://127.0.0.1:5000 in your browser.
3. **Configure Hardware**:
   - Connect sensors to the Raspberry Pi.
   - Run the sensors.py script on the Raspberry Pi:
     python sensors.py
4. **Integrate PubNub**:
   - Update PubNub credentials in the .env file.
   - Ensure PubNub is configured for real-time data transmission between the Flask app 
     and the Raspberry Pi.

---

## Usage
1. Open the **Posture Pal** app in a web browser.
2. Pair Sensors: Connect the device to your Wi-Fi and pair it with the app.
3. Calibrate: Perform posture calibration to set personalized thresholds.
4. Monitor Posture: Wear the sensors and let Posture Pal track your posture in real-time.
5. Real-Time Alerts:
#### Posture Alerts:
- **Vibration**: Subtle haptic feedback when slouching is detected.
- **Sound**: Audible alerts for significant posture deviations.
#### Environmental Alerts:
- Warnings for overheating (temperature exceeds set thresholds).
- Notifications for high or low humidity levels ensuring optimal ergonomics.
6. Analyze Data: Use the statistics dashboard to review trends and insights.
7. Learn: Watch tutorials and read articles to improve posture habits.

---

## Acknowledgments
1. Flask Framework for backend API development.
2. PubNub for seamless real-time communication.
3. Adafruit Libraries for sensor integrations.
4. AWS Services for secure and scalable backend infrastructure.

---

## Contributors

- ✨ *Harjappan Singh Maan* [![Button 1](https://img.shields.io/badge/%22HarjappanSingh%22-blue.svg)](https://github.com/Harjappan-Singh)
- ✨ *Meghana Rathnam Kuppala* [![Button 1](https://img.shields.io/badge/%22RathnamMeghana%22-green.svg)](https://github.com/RathnamMeghana)
- ✨ *Elga Jerusha Henry* [![Button 1](https://img.shields.io/badge/%22henryelga%22-red.svg)](https://github.com/henryelga)
- ✨ *Mila Murphy* [![Button 1](https://img.shields.io/badge/%22milamurphy%22-pink.svg)]( https://github.com/milamurphy)

---

Feel free to reach out for support or open an issue in the GitHub repository. Thank you for using Posture Pal!



