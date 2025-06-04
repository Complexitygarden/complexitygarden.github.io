$(document).ready(function() {
    $("#leftSidebarMenu").on("click", "#settings_menu_item", function(e) {
        var $submenu = $(this).children("ul");
        // If the submenu is currently animating, ignore this click.
        if ($submenu.is(":animated")) {
            console.log("Avoiding double-clicking which causes the submenu to open and close");
            return;
        }
        $(this).toggleClass("open");
        $submenu.slideToggle("fast");
    });

    // Handle history menu dropdown
    $("#leftSidebarMenu").on("click", "#history_menu_item", function(e) {
        var $submenu = $(this).children("ul");
        // If the submenu is currently animating, ignore this click.
        if ($submenu.is(":animated")) {
            console.log("Avoiding double-clicking which causes the submenu to open and close");
            return;
        }
        $(this).toggleClass("open");
        $submenu.slideToggle("fast");
    });

    // Prevent clicks on the sub-items from toggling the parent's settings menu.
    $("#leftSidebarMenu").on("click", "#settings_menu_item ul", function(e) {
        e.stopPropagation();
    });

    // Prevent clicks on the sub-items from toggling the parent's history menu.
    $("#leftSidebarMenu").on("click", "#history_menu_item ul", function(e) {
        e.stopPropagation();
    });
});

// History tracking system
window.graphHistory = [];
window.maxHistorySize = 50; // Limit history to prevent memory issues
window.currentHistoryIndex = -1; // Track current position in history (-1 means at the latest state)

// Add keyboard event listeners for undo/redo
document.addEventListener('keydown', function(event) {
    // Check for Ctrl+Z (undo)
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        performUndo();
    }
    // Check for Ctrl+Y (redo) 
    else if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        performRedo();
    }
});

function addToHistory(action, details) {
    const timestamp = new Date().toLocaleString();
    
    // Capture current state of selected classes
    const currentState = window.networkProcessor ? 
        Array.from(window.networkProcessor.getSelectedClasses()) : [];
    
    const historyEntry = {
        timestamp: timestamp,
        action: action,
        details: details,
        id: Date.now(), // Unique identifier
        state: currentState // Store the current selected classes
    };
    
    // If we're not at the latest position, keep entries from current position onwards
    // (including current position and all entries before it) and remove entries after current position
    if (window.currentHistoryIndex >= 0) {
        // Keep entries from currentHistoryIndex onwards (current position and entries before it)
        window.graphHistory = window.graphHistory.slice(window.currentHistoryIndex);
    }
    
    window.graphHistory.unshift(historyEntry); // Add to beginning of array
    
    // Reset to latest position
    window.currentHistoryIndex = -1;
    
    // Limit history size
    if (window.graphHistory.length > window.maxHistorySize) {
        window.graphHistory = window.graphHistory.slice(0, window.maxHistorySize);
    }
    
    updateHistoryDisplay();
}

function performUndo() {
    if (window.graphHistory.length === 0) {
        console.log('No history to undo');
        return;
    }
    
    // Calculate the target index
    let targetIndex;
    if (window.currentHistoryIndex === -1) {
        // Currently at latest state, go to first history entry
        targetIndex = 0;
    } else if (window.currentHistoryIndex < window.graphHistory.length - 1) {
        // Move one step back in history
        targetIndex = window.currentHistoryIndex + 1;
    } else {
        // Already at oldest state
        console.log('Already at oldest state');
        return;
    }
    
    // Apply the state
    const historyEntry = window.graphHistory[targetIndex];
    applyHistoryState(historyEntry, false); // false = don't add to history
    
    // Update current position
    window.currentHistoryIndex = targetIndex;
    
    updateHistoryDisplay();
    console.log(`Undo: Restored to "${historyEntry.action}" (index ${targetIndex})`);
}

function performRedo() {
    if (window.currentHistoryIndex <= 0) {
        console.log('No forward history to redo');
        return;
    }
    
    // Move one step forward in history
    const targetIndex = window.currentHistoryIndex - 1;
    
    if (targetIndex === -1) {
        // Going back to the latest state
        // We need to restore to the most recent state before any undo operations
        // For now, we'll get the state from the first history entry and move forward from there
        window.currentHistoryIndex = -1;
        updateHistoryDisplay();
        console.log('Redo: Returned to latest state');
        return;
    }
    
    // Apply the state
    const historyEntry = window.graphHistory[targetIndex];
    applyHistoryState(historyEntry, false); // false = don't add to history
    
    // Update current position
    window.currentHistoryIndex = targetIndex;
    
    updateHistoryDisplay();
    console.log(`Redo: Restored to "${historyEntry.action}" (index ${targetIndex})`);
}

function applyHistoryState(historyEntry, addToHistory = true) {
    if (!window.networkProcessor) {
        console.error('NetworkProcessor not available');
        return;
    }
    
    // Clear current selection
    const currentSelected = Array.from(window.networkProcessor.getSelectedClasses());
    currentSelected.forEach(className => {
        window.networkProcessor.deselectClass(className);
    });
    
    // Restore the saved state
    historyEntry.state.forEach(className => {
        window.networkProcessor.selectClass(className);
    });
    
    // Update the search checkboxes to reflect the restored state
    updateSearchCheckboxes();
    
    // Redraw the visualization
    create_visualisation();
    
    // Optionally track the restoration action
    if (addToHistory) {
        addToHistory("State Restored", `Restored to: ${historyEntry.action} (${historyEntry.state.length} classes)`);
    }
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('history_list');
    
    if (window.graphHistory.length === 0) {
        historyList.innerHTML = `
            <li class="leftSidebarMenuInner_sub_li">
                <div class="history-item">
                    <span>No changes yet</span>
                </div>
            </li>
        `;
        return;
    }
    
    let historyHTML = `
        <li class="leftSidebarMenuInner_sub_li">
            <div class="settings-item">
                <button onclick="clearHistory()" class="settings-button">Clear History</button>
            </div>
        </li>
    `;
    
    window.graphHistory.forEach((entry, index) => {
        const isCurrent = (window.currentHistoryIndex === -1 && index === 0) || 
                         (window.currentHistoryIndex === index);
        
        historyHTML += `
            <li class="leftSidebarMenuInner_sub_li">
                <div class="history-item${isCurrent ? ' history-current' : ''}" data-history-id="${entry.id}">
                    <div class="history-entry">
                        <div class="history-header">
                            <div class="history-action-container">
                                ${isCurrent ? '<div class="current-dot"></div>' : ''}
                                <div class="history-action">${entry.action}</div>
                            </div>
                            <button onclick="restoreHistoryState(${entry.id})" class="history-return-button" title="Return to this state">
                                ↶
                            </button>
                        </div>
                        <div class="history-details">${entry.details}</div>
                        <div class="history-timestamp">${entry.timestamp}</div>
                        <div class="history-state-info">${entry.state.length} classes selected</div>
                    </div>
                </div>
            </li>
        `;
    });
    
    historyList.innerHTML = historyHTML;
}

function restoreHistoryState(entryId) {
    // Find the history entry
    const historyEntry = window.graphHistory.find(entry => entry.id === entryId);
    
    if (!historyEntry) {
        console.error('History entry not found:', entryId);
        return;
    }
    
    // Find the index of this entry
    const entryIndex = window.graphHistory.findIndex(entry => entry.id === entryId);
    
    // Apply the state without adding to history
    applyHistoryState(historyEntry, false); // false = don't add to history
    
    // Update current position to this entry
    window.currentHistoryIndex = entryIndex;
    
    updateHistoryDisplay();
}

function updateSearchCheckboxes() {
    // Update all checkboxes in the search results to match the current selection
    const searchResults = document.getElementById('complexity_class_search_results');
    if (searchResults) {
        const checkboxes = searchResults.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const isSelected = window.networkProcessor.isClassSelected(checkbox.id);
            checkbox.checked = isSelected;
        });
    }
}

function clearHistory() {
    window.graphHistory = [];
    updateHistoryDisplay();
}

// Function to track visualization changes
function trackVisualizationChange(action, details) {
    addToHistory(action, details);
}

// Function to track class selection
function trackClassSelection(className) {
    addToHistory("Class Selected", `Selected complexity class: ${className}`);
}

// Function to track settings changes
function trackSettingsChange(setting, value) {
    addToHistory("Settings Change", `${setting}: ${value}`);
}

function toggleGravity(checkbox) {
    window.gravityEnabled = checkbox.checked;
    if (checkbox.checked) {
        console.log("Gravity enabled");
        // Enable forces and free nodes
        simulation.force("charge_force", d3.forceManyBody().strength(strength));
        simulation.force("center_force", d3.forceCenter(center_x, center_y));
        // Unfix all nodes
        simulation.nodes().forEach(node => {
            node.fx = null;
            node.fy = null;
            // Add small random velocities to trigger gravity effect
            node.vx = (Math.random() - 0.5) * 100;
            node.vy = (Math.random() - 0.5) * 100;
        });
        // Set higher alpha target for longer simulation
        simulation.alphaTarget(0.3).alpha(1).restart();
        
        // Reset alpha target after a delay to let simulation settle
        setTimeout(() => {
            simulation.alphaTarget(0);
        }, 20);
        
        // trackSettingsChange("Gravity", "Enabled");
    } else {
        // Fix all nodes in their current positions
        simulation.nodes().forEach(node => {
            node.fx = node.x;
            node.fy = node.y;
            // Reset velocities
            node.vx = 0;
            node.vy = 0;
        });
        // Remove forces
        simulation.force("charge_force", null);
        simulation.force("center_force", null);
        simulation.alpha(1).restart();
        // trackSettingsChange("Gravity", "Disabled");
    }
}

function redrawVisualization() {
    // Clear the existing visualization
    vis_svg.selectAll("*").remove();
    
    // Redraw
    create_visualisation();
    
    // Track the redraw action
    trackVisualizationChange("Redraw", "Visualization redrawn");
}