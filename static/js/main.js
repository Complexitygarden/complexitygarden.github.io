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
var radius = graph_width/10;
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
    radius = graph_width/10,
    strength = (-250)*radius,
    fontSize = radius/(2.5);
}

// Setting up resizing
redraw_divs();
window.addEventListener('resize', redraw_divs);

// Store zoom behavior
var zoom = d3.zoom().on("zoom", function() {
    svg.attr("transform", d3.event.transform);
});

// Drawing svgs
var svg = d3.select("#graph_viz")
    .append("svg")
    .attr("viewBox", "0 0 " + graph_width + " " + graph_height)
    .classed("svg-content-responsive", true)
    .call(zoom)
    .append("g");

//set up the simulation 
var simulation = d3.forceSimulation()

var node,
    link,
    set_node = null;


// Adding the graph

function draw_graph(){
    // If graph was previously drawn, remove all existing elements
    if (drawn === 1) {
        svg.selectAll('.nodes').remove();
        svg.selectAll('.links').remove();
    }

    d3.json(complexity_network_url, function(data) {
        // Find the root node (node with only incoming edges)
        let outgoingEdges = new Set(data.links.map(link => link.source));
        let rootNode = data.nodes.find(node => !outgoingEdges.has(node.name));

        // Initialize positions for nodes
        data.nodes.forEach(node => {
            if (node === rootNode) {
                // Position root node at the top center
                node.x = graph_width / 2;
                node.y = -5000; // Placing it extremely to the top - the force will return it
                node.fx = node.x;
                node.fy = node.y;
            } else {
                // Random positions for other nodes
                node.x = Math.random() * graph_width;
                node.y = (Math.random() * graph_height * 0.7) + (graph_height * 0.3); // Position below the root
            }
        });

         // Unfixing the root node - so that it drags around, but it is still at the top of the screen
        setTimeout(function() {
            rootNode.fx = null;
            rootNode.fy = null;
        }, 500);

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
    
            var nodeGroups = node.append("g")
            .on("mouseover", function() {
                d3.select(this).select("circle")
                    .attr("fill", "#4299e1")
                    .attr("stroke", "#2c5282");
            })
            .on("mouseout", function() {
                d3.select(this).select("circle")
                    .attr("fill", "#2c5282")
                    .attr("stroke", "none");
            });

            // Adding the circle
            nodeGroups.append("circle")
            .attr("r", radius)
            .attr("fill", "#2c5282")
            .attr("stroke", "none")
            .attr("stroke-width", 3);
    
            // Adding a label on the circle
            nodeGroups.append('text')
            .text(nodeLabel)
            .attr("text-anchor", "middle")
            .style("fill", "#fff")
            .style("font-size", fontSize)
            .attr("dy", (fontSize)/2);
        }
    
        draw_everything();
        
        function get_points(d) { 
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
        
        
        // Events which show complexity class descriptions
        node.on("click", function(d){
            // Disallowing zooming in on the graph
            d3.event.preventDefault();
            d3.event.stopPropagation();
            // Opening the side window and showing a class description
            open_side_window(d);
            set_node = d;
        });

        node.on("mouseover", function(d){
            open_side_window(d, false);
        });

        node.on("mouseout", function(d){
            if (set_node !== d && set_node !== null){
                open_side_window(set_node, false)
            }
        });
        
        // Javascript file which creates a sidewindow
        function open_side_window(d, force_open = true) {
            // Fetch the description from the server
            fetch(`/get_class_description?class_name=${d.name}`)
                .then(response => response.json())
                .then(data => {
                    document.getElementById("class-description").textContent = data.description || "No description available";
                    document.getElementById("class-title").textContent = data.title || "No title available";
                    // Open the right sidebar
                    if (force_open){
                        document.getElementById("openRightSidebarMenu").checked = true;
                    }
                    
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

        // After drawing everything and letting the simulation run a bit
        // Need to fix this - the zooming and moving is not working as I'd want it to

        // setTimeout(function() {
        //     var svgElement = d3.select("#graph_viz svg");
        //     var bounds = svg.node().getBBox();
            
        //     // Calculate scale to fit exactly
        //     var scale = (graph_height / bounds.height )* 2; // Just 5% margin

        //     // Calculate translation to center the graph
        //     var transform = d3.zoomIdentity
        //         .translate(
        //             (graph_width - bounds.width * scale) / 2 - bounds.x * scale,
        //             (graph_height - bounds.height * scale) / 2 - bounds.y * (scale* 0.75)
        //         )
        //         .scale(scale);
            
        //     // Apply the transform
        //     svgElement.transition()
        //         .duration(750)
        //         .call(zoom.transform, transform);
        // }, 1000);
    });
    drawn = 1;
}

draw_graph();