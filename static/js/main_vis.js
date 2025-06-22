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
        const [classesData, theoremsData] = await Promise.all([
            fetch('../classes.json').then(response => response.json()),
            fetch('../theorems.json').then(response => response.json())
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
    const all_classes = networkProcessor.getAllClasses().map(c => c.id);
    console.log("[IN LINK CLASSES] all classes: ", all_classes);
    



    //fix escaped characters bc we are going to turn this into regex
    const escaped_class_names = all_classes.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    //this takes something like BQP?\poly and turns it into BQP\?\\poly (just in case, so that we don't get regex errors)
    console.log("[IN LINK CLASSES] escaped classes: ", escaped_class_names);


    //This matches $\\mathsf{CLASS_NAME}$
    //Make sure to always use the dollar signs in the classes.json
    const regex = new RegExp(`\\$\\\\mathsf\\{(${escaped_class_names.join('|')})\\}\\$`, 'g');
    //joins the escaped class names into a single alternation group using "|"

    return information_text.replace(regex, (match, p1) => {
        const latex_wrapped = `$\\mathsf{${p1}}$`;
        //console.log("Printing with no dollar signs.");
        //role=button for accessibility i think?
        return `<a role="button" class="clickable-class" onclick="open_side_window(networkProcessor.getClass('${p1}'))">${latex_wrapped}</a>`;
    });

}



// Open side window with class information
function open_side_window(d) {
    const classData = networkProcessor.getClass(d.id);
    if (!classData) {
        return;
    }

    // Handle title with MathJax
    const titleElement = document.getElementById('class-title');
    titleElement.innerHTML = `$${classData.latex_name}$`;
    MathJax.typeset([titleElement]);
    
    // Set description without math processing
    document.getElementById('class-description').textContent = classData.description || 'No description available';
    
    // Format class information
    let info = '';
    // Add information from classes.json
    if (classData.information) {
        info += '<br><strong>Information:</strong><br>';
        // Process LaTeX parts in the information text
        //processedInfo = classData.information.replace(/\\mathsf\{[^}]+\}/g, match => `$${match}$`);

        //console.log("Linked_class_information: ",link_classes_information(processedInfo));

        processedInfo = link_classes_information(classData.information);

        info += format_information(processedInfo) + '<br>';
    }
    
    const infoElement = document.getElementById('class-information');
    infoElement.innerHTML = info;
    MathJax.typeset([infoElement]);

    // Open the sidebar
    document.getElementById('openRightSidebarMenu').checked = true;
}

// Initialize visualization when the page loads
document.addEventListener('DOMContentLoaded', initializeVisualization);

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
    const actuallySelected = [];
    defaultClasses.forEach(className => {
        if (networkProcessor.selectClass(className)) {
            actuallySelected.push(className);
        }
    });
    
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