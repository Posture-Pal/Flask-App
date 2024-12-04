// document.addEventListener("DOMContentLoaded", () => {
//     const splashScreen = document.getElementById("splashScreen");

//     setTimeout(() => {
//         splashScreen.classList.add("hidden");
//     }, 2000);
// });

// splash screen now does not display if already seen
document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = document.getElementById("splashScreen");

    const hasSeenSplash = localStorage.getItem("hasSeenSplash");

    if (!hasSeenSplash) {
        splashScreen.style.display = "flex"; 

        setTimeout(() => {
            splashScreen.classList.add("hidden");
            splashScreen.style.display = "none"; 

            localStorage.setItem("hasSeenSplash", "true");
        }, 2000);
    } else {
        splashScreen.style.display = "none";
    }
});
