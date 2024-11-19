
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

pubnub.addListener({
    message: function(event) {
        const data = event.message;  

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