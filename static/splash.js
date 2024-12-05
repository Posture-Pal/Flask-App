// document.addEventListener("DOMContentLoaded", () => {
//     const splashScreen = document.getElementById("splashScreen");

//     setTimeout(() => {
//         splashScreen.classList.add("hidden");
//     }, 2000);
// });

// splash screen now only displays for new browser sessions
document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = document.getElementById("splashScreen");

    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");

    if (!hasSeenSplash) {
        splashScreen.classList.add("show");
        setTimeout(() => {
            splashScreen.classList.add("hidden");
            sessionStorage.setItem("hasSeenSplash", "true");
        }, 2500);
    } else {
        splashScreen.classList.add("hidden");
    }
});
