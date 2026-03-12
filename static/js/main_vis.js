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
        // Set Body Class to view-graph
        document.body.classList.add("view-graph");

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
        ensureVisualizationDiv();
        setupVisualization();
        draw_graph();
    } else if (vis_type === 'sunburst') {
        draw_sunburst();
    } else if (vis_type === 'descriptions') {
        console.log("create visualization render description view");
        delete_old_graph();
        renderDescriptionsView();
    }
}

// Switch to descriptions view
function switchToDescriptionsView() {
    vis_type = 'descriptions';
    console.log("Switching to descriptions view");
    
    document.body.classList.remove('view-graph');
    document.body.classList.add('view-descriptions');
    

    svg_html = '<svg fill="#000000" height="200px" width="200px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 55 55" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M49,0c-3.309,0-6,2.691-6,6c0,1.035,0.263,2.009,0.726,2.86l-9.829,9.829C32.542,17.634,30.846,17,29,17 s-3.542,0.634-4.898,1.688l-7.669-7.669C16.785,10.424,17,9.74,17,9c0-2.206-1.794-4-4-4S9,6.794,9,9s1.794,4,4,4 c0.74,0,1.424-0.215,2.019-0.567l7.669,7.669C21.634,21.458,21,23.154,21,25s0.634,3.542,1.688,4.897L10.024,42.562 C8.958,41.595,7.549,41,6,41c-3.309,0-6,2.691-6,6s2.691,6,6,6s6-2.691,6-6c0-1.035-0.263-2.009-0.726-2.86l12.829-12.829 c1.106,0.86,2.44,1.436,3.898,1.619v10.16c-2.833,0.478-5,2.942-5,5.91c0,3.309,2.691,6,6,6s6-2.691,6-6c0-2.967-2.167-5.431-5-5.91 v-10.16c1.458-0.183,2.792-0.759,3.898-1.619l7.669,7.669C41.215,39.576,41,40.26,41,41c0,2.206,1.794,4,4,4s4-1.794,4-4 s-1.794-4-4-4c-0.74,0-1.424,0.215-2.019,0.567l-7.669-7.669C36.366,28.542,37,26.846,37,25s-0.634-3.542-1.688-4.897l9.665-9.665 C46.042,11.405,47.451,12,49,12c3.309,0,6-2.691,6-6S52.309,0,49,0z M11,9c0-1.103,0.897-2,2-2s2,0.897,2,2s-0.897,2-2,2 S11,10.103,11,9z M6,51c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S8.206,51,6,51z M33,49c0,2.206-1.794,4-4,4s-4-1.794-4-4 s1.794-4,4-4S33,46.794,33,49z M29,31c-3.309,0-6-2.691-6-6s2.691-6,6-6s6,2.691,6,6S32.309,31,29,31z M47,41c0,1.103-0.897,2-2,2 s-2-0.897-2-2s0.897-2,2-2S47,39.897,47,41z M49,10c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S51.206,10,49,10z"></path> </g></svg>'
    svg = document.getElementById('descriptions-svg-link');
    svg.innerHTML = svg_html;


    
    // Stop any running simulation
    if (typeof simulation !== 'undefined' && simulation) {
        simulation.stop();
    }
    
    create_visualisation();
}

function ensureVisualizationDiv() {
    const container = document.getElementById('mainInner');
    if (!container) return false;

    // Remove descriptions UI when returning to graph
    container.querySelectorAll('.descriptions-container, .descriptions-empty-state')
        .forEach(el => el.remove());

    let visDiv = document.getElementById('visualisation_div');
    if (!visDiv) {
        visDiv = document.createElement('div');
        visDiv.id = 'visualisation_div';
        container.prepend(visDiv);
    }

    console.log("vis div style attempting to change");
    visDiv.style.display = "";
    return true;
}

function switchToGraphView()
{

    vis_type = 'graph';
    console.log("Switching to graph view");

    document.body.classList.remove('view-descriptions');
    document.body.classList.add('view-graph');


    svg_html = '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 399 511.66"><path fill-rule="nonzero" d="M71.1 0h190.92c5.22 0 9.85 2.5 12.77 6.38L394.7 136.11c2.81 3.05 4.21 6.92 4.21 10.78l.09 293.67c0 19.47-8.02 37.23-20.9 50.14l-.09.08c-12.9 12.87-30.66 20.88-50.11 20.88H71.1c-19.54 0-37.33-8.01-50.22-20.9C8.01 477.89 0 460.1 0 440.56V71.1c0-19.56 8-37.35 20.87-50.23C33.75 8 51.54 0 71.1 0zm45.78 254.04c-8.81 0-15.96-7.15-15.96-15.95 0-8.81 7.15-15.96 15.96-15.96h165.23c8.81 0 15.96 7.15 15.96 15.96 0 8.8-7.15 15.95-15.96 15.95H116.88zm0 79.38c-8.81 0-15.96-7.15-15.96-15.96 0-8.8 7.15-15.95 15.96-15.95h156.47c8.81 0 15.96 7.15 15.96 15.95 0 8.81-7.15 15.96-15.96 15.96H116.88zm0 79.39c-8.81 0-15.96-7.15-15.96-15.96s7.15-15.95 15.96-15.95h132.7c8.81 0 15.95 7.14 15.95 15.95 0 8.81-7.14 15.96-15.95 15.96h-132.7zm154.2-363.67v54.21c1.07 13.59 5.77 24.22 13.99 31.24 8.63 7.37 21.65 11.52 38.95 11.83l36.93-.05-89.87-97.23zm96.01 129.11-43.31-.05c-25.2-.4-45.08-7.2-59.39-19.43-14.91-12.76-23.34-30.81-25.07-53.11l-.15-2.22V31.91H71.1c-10.77 0-20.58 4.42-27.68 11.51-7.09 7.1-11.51 16.91-11.51 27.68v369.46c0 10.76 4.43 20.56 11.52 27.65 7.11 7.12 16.92 11.53 27.67 11.53h256.8c10.78 0 20.58-4.4 27.65-11.48 7.13-7.12 11.54-16.93 11.54-27.7V178.25z"/></svg>'
    svg = document.getElementById('descriptions-svg-link');
    svg.innerHTML = svg_html;

    const visTypeSelect = document.getElementById('vis-type-select');
    if (visTypeSelect) {
        visTypeSelect.value = 'graph';
    }

    if (typeof simulation !== 'undefined' && simulation) {
        simulation.stop();
    }
    

    create_visualisation();
}



function toggleView()
{
    if (vis_type == 'graph')
    {
        switchToDescriptionsView();
    }
    else
    {
        switchToGraphView();
    }
}

window.toggleView = toggleView;

window.switchToDescriptionsView = switchToDescriptionsView;

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
