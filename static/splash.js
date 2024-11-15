document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = document.getElementById("splashScreen");

    setTimeout(() => {
        splashScreen.classList.add("hidden");
    }, 3000);
});