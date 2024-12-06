
function startListeningForUpdates() {
    console.log("Subscribing to channel:", CHANNEL_NAME);

    pubnub.subscribe({ channels: [CHANNEL_NAME] });

    pubnub.addListener({
        message: (event) => {
            console.log("Received message:", event.message);

            if (event.message.thresholds) {
                updateThresholdTable(event.message.thresholds);
            } else {
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

function updateDataInHTML(data) {
    if (!data) {
        console.error("No data received to update.");
        return;
    }

    const slouchStatus = document.getElementById("slouchStatusBoldText");
    if (slouchStatus) {
        slouchStatus.textContent = `Slouch: ${data.slouch !== undefined ? data.slouch : "N/A"}`;
    } else {
        console.warn("Element with ID 'slouch-status' not found.");
    }

    axios
        .post("/save_sensor_data", data)
        .then((response) => {
            console.log(response.data.message || "Data saved successfully.");
        })
        .catch((error) => {
            console.error("Error in sending data to backend:", error.response?.data?.error || error.message);
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
            console.log("Waiting for real-time sensor data...");
            startListeningForUpdates();
        }
    });
}

function startListeningForUpdates() {
    console.log("Subscribing to channel:", CHANNEL_NAME);

    pubnub.subscribe({ channels: [CHANNEL_NAME] });

    pubnub.addListener({
        message: (event) => {
            console.log("Received message:", event.message);

            // If sensor data is received, update thresholds dynamically
            if (event.message.calibration_data) {
                updateThresholdTable(event.message.calibration_data);
            } else if (event.message.sensor_data) {
                // If it's regular sensor data, update the UI
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


pubnub.addListener({
    message: (event) => {
        console.log("Received message:", event.message);

        if (event.message.type === "calibration") {
            updateThresholdTable(event.message);
        } else if (event.message.type === "sensor") {
            updateDataInHTML(event.message);
        }
    },
});

const calibrateButton = document.getElementById("calibrate-btn");
if (calibrateButton) {
    console.log("Calibrate button found!");
    calibrateButton.addEventListener("click", sendCalibrationMessage);
} else {
    console.error("Calibrate button not found!");
}

// Testing if button is still working 
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

function sendModesStatus() {
    const soundToggle = document.getElementById("soundToggle").checked;
    const vibrationToggle = document.getElementById("vibrationToggle").checked;

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
                console.log("Mode status message sent successfully:", response);
            }
        }
    );
}

function initToggleListeners() {
    const soundToggle = document.getElementById("soundToggle");
    const vibrationToggle = document.getElementById("vibrationToggle");

    soundToggle.addEventListener("change", sendModesStatus);
    vibrationToggle.addEventListener("change", sendModesStatus);
}


function initApp() {
    startListeningForUpdates();
    const powerToggle = document.getElementById("powerToggle");
    if (!powerToggle) {
        console.error("Power toggle not found in DOM");
    } else {
        powerToggle.addEventListener("change", () => {
            const powerOn = powerToggle.checked; // Boolean: true (ON) or false (OFF)

            // Publish the message to PubNub
            const message = { power: powerOn };
            pubnub.publish(
                {
                    channel: CHANNEL_NAME,
                    message: message,
                },
                (status, response) => {
                    if (status.error) {
                        console.error("Error publishing message:", status);
                    } else {
                        console.log(`Power ${powerOn ? "ON" : "OFF"} message sent:`, response);
                    }
                }
            );

            // Send the power session data to the backend
            axios
                .post("/save_power_session", { power_on: powerOn ? 1 : 0 }) // Convert to 1 or 0
                .then((response) => {
                    console.log(response.data.message || "Power session saved successfully.");
                })
                .catch((error) => {
                    console.error("Error saving power session:", error.response?.data?.error || error.message);
                });
        });
    }

    fetchLastSlouchTemperature();

    const calibrateButton = document.getElementById("calibrate-btn");
    calibrateButton.addEventListener("click", () => {
        sendCalibrationMessage();
    });

    initToggleListeners();
}


function populateTemperature(data) {
    const temperatureDiv = document.querySelector(".temperatureBoldText");
    if (temperatureDiv) {
        temperatureDiv.textContent = `${data.temperature}°`;

        checkTemperatureStatus(data.temperature_status);
    }
}


function showPushNotification(message) {
    console.log("Attempting to show notification:", message); // Debug log
    if ("Notification" in window) {
        if (Notification.permission === "granted") {
            console.log("Notification permission granted."); // Debug log
            new Notification("Temperature Alert", { body: message });
        } else if (Notification.permission === "default") {
            console.log("Requesting notification permission."); // Debug log
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    console.log("Permission granted after request."); // Debug log
                    new Notification("Temperature Alert", { body: message });
                    console.log(message)
                    console.log("hello inside notification")
                } else {
                    console.log("Notification permission denied."); // Debug log
                }
            });
        } else {
            console.log("Notifications are blocked."); // Debug log
        }
    } else {
        console.log("Notifications are not supported by the browser."); // Debug log
    }
}


function checkTemperatureStatus(status) {
    if (status === "high") {
        showPushNotification("Warning: Temperature is high!");
    } else if (status === "low") {
        showPushNotification("Warning: Temperature is low!");
    }
}
function populateTemperatureDiv(temperature) {
    const temperatureDiv = document.querySelector(".temperatureBoldText");
    if (temperatureDiv) {
        temperatureDiv.textContent = `${temperature.toFixed(1)}°`;
    }
}

async function fetchLastSlouchTemperature() {
    try {
        const response = await axios.get("/last-slouch-temperature");
        if (response.status === 200) {
            const { temperature, temperature_status } = response.data;
            populateTemperatureDiv(temperature);
            checkTemperatureStatus(temperature_status);
        } else {
            console.error("Error fetching temperature:", response.data.error);
        }
    } catch (error) {
        console.error("Error fetching temperature:", error);
    }
}


function showErrorMessage(container, message) {
    container.textContent = message;
    container.style.display = "block";
}

function hideErrorMessage(container) {
    container.style.display = "none";
}


document.addEventListener("DOMContentLoaded", initApp);