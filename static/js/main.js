
// TODO Remove publishKey, subscribeKey, uuid, CHANNEL_NAME from main.js
const pubnub = new PubNub({
    publishKey: 'pub-c-ef699d1a-d6bd-415f-bb21-a5942c7afc1a',
    subscribeKey: 'sub-c-90478427-a073-49bc-b402-ba4903894284',
    uuid: "Posture-Pal",
});

const CHANNEL_NAME = "Posture-Pal";

// --- Initialization Functions ---
function initApp() {
    subscribeToChannel();
    setupPowerToggleListener();
    setupCalibrateButtonListener();
    setupToggleListeners();
    fetchLastSlouchTemperature();
}

document.addEventListener("DOMContentLoaded", initApp);

// --- PubNub Communication ---
function subscribeToChannel() {
    console.log("Subscribing to channel:", CHANNEL_NAME);
    pubnub.subscribe({ channels: [CHANNEL_NAME] });
    pubnub.addListener({
        message: handleIncomingMessage,
        status: handlePubNubStatus,
    });
}

function publishMessage(message, callback) {
    pubnub.publish({ channel: CHANNEL_NAME, message }, (status, response) => {
        if (status.error) {
            console.error("Error publishing message:", status);
        } else {
            console.log("Message sent successfully:", response);
        }
        if (callback) callback(status, response);
    });
}

function handleIncomingMessage(event) {
    console.log("Received message:", event.message);
    if (event.message.thresholds) {
        updateThresholdTable(event.message.thresholds);
    } else if (event.message.sensor_data) {
        updateSensorData(event.message.sensor_data);
    }
}

function handlePubNubStatus(statusEvent) {
    if (statusEvent.category === "PNConnectedCategory") {
        console.log("Successfully connected to PubNub channel.");
    } else {
        console.warn("PubNub connection status:", statusEvent);
    }
}

// --- UI Updates ---
function updateSensorData(data) {
    if (!data) {
        console.error("No sensor data received.");
        return;
    }

    const slouchStatus = document.getElementById("slouchStatusBoldText");
    if (slouchStatus) {
        slouchStatus.textContent = `Slouch: ${data.slouch ?? "N/A"}`;
    } else {
        console.warn("Slouch status element not found.");
    }

    sendDataToBackend("/save_sensor_data", data);
}

function updateThresholdTable(thresholds) {
    const tableBody = document.getElementById("threshold-values");
    const table = document.getElementById("threshold-table");
    if (!tableBody || !table) {
        console.warn("Threshold table elements not found.");
        return;
    }

    tableBody.innerHTML = "";
    Object.entries(thresholds).forEach(([key, value]) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${key}</td><td>${formatThresholdValue(value)}</td>`;
        tableBody.appendChild(row);
    });
    table.style.display = "table";

    sendDataToBackend("/save_threshold_data", thresholds);
}

function formatThresholdValue(value) {
    return Array.isArray(value) ? value.map(v => v.toFixed(2)).join(", ") : value.toFixed(2);
}

// --- Event Listeners ---
function setupPowerToggleListener() {
    const powerToggle = document.getElementById("powerToggle");
    if (!powerToggle) {
        console.error("Power toggle not found.");
        return;
    }

    powerToggle.addEventListener("change", () => {
        const powerOn = powerToggle.checked;
        publishMessage({ power: powerOn }, () => {
            sendDataToBackend("/save_power_session", { power_on: powerOn ? 1 : 0 });
        });
    });
}

function setupCalibrateButtonListener() {
    const calibrateButton = document.getElementById("calibrate-btn");
    if (!calibrateButton) {
        console.error("Calibrate button not found.");
        return;
    }

    calibrateButton.addEventListener("click", () => {
        publishMessage({ calibration_setup: true });
    });
}

function setupToggleListeners() {
    ["soundToggle", "vibrationToggle"].forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        if (toggle) toggle.addEventListener("change", sendModeStatus);
    });
}

function sendModeStatus() {
    const soundMode = document.getElementById("soundToggle").checked;
    const vibrationMode = document.getElementById("vibrationToggle").checked;
    publishMessage({ sound_mode: soundMode, vibration_mode: vibrationMode });
}

// --- Backend Communication ---
function sendDataToBackend(endpoint, data) {
    axios.post(endpoint, data)
        .then(response => console.log(response.data.message || "Data saved successfully."))
        .catch(error => console.error("Error sending data to backend:", error.response?.data?.error || error.message));
}


// --- Temperature Handling ---
function fetchLastSlouchTemperature() {
    axios.get("/last-slouch-temperature")
        .then(response => {
            if (response.status === 200) {
                const { temperature, temperature_status } = response.data;
                updateTemperatureUI(temperature);
                checkTemperatureAlert(temperature_status);
            }
        })
        .catch(error => console.error("Error fetching temperature:", error));
}

function updateTemperatureUI(temperature) {
    const temperatureDiv = document.querySelector(".temperatureBoldText");
    if (temperatureDiv) {
        temperatureDiv.textContent = `${temperature.toFixed(1)}°`;
    }
}

function checkTemperatureAlert(status) {
    if (status === "high") showNotification("Warning: Temperature is high!");
    if (status === "low") showNotification("Warning: Temperature is low!");
}

// --- Notifications ---
function showNotification(message) {
    if (!("Notification" in window)) return console.warn("Notifications not supported.");
    if (Notification.permission === "granted") {
        new Notification("Temperature Alert", { body: message });
    } else if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Temperature Alert", { body: message });
            }
        });
    }
}

// -----------------------------------------------------------------------------------------------------

//Statistics page
document.addEventListener("DOMContentLoaded", function () {
    const datePicker = document.getElementById("datePicker");
    const slouchCount = document.getElementById("slouchCount");
    const totalUsage = document.getElementById("totalUsage");
    const ctx = document.getElementById("postureChart").getContext("2d");
    let postureChart;

    // Fetching the most recent available date from the backend
    async function getMostRecentDate() {
        try {
            const response = await fetch('/get_last_available_data_date');
            const data = await response.json();

            if (data.success) {
                return data.lastAvailableDate; 
            } else {
                console.error("No data available before today.");
                return null;
            }
        } catch (error) {
            console.error("Error fetching the most recent available date:", error);
            return null;
        }
    }

    // Setting default date to the last available date before today
    async function setDefaultDate() {
        const mostRecentDate = await getMostRecentDate();
        if (mostRecentDate) {
            datePicker.value = mostRecentDate; 
            fetchStatistics(mostRecentDate); 
        } else {
            console.warn("No available data before today.");
        }
    }

    setDefaultDate(); 


    // Initializing the chart with data
    function initializeChart(data) {
        if (!data || data.durations.length === 0) {
            if (postureChart) {
                postureChart.destroy(); // Destroying the existing chart if it exists
            }
            slouchCount.textContent = "0"; 
            document.getElementById("totalUsage").textContent = "0.00 hours"; 
            populateSlouchTimings([]); 
            return;
        }
    
    
        if (postureChart) postureChart.destroy(); 
    
        const image = new Image();
        image.src = "/static/images/penguinRing.png";
    
        const centerImagePlugin = {
            id: "centerImage",
            afterDraw(chart) {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                const centerX = (chartArea.left + chartArea.right) / 2;
                const centerY = (chartArea.top + chartArea.bottom) / 2;
    
                const innerRadius = chart.getDatasetMeta(0).data[0].innerRadius;
                const imageSize = innerRadius * 1.9;
    
                if (image.complete) {
                    ctx.drawImage(image, centerX - imageSize / 2, centerY - imageSize / 2, imageSize, imageSize);
                } else {
                    image.onload = function () {
                        chart.draw();
                    };
                }
            },
        };
    
        postureChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        data: data.durations,
                        backgroundColor: data.colors,
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: "80%",
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: false,
                        external: function (context) {
                            const tooltipModel = context.tooltip;
                            let tooltipEl = document.getElementById("chartjs-tooltip");
                            if (!tooltipEl) {
                                tooltipEl = document.createElement("div");
                                tooltipEl.id = "chartjs-tooltip";
                                tooltipEl.className = "chartjs-tooltip";
                                document.body.appendChild(tooltipEl);
                            }
    
                            if (tooltipModel.opacity === 0) {
                                tooltipEl.style.opacity = "0";
                                return;
                            }
    
                            if (tooltipModel.body) {
                                const title = tooltipModel.title || [];
                                const body = tooltipModel.body.map((item) => item.lines);
                                let tooltipContent = `<div><strong>${title.join("<br>")}</strong></div>`;
                                tooltipContent += `<div>${body.join("<br>")}</div>`;
                                tooltipEl.innerHTML = tooltipContent;
                            }
    
                            const canvasRect = context.chart.canvas.getBoundingClientRect();
                            const tooltipX = canvasRect.left + window.scrollX + tooltipModel.caretX;
                            const tooltipY = canvasRect.top + window.scrollY + tooltipModel.caretY;
    
                            tooltipEl.style.opacity = "1";
                            tooltipEl.style.left = `${tooltipX}px`;
                            tooltipEl.style.top = `${tooltipY}px`;
                            tooltipEl.style.position = "absolute";
                            tooltipEl.style.pointerEvents = "none";
                            tooltipEl.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                            tooltipEl.style.border = "1px solid rgba(0, 0, 0, 0.1)";
                            tooltipEl.style.borderRadius = "5px";
                            tooltipEl.style.padding = "10px";
                            tooltipEl.style.boxShadow = "0px 2px 6px rgba(0, 0, 0, 0.1)";
                            tooltipEl.style.fontFamily = "Arial, sans-serif";
                            tooltipEl.style.fontSize = "12px";
                            tooltipEl.style.zIndex = "1000";
                        },
                        callbacks: {
                            label: function (context) {
                                const label = context.label || "";
                                const timeRange = label.split(": ")[1];
                                if (!timeRange) return "";
                                const times = timeRange.split(" - ");
                                return times.length === 2 ? `${times[0]} - ${times[1]}` : times[0];
                            },
                            title: function (tooltipItems) {
                                const title = tooltipItems[0].label || "";
                                return title.split(": ")[0];
                            },
                        },
                    },
                },
            },
            plugins: [centerImagePlugin],
        });
    }
    
    // Processing power and slouch data into durations, labels and colors
    function processChartData(powerData, slouchData) {
        const durations = [];
        const labels = [];
        const colors = [];

        powerData.forEach((session, index) => {
            const sessionStart = new Date(`2024-11-21T${session.timestamp}`);
            const sessionEnd =
                index + 1 < powerData.length
                    ? new Date(`2024-11-21T${powerData[index + 1].timestamp}`)
                    : null;

            if (!session.power_on) {
                // Handling power off periods
                if (!sessionEnd) {
                    durations.push(0.1); 
                    labels.push(`Power Off: ${formatTime(sessionStart)}`);
                } else {
                    const duration = (sessionEnd - sessionStart) / (1000 * 60 * 60);
                    durations.push(duration);
                    labels.push(`Power Off: ${formatTime(sessionStart)} - ${formatTime(sessionEnd)}`);
                }
                colors.push("#9B9B9B");
            } else {
                // Handling power on and slouch events
                let lastTime = sessionStart;

                slouchData.forEach((slouch) => {
                    const slouchTime = new Date(`2024-11-21T${slouch.timestamp}`);
                    if (slouchTime >= sessionStart && (!sessionEnd || slouchTime <= sessionEnd)) {
                        const goodDuration = (slouchTime - lastTime) / (1000 * 60 * 60);
                        if (goodDuration > 0) {
                            durations.push(goodDuration);
                            labels.push(`Good Posture: ${formatTime(lastTime)} - ${formatTime(slouchTime)}`);
                            colors.push("#46C261");
                        }

                        durations.push(0.1);
                        labels.push(`Slouch: ${formatTime(slouchTime)}`);
                        colors.push("#D1582F");

                        lastTime = slouchTime;
                    }
                });

                if (sessionEnd) {
                    const remainingGoodDuration = (sessionEnd - lastTime) / (1000 * 60 * 60);
                    if (remainingGoodDuration > 0) {
                        durations.push(remainingGoodDuration);
                        labels.push(`Good Posture: ${formatTime(lastTime)} - ${formatTime(sessionEnd)}`);
                        colors.push("#46C261");
                    }
                }
            }
        });

        return { durations, labels, colors };
    }

    // Formatting time for display
    function formatTime(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const period = hours >= 12 ? "PM" : "AM";
        const formattedHours = ((hours + 11) % 12) + 1;
        return `${formattedHours}:${minutes} ${period}`;
    }

    // Fetching statistics for the selected date
    async function fetchStatistics(date) {
        try {
            const response = await fetch(`/get_posture_data?date=${date}`);
            const data = await response.json();
    
            if (!data.success) {
                console.error("Error fetching data:", data.message);
                initializeChart(null); // Passing null or empty data to initializeChart to clear it
                return;
            }
    
            const chartData = processChartData(data.powerData, data.slouchData);
    
            if (!chartData.durations.length) {
                console.warn("No valid data for the selected date.");
                initializeChart(null); // Clearing chart if no valid data
                return;
            }
    
            initializeChart(chartData); // Updating the chart with fetched data
    
            slouchCount.textContent = data.slouchData.length; 
    
            let totalUsage = 0;
    
            for (let i = 0; i < data.powerData.length - 1; i++) {
                const currentSession = data.powerData[i];
                const nextSession = data.powerData[i + 1];
    
                if (currentSession.power_on && !nextSession.power_on) {
                    const startTime = new Date(`2024-11-21T${currentSession.timestamp}`);
                    const endTime = new Date(`2024-11-21T${nextSession.timestamp}`);
                    totalUsage += (endTime - startTime) / (1000 * 60 * 60); 
                }
            }
    
            document.getElementById("totalUsage").textContent = `${totalUsage.toFixed(2)} hours`;
    
            populateSlouchTimings(data.slouchData); 
    
        } catch (error) {
            console.error("Error fetching statistics:", error);
            initializeChart(null); 
        }
    }
    

    // Populating slouch timings in a table
    function populateSlouchTimings(slouchData) {
        const slouchDetailsContainer = document.getElementById("chartDetails");
        slouchDetailsContainer.innerHTML = "";

        if (slouchData.length === 0) {
            slouchDetailsContainer.innerHTML = `<p>No slouch events recorded for the selected date.</p>`;
            return;
        }

        const table = document.createElement("table");
        table.className = "table table-striped table-bordered";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        const headerSlouchEvent = document.createElement("th");
        headerSlouchEvent.textContent = "Slouch Event";

        const headerTime = document.createElement("th");
        headerTime.textContent = "Time";

        headerRow.appendChild(headerSlouchEvent);
        headerRow.appendChild(headerTime);
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        slouchData.forEach((slouch, index) => {
            const slouchTime = new Date(`2024-11-21T${slouch.timestamp}`);
            const formattedTime = formatTime(slouchTime);

            const row = document.createElement("tr");

            const slouchEventCell = document.createElement("td");
            slouchEventCell.textContent = `Slouch Event ${index + 1}`;

            const timeCell = document.createElement("td");
            timeCell.textContent = formattedTime;

            row.appendChild(slouchEventCell);
            row.appendChild(timeCell);
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        slouchDetailsContainer.appendChild(table);
    }

    // Handling date selection changes
    datePicker.addEventListener("change", function () {
    const selectedDate = datePicker.value;
    if (selectedDate) {
        fetchStatistics(selectedDate);
    }
});
});

//Home page
document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById("homePagePostureChart").getContext("2d");
    let homePagePostureChart;

    const noDataMessage = document.getElementById("noDataMessage");
    const homePagePostureChartContainer = document.getElementById("homePagePostureChart");

    // Helper function to fetch today's date
    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, "0"); 
        const day = today.getDate().toString().padStart(2, "0"); 
        return `${year}-${month}-${day}`; 
    }

    // Fetching statistics for today
    async function fetchTodayStatistics() {
        const todayDate = getTodayDate();
        try {
            const response = await fetch(`/get_posture_data?date=${todayDate}`);
            const data = await response.json();

            if (!data.success || !data.powerData || !data.slouchData) {
                console.log("No data available for today.");
                displayNoDataMessage(true);
                return;
            }

            const chartData = processChartData(data.powerData, data.slouchData);
            if (chartData.durations.length === 0) {
                console.log("No valid data for today.");
                displayNoDataMessage(true);
                return;
            }

            initializeChart(chartData);
            displayNoDataMessage(false);

        } catch (error) {
            console.error("Error fetching statistics:", error);
            displayNoDataMessage(true);
        }
    }

    // Function to display or hide the "No Data Available" message
    function displayNoDataMessage(show) {
        if (show) {
            noDataMessage.style.display = "flex";
            homePagePostureChartContainer.style.display = "none";
            if (homePagePostureChart) homePagePostureChart.destroy();
        } else {
            noDataMessage.style.display = "none";
            homePagePostureChartContainer.style.display = "block";
        }
    }

    // Function to initialize the chart with data
    function initializeChart(data) {
        if (homePagePostureChart) {
            homePagePostureChart.destroy(); 
        }

        const image = new Image();
        image.src = "/static/images/penguinRing.png";

        const centerImagePlugin = {
            id: "centerImage",
            afterDraw(chart) {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                const centerX = (chartArea.left + chartArea.right) / 2;
                const centerY = (chartArea.top + chartArea.bottom) / 2;

                const innerRadius = chart.getDatasetMeta(0).data[0].innerRadius;
                const imageSize = innerRadius * 1.9;

                if (image.complete) {
                    ctx.drawImage(image, centerX - imageSize / 2, centerY - imageSize / 2, imageSize, imageSize);
                } else {
                    image.onload = function () {
                        chart.draw();
                    };
                }
            },
        };

        // Initializing the chart 
        homePagePostureChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        data: data.durations,
                        backgroundColor: data.colors,
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: "80%",
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: false, // Enable tooltips
                        external: function (context) {
                            const tooltipModel = context.tooltip;
                            let tooltipEl = document.getElementById("chartjs-tooltip");
                            if (!tooltipEl) {
                                tooltipEl = document.createElement("div");
                                tooltipEl.id = "chartjs-tooltip";
                                tooltipEl.className = "chartjs-tooltip";
                                document.body.appendChild(tooltipEl);
                            }

                            if (tooltipModel.opacity === 0) {
                                tooltipEl.style.opacity = "0";
                                return;
                            }

                            if (tooltipModel.body) {
                                const title = tooltipModel.title || [];
                                const body = tooltipModel.body.map((item) => item.lines);
                                let tooltipContent = `<div><strong>${title.join("<br>")}</strong></div>`;
                                tooltipContent += `<div>${body.join("<br>")}</div>`;
                                tooltipEl.innerHTML = tooltipContent;
                            }

                            const canvasRect = context.chart.canvas.getBoundingClientRect();
                            const tooltipX = canvasRect.left + window.scrollX + tooltipModel.caretX;
                            const tooltipY = canvasRect.top + window.scrollY + tooltipModel.caretY;

                            tooltipEl.style.opacity = "1";
                            tooltipEl.style.left = `${tooltipX}px`;
                            tooltipEl.style.top = `${tooltipY}px`;
                            tooltipEl.style.position = "absolute";
                            tooltipEl.style.pointerEvents = "none";
                            tooltipEl.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                            tooltipEl.style.border = "1px solid rgba(0, 0, 0, 0.1)";
                            tooltipEl.style.borderRadius = "5px";
                            tooltipEl.style.padding = "10px";
                            tooltipEl.style.boxShadow = "0px 2px 6px rgba(0, 0, 0, 0.1)";
                            tooltipEl.style.fontFamily = "Arial, sans-serif";
                            tooltipEl.style.fontSize = "12px";
                            tooltipEl.style.zIndex = "1000";
                        },
                        callbacks: {
                            label: function (context) {
                                const label = context.label || "";
                                const timeRange = label.split(": ")[1];
                                if (!timeRange) return "";
                                const times = timeRange.split(" - ");
                                return times.length === 2 ? `${times[0]} - ${times[1]}` : times[0];
                            },
                            title: function (tooltipItems) {
                                const title = tooltipItems[0].label || "";
                                return title.split(": ")[0];
                            },
                        },
                    },
                },
            },
            plugins: [centerImagePlugin],
        });
    }

    // Processing power and slouch data into durations, labels, and colors
    function processChartData(powerData, slouchData) {
        const durations = [];
        const labels = [];
        const colors = [];

        powerData.forEach((session, index) => {
            const sessionStart = new Date(`2024-11-21T${session.timestamp}`);
            const sessionEnd =
                index + 1 < powerData.length
                    ? new Date(`2024-11-21T${powerData[index + 1].timestamp}`)
                    : null;

            if (!session.power_on) {
                // Handling power off periods
                if (!sessionEnd) {
                    durations.push(0.1);
                    labels.push(`Power Off: ${formatTime(sessionStart)}`);
                } else {
                    const duration = (sessionEnd - sessionStart) / (1000 * 60 * 60);
                    durations.push(duration);
                    labels.push(`Power Off: ${formatTime(sessionStart)} - ${formatTime(sessionEnd)}`);
                }
                colors.push("#9B9B9B");
            } else {
                // Handling power on and slouch events
                let lastTime = sessionStart;

                slouchData.forEach((slouch) => {
                    const slouchTime = new Date(`2024-11-21T${slouch.timestamp}`);
                    if (slouchTime >= sessionStart && (!sessionEnd || slouchTime <= sessionEnd)) {
                        const goodDuration = (slouchTime - lastTime) / (1000 * 60 * 60);
                        if (goodDuration > 0) {
                            durations.push(goodDuration);
                            labels.push(`Good Posture: ${formatTime(lastTime)} - ${formatTime(slouchTime)}`);
                            colors.push("#46C261");
                        }

                        durations.push(0.1);
                        labels.push(`Slouch: ${formatTime(slouchTime)}`);
                        colors.push("#D1582F");

                        lastTime = slouchTime;
                    }
                });

                if (sessionEnd) {
                    const remainingGoodDuration = (sessionEnd - lastTime) / (1000 * 60 * 60);
                    if (remainingGoodDuration > 0) {
                        durations.push(remainingGoodDuration);
                        labels.push(`Good Posture: ${formatTime(lastTime)} - ${formatTime(sessionEnd)}`);
                        colors.push("#46C261");
                    }
                }
            }
        });

        return { durations, labels, colors };
    }

    // Formatting time for display
    function formatTime(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const period = hours >= 12 ? "PM" : "AM";
        const formattedHours = ((hours + 11) % 12) + 1;
        return `${formattedHours}:${minutes} ${period}`;
    }

    // Fetching statistics for today
    fetchTodayStatistics();
});

// only display the disclaimer on information page once
document.addEventListener("DOMContentLoaded", function () {
    const disclaimer = document.getElementById("disclaimerAlert");

    if (localStorage.getItem("disclaimerDismissed") !== "true") {
        disclaimer.classList.remove("hidden");
    }
});

function dismissDisclaimer() {
    localStorage.setItem("disclaimerDismissed", "true");
}