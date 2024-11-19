
const pubnub = new PubNub({
    publishKey: 'pub-c-ef699d1a-d6bd-415f-bb21-a5942c7afc1a',
    subscribeKey: 'sub-c-90478427-a073-49bc-b402-ba4903894284',
    uuid: "Posture-Pal",
});


const channelName = "Posture-Pal";

pubnub.subscribe({
    channels: [channelName],
});

let receivedData = {}; 

    // Retrieve threshold values
const thresholdYaw = 12.3
const thresholdPitch = 34.2
const thresholdRoll = -1.98
const thresholdTemperature = 23
const thresholdHumidity = 66

pubnub.addListener({
    message: function(event) {
        // console.log("Received event:", event); 
        const data = JSON.parse(event.message); 

        console.log("Received data:", data);
        receivedData = data;
        // console.log(data.yaw);
    
            // Compare with received data


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
        
        // comparison logic to add into a dict
    let outOfThresholdData = {};

        // compare received data with thresholds and log it
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

        if (Object.keys(outOfThresholdData).length > 0) {
            fetch("/store_sensor_data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(outOfThresholdData),
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Response from backend:", data);
                })
                .catch(error => {
                    console.error("Error sending out-of-threshold data:", error);
                });
        }

        
    },
    status: function(statusEvent) {
        if (statusEvent.category === "PNConnectedCategory") {
            console.log("Connected to PubNub and subscribed to channel:", channelName);
        }
    }
});

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