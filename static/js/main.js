

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

    table.style.display = "none";
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
    // startListeningForUpdates();

    // const powerButton = document.getElementById("power-btn");
    // powerButton.addEventListener("click", () => {
    //     sendPowerOnMessage();
    // });

    // const powerOffButton = document.getElementById("power-off-btn");
    // powerOffButton.addEventListener("click", () => {
    //     sendPowerOffMessage();
    // });

    // const calibrateButton = document.getElementById("calibrate-btn");
    // calibrateButton.addEventListener("click", () => {
    //     sendCalibrationMessage();
    // });

    // const statisticButton = document.getElementById("view-statistics-btn");
    // statisticButton.addEventListener("click", () => {
    //     fetchAndDisplayStatistics();
    // });


    if (document.body.classList.contains("statistics-page")) {
        setupStatisticsPage();

    }

    if (document.body.classList.contains("home-page")) {
                console.log("Inside the body page")
        setupHomePage();
    }

    fetchLastSlouchTemperature();

    // initToggleListeners();
}

// function populatePowerSessionsTable(powerSessions) {
//     const powerSessionsTable = document.getElementById("power-sessions-table");
//     powerSessionsTable.innerHTML = ""; 

//     powerSessions.forEach((session) => {
//         const row = document.createElement("tr");

//         const powerOnCell = document.createElement("td");
//         powerOnCell.textContent = session.power_on ? "Yes" : "No";

//         const timestampCell = document.createElement("td");
//         timestampCell.textContent = new Date(session.timestamp).toLocaleString();

//         row.appendChild(powerOnCell);
//         row.appendChild(timestampCell);

//         powerSessionsTable.appendChild(row);
//     });
// }

// function populateSensorDataTable(sensorData) {
//     const sensorDataTable = document.getElementById("sensor-data-table");
//     sensorDataTable.innerHTML = ""; 
//     console.log(sensorData);


//     sensorData.forEach((data) => {
//         const row = document.createElement("tr");

//         const temperatureCell = document.createElement("td");
//         temperatureCell.textContent = data.temperature.toFixed(1) + " °C";

//         const temperatureStatusCell = document.createElement("td");
//         temperatureStatusCell.textContent = data.temperature_status;

//         const humidityCell = document.createElement("td");
//         humidityCell.textContent = data.humidity.toFixed(1) + " %";

//         const humidityStatusCell = document.createElement("td");
//         humidityStatusCell.textContent = data.humidity_status;

//         const pitchCell = document.createElement("td");
//         pitchCell.textContent = data.pitch.toFixed(2);

//         const gravityXCell = document.createElement("td");
//         gravityXCell.textContent = data.gravity_x.toFixed(2);

//         const gravityYCell = document.createElement("td");
//         gravityYCell.textContent = data.gravity_y.toFixed(2);

//         const gravityZCell = document.createElement("td");
//         gravityZCell.textContent = data.gravity_z.toFixed(2);


//         const timestampCell = document.createElement("td");
//         timestampCell.textContent = new Date(data.timestamp).toLocaleString();

//         row.appendChild(temperatureCell);
//         row.appendChild(temperatureStatusCell);
//         row.appendChild(humidityCell);
//         row.appendChild(humidityStatusCell);
//         row.appendChild(pitchCell);
//         row.appendChild(gravityXCell);
//         row.appendChild(gravityYCell);
//         row.appendChild(gravityZCell);
//         row.appendChild(timestampCell);

//         sensorDataTable.appendChild(row);
//     });
// }

// function fetchAndDisplayStatistics() {
//     axios
//         .get("/get_statistics_data")
//         .then((response) => {
//             const { power_sessions, sensor_data } = response.data;

//             populatePowerSessionsTable(power_sessions);
//             populateSensorDataTable(sensor_data);
//             createLineGraph(sensor_data, power_sessions);

//             console.log("Statistics data displayed successfully.");
//         })
//         .catch((error) => {
//             console.error("Error fetching statistics data:", error.response?.data?.error || error.message);
//         });
// }

// function prepareGraphData(sensorData, powerSessions) {
//     const timestamps = [];
//     const postureStates = [];
//     const powerStates = [];

//     let sensorIndex = 0;
//     let powerIndex = 0;

//     while (sensorIndex < sensorData.length && powerIndex < powerSessions.length) {
//         const sensorTimestamp = new Date(sensorData[sensorIndex].timestamp);
//         const powerTimestamp = new Date(powerSessions[powerIndex].timestamp);

//         if (powerTimestamp < sensorTimestamp) {
//             powerIndex++;
//         } else if (sensorTimestamp < powerTimestamp) {
//             sensorIndex++;
//         } else {
//             timestamps.push(sensorTimestamp);
//             postureStates.push(sensorData[sensorIndex].posture_status === 'good' ? 1 : 0);
//             powerStates.push(powerSessions[powerIndex].power_status === 'on' ? 1 : 0);

//             sensorIndex++;
//             powerIndex++;
//         }
//     }

//     return {
//         timestamps,
//         postureStates,
//         powerStates,
//     };
// }


// function createLineGraph(sensorData, powerSessions) {
//     const graphData = prepareGraphData(sensorData, powerSessions);

//     const ctx = document.getElementById("lineGraph").getContext("2d");

//     const chart = new Chart(ctx, {
//         type: "line",
//         data: {
//             labels: graphData.timestamps,
//             datasets: [
//                 {
//                     label: "Posture",
//                     data: graphData.postureStates,
//                     borderColor: "green",
//                     backgroundColor: "rgba(0, 255, 0, 0.2)",
//                     fill: true,
//                     lineTension: 0.1,
//                     borderWidth: 2,
//                     pointRadius: 0,
//                 },
//                 {
//                     label: "Slouch",
//                     data: graphData.postureStates.map((state) => (state === 0 ? 1 : null)), // Slouch
//                     borderColor: "red",
//                     backgroundColor: "rgba(255, 0, 0, 0.2)",
//                     fill: true,
//                     lineTension: 0.1,
//                     borderWidth: 2,
//                     pointRadius: 0,
//                 },
//                 {
//                     label: "Power Status",
//                     data: graphData.powerStates,
//                     borderColor: "gray",
//                     backgroundColor: "rgba(128, 128, 128, 0.2)",
//                     fill: false,
//                     borderWidth: 2,
//                     pointRadius: 0,
//                 },
//             ],
//         },
//         options: {
//             scales: {
//                 x: {
//                     type: "time",
//                     time: {
//                         unit: "minute", 
//                         tooltipFormat: "ll HH:mm", 
//                     },
//                     title: {
//                         display: true,
//                         text: "Time",
//                     },
//                 },
//                 y: {
//                     beginAtZero: false,
//                     ticks: {
//                         stepSize: 1,
//                         min: -1, 
//                         max: 2,
//                     },
//                     title: {
//                         display: true,
//                         text: "States",
//                     },
//                 },
//             },
//             responsive: true,
//             plugins: {
//                 legend: {
//                     position: "top",
//                 },
//                 tooltip: {
//                     mode: "index",
//                     intersect: false,
//                 },
//             },
//         },
//     });
// }
function populateTemperature(data) {
    const temperatureDiv = document.querySelector(".temperatureBoldText");
    if (temperatureDiv) {
        temperatureDiv.textContent = `${data.temperature}°`;

        checkTemperatureStatus(data.temperature_status);
    }
}

// function showPushNotification(message) {
//     if ("Notification" in window) {
//         if (Notification.permission === "granted") {
//             new Notification("Temperature Alert", { body: message });
//         } else if (Notification.permission === "default") {
//             Notification.requestPermission().then((permission) => {
//                 if (permission === "granted") {
//                     new Notification("Temperature Alert", { body: message });
//                 } else {
//                     console.log("Notification permission denied.");
//                 }
//             });
//         } else {
//             console.log("Notifications are blocked. Please enable them in browser settings.");
//         }
//     } else {
//         alert("This browser does not support notifications.");
//     }
// }

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



document.addEventListener("DOMContentLoaded", initApp);

document.addEventListener('DOMContentLoaded', function () {
    const calibrateBtn = document.getElementById('calibrate-btn');
    const thresholdTable = document.getElementById('threshold-table');

    fetch('/check-threshold')
        .then(response => response.json())
        .then(data => {
            if (data.show_calibrate) {
                calibrateBtn.style.display = 'block';
                thresholdTable.style.display = 'block';
            } else {
                calibrateBtn.style.display = 'none';
                thresholdTable.style.display = 'none';
            }
        })
        .catch(error => console.error('Error fetching threshold status:', error));
});

document.getElementById("calibrate-btn").addEventListener("click", () => {
    const modal = document.getElementById("calibrateModal");
    const overlay = document.getElementById("modal-overlay")
    modal.style.display = modal.style.display === "none" ? "block" : "none";
    overlay.style.display = overlay.style.display === "none" ? "block" : "none";
});

async function fetchPostureData(date) {
    try {
        const response = await fetch(`/get_posture_data?date=${date}`);
        const data = await response.json();
        

        if (!data.success) {
            throw new Error(data.message || "An error occurred while fetching data.");
        }

        console.log(data, "Inside fetchPostureData")
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
    // console.log(data, "Inside renderChart")
    console.log("happy")

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
    // const ctx = document.getElementById("postureChartHome").getContext("2d");
    // const errorMessage = document.getElementById("errorMessageHome");
    // let postureChart;

    // // Fetch and render data for today
    // const today = new Date().toISOString().split("T")[0];

    // (async () => {
    //     try {
    //         const data = await fetchPostureData(today);
    //         hideErrorMessage(errorMessage);

    //         const chartData = processChartData(data.powerData, data.slouchData);
    //         if (postureChart) postureChart.destroy();
    //         postureChart = renderChart(ctx, chartData);
    //     } catch (error) {
    //         showErrorMessage(errorMessage, error.message);
    //     }
    // })();

    const ctx = document.getElementById("postureChartHome").getContext("2d");
    const errorMessage = document.getElementById("errorMessageHome");
    let postureChart;

    const today = new Date().toISOString().split("T")[0];
    console.log(today)


    // (async () => {
    //     try {
    //         const data = await fetchPostureData(today);
    //         hideErrorMessage(errorMessage);
    //         console.log(data)

    //         const chartData = processChartData(data.powerData, data.slouchData);
    //         if (postureChart) postureChart.destroy();
    //         postureChart = renderChart(ctx, chartData);
    //     } catch (error) {
    //         showErrorMessage(errorMessage, error.message);
    //     }
    // })();

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
            console.log(chartData, "Inside setup home page")

            console.log("About to call renderChart", chartData);
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
