// Main javascript file which controls visualisation of the complexity classes

// Key variables
const body = $('body');
const searchBar = $('#complexity_class_search_bar');
var margin = 100; // Margin between the top of the screen Note: Change based on the top bar size
var colorScale = d3.scaleLinear()
    .range(["#63B3ED", "#2C5282"]);// Note: Going to add the ability to change the color scale
var user_interaction = {
        selected_class_a: null, // The class selected on the left
        selected_class_b: null // The class selected on the right
    }
var id_visualisation_div = "#visualisation_div";
var currentVisualization = 'graph';

// Sizes of the divs
var window_width = 200,
    window_height = 200,
    vis_width_ratio = 1,
    right_width_ratio = 0,
    min_width = 10,
    vis_width = window.innerWidth,
    vis_height = window.innerHeight,
    right_width = 100,
    right_height = 100,
    center_x = vis_width / 2,
    center_y = vis_height / 2;

// Function to keep the session active by periodically accessing the network
function keepSessionActive() {
    fetch('/get_complexity_network')
        .then(response => response.json())
        .catch(error => console.error('Error keeping session active:', error));
}

// Set up an interval to keep the session active every 30 seconds
setInterval(keepSessionActive, 30000);

// Redrawing the divs based on the window size
// Essentially an attempt at resizing the graph when the window is adjusted
function redraw_divs(){
    vis_width = window.innerWidth - margin;
    vis_height = window.innerHeight - margin;
    center_x = vis_width / 2;
    center_y = vis_height / 2;

    d3.select(id_visualisation_div)
        .style("width", vis_width + 'px')
        .style("height", vis_height + 'px')
        .attr("viewBox", "0 0 " + vis_width + " " + vis_height);

    right_width = Math.max(Math.floor(right_width_ratio * window_width)-margin, min_width);
    right_height = window_height-margin;
    if (right_width == min_width){
        right_height = 0;
    }

    d3.select("#right_side")
    .style("width", right_width + 'px')
    .style("height", right_height + 'px');

    // Changing the font and radius
    try {
        update_graph_values(vis_width, vis_height);
    } catch {}
    try {
        update_sunburst_values(vis_width);
    } catch {}
}

// Setting up resizing of the divs when the window is resized
window.addEventListener('resize', redraw_divs);

// Update the zoom definition
var zoom = d3.zoom()
    .on("zoom", function() {
        vis_svg.attr("transform", d3.event.transform);
    });

// Update the SVG creation to ensure proper viewBox
var vis_svg = d3.select(id_visualisation_div)
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 " + vis_width + " " + vis_height)
    .classed("svg-content-responsive", true)
    .call(zoom)
    .append("g");

// Add this after the vis_svg definition
function logSVGBoundaries() {
    var svgElement = d3.select("#visualisation_div svg");
    var gElement = svgElement.select("g");
    
    // Get the SVG viewport dimensions
    var svgRect = svgElement.node().getBoundingClientRect();
    
    // Get the actual content bounds (including all elements)
    var gBounds = gElement.node().getBBox();
    
    // Get current transform
    var transform = d3.zoomTransform(svgElement.node());
    
    console.log("SVG Viewport:", {
        width: svgRect.width,
        height: svgRect.height
    });
    
    console.log("Content Bounds:", {
        x: gBounds.x,
        y: gBounds.y,
        width: gBounds.width,
        height: gBounds.height
    });
    
    console.log("Current Transform:", {
        x: transform.x,
        y: transform.y,
        scale: transform.k
    });
}

// Call this every second
// setInterval(logSVGBoundaries, 1000);

// Controlling the type and style of visualisation
function create_visualisation(){
    // Clear the existing visualization
    d3.select(id_visualisation_div).select("svg").remove();

    // Create new SVG
    vis_svg = d3.select(id_visualisation_div)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", "0 0 " + vis_width + " " + vis_height)
        .classed("svg-content-responsive", true)
        .call(zoom)
        .append("g");

    // Draw the selected visualization
    if (currentVisualization === 'graph') {
        draw_graph();
    } else if (currentVisualization === 'sunburst') {
        draw_sunburst();
    }
}

// Javascript file which creates a sidewindow
function open_side_window(d, force_open = true) {
    if (user_interaction.selected_class_a == d.name && !force_open){
        return;
    }
    user_interaction.selected_class = d.name;

    // Fetch the description from the server
    fetch(`/get_class_description?class_name=${d.name}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("class-description").textContent = data.description || "No description available";
            document.getElementById("class-title").textContent = data.title || "No title available";
            let class_information = data.information || "No information available";
            let formatted_information = format_information(class_information);
            document.getElementById("class-information").innerHTML = formatted_information;
            // Open the right sidebar
            if (force_open){
                document.getElementById("openRightSidebarMenu").checked = true;
            }
            MathJax.typesetPromise();
            
            // Adjust the graph width
            graph_width_ratio = 0.9;
            right_width_ratio = 0.1;
            redraw_divs();
        })
        .catch(error => {
            console.error('Error fetching class description:', error);
            document.getElementById("class-description").textContent = "Error loading description";
        });

    if(body.hasClass('search-active')){
            body.removeClass('search-active');
            searchBar.blur();
    }
}

// Add after other initialization code
function initializeVisualizationControls() {
    // Set up visualization type selector
    const visTypeSelect = document.getElementById('vis-type-select');
    if (visTypeSelect) {
        visTypeSelect.addEventListener('change', function(e) {
            currentVisualization = e.target.value;
            create_visualisation();
        });
    }
}

// Call initialization when the window loads
window.addEventListener('load', initializeVisualizationControls);