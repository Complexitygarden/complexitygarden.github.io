// Main javascript file which controls visualisation of the complexity classes

// Key variables for visualization coordination
var vis_type = 'graph';
var gravity = true;
var id_visualisation_div = "#visualisation_div";

// SVG and zoom setup
var vis_svg;
var zoom;

// Initialize the visualization
async function initializeVisualization() {
    console.log('Initializing visualization...');
    try {
        // Initialize network processor
        window.networkProcessor = new NetworkProcessor();
        
        // Load data files
        console.log('Loading data files...');
        const [classesData, theoremsData] = await Promise.all([
            fetch('../classes.json').then(response => response.json()),
            fetch('../theorems.json').then(response => response.json())
        ]);
        console.log('Data loaded:', { 
            classesCount: Object.keys(classesData.class_list).length, 
            theoremsCount: theoremsData.theorems.length 
        });

        // Initialize network processor with data
        console.log('Initializing network processor...');
        await networkProcessor.initialize(classesData, theoremsData);
        console.log('Network processor initialized');

        // Select default classes
        // const defaultClasses = ["P", "PSPACE", "BPP", "NP", "BQP"];
        const defaultClasses = ["P", "PostBQP", "BQP"];
        defaultClasses.forEach(className => {
            networkProcessor.selectClass(className);
        });
        console.log('Default classes selected:', defaultClasses);

        // Setup SVG and zoom
        setupVisualization();

        // Create initial visualization
        console.log('Creating initial visualization...');
        create_visualisation();
        console.log('Initial visualization created');
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
    console.log('Creating visualization of type:', vis_type);
    if (vis_type === 'graph') {
        draw_graph();
    } else if (vis_type === 'sunburst') {
        draw_sunburst();
    }
}

// Toggle gravity
function toggleGravity(checkbox) {
    gravity = checkbox.checked;
    if (vis_type === 'graph') {
        create_visualisation();
    }
}

// Redraw visualization
function redrawVisualization() {
    create_visualisation();
}

// Open side window with class information
function open_side_window(d) {
    console.log('Opening side window for class:', d);
    const classData = networkProcessor.getClass(d.id);
    if (!classData) {
        console.warn('No class data found for:', d.id);
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
        const processedInfo = classData.information.replace(/\\mathsf\{[^}]+\}/g, match => `$${match}$`);
        info += format_information(processedInfo) + '<br>';
    }
    
    // Create Relationships section with side-by-side layout
    info += '<br><div style="text-align: center;"><strong>Tightest Relationships:</strong></div><br>';
    info += '<div style="display: flex; justify-content: center; gap: 20px;">';
    
    // Left side - Contains
    info += '<div style="width: 45%;">';
    info += '<strong>⊂</strong><br>';
    if (classData.contains && classData.contains.size > 0) {
        classData.contains.forEach(c => {
            const targetClass = networkProcessor.getClass(c);
            if (targetClass) {
                info += `- $${targetClass.latex_name}$<br>`;
            }
        });
    } else {
        info += 'None<br>';
    }
    info += '</div>';
    
    // Right side - Within
    info += '<div style="width: 45%;">';
    info += '<strong>⊃</strong><br>';
    if (classData.within && classData.within.size > 0) {
        classData.within.forEach(c => {
            const targetClass = networkProcessor.getClass(c);
            if (targetClass) {
                info += `- $${targetClass.latex_name}$<br>`;
            }
        });
    } else {
        info += 'None<br>';
    }
    info += '</div>';
    
    info += '</div>';
    
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
            vis_type = e.target.value;
            create_visualisation();
        });
    }
}

// Call initialization when the window loads
window.addEventListener('load', initializeVisualizationControls);