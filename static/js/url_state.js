
// Function to encode current configuration to URL parameter
function encodeConfiguration() {
    try {
        const selectedClasses = networkProcessor.getSelectedClasses();
        
        // Convert to JSON and encode to base64
        const jsonString = JSON.stringify(selectedClasses);
        const base64Config = btoa(jsonString);
        
        return base64Config;
    } catch (error) {
        console.error('Error encoding configuration:', error);
        return null;
    }
}

// Function to decode configuration from URL parameter
export function decodeConfiguration(encodedConfig) {
    try {
        // Decode from base64 and parse JSON
        const jsonString = atob(encodedConfig);
        const classes = JSON.parse(jsonString);
        
        return classes;
    } catch (error) {
        console.error('Error decoding configuration:', error);
        return null;
    }
}


// Function to update the browser address bar with the current configuration
// If addToHistory is true, the change will create a new history entry (pushState). Otherwise, it
// will simply replace the current entry (replaceState) so that the back-button behaviour remains intuitive.
export function updateURLWithConfig(addToHistory = false) {
    try {
        const encodedConfig = encodeConfiguration();
        if (!encodedConfig) {
            return; // Nothing to update
        }

        const baseURL = window.location.origin + window.location.pathname;
        const newURL = `${baseURL}?config=${encodedConfig}`;

        if (addToHistory) {
            window.history.pushState({}, '', newURL);
        } else {
            window.history.replaceState({}, '', newURL);
        }
    } catch (error) {
        console.error('Error updating URL with configuration:', error);
    }
}