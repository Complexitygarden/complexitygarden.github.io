// Dark Mode Toggle Functionality

// Check for saved dark mode preference or default to light mode
function initializeDarkMode() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        updateDarkModeIcon(true);
    }
}

// Toggle dark mode
function toggleDarkMode() {
    const body = document.body;
    const isDarkMode = body.classList.toggle('dark-mode');
    
    // Save preference
    localStorage.setItem('darkMode', isDarkMode);
    
    // Update icon
    updateDarkModeIcon(isDarkMode);
}

// Update the icon based on mode
function updateDarkModeIcon(isDarkMode) {
    const btn = document.getElementById('darkModeToggle');
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) {
            if (isDarkMode) {
                icon.className = 'fa fa-sun-o';
                btn.title = 'Switch to Light Mode';
            } else {
                icon.className = 'fa fa-moon-o';
                btn.title = 'Switch to Dark Mode';
            }
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode();
    console.log('Dark mode initialized');
});
