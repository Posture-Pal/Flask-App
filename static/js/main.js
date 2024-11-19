const pubnub = new PubNub({
    publishKey: 'pub-c-ef699d1a-d6bd-415f-bb21-a5942c7afc1a',
    subscribeKey: 'sub-c-90478427-a073-49bc-b402-ba4903894284',
    uuid: "Posture-Pal",
});

const channelName = "Posture-Pal";

// Global variables for threshold values
let thresholdYaw, thresholdPitch, thresholdRoll, thresholdTemperature, thresholdHumidity;

// Function to fetch threshold values from the backend and store them in global variables
function fetchThresholdValues() {
    fetch("/threshold_values")
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Error retrieving threshold values:", data.error);
                return;
            }

            // Store the threshold values in global variables
            thresholdYaw = data.threshold_yaw;
            thresholdPitch = data.threshold_pitch;
            thresholdRoll = data.threshold_roll;
            thresholdTemperature = data.threshold_temperature;
            thresholdHumidity = data.threshold_humidity;

            console.log("Threshold values loaded:", {
                thresholdYaw,
                thresholdPitch,
                thresholdRoll,
                thresholdTemperature,
                thresholdHumidity
            });
        })
        .catch(error => {
            console.error("Error fetching threshold values:", error);
        });
}

// Call this function initially to fetch threshold values
fetchThresholdValues();

let receivedData = {}; 

pubnub.subscribe({
    channels: [channelName],
});

pubnub.addListener({
    message: function(event) {
        const data = JSON.parse(event.message); 
        console.log("Received data:", data);
        receivedData = data;

        if (data.temperature) {
            document.getElementById("temperature").innerText = `Temperature: ${data.temperature}°C`;
        }
        if (data.humidity) {
            document.getElementById("humidity").innerText = `Humidity: ${data.humidity}%`;
        }
        if (data.roll) {
            document.getElementById("roll").innerText = `Roll: ${data.roll}°`;
        }
        if (data.pitch) {
            document.getElementById("pitch").innerText = `Pitch: ${data.pitch}°`;
        }
        if (data.yaw) {
            document.getElementById("yaw").innerText = `Yaw: ${data.yaw}°`;
        }

        // Compare with received data using the checkThresholds function
        if (checkThresholds(data)) {
            sendDataToBackend(data);
        }
    },
    status: function(statusEvent) {
        if (statusEvent.category === "PNConnectedCategory") {
            console.log("Connected to PubNub and subscribed to channel:", channelName);
        }
    }
});

// Function to check if the values are out of the defined threshold range
function checkThresholds(data) {
    let outOfThresholdData = {};

    if (data.yaw && (data.yaw < thresholdYaw - 5 || data.yaw > thresholdYaw + 5)) {
        console.log(`Yaw (${data.yaw}) is out of range (${thresholdYaw})`);
        outOfThresholdData.yaw = data.yaw;
    }
    if (data.pitch && (data.pitch < thresholdPitch - 5 || data.pitch > thresholdPitch + 5)) {
        console.log(`Pitch (${data.pitch}) is out of range (${thresholdPitch})`);
        outOfThresholdData.pitch = data.pitch;
    }
    if (data.roll && (data.roll < thresholdRoll - 5 || data.roll > thresholdRoll + 5)) {
        console.log(`Roll (${data.roll}) is out of range (${thresholdRoll})`);
        outOfThresholdData.roll = data.roll;
    }
    if (data.temperature && (data.temperature < thresholdTemperature - 2 || data.temperature > thresholdTemperature + 2)) {
        console.log(`Temperature (${data.temperature}) is out of range (${thresholdTemperature})`);
        outOfThresholdData.temperature = data.temperature;
    }
    if (data.humidity && (data.humidity < thresholdHumidity - 5 || data.humidity > thresholdHumidity + 5)) {
        console.log(`Humidity (${data.humidity}) is out of range (${thresholdHumidity})`);
        outOfThresholdData.humidity = data.humidity;
    }

    // If there are any values out of range, return true
    return Object.keys(outOfThresholdData).length > 0;
}

// Function to send out-of-threshold data to the backend
function sendDataToBackend(data) {
    fetch("/store_sensor_data", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),  // Sending the full data or outOfThresholdData
    })
    .then(response => response.json())
    .then(responseData => {
        console.log("Response from backend:", responseData);
    })
    .catch(error => {
        console.error("Error sending out-of-threshold data:", error);
    });
}

// Event listener for the "Save Data" button
document.getElementById("saveDataButton").addEventListener("click", function() {
    if (Object.keys(receivedData).length > 0) {
        fetch("/test", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(receivedData), 
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                console.log("Data saved:", data.message);
                document.getElementById("statusMessage").innerText = "Device calibrated and data saved!";
            } else if (data.error) {
                console.error("Error saving data:", data.error);
                document.getElementById("statusMessage").innerText = "Error saving data.";
            }
        })
        .catch(error => {
            console.error("Error sending data to backend:", error);
            document.getElementById("statusMessage").innerText = "Error sending data to backend.";
        });
    } else {
        console.log("No data available to save.");
        document.getElementById("statusMessage").innerText = "No data available to save.";
    }
});
