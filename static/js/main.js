

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
        }
    });
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

    if (document.body.classList.contains("statistics-page")) {
        setupStatisticsPage();
    }
    if (document.body.classList.contains("home-page")) {
        setupHomePage();
    }

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

// DOESN'T WORK
// document.addEventListener('DOMContentLoaded', function () {
//     const calibrateBtn = document.getElementById('calibrate-btn');
//     const thresholdTable = document.getElementById('threshold-table');

//     fetch('/check-threshold')
//         .then(response => response.json())
//         .then(data => {
//             if (data.show_calibrate) {
//                 calibrateBtn.style.display = 'block';
//                 thresholdTable.style.display = 'block';
//             } else {
//                 calibrateBtn.style.display = 'none';
//                 thresholdTable.style.display = 'none';
//             }
//         })
//         .catch(error => console.error('Error fetching threshold status:', error));
// });


async function fetchPostureData(date) {
    try {
        const response = await fetch(`/get_posture_data?date=${date}`);
        const data = await response.json();
        

        if (!data.success) {
            throw new Error(data.message || "An error occurred while fetching data.");
        }
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}

function showErrorMessage(container, message) {
    container.textContent = message;
    container.style.display = "block";
}

function hideErrorMessage(container) {
    container.style.display = "none";
}

function renderChart(ctx, data) {
    const { timestamps, greenBars, greyBars, redSpikes } = data;

    return new Chart(ctx, {
        type: "line",
        data: {
            labels: timestamps,
            datasets: [
                {
                    label: "Good Posture",
                    data: greenBars,
                    borderColor: "green",
                    backgroundColor: "green",
                    borderWidth: 2,
                    fill: false,
                    stepped: true,
                },
                {
                    label: "Power Off",
                    data: greyBars,
                    borderColor: "gray",
                    backgroundColor: "gray",
                    borderWidth: 2,
                    fill: false,
                    stepped: true,
                },
                {
                    label: "Bad Posture",
                    data: redSpikes,
                    borderColor: "red",
                    backgroundColor: "red",
                    borderWidth: 2,
                    fill: false,
                    stepped: true,
                    pointStyle: "circle",
                    pointRadius: (context) => (context.raw === 1 ? 6 : 0),
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
            },
            scales: {
                x: {
                    title: { display: true, text: "Time" },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10,
                    },
                },
                y: {
                    title: { display: true, text: "Posture Status" },
                    min: -1.5,
                    max: 1.5,
                    ticks: {
                        callback: (value) => {
                            if (value === 0) return "Good Posture";
                            if (value === 1) return "Bad Posture";
                            if (value === -1) return "Power Off";
                            return "";
                        },
                    },
                },
            },
        },
    });
}


document.addEventListener("DOMContentLoaded", initApp);

// document.addEventListener('DOMContentLoaded', function () {
//     const modal = document.querySelector('#calibrateModal');
//     const overlay = document.querySelector('#modal-overlay');

//     const thresholdTable = document.querySelector('#threshold-table');
//     const calibrateBtnHome = document.querySelector('#calibrate-btn');



//     const openModalBtns = [
//         document.querySelector('#calibrate-btn'),
//         document.querySelector('#calibrateBtn')
//     ].filter(btn => btn !== null);

//     openModalBtns.forEach(btn => {
//         btn.addEventListener('click', () => {
//             const isModalVisible = modal.style.display === 'block';
//             modal.style.display = isModalVisible ? 'none' : 'block';
//             overlay.style.display = isModalVisible ? 'none' : 'block';

//             sendCalibrationMessage();
//         });
//     });

//     overlay.addEventListener('click', () => {
//         modal.style.display = 'none';
//         overlay.style.display = 'none';
//     });
// });
 
function setupStatisticsPage() {
    const datePicker = document.getElementById("datePicker");
    const errorMessage = document.getElementById("errorMessage");
    const ctx = document.getElementById("postureChart").getContext("2d");
    let postureChart;

    datePicker.addEventListener("change", async () => {
        const selectedDate = datePicker.value;
        console.log(selectedDate)
        if (!selectedDate) {
            showErrorMessage(errorMessage, "Please select a date.");
            return;
        }

        try {
            const data = await fetchPostureData(selectedDate);
            hideErrorMessage(errorMessage);

            const chartData = processChartData(data.powerData, data.slouchData);
            if (postureChart) postureChart.destroy();
            postureChart = renderChart(ctx, chartData);
        } catch (error) {
            showErrorMessage(errorMessage, error.message);
        }
    });
}


// TODO - This function doesn't work as expected, user need to select the date and then only they will see the data

function setupHomePage() {
    const ctx = document.getElementById("postureChartHome").getContext("2d");
    const errorMessage = document.getElementById("errorMessageHome");
    let postureChart;

    const today = new Date().toISOString().split("T")[0];

    const datePicker = document.getElementById("datePicker");


    datePicker.value = today;
    datePicker.addEventListener("change", async () => {
        const selectedDate = datePicker.value;
        if (!selectedDate) {
            showErrorMessage(errorMessage, "Please select a date.");
            return;
        }

        try {
            const data = await fetchPostureData(selectedDate);
            hideErrorMessage(errorMessage);

            const chartData = processChartData(data.powerData, data.slouchData);

            if (postureChart) postureChart.destroy();
            postureChart = renderChart(ctx, chartData);
        } catch (error) {
            showErrorMessage(errorMessage, error.message);
        }
    });
}


function processChartData(powerData, slouchData) {
    const timestamps = [];
    const greenBars = [];
    const greyBars = [];
    const redSpikes = [];

    powerData.forEach((session, index) => {
        const sessionTime = session.timestamp;

        if (!session.power_on) {
            if (!timestamps.includes(sessionTime)) {
                timestamps.push(sessionTime);
                greyBars.push(-1);
                greenBars.push(null);
                redSpikes.push(null);
            }

            if (
                index + 1 < powerData.length &&
                !timestamps.includes(powerData[index + 1].timestamp)
            ) {
                timestamps.push(powerData[index + 1].timestamp);
                greyBars.push(-1);
                greenBars.push(null);
                redSpikes.push(null);
            }
        } else {
            if (!timestamps.includes(sessionTime)) {
                timestamps.push(sessionTime);
                greenBars.push(0);
                greyBars.push(null);
                redSpikes.push(null);
            }

            slouchData.forEach((slouch) => {
                if (
                    slouch.timestamp >= sessionTime &&
                    (index + 1 < powerData.length
                        ? slouch.timestamp < powerData[index + 1].timestamp
                        : true)
                ) {
                    if (!timestamps.includes(slouch.timestamp)) {
                        timestamps.push(slouch.timestamp);
                        greenBars.push(0);
                        greyBars.push(null);
                        redSpikes.push(null);

                        timestamps.push(slouch.timestamp);
                        greenBars.push(null);
                        greyBars.push(null);
                        redSpikes.push(1);
                    }
                }
            });

            if (
                index + 1 < powerData.length &&
                !timestamps.includes(powerData[index + 1].timestamp)
            ) {
                timestamps.push(powerData[index + 1].timestamp);
                greenBars.push(0);
                greyBars.push(null);
                redSpikes.push(null);
            }
        }
    });

    return { timestamps, greenBars, greyBars, redSpikes };
}