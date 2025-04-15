// Drawing a graph of complexity classes using D3


// Key properties
var graph_drawn = false,// Indicator whether the graph has been drawn
    click_timeout = null;// Timeout for click events - prevents counting double clicks as single clicks and double clicks simultaneously

// Sizes
// Note: In the future this should change to adjust for a device
var arrow_scale = 3.5;

// Graph variables
var radius = 50,
    strength = (-500)*radius,
    fontSize = radius/2,
    node_distance = radius * 4,
    center_x = 50,
    center_y = 50;

// User settings
window.gravityEnabled = false; // Whether location is adjusted by gravity

// Updating the key variables about the graph based on the width
function update_graph_values(width, height){
    radius = width/10,
    strength = (-250)*radius,
    fontSize = radius/(2.5),
    node_distance = radius * 4,
    center_x = width/2,
    center_y = height/2;
}

// Variables describing the graph
var simulation = d3.forceSimulation(), // Gravity simulation
    node, // Nodes on the graph i.e. complexity classes
    link, // Links between nodes i.e. containment relations
    select_node_a = null,
    layer1 = null,
    layer2 = null,
    arrowLayer = null,
    nodeCount = 0, // Selected node by the user
    nodeGroups = null; // Node groups for accessing in other functions

redraw_divs();

// Add event listener for Escape key to close all tooltips
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // Close all equal classes tooltips
        d3.selectAll(".equal-classes-tooltip").remove();
        
        // Reset all pinned buttons
        if (nodeGroups) {
            nodeGroups.selectAll(".equal-classes-button")
                .classed("pinned", false)
                .select(".equal-classes-symbol")
                .text("+");
        }
    }
});

function delete_old_graph(){
    if (graph_drawn === 1) {
        vis_svg.selectAll('.nodes').remove();
        vis_svg.selectAll('.links').remove();
        
        // Clear layers
        if (layer1) layer1.selectAll('*').remove();
        if (layer2) layer2.selectAll('*').remove();
        if (arrowLayer) arrowLayer.selectAll('*').remove();
        
        // Stop and clear the simulation
        if (simulation) {
            simulation.stop();
            simulation.nodes([]);
            simulation.force("links", null);
            simulation.force("charge_force", null);
            simulation.force("center_force", null);
            simulation.force("collision", null);
        }
        
        // Clear references
        node = null;
        link = null;
        layer1 = null;
        layer2 = null;
        arrowLayer = null;
    }
}

// Main function which draws the graph
function draw_graph(){
    console.log("Drawing graph");
        // If graph was previously drawn, remove all existing elements
        delete_old_graph()

    
    // Create fresh simulation
    simulation = d3.forceSimulation()
        .alphaDecay(0.05)  // Faster convergence
        .velocityDecay(0.3); // Add damping

    d3.json('/get_complexity_network', function(data) {
        // Find the root node (node with only incoming edges) and top node (node with only outgoing edges)
        console.log(data);
        nodeCount = data.nodes.length;
        redraw_divs();
        // console.log("Window width: " + window.innerWidth);
        // console.log("Window height: " + window.innerHeight);
        // console.log("Vis width: " + vis_width);
        // console.log("Vis height: " + vis_height);

        // console.log("Graph: Gravity variable: " + window.gravityEnabled);

        // Adding visual objects
        add_arrow_marker(vis_svg, arrow_scale);
        
        // Adding the color scale
        colorScale.domain([0, data.maxLevel]);

        // Initializing positions
        data.nodes.forEach(node => {
            node.x = node.savedX*vis_width;
            node.y = node.savedY*vis_height;
            if (window.gravityEnabled){
                if (node.name in data.root_nodes){
                    node.y = -5000;
                    node.fx = node.x;
                    node.fy = node.y;
                } else if (node.name in data.top_nodes){
                    node.y = 5000;
                    node.fx = node.x;
                    node.fy = node.y;
                }
            }
            if (window.gravityEnabled === false){
                node.fx = node.x;
                node.fy = node.y;
            }
        });

        // Reset simulation with new data
        simulation.nodes(data.nodes);

        var link_force = d3.forceLink(data.links)
            .id(function(d) { return d.name; })
            .distance(node_distance)
            .strength(1);

        // Setting the simulation
        if (window.gravityEnabled){
            // Setting the strength of the force based on the number of nodes
            let adjustedStrength = data.nodes.length <= 5 ? 5*strength : strength;
            simulation
                .force("charge_force", d3.forceManyBody().strength(adjustedStrength))
                .force("center_force", d3.forceCenter(center_x, center_y))
                .force("links", link_force)
                .force("collision", d3.forceCollide().radius(radius * 2))  // Add collision detection
                .alpha(1)    // Reset the simulation's internal timer
                .restart();  // Restart the simulation
        } else {
            simulation
                .force("charge_force", null)
                .force("center_force", null)
                .force("links", link_force)
                .alpha(1)    // Reset the simulation's internal timer
                .restart();  // Restart the simulation
        }

        // Adding tick actions
        simulation.on("tick", tickActions);

        // Returning the label
        function nodeLabel(d){return d.latex_name}

        // Layers - Created in their order from behind to the front
        layer1 = vis_svg.append("g");
        layer2 = vis_svg.append("g");
        arrowLayer = layer1.append("g").attr("class", "arrow-layer");

        function initialize_nodes(){
            node = layer2.attr("class", "nodes")
                .selectAll("circle")
                .data(data.nodes)
                .enter()
                .append("g");
        }

        function draw_links(link_data){
            link = layer1.attr("class", "links")
            .selectAll(".links")
            .data(link_data)
            .enter()
            .append("g")  // Create a group for each link
            .each(function(d) {
                // Invisible line for better hover detection
                d3.select(this)
                    .append("polyline")
                    .attr("class", "link-hover-area")
                    .attr("stroke-width", 50)  // Much wider than visible line
                    .style("stroke", "transparent")  // Invisible
                    .style("fill", "none")
                    .attr("points", get_points);
                
                // Visible line
                d3.select(this)
                    .append("polyline")
                    .attr("class", "link-visible")
                    .attr("stroke-width", 2)
                    .style("stroke", "#2c5282")
                    .style("fill", "none")
                    .attr("points", get_points);
            })
            .on("mouseover", function(d) {
                d3.select(this).select(".link-visible")
                    .style("stroke", "#4299e1")
                    .attr("stroke-width", 12);
                // Arrow highlight
                arrowLayer.selectAll(".arrow")
                    .filter(a => a.source === d.source && a.target === d.target)
                    .style("stroke", "#4299e1")
                    .style("fill", "#4299e1");
            })
            .on("mouseout", function(d) {
                d3.select(this).select(".link-visible")
                    .style("stroke", "#2c5282")
                    .attr("stroke-width", 2);
                // Arrow reset
                arrowLayer.selectAll(".arrow")
                    .filter(a => a.source === d.source && a.target === d.target)
                    .style("stroke", "#2c5282")
                    .style("fill", "#2c5282");
            })
            .on("dblclick", function(d) {
                // Get the source and target class names
                var sourceClass = d.source.name;
                var targetClass = d.target.name;
                
                expand(sourceClass, targetClass, true);
            });

            // Arrows
            arrowLayer.selectAll(".arrow")
            .data(link_data)
            .enter()
            .append("path")
            .attr("class", "arrow")
            .attr("stroke-width", 2)
            .style("stroke", "#2c5282")
            .style("fill", "#2c5282")
            .attr("d", function(d) {
                var midX = (d.source.x + d.target.x) / 2;
                var midY = (d.source.y + d.target.y) / 2;
                var size = 10 * arrow_scale;
                return `M ${midX-size} ${midY-size} L ${midX+size} ${midY} L ${midX-size} ${midY+size} Z`;
            })
            .on("mouseover", function(d) {
                // Arrow highlight
                d3.select(this)
                    .style("stroke", "#4299e1")
                    .style("fill", "#4299e1");
                // Arrow highlight
                link.filter(l => l.source === d.source && l.target === d.target)
                    .select(".link-visible")
                    .style("stroke", "#4299e1")
                    .attr("stroke-width", 12);
            })
            .on("mouseout", function(d) {
                // Arrow reset
                d3.select(this)
                    .style("stroke", "#2c5282")
                    .style("fill", "#2c5282");
                // Arrow reset
                link.filter(l => l.source === d.source && l.target === d.target)
                    .select(".link-visible")
                    .style("stroke", "#2c5282")
                    .attr("stroke-width", 2);
            })
            .on("dblclick", function(d) {
                // Get the source and target class names
                var sourceClass = d.source.name;
                var targetClass = d.target.name;
                
                expand(sourceClass, targetClass, true);
            });
        }

        function draw_nodes(){
            nodeGroups = node.append("g")
                .on("mouseover", function(d) {
                    d3.select(this).select("circle")
                        .attr("fill", d => d3.rgb(colorScale(d.level)).brighter(0.3))
                        .attr("stroke", "#2c5282");
                    // Show delete button on hover
                    d3.select(this).select(".delete-button")
                        .style("display", "block");
                })
                .on("mouseout", function(d) {
                    d3.select(this).select("circle")
                        .attr("fill", d => colorScale(d.level))
                        .attr("stroke", "none");
                    // Hide delete button when not hovering
                    d3.select(this).select(".delete-button")
                        .style("display", "none");
                });

            // Adding the circle
            nodeGroups.append("circle")
                .attr("r", radius)
                .attr("fill", d => colorScale(d.level))
                .attr("stroke", "none")
                .attr("stroke-width", 3);
    
            // Adding a label on the circle
            nodeGroups.append('foreignObject')
                .attr("x", -radius)
                .attr("y", -fontSize)
                .attr("width", radius * 2)
                .attr("height", fontSize * 2)
                .append("xhtml:div")
                .style("text-align", "center")
                .style("color", "#fff")
                .style("font-size", fontSize + "px")
                .style("display", "flex")
                .style("justify-content", "center")
                .style("align-items", "center")
                .style("height", "100%")
                .style("pointer-events", "none")
                .html(d => d.latex_name);

            // Process all MathJax after adding all nodes
            // Added as sometimes MathJax doesn't load in time, so then we can't even move the nodes.
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                MathJax.typesetPromise().then(() => {
                    // console.log("MathJax processing complete");
                }).catch((err) => {
                    console.error("MathJax processing failed:", err);
                    setTimeout(() => {
                        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                            MathJax.typesetPromise().then(() => {
                                console.log("MathJax processing complete");
                            }).catch((err) => {
                                console.error("MathJax processing failed:", err);
                            });
                        } else {
                            console.warn("MathJax not available for retry");
                        }
                    }, 100);
                });
            } else {
                console.warn("MathJax not available, skipping typesetting");
                drag_handler(node);
            }

            // Add delete button
            nodeGroups.append("g")
                .attr("class", "delete-button")
                .attr("transform", `translate(${0.7*radius}, ${-0.7*radius})`)
                .style("display", "none")
                .style("cursor", "pointer")
                .on("click", function(d) {
                    d3.event.stopPropagation(); // Prevent node click event
                    delete_node(d.name);
                })
                .append("circle")
                .attr("r", radius/6)
                .attr("fill", "#E53E3E")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);

            // Add X symbol to delete button
            nodeGroups.select(".delete-button")
                .append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .style("fill", "#fff")
                .style("font-size", `${radius/4}px`)
                .style("pointer-events", "none")
                .text("×");

            // Add equal classes button (plus button)
            nodeGroups.append("g")
                .attr("class", "equal-classes-button")
                .attr("transform", `translate(${-0.7*radius}, ${-0.7*radius})`)
                .style("display", d => d.equal_classes && d.equal_classes.length > 0 ? "block" : "none")
                .style("cursor", "pointer")
                .append("circle")
                .attr("r", radius/6)
                .attr("fill", "#3182CE")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);

            // Add plus symbol to equal classes button
            nodeGroups.select(".equal-classes-button")
                .append("text")
                .attr("class", "equal-classes-symbol")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .style("fill", "#fff")
                .style("font-size", `${radius/4}px`)
                .style("pointer-events", "none")
                .text("+");

            // Add tooltip for equal classes
            nodeGroups.select(".equal-classes-button")
                .on("mouseover", function(d) {
                    if (d.equal_classes && d.equal_classes.length > 0) {
                        // Only show tooltip on hover if it's not already pinned
                        if (!d3.select(this).classed("pinned")) {
                            showEqualClassesTooltip(d, this);
                        }
                    }
                })
                .on("mouseout", function(d) {
                    // Only hide tooltip on mouseout if it's not pinned
                    if (!d3.select(this).classed("pinned")) {
                        d3.selectAll(".equal-classes-tooltip").remove();
                    }
                })
                .on("click", function(d) {
                    d3.event.stopPropagation(); // Prevent node click event
                    
                    // Toggle pinned state
                    var isPinned = d3.select(this).classed("pinned");
                    
                    if (isPinned) {
                        // Unpin: remove pinned class and hide tooltip
                        d3.select(this).classed("pinned", false);
                        d3.selectAll(".equal-classes-tooltip").remove();
                        // Change symbol back to plus
                        d3.select(this).select(".equal-classes-symbol").text("+");
                    } else {
                        // Pin: add pinned class and show tooltip
                        d3.select(this).classed("pinned", true);
                        showEqualClassesTooltip(d, this);
                        // Change symbol to x
                        d3.select(this).select(".equal-classes-symbol").text("×");
                    }
                });
                
            // Function to show the equal classes tooltip
            function showEqualClassesTooltip(d, buttonElement) {
                // Remove any existing tooltips first
                d3.selectAll(".equal-classes-tooltip").remove();
                
                // Create tooltip
                var tooltip = d3.select("body").append("div")
                    .attr("class", "equal-classes-tooltip")
                    .style("position", "absolute")
                    .style("background-color", "white")
                    .style("border", "1px solid #ccc")
                    .style("border-radius", "5px")
                    .style("padding", "10px")
                    .style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)")
                    .style("z-index", "1000")
                    .style("max-width", "300px");
                
                // Add title
                tooltip.append("div")
                    .style("font-weight", "bold")
                    .style("margin-bottom", "5px")
                    .text("Equal Classes:");
                
                // Add list of equal classes
                var list = tooltip.append("ul")
                    .style("margin", "0")
                    .style("padding-left", "20px");
                
                d.equal_classes.forEach(function(equalClass) {
                    list.append("li")
                        .html(equalClass.latex_name)
                        .style("cursor", "pointer")
                        .style("color", "#3182CE")
                        .style("text-decoration", "underline")
                        .on("click", function() {
                            // Stop event propagation to prevent tooltip from closing
                            d3.event.stopPropagation();
                            open_side_window(equalClass);
                        });
                });
                
                // Process MathJax in the tooltip
                if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                    MathJax.typesetPromise([tooltip.node()]).then(() => {
                        // console.log("MathJax processing complete for equal classes tooltip");
                    }).catch((err) => {
                        console.error("MathJax processing failed for equal classes tooltip:", err);
                    });
                }
                
                // Position tooltip near the button
                var buttonRect = buttonElement.getBoundingClientRect();
                
                tooltip.style("left", (buttonRect.right + 10) + "px")
                    .style("top", (buttonRect.top - tooltip.node().getBoundingClientRect().height/2) + "px");
            }

            // Events which show complexity class descriptions
            node.on("click", function(d){
                // Clear any existing timeout
                if (click_timeout) {
                    clearTimeout(click_timeout);
                }
                
                // Set a new timeout
                click_timeout = setTimeout(function() {
                    // Only execute click behavior if it wasn't part of a double-click
                    // d3.event.preventDefault();
                    // d3.event.stopPropagation();
                    // Opening the side window and showing a class description
                    open_side_window(d);
                    select_node_a = d;
                }, 250); // 250ms delay
            });

            // node.on("mouseover", function(d){
            //     open_side_window(d, false);
            // });

            // node.on("mouseout", function(d){
            //     if (select_node_a !== d && select_node_a !== null){ 
            //         open_side_window(select_node_a, false)
            //     }
            // });

            node.on("dblclick", function(d) {
                // Clear the click timeout so the click handler won't fire
                if (click_timeout) {
                    clearTimeout(click_timeout);
                    click_timeout = null;
                }
                expand(d.name, null, false);
            });
        }

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

        // Drag handler
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
            if (!window.gravityEnabled) {
                // If gravity is off, keep the node fixed at its new position
                d.fx = d.x;
                d.fy = d.y;
            } else {
                // If gravity is on, let it float freely
                d.fx = null;
                d.fy = null;
            }
        }

        function tickActions() {
            node.attr('transform', d => `translate(${d.x},${d.y})`);
            // Update both the hover area and visible line
            link.selectAll("polyline").attr("points", function(d) {
                return [
                    d.source.x, d.source.y,
                    (d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2,
                    d.target.x, d.target.y
                ].join(',')
            });
            
            // Update arrow positions
            arrowLayer.selectAll(".arrow").attr("d", function(d) {
                var midX = (d.source.x + d.target.x) / 2;
                var midY = (d.source.y + d.target.y) / 2;
                
                // Calculate angle for arrow rotation
                var angle = Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x);
                
                // Create arrow points using arrow_scale
                var baseSize = 10 * arrow_scale;
                var points = [
                    [0, -baseSize],         // Left point
                    [baseSize * 2, 0],      // Tip
                    [0, baseSize]           // Right point
                ];
                
                // Rotate and translate points
                var transformedPoints = points.map(p => {
                    var x = p[0] * Math.cos(angle) - p[1] * Math.sin(angle);
                    var y = p[0] * Math.sin(angle) + p[1] * Math.cos(angle);
                    return [(x + midX), (y + midY)];
                });
                
                return `M ${transformedPoints[0][0]} ${transformedPoints[0][1]} 
                        L ${transformedPoints[1][0]} ${transformedPoints[1][1]} 
                        L ${transformedPoints[2][0]} ${transformedPoints[2][1]} Z`;
            });
            
            // Update positions of pinned equal classes tooltips
            updatePinnedTooltips();
        }
        
        // Function to update positions of pinned tooltips
        function updatePinnedTooltips() {
            if (!nodeGroups) return; // Exit if nodeGroups is not defined yet
            
            // Find all nodes with pinned equal classes buttons
            nodeGroups.filter(function(d) {
                return d3.select(this).select(".equal-classes-button").classed("pinned");
            }).each(function(d) {
                // Get the button element
                var buttonElement = d3.select(this).select(".equal-classes-button").node();
                
                // Find the corresponding tooltip
                var tooltip = d3.select(".equal-classes-tooltip");
                
                if (!tooltip.empty()) {
                    // Get the current button position
                    var buttonRect = buttonElement.getBoundingClientRect();
                    
                    // Update tooltip position
                    tooltip.style("left", (buttonRect.right + 10) + "px")
                        .style("top", (buttonRect.top - tooltip.node().getBoundingClientRect().height/2) + "px");
                }
            });
        }
        
        function delete_node(className) {
            console.log("Deleting node " + className);
            // Remove the node from the DOM
            node.filter(d => d.name === className).remove();
            
            // Update simulation data
            var nodes = simulation.nodes();
            var currentLinks = simulation.force("links").links();
            
            fetch(`/check_indirect_paths?class_name=${className}&delete_node=true`)
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    
                    // Filter out the deleted node from nodes
                    simulation.nodes(nodes.filter(n => n.name !== className));
                    
                    // Find edges that should remain (not connected to deleted node and not in direct_paths)
                    var remainingLinks = currentLinks.filter(l => {
                        // Skip if link connects to deleted node
                        if (l.source.name === className || l.target.name === className) {
                            return false;
                        }
                        return true;
                    });

                    // Add new direct paths
                    for (var i = 0; i < data.direct_paths.length; i++) {
                        var newLink = data.direct_paths[i];
                        var sourceNode = nodes.find(n => n.name === newLink[0]);
                        var targetNode = nodes.find(n => n.name === newLink[1]);
                        if (sourceNode && targetNode) {
                            remainingLinks.push({source: sourceNode, target: targetNode, type: "A"});
                        } else {
                            console.log("Could not find node " + newLink[0] + " or " + newLink[1]);
                        }
                    }

                    // Deleting the node from the network
                    delete_class(className)
                    
                    // Delete all current edges
                    delete_all_edges();
                    
                    // Update simulation with new links
                    simulation.force("links").links(remainingLinks);

                    draw_links(remainingLinks);
                    
                    // Restart the simulation gently
                    simulation.alpha(1).restart();
                })
                .catch(error => console.error('Error checking indirect paths:', error));
        }

        function draw_everything(data){
            initialize_nodes();
            draw_links(data.links);
            draw_nodes();
            drag_handler(node);
        }


        // Rescaling the graph
        var rescaling_timer = window.gravityEnabled ? 2000 : 20;
        function rescaling_zoom() {
            var nodes = simulation.nodes();
            var minX = d3.min(nodes, d => d.x);
            var maxX = d3.max(nodes, d => d.x);
            var minY = d3.min(nodes, d => d.y);
            var maxY = d3.max(nodes, d => d.y);

            // Bounds
            var boundsWidth = maxX - minX + 2*radius;
            var boundsHeight = maxY - minY + 2*radius;

            // Available space
            var availableWidth = vis_width;
            var availableHeight = vis_height - margin;
            
            // Scaling the change
            var scale = Math.min(availableWidth / boundsWidth, availableHeight / boundsHeight);

            // Center points
            var centerX = (minX + maxX) / 2;
            var centerY = (minY + maxY) / 2;

            // Translations to center the content
            var tx = (availableWidth / 2) - (centerX * scale);
            var ty = (availableHeight / 2) - (centerY * scale) + margin/2;
            var transform = d3.zoomIdentity
                .translate(tx, ty)
                .scale(scale);

            // Smoothing
            d3.select("#visualisation_div svg")
                .transition()
                .duration(750)
                .call(zoom.transform, transform);
        }
        
        setTimeout(function() {
            if (nodeCount == 0){
                return;
            }
            rescaling_zoom();
        }, rescaling_timer);

        function delete_all_edges() {
            // Remove all visual link elements
            link.remove();
            
            // Remove all arrow elements
            arrowLayer.selectAll(".arrow").remove();
            
            // Update simulation by clearing all links
            simulation.force("links").links([]);
            
            // Restart the simulation gently
            simulation.alpha(1).restart();
        }

        
        draw_everything(data);

        // Expanding an edge we double-clicked on
        function expand(sourceClass, targetClass, edge = true){
            // Prevent default behavior and event propagation
            d3.event.preventDefault();
            d3.event.stopPropagation();
            var fetch_url;
            if (edge){
                console.log("Expanding edge from " + sourceClass + " to " + targetClass);
                // Create an alert showing the relationship
                console.log(`From ${sourceClass} to ${targetClass}`);
                fetch_url = `/expand_item?expand_edge=true&source_class=${sourceClass}&target_class=${targetClass}`;
            } else {
                console.log("Expanding node " + sourceClass);
                fetch_url = `/expand_item?expand_edge=false&source_class=${sourceClass}`;
            }

            fetch(fetch_url)
                .then(response => response.json())
                .then(data => {
                    // Redraw the graph
                    if (data.success){
                        draw_graph();
                        console.log("Successfully expanded");
                        console.log(data.new_classes);
                        select_class_list(data.new_classes, true);
                    } else {
                        console.log("Did not expand -> are there any new classes to add?");
                    }
                })
                .catch(error => console.error('Error expanding edge:', error));
        }
        
    });

    
    
    graph_drawn = 1;
}

create_visualisation();