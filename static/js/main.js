/*
Main javascript file
*/
// import { arrow1 } from "./utils/arrow";
var arrow_scale = 2.5; // Increased from 1 to 2.5
var drawn = 0;

// Distribution of divs
var graph_width_ratio = 1,
    right_width_ratio = 0,
    margin = 20,
    min_width = 10;

// Initialization of dimensions of divs
var graph_width = 100,
    graph_height = 100,
    right_width = 100,
    right_height = 100;

// Graph variables
var radius = graph_width/15;
var strength = (-500)*radius;
var fontSize = radius/2;

// Redrawing the divs
// Essentially an attempt at resizing the graph when the window is adjusted
function redraw_divs(){
    width = window.innerWidth;
    height = window.innerHeight;

    graph_width = Math.max(Math.floor(graph_width_ratio * width)-margin, min_width);
    graph_height = height-margin;
    right_width = Math.max(Math.floor(right_width_ratio * width)-margin, min_width);
    right_height = height-margin;
    if (right_width == min_width){
        right_height = 0;
    }

    d3.select("#graph_viz")
    .style("width", graph_width + 'px')
    .style("height", graph_height + 'px')
    .attr("viewBox", "0 0 " + graph_width + " " + graph_height);

    d3.select("#right_side")
    .style("width", right_width + 'px')
    .style("height", right_height + 'px');

    // Changing the font and radius
    radius = graph_width/15,
    strength = (-500)*radius,
    fontSize = radius/2;
}

// Setting up resizing
redraw_divs();
window.addEventListener('resize', redraw_divs);

// Drawing svgs
var svg = d3.select("#graph_viz")
.append("svg")
.attr("viewBox", "0 0 " + graph_width + " " + graph_height)
.classed("svg-content-responsive", true)
.call(d3.zoom().on("zoom", function () {
  svg.attr("transform", d3.event.transform)
}))
.append("g");

//set up the simulation 
var simulation = d3.forceSimulation()

var node,
    link;


// Adding the graph

function draw_graph(){
    // If graph was previously drawn, remove all existing elements
    if (drawn === 1) {
        svg.selectAll('.nodes').remove();
        svg.selectAll('.links').remove();
    }

    d3.json(complexity_network_url, function(data) {
        // Initialize random positions for nodes
        data.nodes.forEach(node => {
            // Add random positions within the graph boundaries
            node.x = Math.random() * graph_width;
            node.y = Math.random() * graph_height;
        });

        // Reset simulation with new data
        simulation.nodes(data.nodes);
        
        //add forces
        var link_force = d3.forceLink(data.links)
            .id(function(d) { return d.name; });
            
        simulation
            .force("charge_force", d3.forceManyBody().strength(strength))
            .force("center_force", d3.forceCenter(graph_width / 2, graph_height / 2))
            .force("links", link_force)
            .alpha(1)    // Reset the simulation's internal timer
            .restart();  // Restart the simulation
        
        //add tick instructions: 
        simulation.on("tick", tickActions );
        
        function edgeColor(d){
        return "#2c5282"
        }
        
        // Returning the label
        function nodeLabel(d){return d.label}
        
        // Create a custom arrow marker definition
        svg.append("defs").append("marker")
            .attr("id", "my-arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 10)
            .attr("refY", 5)
            .attr("markerWidth", 10*arrow_scale)
            .attr("markerHeight", 10*arrow_scale)
            .attr("orient", "auto-start-reverse")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")  // Triangle shape
            .attr("fill", "#2c5282");
        
        // Layers - Created in their order from behind to the front
        var layer1 = svg.append("g");
        var layer2 = svg.append("g");
        
        // Create new nodes and links
        node = layer2.attr("class", "nodes")
            .selectAll("circle")
            .data(data.nodes)
            .enter()
            .append("g");
        
        link = layer1.attr("class", "links")
            .selectAll(".links")
            .data(data.links)
            .enter()
            .append("polyline");
    
        function draw_everything(){
            link
                .attr("stroke-width", 2)
                .style("stroke", "#2c5282")
            .attr("marker-mid", "url(#my-arrow)")
            .attr("points",get_points);
    
            // Adding the circle
            node.append("circle")
            .attr("r", radius)
            .attr("fill", "#2c5282");
    
            // Adding a label on the circle
            node.append('text')
            .text(nodeLabel)
            .attr("text-anchor", "middle")
            .style("fill", "#fff")
            .style("font-size", fontSize)
            .attr("dy", (fontSize)/2);
        }
    
        draw_everything();
        
        function get_points(d) { 
          // console.log(d);
          // console.log(d.source.x);
          return [
               d.source.x, d.source.y,
               d.source.x/2+d.target.x/2, d.source.y/2+d.target.y/2,
               d.target.x, d.target.y
          ].join(',');
        };
        
        var drag_handler = d3.drag()
        .on("start", drag_start)
        .on("drag", drag_drag)
        .on("end", drag_end);	
        
        drag_handler(node)
        
        // //drag handler
        // //d is the node 
        function drag_start(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        }
        
        function drag_drag(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
        }
        
        
        function drag_end(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        }
        
        function tickActions() {
          node.attr('transform', d => `translate(${d.x},${d.y})`);
          link.attr("points", function(d) {
            // Ensure the positions are updated during each tick
            return [
                d.source.x, d.source.y,
                (d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2,  // mid-point for the curve
                d.target.x, d.target.y
            ].join(',')});
        }
        
        
        // Clicking events
        node.on("dblclick", function(d){
            // Disallowing zooming in on the graph
            d3.event.preventDefault();
            d3.event.stopPropagation();
            // Opening the side window and showing a class description
            open_side_window(d);
        });
        
        // Javascript file which creates a sidewindow
        function open_side_window(d) {
            // Fetch the description from the server
            fetch(`/get_class_description?class_name=${d.name}`)
                .then(response => response.json())
                .then(data => {
                    document.getElementById("class-description").textContent = data.description || "No description available";
                    
                    // Open the right sidebar
                    document.getElementById("openRightSidebarMenu").checked = true;
                    
                    // Adjust the graph width
                    graph_width_ratio = 0.9;
                    right_width_ratio = 0.1;
                    redraw_divs();
                })
                .catch(error => {
                    console.error('Error fetching class description:', error);
                    document.getElementById("class-description").textContent = "Error loading description";
                });
        }
        
        });
        drawn = 1;
}

draw_graph();