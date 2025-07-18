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

//should this function be in a new js file or is it alright here?
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
                return `<a role="button" class="clickable-class" onclick="open_side_window(networkProcessor.getClass('${class_id}'))">\$${latex}\$</a>`;
            })
        }
    });

    return processed.join('');

}

function getSessionId() {
    let sid = localStorage.getItem('sessionId');
    if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem('sessionId', sid);
    }
    return sid;
}

function track_class_click(className) {

    const url = "https://nu0naevqt8.execute-api.us-east-1.amazonaws.com/initial";
    const now = new Date();
    console.log("Attempting to track information...");

    fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            className: className,
            timestamp: now.getTime(),
            isoTimestamp: now.toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            sessionId: getSessionId()
        })
    }).catch(console.error);
}



// Open side window with class information
function open_side_window(d) {
    const classData = networkProcessor.getClass(d.id);
    if (!classData) {
        return;
    }

    track_class_click(classData.id);

    // Handle title with MathJax
    const titleElement = document.getElementById('class-title');
    titleElement.innerHTML = `$${classData.latex_name}$`;
    MathJax.typeset([titleElement]);
    
    // Set description with links and allow MathJax processing
    const descElement = document.getElementById('class-description');
    descElement.innerHTML = link_classes_information(classData.description) || 'No description available';
    
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
    // Typeset both description and information sections
    MathJax.typesetPromise([descElement, infoElement]).then(() => {
        //process clickable-elements
        document.querySelectorAll('.clickable-class').forEach(el => {

            el.onclick = () => {
                const className = el.textContent.replace(/\s/g, '');
                const classData = networkProcessor.getClass(className);
                console.log("Class name: ", className);
                console.log("Class data:", classData);
                open_side_window(classData);
            };
        });
    });

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
