// Wait until the page content is fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Get references to the theme toggle and font size slider elements
    const themeToggle = document.getElementById('themeToggle');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    
       // Function to set the theme (dark or light) based on what's saved in localStorage
    function applyTheme() {
        const isDarkMode = localStorage.getItem('theme') === 'dark';
        document.body.classList.toggle('dark-mode', isDarkMode);
        if (themeToggle) {
            themeToggle.checked = isDarkMode; // Sync toggle state with stored preference
        }
    }

    // Function to set the font size globally based on the saved value in localStorage
    function applyFontSize() {
        const savedFontSize = localStorage.getItem('fontSize') || '16px';// Default to 16px if not set
        document.documentElement.style.setProperty('--font-size', savedFontSize);
        document.body.style.fontSize = savedFontSize; // Apply the saved font size
        if (fontSizeSlider) {
            fontSizeSlider.value = parseInt(savedFontSize); // Sync slider value with stored size
        }
    }

 // Apply the user's saved preferences (theme and font size) when the page loads
    applyTheme();
    applyFontSize();

    // Update theme preference in localStorage when the toggle is changed
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const isDarkMode = themeToggle.checked; // Check if the toggle is on (dark mode)
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            applyTheme();
        });
    }

    // Update font size in localStorage and apply changes when the slider is adjusted
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', () => {
            const fontSize = fontSizeSlider.value + 'px';
            localStorage.setItem('fontSize', fontSize);
            applyFontSize();
        });
    }
});
