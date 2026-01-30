// Main javascript file which controls visualisation of the complexity classes

// console.log("Testing if the new version is working.")

// Key variables for visualization coordination
var vis_type = 'graph';
var gravity = true;
var id_visualisation_div = "#visualisation_div";

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// SVG and zoom setup
var vis_svg;
var zoom;

// Initialize the visualization
async function initializeVisualization() {
    try {
        // Initialize network processor
        window.networkProcessor = new NetworkProcessor();
        
        // Load data files
        url_classes = "https://raw.githubusercontent.com/Complexitygarden/dataset/refs/heads/main/decision_complexity_classes/classes.json"
        url_theorems = "https://raw.githubusercontent.com/Complexitygarden/dataset/refs/heads/main/decision_complexity_classes/theorems.json"
        const [classesData, theoremsData] = await Promise.all([
            fetch(url_classes).then(response => response.json()),
            fetch(url_theorems).then(response => response.json())
        ]);

        // Initialize network processor with data
        await networkProcessor.initialize(classesData, theoremsData);

        // Check for shared configuration first
        const urlParams = new URLSearchParams(window.location.search);
        const configParam = urlParams.get('config');
        
        if (configParam) {
            const sharedClasses = decodeSharedConfiguration(configParam);
            if (sharedClasses && Array.isArray(sharedClasses)) {
                // Clear any existing history since we're loading a shared config
                if (window.graphHistory) {
                    window.graphHistory = [];
                    window.currentHistoryIndex = -1;
                }
                
                // Select the shared classes
                let validClasses = 0;
                sharedClasses.forEach(className => {
                    networkProcessor.selectClass(className);
                    
                    // Check if the class is actually selected instead of relying on return value
                    if (networkProcessor.isClassSelected(className)) {
                        validClasses++;
                    }
                });
                
                if (validClasses > 0) {
                    // Track the configuration load AFTER clearing history
                    if (typeof trackVisualizationChange === 'function') {
                        trackVisualizationChange("Shared Configuration Loaded", `Started from shared link with ${validClasses} classes: ${sharedClasses.filter(c => networkProcessor.isClassSelected(c)).join(", ")}`);
                    } else {
                        // Defer the call until the function is available
                        setTimeout(() => {
                            if (typeof trackVisualizationChange === 'function') {
                                trackVisualizationChange("Shared Configuration Loaded", `Started from shared link with ${validClasses} classes: ${sharedClasses.filter(c => networkProcessor.isClassSelected(c)).join(", ")}`);
                            }
                        }, 100);
                    }
                    
                    // Keep config parameter in URL to allow bookmarking of the current configuration
                    // const newURL = window.location.origin + window.location.pathname;
                    // window.history.replaceState({}, document.title, newURL);
                } else {
                    // Fall back to default classes if no shared classes were valid
                    selectDefaultClasses();
                }
            } else {
                // Fall back to default classes if shared config is invalid
                selectDefaultClasses();
            }
        } else {
            // No shared configuration, use default classes
            selectDefaultClasses();
        }

        // Setup SVG and zoom
        setupVisualization();

        // Create initial visualization
        create_visualisation();
    } catch (error) {
        console.error('Error in initialization:', error);
    }
}

// Setup SVG and zoom
function setupVisualization() {
    // Clear any existing SVG
    d3.select(id_visualisation_div).selectAll("*").remove();

    // Create zoom behavior
    zoom = d3.zoom()
        .on("zoom", function() {
            vis_svg.attr("transform", d3.event.transform);
        });

    // Create SVG
    vis_svg = d3.select(id_visualisation_div)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", "0 0 " + window.innerWidth + " " + window.innerHeight)
        .classed("svg-content-responsive", true)
        .call(zoom)
        .append("g");
}

// Create visualization based on selected type
function create_visualisation() {
    if (vis_type === 'graph') {
        draw_graph();
    } else if (vis_type === 'sunburst') {
        draw_sunburst();
    }
}

// Redraw visualization
function redrawVisualization() {
    create_visualisation();
}

function link_classes_information(information_text)
{
    const all_classes = networkProcessor.getAllClasses();

    //sort longest to shortest, so that more complex names match first (like PDQP/qpoly matched before just PDQP)
    const sorted_classes = all_classes.sort((a, b) => b.id.length - a.id.length);


    //fix escaped characters bc we are going to turn this into regex
    const escaped_class_names = sorted_classes.map(c => c.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    //this takes something like BQP?\poly and turns it into BQP\?\\poly (just in case, so that we don't get regex errors)


    //This matches $\\mathsf{CLASS_NAME}$
    //Make sure to always use the dollar signs in the classes.json
    //const regex = new RegExp(`\\$\\\\mathsf\\{(${escaped_class_names.join('|')})\\}\\$`, 'g');

    //this matches just classnames
    const regex = new RegExp(`\\b(${escaped_class_names.join('|')})\\b`, 'g');
    //joins the escaped class names into a single alternation group using "|"

    const segments = information_text.split(/(\$[^$]*\$)/);

    const processed = segments.map(segment =>{
        if (segment.startsWith('$') && segment.endsWith('$')) {
            //inside math mode, don't add dollar signs
            return segment.replace(regex, (match, class_id) => {
                const classData = networkProcessor.getClass(class_id);
                if (!classData) return match;
                const latex = classData.latex_name || class_id;
                
                return `\\mathsf{${latex}}`;
                //return `\\class{clickable-class}{${latex}}`;
                //return `<a role="button" class="clickable-class" onclick="open_side_window(networkProcessor.getClass('${class_id}'))">${latex}</a>`;
            });

        }

        else {
            //outside math mode, add dollar signs

            return segment.replace(regex, (match, class_id) => {
                const classData = networkProcessor.getClass(class_id);
                if (!classData) return match;
                const latex = classData.latex_name || class_id;
                return `<a role="button" class="clickable-class" data-class="${class_id}">\$${latex}\$</a>`;
            })
        }
    });

    return processed.join('');

}




// Open side window with class information (called from graph clicks)
// This clears the navigation history since we're starting fresh from the graph
function open_side_window(d) {
    const classData = networkProcessor.getClass(d.id);
    if (!classData) {
        return;
    }

    // Temporary fix combining definition and information
    console.log("Checking for definition")
    console.log(classData)
    if (classData.definition){
        console.log("Combining definition and information")
        classData.information = classData.definition + " " + classData.information;
    }

    const action = "Description";
    track_class_click(classData.id, { action });

    // Clear navigation history when clicking from graph (start fresh)
    AppState.navigationHistory = [];
    AppState.selectedClass = classData.id;

    // Show class panel and hide welcome state
    document.getElementById('welcome-state').style.display = 'none';
    document.getElementById('class-panel').style.display = 'flex';

    // Update navigation buttons (back button should be hidden since history is empty)
    updateNavigationButtons();

    // Populate class information
    populateComplexityClassPanel(classData);

    // Open the sidebar
    document.getElementById('openRightSidebarMenu').checked = true;
}

function updateNavigationButtons() {
    const backButton = document.getElementById('back-button');
    const closeButton = document.getElementById('close-panel-button');
    const addButton = document.getElementById('add-class-button');

    // Update back button - use visibility to preserve layout space
    if (AppState.navigationHistory.length > 0) {
        backButton.style.visibility = 'visible';
        backButton.style.opacity = '1';
        backButton.onclick = () => navigateBack();
    } else {
        backButton.style.visibility = 'hidden';
        backButton.style.opacity = '0';
    }

    // Update add button - show only if class is not already selected
    if (AppState.selectedClass && window.networkProcessor && !window.networkProcessor.isClassSelected(AppState.selectedClass)) {
        addButton.style.visibility = 'visible';
        addButton.style.opacity = '1';
        addButton.onclick = () => {
            window.networkProcessor.selectClass(AppState.selectedClass);
            draw_graph();
            if (typeof trackVisualizationChange === 'function') {
                trackVisualizationChange("Add Class", `Added ${AppState.selectedClass} to selection`);
            }
            addButton.style.visibility = 'hidden';
            addButton.style.opacity = '0';
        };
    } else {
        addButton.style.visibility = 'hidden';
        addButton.style.opacity = '0';
    }

    // Setup close button
    closeButton.onclick = () => {
        document.getElementById('openRightSidebarMenu').checked = false;
        AppState.selectedClass = null;
        AppState.navigationHistory = [];
        showWelcomeState();
    };
}

function showWelcomeState() {
    document.getElementById('welcome-state').style.display = 'flex';
    document.getElementById('class-panel').style.display = 'none';
}

function populateComplexityClassPanel(classData) {
    console.log("Populating panel for:", classData.name);
    
    // Populate header
    populateClassHeader(classData);
    
    // Populate definition
    populateDefinition(classData);
    
    // Populate useful information
    populateUsefulInformation(classData);
    
    // Populate links
    populateLinks(classData);
    
    // Populate references
    populateReferences(classData);
    
    // Process MathJax
    const elementsToTypeset = [
        document.getElementById('class-title'),
        document.getElementById('class-definition'),
        document.getElementById('class-information'),
        document.getElementById('class-links'),
        document.getElementById('related-classes-list'),
        document.getElementById('see-also-link'),
        document.getElementById('class-full-name')
    ];
    
    MathJax.typesetPromise(elementsToTypeset.filter(el => el)).then(() => {
        setupClickableElements();
    });
}

function populateClassHeader(classData) {
    // Set title and full name
    document.getElementById('class-title').innerHTML = `$${classData.latex_name}$`;
    const class_description = document.getElementById('class-full-name');
    class_description.innerHTML = link_classes_information(classData.description) || "";
    
    // These processes to determine badges are wrong
    // Determine type and update badges
    // const typeText = determineComplexityType(classData);
    // const isDeterministic = determineDeterministic(classData);
    
    // document.getElementById('type-text').textContent = typeText;
    // document.getElementById('deterministic-text').textContent = isDeterministic ? 'Deterministic' : 'Non-deterministic';
}

// function determineComplexityType(classData) {
//     const name = classData.name.toLowerCase();
//     if (name.includes('space') || name.includes('pspace') || name.includes('nspace')) {
//         return 'space complexity';
//     } else if (name.includes('time') || name.includes('p') || name.includes('np') || name.includes('exp')) {
//         return 'time complexity';
//     }
//     return 'complexity';
// }

// function determineDeterministic(classData) {
//     const name = classData.name.toLowerCase();
//     return !name.startsWith('n') || name === 'nspace' || name === 'nl';
// }

function populateDefinition(classData) {
    const descElement = document.getElementById('class-definition');
    descElement.innerHTML = format_reference_information(link_classes_information(classData.definition)) || 'No definition available';
}

function populateUsefulInformation(classData) {
    const descElement = document.getElementById('class-information');
    const infoCard = descElement.closest('.info-card');

    // Hide the entire card if there's no information
    if (!classData.information || classData.information.trim() === '') {
        infoCard.style.display = 'none';
    } else {
        infoCard.style.display = '';
        descElement.innerHTML = format_reference_information(link_classes_information(classData.information));
    }
}

function populateLinks(classData) {
    const linksElement = document.getElementById('class-links');
    linksElement.innerHTML = '';

    // Check for links in classData - these are complexity class identifiers
    const linksList = classData.see_also || [];

    if (linksList && linksList.length > 0) {
        let validLinksCount = 0;

        linksList.forEach(link => {
            if (typeof link === 'string') {
                // Check if it's a complexity class identifier
                const linkedClassData = networkProcessor.getClass(link);

                if (linkedClassData) {
                    // It's a valid complexity class - create a clickable link
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('role', 'button');
                    linkElement.className = 'see-also-link clickable-class';
                    linkElement.setAttribute('data-class', link);

                    // Use latex name if available, otherwise use the id
                    const latex = linkedClassData.latex_name || link;
                    linkElement.innerHTML = `$${latex}$`;

                    linksElement.appendChild(linkElement);
                    validLinksCount++;
                }
            }
        });

        // Show message if no valid class links were found
        if (validLinksCount === 0) {
            linksElement.innerHTML = '<div class="link-text">No related classes found.</div>';
        }
    } else {
        // Show a message when no links are available
        linksElement.innerHTML = '<div class="link-text">No links available for this complexity class.</div>';
    }
}

function populateReferences(classData) {
    const referencesElement = document.getElementById('class-references');
    referencesElement.innerHTML = '';
    
    // Add enhanced references
    if (classData.references && classData.references.length > 0) {
        classData.references.forEach(ref => {
            const item = document.createElement('div');
            item.className = 'reference-item';

            if (ref.length == 2) {
                ref_title = ref[0];
                // Reference url - special case for the zoo
                ref_url = (ref_title == "Complexity Zoo")? ("https://complexityzoo.net/Complexity_Zoo:" +ref[1]):ref[1];
                item.innerHTML = `
                    <a href="${ref_url}" target="_blank" class="reference-link">
                        ${ref_title}
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                    </a>
                `;
            } else {
                console.log("Error parsing the following reference: " + ref)
            }
            
            referencesElement.appendChild(item);
        });
    }
}

function setupClickableElements() {
    document.querySelectorAll('.clickable-class').forEach(el => {
        el.onclick = (e) => {
            e.preventDefault();
            const className = el.dataset.class;
            if (className) {
                handleClassSelect(className);
            }
        };
    });
}

// Helper function to navigate back in class history
function navigateBack() {
    AppState.navigateBack();
}


// Function to show initial state of right panel
function showInitialPanelState() {
    showWelcomeState();
    
    // Setup close button
    const closeButton = document.getElementById('close-panel-button');
    if (closeButton) {
        closeButton.onclick = () => {
            document.getElementById('openRightSidebarMenu').checked = false;
            showWelcomeState();
        };
    }
}

// Test function to populate content manually
function testPopulateContent() {
    console.log("Testing content population");
    
    // Test populating examples directly
    const examplesElement = document.getElementById('class-examples');
    if (examplesElement) {
        examplesElement.innerHTML = '<ul><li>Test example 1</li><li>Test example 2</li></ul>';
        document.getElementById('examples-subsection').style.display = 'block';
        console.log("Test examples populated");
    } else {
        console.error("Examples element not found");
    }
    
    // Test populating applications
    const applicationsElement = document.getElementById('class-applications');
    if (applicationsElement) {
        applicationsElement.innerHTML = '<ul><li>Test application 1</li><li>Test application 2</li></ul>';
        document.getElementById('applications-subsection').style.display = 'block';
        console.log("Test applications populated");
    } else {
        console.error("Applications element not found");
    }
}

// App State Management (similar to React component)
const AppState = {
    selectedClass: null,
    navigationHistory: [],
    sidebarOpen: false,
    
    setSelectedClass(classId) {
        if (this.selectedClass && this.selectedClass !== classId) {
            this.navigationHistory.push(this.selectedClass);
        }
        this.selectedClass = classId;
        this.updateUI();
    },
    
    navigateBack() {
        const previousClass = this.navigationHistory.pop();
        this.selectedClass = previousClass || null;
        this.updateUI();
    },
    
    navigateToClass(classId) {
        if (this.selectedClass) {
            this.navigationHistory.push(this.selectedClass);
        }
        this.selectedClass = classId;
        this.updateUI();
    },
    
    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        this.updateMobileMenu();
    },
    
    updateUI() {
        // Update navigation buttons
        updateNavigationButtons();
        
        // Update panel content
        if (this.selectedClass) {
            const classData = networkProcessor.getClass(this.selectedClass);
            if (classData) {
                populateComplexityClassPanel(classData);
                document.getElementById('welcome-state').style.display = 'none';
                document.getElementById('class-panel').style.display = 'flex';
            }
        } else {
            showWelcomeState();
        }
    },
    
    updateMobileMenu() {
        const menuIcon = document.getElementById('menu-icon');
        const closeIcon = document.getElementById('close-icon');
        const leftSidebar = document.getElementById('leftSidebarMenu');
        
        if (this.sidebarOpen) {
            menuIcon.style.display = 'none';
            closeIcon.style.display = 'block';
            leftSidebar.style.display = 'block';
        } else {
            menuIcon.style.display = 'block';
            closeIcon.style.display = 'none';
            leftSidebar.style.display = '';
        }
    }
};

// Initialize mobile menu toggle
function initializeMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            AppState.toggleSidebar();
        });
    }
}

// Update the open_side_window function to use AppState
function handleClassSelect(classId) {
    AppState.setSelectedClass(classId);
    document.getElementById('openRightSidebarMenu').checked = true;
}

// Initialize visualization when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeVisualization();
    showInitialPanelState();
    initializeMobileMenu();
    
    console.log("Complexity Class Explorer initialized");
});

// Add after other initialization code
function initializeVisualizationControls() {
    // Set up visualization type selector
    const visTypeSelect = document.getElementById('vis-type-select');
    if (visTypeSelect) {
        visTypeSelect.addEventListener('change', function(e) {
            const oldType = vis_type;
            vis_type = e.target.value;
            create_visualisation();
            trackSettingsChange("Visualization Type", `Changed from ${oldType} to ${vis_type}`);
        });
    }
}

// Call initialization when the window loads
window.addEventListener('load', initializeVisualizationControls);

// Helper function to decode shared configuration
function decodeSharedConfiguration(encodedConfig) {
    try {
        const jsonString = atob(encodedConfig);
        const classes = JSON.parse(jsonString);
        return classes;
    } catch (error) {
        return null;
    }
}

// Helper function to select default classes
function selectDefaultClasses() {
    const defaultClasses = ["P", "PSPACE", "BQP", "NP"];

    // Temporarily disable URL updates while loading the default configuration
    const previousUpdateSetting = networkProcessor.updateLocation;
    networkProcessor.updateLocation = false;

    const actuallySelected = [];
    defaultClasses.forEach(className => {
        networkProcessor.selectClass(className);
        if (networkProcessor.isClassSelected(className)) {
            actuallySelected.push(className);
        }
    });

    // Re-enable URL updates for future user interactions
    networkProcessor.updateLocation = previousUpdateSetting;

    // Track the initial setup
    if (typeof trackVisualizationChange === 'function') {
        trackVisualizationChange("Initial Load", `Default classes selected: ${actuallySelected.join(", ")}`);
    } else {
        setTimeout(() => {
            if (typeof trackVisualizationChange === 'function') {
                trackVisualizationChange("Initial Load", `Default classes selected: ${actuallySelected.join(", ")}`);
            }
        }, 100);
    }
}
