const pubnub = new PubNub({
    publishKey: 'pub-c-ef699d1a-d6bd-415f-bb21-a5942c7afc1a',
    subscribeKey: 'sub-c-90478427-a073-49bc-b402-ba4903894284',
    uuid: "Posture-Pal",
});

const CHANNEL_NAME = "Posture-Pal";

function sendPowerOnMessage() {
    const message = { power: true };

    pubnub.publish(
        {
            channel: CHANNEL_NAME,
            message: message,
        },
        (status, response) => {
            if (status.error) {
                console.error("Error publishing message:", status);
            } else {
                console.log("Power ON message sent:", response);
            }
        }
    );
}

function updateDataInHTML(data) {
    if (!data) {
        console.error("No data received to update.");
        return;
    }

    document.getElementById("slouch-status").textContent = `Slouch: ${data.slouch !== undefined ? data.slouch : "N/A"}`;
    document.getElementById("temperature-status").textContent = `Temperature Status: ${data.temperature_status || "N/A"}`;
    document.getElementById("temperature-value").textContent = `Temperature: ${
        typeof data.temperature === "number" ? data.temperature.toFixed(1) : "N/A"
    } °C`;
    document.getElementById("humidity-status").textContent = `Humidity Status: ${data.humidity_status || "N/A"}`;
    document.getElementById("humidity-value").textContent = `Humidity: ${
        typeof data.humidity === "number" ? data.humidity.toFixed(1) : "N/A"
    }%`;
    document.getElementById("pitch-value").textContent = `Pitch: ${
        typeof data.pitch === "number" ? data.pitch.toFixed(4) : "N/A"
    }`;
    document.getElementById("gravity-vector").textContent = `Gravity Vector: ${
        Array.isArray(data.gravity_vector)
            ? data.gravity_vector.map((g) => (typeof g === "number" ? g.toFixed(2) : "N/A")).join(", ")
            : "N/A"
    }`;
}

function startListeningForUpdates() {
    console.log("Subscribing to channel:", CHANNEL_NAME);

    pubnub.subscribe({ channels: [CHANNEL_NAME] });

    pubnub.addListener({
        message: (event) => {
            console.log("Received message:", event.message);
            updateDataInHTML(event.message);
        },
        status: (statusEvent) => {
            if (statusEvent.category === "PNConnectedCategory") {
                console.log("Successfully connected to PubNub channel.");
            } else {
                console.warn("PubNub connection status:", statusEvent);
            }
        },
    });
}

function sendPowerOffMessage() {
    const message = { power: false };

    pubnub.publish({
        channel: CHANNEL_NAME,
        message: message,
    }, (status, response) => {
        if (status.error) {
            console.error("Error publishing message:", status);
        } else {
            console.log("Power OFF message sent:", response);
        }
    });
}

function initApp() {
    startListeningForUpdates();

    const powerButton = document.getElementById("power-btn");

    powerButton.addEventListener("click", () => {
        sendPowerOnMessage();
    });

    const powerOffButton = document.getElementById("power-off-btn");
    powerOffButton.addEventListener("click", () => {
        sendPowerOffMessage();
    });
}

document.addEventListener("DOMContentLoaded", initApp);
