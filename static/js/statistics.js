// document.addEventListener("DOMContentLoaded", function () {
//     const datePicker = document.getElementById("datePicker");
//     const errorMessage = document.getElementById("errorMessage");
//     const ctx = document.getElementById("postureChart").getContext("2d");
//     let postureChart;

//     datePicker.addEventListener("change", async function () {
//         const selectedDate = datePicker.value;
//         if (!selectedDate) {
//             showError("Please select a date.");
//             return;
//         }

//         try {
//             const response = await fetch(`/get_posture_data?date=${selectedDate}`);
//             const data = await response.json();

//             if (!data.success) {
//                 showError(data.message || "An error occurred while fetching data.");
//                 return;
//             }

//             errorMessage.style.display = "none";
//             processAndRenderChart(data.powerData, data.slouchData);
//         } catch (error) {
//             console.error("Error fetching data:", error);
//             showError("An error occurred while fetching data.");
//         }
//     });

//     function showError(message) {
//         errorMessage.textContent = message;
//         errorMessage.style.display = "block";
//         if (postureChart) postureChart.destroy();
//     }

//     function processAndRenderChart(powerData, slouchData) {
//         if (postureChart) postureChart.destroy();

//         const timestamps = [];
//         const greenBars = [];
//         const greyBars = [];
//         const redSpikes = [];

//         let isPowerOn = false;

//         // Process power sessions
//         powerData.forEach((session, index) => {
//             const sessionTime = session.timestamp;

//             if (!session.power_on) {
//                 // Grey bar for power-off
//                 if (!timestamps.includes(sessionTime)) {
//                     timestamps.push(sessionTime);
//                     greyBars.push(-1); // Power-off baseline
//                     greenBars.push(null); // No good posture
//                     redSpikes.push(null); // No bad posture
//                 }

//                 // Continue grey bar until the next session or end of the day
//                 if (
//                     index + 1 < powerData.length &&
//                     !timestamps.includes(powerData[index + 1].timestamp)
//                 ) {
//                     timestamps.push(powerData[index + 1].timestamp);
//                     greyBars.push(-1); // Continue power-off
//                     greenBars.push(null);
//                     redSpikes.push(null);
//                 }
//             } else {
//                 // Green bar for power-on
//                 if (!timestamps.includes(sessionTime)) {
//                     timestamps.push(sessionTime);
//                     greenBars.push(0); // Good posture baseline
//                     greyBars.push(null); // No power-off
//                     redSpikes.push(null);
//                 }

//                 // Add red spikes only for valid slouch events
//                 slouchData.forEach(slouch => {
//                     if (
//                         slouch.timestamp >= sessionTime && // Slouch happens after power-on
//                         (index + 1 < powerData.length
//                             ? slouch.timestamp < powerData[index + 1].timestamp
//                             : true)
//                     ) {
//                         if (!timestamps.includes(slouch.timestamp)) {
//                             // Add green bar until slouch point
//                             timestamps.push(slouch.timestamp);
//                             greenBars.push(0); // Good posture
//                             greyBars.push(null);
//                             redSpikes.push(null);

//                             // Add red spike for slouch
//                             timestamps.push(slouch.timestamp);
//                             greenBars.push(null);
//                             greyBars.push(null);
//                             redSpikes.push(1); // Bad posture spike
//                         }
//                     }
//                 });

//                 // Continue green bar until the next power-off or the end of the session
//                 if (
//                     index + 1 < powerData.length &&
//                     !timestamps.includes(powerData[index + 1].timestamp)
//                 ) {
//                     timestamps.push(powerData[index + 1].timestamp);
//                     greenBars.push(0); // Continue good posture
//                     greyBars.push(null);
//                     redSpikes.push(null);
//                 }
//             }
//         });

//         renderChart(timestamps, greenBars, greyBars, redSpikes);
//     }

//     function renderChart(timestamps, greenBars, greyBars, redSpikes) {
//         if (postureChart) postureChart.destroy();

//         postureChart = new Chart(ctx, {
//             type: "line",
//             data: {
//                 labels: timestamps,
//                 datasets: [
//                     {
//                         label: "Good Posture",
//                         data: greenBars,
//                         borderColor: "green",
//                         backgroundColor: "green",
//                         borderWidth: 2,
//                         fill: false,
//                         stepped: true, // Stepped for clear transitions
//                     },
//                     {
//                         label: "Power Off",
//                         data: greyBars,
//                         borderColor: "gray",
//                         backgroundColor: "gray",
//                         borderWidth: 2,
//                         fill: false,
//                         stepped: true, // Stepped for power-off periods
//                     },
//                     {
//                         label: "Bad Posture",
//                         data: redSpikes,
//                         borderColor: "red",
//                         backgroundColor: "red",
//                         borderWidth: 2,
//                         fill: false,
//                         stepped: true,
//                         pointStyle: "circle",
//                         pointRadius: function (context) {
//                             return context.raw === 1 ? 6 : 0; // Highlight slouch events
//                         },
//                     },
//                 ],
//             },
//             options: {
//                 responsive: true,
//                 plugins: {
//                     legend: { display: true },
//                 },
//                 scales: {
//                     x: {
//                         title: { display: true, text: "Time" },
//                         ticks: {
//                             autoSkip: true,
//                             maxTicksLimit: 10,
//                         },
//                     },
//                     y: {
//                         title: { display: true, text: "Posture Status" },
//                         min: -1.5, // Adjusted to leave space for dots
//                         max: 1.5,
//                         ticks: {
//                             callback: function (value) {
//                                 if (value === 0) return "Good Posture";
//                                 if (value === 1) return "Bad Posture";
//                                 if (value === -1) return "Power Off";
//                                 return "";
//                             },
//                         },
//                     },
//                 },
//             },
//         });
//     }
// });
