// initialize PubNub
const pubnub = new PubNub({
    publishKey: 'pub-c-ef699d1a-d6bd-415f-bb21-a5942c7afc1a',
    subscribeKey: 'sub-c-90478427-a073-49bc-b402-ba4903894284',
    uuid: "Posture-Pal",
});

// subscribe to channel
const channelName = "Posture-Pal";

pubnub.subscribe({
    channels: [channelName],
});


pubnub.addListener({
    message: function(event) {
        const data = event.message;  

        console.log("Received data:", data);

        // update HTML
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