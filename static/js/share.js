// Share functionality for Complexity Garden

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
function decodeConfiguration(encodedConfig) {
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

// Function to generate shareable URL
function generateShareableURL() {
    const encodedConfig = encodeConfiguration();
    
    if (!encodedConfig) {
        showNotification('Error generating shareable link', 'error');
        return null;
    }
    
    const baseURL = window.location.origin + window.location.pathname;
    const shareURL = `${baseURL}?config=${encodedConfig}`;
    
    return shareURL;
}

// Function to copy text to clipboard
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            // Use the modern clipboard API
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        }
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
    }
}

// Function to show notifications
function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.share-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `share-notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48BB78' : '#E53E3E'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Function to handle share button click
async function handleShare() {
    const selectedClasses = networkProcessor.getSelectedClasses();
    
    if (!selectedClasses || selectedClasses.length === 0) {
        showNotification('No classes selected to share', 'error');
        return;
    }
    
    const shareURL = generateShareableURL();
    if (!shareURL) {
        return; // Error already shown
    }
    
    const success = await copyToClipboard(shareURL);
    
    if (success) {
        showNotification(`Shareable link copied to clipboard! (${selectedClasses.length} classes)`);
    } else {
        showNotification('Failed to copy link to clipboard', 'error');
        // As fallback, show the URL in a prompt
        prompt('Copy this shareable link:', shareURL);
    }
}

// Initialize share functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to share button
    const shareLink = document.getElementById('share-link');
    if (shareLink) {
        shareLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleShare();
        });
    }
    
    // Note: Shared configuration loading is now handled in main_vis.js
    // during the main initialization process to ensure networkProcessor
    // is fully loaded before processing shared configurations
}); 