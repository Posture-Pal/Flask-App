const pubnub = new PubNub({
    publishKey: 'pub-c-ef699d1a-d6bd-415f-bb21-a5942c7afc1a',
    subscribeKey: 'sub-c-90478427-a073-49bc-b402-ba4903894284',
    uuid: "Posture-Pal",
});

const CHANNEL_NAME = "Posture-Pal";



function startListeningForUpdates() {
    console.log("Subscribing to channel:", CHANNEL_NAME);

    pubnub.subscribe({ channels: [CHANNEL_NAME] });

    pubnub.addListener({
        message: (event) => {
            console.log("Received message:", event.message);

            // check if the message contains calibration thresholds
            if (event.message.thresholds) {
                updateThresholdTable(event.message.thresholds);
            } else {
                // regular slouch data
                updateDataInHTML(event.message);
            }
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


//send a "power: true" message to PubNub
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

//send a "power: false" message to PubNub
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

// display the slouch values with received data
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
    
    
    axios
        .post("/save_sensor_data", data)
        .then((response) => {
            console.log(response.data.message || "Data saved successfully.");
        })
        .catch((error) => {
            console.error("Error in sending data to backend:", error.response?.data?.error || error.message);
        });
}

//send a "calibration_setup: true" message to PubNub
function sendCalibrationMessage() {
    const message = { calibration_setup: true };

    pubnub.publish({
        channel: CHANNEL_NAME,
        message: message,
    }, (status, response) => {
        if (status.error) {
            console.error("Error publishing calibration message:", status);
        } else {
            console.log("Calibration message sent:", response);
        }
    });
}

function updateThresholdTable(data) {
    const table = document.getElementById("threshold-table");
    const tableBody = document.getElementById("threshold-values");

    tableBody.innerHTML = "";

    Object.entries(data.thresholds).forEach(([key, value]) => {
        const row = document.createElement("tr");

        const parameterCell = document.createElement("td");
        parameterCell.textContent = key;

        const valueCell = document.createElement("td");

        if (Array.isArray(value)) {
            valueCell.textContent = value.map(v => v.toFixed(2)).join(", ");
        } else {
            valueCell.textContent = typeof value === "number" ? value.toFixed(2) : value;
        }

        row.appendChild(parameterCell);
        row.appendChild(valueCell);
        tableBody.appendChild(row);
    });

    table.style.display = "table";
    axios
        .post("/save_threshold_data", data.thresholds)
        .then((response) => {
            console.log(response.data.message || "Data saved successfully.");
        })
        .catch((error) => {
            console.error("Error in sending data to backend:", error.response?.data?.error || error.message);
        });
}


function startListeningForUpdates() {
    console.log("Subscribing to channel:", CHANNEL_NAME);

    pubnub.subscribe({ channels: [CHANNEL_NAME] });

    pubnub.addListener({
        message: (event) => {
            console.log("Received message:", event.message);

            // check the type of message and call the appropriate function
            if (event.message.thresholds) {
                // handle calibration data
                updateThresholdTable(event.message);
            } else {
                // handle regular sensor data
                updateDataInHTML(event.message);
            }
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

//send a "sound_mode: true/false, vibration_mode: true/false" message to PubNub
function sendModesStatus() {
    const soundToggle = document.getElementById("sound-toggle").checked;
    const vibrationToggle = document.getElementById("vibration-toggle").checked;

    const message = {
        sound_mode: soundToggle,
        vibration_mode: vibrationToggle,
    };

    pubnub.publish(
        {
            channel: CHANNEL_NAME,
            message: message,
        },
        (status, response) => {
            if (status.error) {
                console.error("Error publishing mode status:", status);
            } else {
                console.log("Mode status message sent:", response);
            }
        }
    );
}

function initToggleListeners() {
    const soundToggle = document.getElementById("sound-toggle");
    const vibrationToggle = document.getElementById("vibration-toggle");

    soundToggle.addEventListener("change", sendModesStatus);
    vibrationToggle.addEventListener("change", sendModesStatus);
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

    const calibrateButton = document.getElementById("calibrate-btn");
    calibrateButton.addEventListener("click", () => {
        sendCalibrationMessage();
    });

    initToggleListeners();
}

document.addEventListener("DOMContentLoaded", initApp);
