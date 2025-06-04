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

// Function to position tooltips - simplified
function positionTooltip(tooltip, d) {
    var tooltipWidth = parseFloat(tooltip.select("rect").attr("width"));
    var tooltipHeight = parseFloat(tooltip.select("rect").attr("height"));

    // Position to the left of the node
    var tooltipX = d.x - tooltipWidth - radius - 10;
    var tooltipY = d.y - tooltipHeight/2;
    if (tooltipX < 0) {
        tooltipX = d.x + radius + 10;
    }
    
    // Position the tooltip
    tooltip.attr("transform", `translate(${tooltipX}, ${tooltipY})`);
}

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

    // Hiding tooltips
    d3.selectAll(".equal-classes-tooltip").remove();
}

var colorScale = d3.scaleLinear()
    .range(["#63B3ED", "#2C5282"]);

// Main function which draws the graph
function draw_graph(){
    console.log("Drawing graph");
        // If graph was previously drawn, remove all existing elements
        delete_old_graph()

    
    // Create fresh simulation
    simulation = d3.forceSimulation()
        .alphaDecay(0.05)  // Faster convergence
        .velocityDecay(0.3); // Add damping

    // Get data from network processor
    const data = networkProcessor.getTrimmedNetworkJson();
    console.log("Graph data:", data);

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
    colorScale.domain([0, data.maxLevel || 1]);

    // Initializing positions
    data.nodes.forEach(node => {
        node.x = (Number.isFinite(node.savedX) ? node.savedX * window.innerWidth
                                               : Math.random() * window.innerWidth);
        node.y = (Number.isFinite(node.savedY) ? node.savedY * window.innerHeight
                                               : Math.random() * window.innerHeight);
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
        if (typeof isSafari !== "undefined" && isSafari) {
            // Safari: Use MathJax with SVG output
            console.log("Safari - using MathJax SVG");
            
            nodeGroups.each(function(d) {
                var group = d3.select(this);
                
                try {
                    // Check if MathJax is available
                    if (typeof MathJax !== 'undefined' && MathJax.tex2svg) {
                        // Use MathJax to convert LaTeX to SVG
                        var mathSvg = MathJax.tex2svg(d.latex_name, {display: false});
                        var svgElement = mathSvg.querySelector('svg');
                        
                        if (svgElement) {
                            // Get the SVG content as string
                            var svgString = svgElement.outerHTML;
                            
                            // Create a foreignObject to hold the SVG
                            var foreignObj = group.append('foreignObject')
                                .attr('x', -radius)
                                .attr('y', -fontSize/2)
                                .attr('width', radius * 2)
                                .attr('height', fontSize)
                                .style('overflow', 'visible');
                            
                            // Insert the SVG
                            foreignObj.node().innerHTML = svgString;
                            
                            // Scale the SVG to fit
                            var insertedSvg = foreignObj.select('svg');
                            insertedSvg
                                .attr('width', radius * 1.8)
                                .attr('height', fontSize)
                                .style('display', 'block')
                                .style('margin', '0 auto');
                            
                            // Make all text elements white
                            insertedSvg.selectAll('*')
                                .style('fill', '#fff')
                                .style('color', '#fff');
                        } else {
                            throw new Error('MathJax SVG generation failed');
                        }
                    } else {
                        throw new Error('MathJax not available');
                    }
                } catch (e) {
                    console.error('MathJax rendering error:', e);
                    // Fallback to simple text
                    group.append("text")
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle")
                        .attr("x", 0)
                        .attr("y", 0)
                        .style("fill", "#fff")
                        .style("font-size", `${fontSize}px`)
                        .style("font-family", "serif")
                        .style("pointer-events", "none")
                        .text(d.latex_name);
                }
            });
        } else {
            // Non-Safari: Use foreignObject approach (existing Windows solution)
            nodeGroups.append('foreignObject')
                .attr("x", -radius)
                .attr("y", -fontSize)
                .attr("width", radius * 2)
                .attr("height", fontSize * 2)
                .append("xhtml:div")
                .style("text-align", "center")
                .style("color", "#fff")
                .style("font-size", `${fontSize}px`)
                .style("display", "flex")
                .style("justify-content", "center")
                .style("align-items", "center")
                .style("height", "100%")
                .style("pointer-events", "none")
                .each(function(d) {
                    // Non-Safari: Render KaTeX as before
                    console.log("Not safari")
                    try {
                        const tempDiv = document.createElement('div');
                        tempDiv.style.position = 'absolute';
                        tempDiv.style.visibility = 'hidden';
                        tempDiv.style.fontSize = `${fontSize}px`;
                        document.body.appendChild(tempDiv);

                        renderKaTeX(d.latex_name, tempDiv, window.katexOptions);

                        const textWidth = tempDiv.offsetWidth;
                        document.body.removeChild(tempDiv);

                        renderKaTeX(d.latex_name, this, window.katexOptions);

                        if (textWidth > radius * 1.5) {
                            this.style.fontSize = `${fontSize * 0.7}px`;
                            renderKaTeX(d.latex_name, this, window.katexOptions);
                        }
                    } catch (e) {
                        console.error('KaTeX rendering error:', e);
                        this.textContent = d.latex_name;
                    }
                });
        }

        // Add delete button
        nodeGroups.append("g")
            .attr("class", "delete-button")
            .attr("transform", `translate(${0.7*radius}, ${-0.7*radius})`)
            .style("display", "none")
            .style("cursor", "pointer")
            .on("click", function(d) {
                d3.event.stopPropagation(); // Prevent node click event
                delete_node(d);
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
            .attr("data-node-id", d => d.name)
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

        // Function to show the equal classes tooltip - simplified
        function showEqualClassesTooltip(d, buttonElement) {
            // Check if equal_classes exists and has items
            if (!d.equal_classes || d.equal_classes.length === 0) return;
            
            // Check if tooltip already exists for this node
            var existingTooltip = d3.select(`.equal-classes-tooltip[data-node-id="${d.name}"]`);
            
            if (!existingTooltip.empty()) {
                // Tooltip already exists, just show it
                existingTooltip.style("display", "block");
                return;
            }
            
            // Create an SVG group for the tooltip
            var tooltipGroup = vis_svg.append("g")
                .attr("class", "equal-classes-tooltip")
                .attr("data-node-id", d.name);
            
            // Define tooltip dimensions
            var tooltipWidth = radius * 4;
            var tooltipHeight = radius * 2;
            
            // Create a background rectangle
            tooltipGroup.append("rect")
                .attr("width", tooltipWidth)
                .attr("height", tooltipHeight)
                .attr("rx", radius * 0.1)
                .attr("ry", radius * 0.1)
                .style("fill", "white")
                .style("stroke", "#ccc")
                .style("stroke-width", 1);
            
            // Create a foreignObject to contain HTML content
            var foreignObject = tooltipGroup.append("foreignObject")
                .attr("width", tooltipWidth)
                .attr("height", tooltipHeight)
                .attr("x", 0)
                .attr("y", 0);
            
            // Create the HTML content
            var tooltipContent = foreignObject.append("xhtml:div")
                .style("padding", `${radius * 0.3}px`)
                .style("font-family", "Arial, sans-serif")
                .style("color", "#333")
                .style("pointer-events", "all");
            
            // Add title
            tooltipContent.append("div")
                .style("font-weight", "bold")
                .style("font-size", `${radius * 0.4}px`)
                .style("margin-bottom", `${radius * 0.2}px`)
                .text("Equal Classes:");
            
            // Create a list for the equal classes
            var list = tooltipContent.append("ul")
                .style("list-style-type", "none")
                .style("padding", "0")
                .style("margin", "0");
            
            // Add each equal class as a list item
            d.equal_classes.forEach(function(equalClass) {
                var listItem = list.append("li")
                    .style("margin-bottom", `${radius * 0.15}px`)
                    .style("cursor", "pointer")
                    .style("color", "#3182CE")
                    .style("text-decoration", "underline")
                    .style("font-size", `${radius * 0.4}px`)
                    .style("display", "flex")
                    .style("align-items", "center");
                
                // Add bullet point
                listItem.append("span")
                    .style("display", "inline-block")
                    .style("width", `${radius * 0.2}px`)
                    .style("height", `${radius * 0.2}px`)
                    .style("background-color", "#3182CE")
                    .style("border-radius", "50%")
                    .style("margin-right", `${radius * 0.15}px`);
                
                // Add the class name
                var nameSpan = listItem.append("span");
                window.renderKaTeX(equalClass.latex_name, nameSpan.node(), window.katexOptions);
                
                // Add hover effect
                listItem.on("mouseover", function() {
                    d3.select(this).style("font-weight", "bold");
                })
                .on("mouseout", function() {
                    d3.select(this).style("font-weight", "normal");
                })
                .on("click", function() {
                    d3.event.stopPropagation();
                    open_side_window(equalClass);
                });
            });
            
            // Process MathJax in the tooltip
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                MathJax.typesetPromise([tooltipContent.node()]).then(() => {
                    var transform = d3.zoomTransform(d3.select("#visualisation_div svg").node());
                    var contentHeightPx = tooltipContent.node().getBoundingClientRect().height;
                    var contentWidthPx = tooltipContent.node().getBoundingClientRect().width;
                    var svgHeight = contentHeightPx / transform.k;
                    var svgWidth = contentWidthPx / transform.k;

                    // Ensure minimum height
                    var minHeight = tooltipHeight; // Use our desired minimum height
                    svgHeight = Math.max(svgHeight, minHeight);

                    tooltipGroup.select("rect")
                        .attr("height", svgHeight)
                        .attr("width", svgWidth);

                    foreignObject
                        .attr("height", svgHeight)
                        .attr("width", svgWidth);

                    positionTooltip(tooltipGroup, d);
                });
            } else {
                // Position the tooltip even if MathJax is not available
                positionTooltip(tooltipGroup, d);
            }
        }
        
        // Function to hide a tooltip - simplified
        function hideEqualClassesTooltip(d) {
            var tooltip = d3.select(`.equal-classes-tooltip[data-node-id="${d.name}"]`);
            if (!tooltip.empty()) {
                tooltip.style("display", "none");
            }
        }
        
        // Update the updatePinnedTooltips function - simplified
        updatePinnedTooltips = function() {
            if (!nodeGroups) return;
            
            // Find all pinned buttons
            var pinnedButtons = nodeGroups.filter(function(d) {
                return d3.select(this).select(".equal-classes-button").classed("pinned");
            });
            
            // Update each pinned tooltip
            pinnedButtons.each(function(d) {
                var tooltip = d3.select(`.equal-classes-tooltip[data-node-id="${d.name}"]`);
                if (!tooltip.empty()) {
                    positionTooltip(tooltip, d);
                }
            });
        };
        
        // Add the updatePinnedTooltips function to the zoom event
        var originalZoomHandler = zoom.on("zoom");
        zoom.on("zoom", function() {
            // Call the original zoom handler
            originalZoomHandler.call(this);
            
            // Update tooltip positions
            updatePinnedTooltips();
        });
        
        // Modify the button event handlers to use the new show/hide functions
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
                    hideEqualClassesTooltip(d);
                }
            })
            .on("click", function(d) {
                d3.event.stopPropagation(); // Prevent node click event
                
                // Toggle pinned state
                var isPinned = d3.select(this).classed("pinned");
                
                if (isPinned) {
                    // Unpin: remove pinned class and hide tooltip
                    d3.select(this).classed("pinned", false);
                    hideEqualClassesTooltip(d);
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
        
        // Update tooltip position if it exists
        var tooltip = d3.select(`.equal-classes-tooltip[data-node-id="${d.name}"]`);
        if (!tooltip.empty()) {
            positionTooltip(tooltip, d);
        }
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
    if (typeof updatePinnedTooltips !== "function") return; // no-op until ready
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
    
    function delete_node(class_obj) {
        var className = class_obj.name;
        console.log("Deleting node " + className);
        
        // Track the deletion in history
        trackVisualizationChange("Class Deleted", `Deleted complexity class: ${className}`);
        
        // Close any open tooltip for this node
        var nodeToDelete = nodeGroups.filter(d => d.name === className);
        if (!nodeToDelete.empty()) {
            var button = nodeToDelete.select(".equal-classes-button");
            if (button.classed("pinned")) {
                // Reset the button state
                button.classed("pinned", false)
                    .select(".equal-classes-symbol")
                    .text("+");
            }
        }
        
        // Remove the node from the DOM
        nodeToDelete.remove();
        console.log("Removed node from DOM:", className);
        
        // Update simulation data
        var nodes = simulation.nodes();
        var currentLinks = simulation.force("links").links();
        console.log("Current nodes and links:", { nodes, currentLinks });
        
        // Get the class data before removing it
        const deletedClass = networkProcessor.getClass(className);
        if (!deletedClass) {
            console.error("Could not find class data for:", className);
            return;
        }
        
        // Filter out the deleted node from nodes
        simulation.nodes(nodes.filter(n => n.name !== className));
        console.log("Filtered out deleted node from simulation nodes");
        
        // Find edges that should remain (not connected to deleted node)
        var remainingLinks = currentLinks.filter(l => {
            // Skip if link connects to deleted node
            if (l.source.name === className || l.target.name === className) {
                return false;
            }
            return true;
        });
        console.log("Filtered remaining links:", remainingLinks);
        
        // Find new direct paths between classes that were connected through the deleted class
        const directPaths = [];
        
        // Get all classes that were connected through this class
        const withinClasses = Array.from(deletedClass.trim_within); // Classes that contain the deleted class
        const containsClasses = Array.from(deletedClass.trim_contains); // Classes that the deleted class contains
        
        console.log("Classes connected through deleted node:", {
            within: withinClasses,
            contains: containsClasses
        });
        
        // Check for indirect paths between within and contains classes
        for (const withinClass of withinClasses) {
            for (const containsClass of containsClasses) {
                // Skip if either class is the deleted class
                if (withinClass === className || containsClass === className) continue;
                
                // Check if there was an indirect path through the deleted node
                // const hadIndirectPath = networkProcessor.hasIndirectPath(containsClass, withinClass);
                
                // Check if there's still an indirect path that doesn't go through the deleted class
                const hasOtherIndirectPath = networkProcessor.hasIndirectPath(containsClass, withinClass, className);
                
                // Only add direct path if there was a path through the deleted class but no other path exists
                if (!hasOtherIndirectPath) {
                    directPaths.push([containsClass, withinClass]);
                }
            }
        }
        console.log("Found direct paths:", directPaths);
        
        // Add new direct paths
        for (var i = 0; i < directPaths.length; i++) {
            var newLink = directPaths[i];
            var sourceNode = nodes.find(n => n.name === newLink[0]);
            var targetNode = nodes.find(n => n.name === newLink[1]);
            if (sourceNode && targetNode) {
                remainingLinks.push({source: sourceNode, target: targetNode, type: "A"});
                
                // Update trim lists in networkProcessor
                const sourceClass = networkProcessor.getClass(newLink[0]);
                const targetClass = networkProcessor.getClass(newLink[1]);
                if (sourceClass && targetClass) {
                    sourceClass.trim_within.add(newLink[1]);
                    targetClass.trim_contains.add(newLink[0]);
                }
            } else {
                console.log("Could not find node " + newLink[0] + " or " + newLink[1]);
            }
        }
        console.log("Added new direct paths to remaining links");
        
        // Remove the deleted class's relationships from other classes' trim lists
        for (const withinClass of withinClasses) {
            const classData = networkProcessor.getClass(withinClass);
            if (classData) {
                classData.trim_contains.delete(className);
            }
        }
        for (const containsClass of containsClasses) {
            const classData = networkProcessor.getClass(containsClass);
            if (classData) {
                classData.trim_within.delete(className);
            }
        }
        console.log("Updated trim lists in networkProcessor");
        
        // If the node has equal classes, recursively delete them
        if (class_obj.equal_classes && class_obj.equal_classes.length > 0) {
            console.log("Recursively deleting equal classes:", class_obj.equal_classes);
            for (var i = 0; i < class_obj.equal_classes.length; i++) {
                delete_node(class_obj.equal_classes[i]);
            }
        }
        
        // Remove the class from the network processor
        networkProcessor.deselectClass(className);
        console.log("Deselected class from networkProcessor:", className);
        
        // Delete all current edges
        delete_all_edges();
        console.log("Deleted all current edges");
        
        // Update simulation with new links
        simulation.force("links").links(remainingLinks);
        console.log("Updated simulation with new links");
        
        // Draw new links
        draw_links(remainingLinks);
        console.log("Drew new links");
        
        // Restart the simulation gently
        simulation.alpha(1).restart();
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
        var availableWidth = window.innerWidth;
        var availableHeight = window.innerHeight - 100; // Account for margin
        
        // Scaling the change
        var scale = Math.min(availableWidth / boundsWidth, availableHeight / boundsHeight);

        // Center points
        var centerX = (minX + maxX) / 2;
        var centerY = (minY + maxY) / 2;

        // Translations to center the content
        var tx = (availableWidth / 2) - (centerX * scale);
        var ty = (availableHeight / 2) - (centerY * scale) + 50; // Half of margin
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
        
        if (edge){
            console.log("Expanding edge from " + sourceClass + " to " + targetClass);
            // Get all classes between source and target
            const classes = networkProcessor.getClassesBetween(sourceClass, targetClass);
            if (classes && classes.length > 0) {
                // Select the new classes
                classes.forEach(className => {
                    networkProcessor.selectClass(className);
                });
                // Redraw the graph
                draw_graph();
                console.log("Successfully expanded");
                console.log(classes);
                // Track the edge expansion
                trackVisualizationChange("Edge Expanded", `Expanded edge from ${sourceClass} to ${targetClass}, added ${classes.length} classes: ${classes.join(", ")}`);
            } else {
                console.log("No new classes to add");
            }
        } else {
            console.log("Expanding node " + sourceClass);
            // Get all connected classes
            const classes = networkProcessor.getConnectedClasses(sourceClass);
            if (classes && classes.length > 0) {
                // Select the new classes
                classes.forEach(className => {
                    networkProcessor.selectClass(className);
                });
                // Redraw the graph
                draw_graph();
                console.log("Successfully expanded");
                console.log(classes);
                // Track the node expansion
                trackVisualizationChange("Node Expanded", `Expanded node ${sourceClass}, added ${classes.length} classes: ${classes.join(", ")}`);
            } else {
                console.log("No new classes to add");
            }
        }
    }
    
    graph_drawn = 1;
}

// Option 2: Manual LaTeX Symbol Mapping (Medium-High probability ~70%)
// This approach maps common LaTeX commands to Unicode mathematical symbols
/*
function latexToUnicode(latex) {
    const mapping = {
        '\\mathcal{P}': '𝒫',
        '\\mathcal{N}': '𝒩', 
        '\\mathcal{L}': '𝒵',
        '\\text{P}': 'P',
        '\\text{NP}': 'NP',
        '\\text{PSPACE}': 'PSPACE',
        '\\text{EXP}': 'EXP',
        '\\text{BPP}': 'BPP',
        '\\text{RP}': 'RP',
        '\\text{co-NP}': 'co-NP',
        '\\subseteq': '⊆',
        '\\subset': '⊂', 
        '\\cap': '∩',
        '\\cup': '∪',
        '\\in': '∈',
        '\\notin': '∉',
        '\\leq': '≤',
        '\\geq': '≥',
        '\\neq': '≠',
        '\\infty': '∞',
        '\\log': 'log',
        '\\sum': '∑',
        '\\prod': '∏',
        '\\int': '∫',
        '\\partial': '∂',
        '\\nabla': '∇',
        '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
        '\\epsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ',
        '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\pi': 'π',
        '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ', '\\phi': 'φ',
        '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω'
    };
    
    let result = latex;
    // Sort by length (longest first) to avoid partial replacements
    const sortedKeys = Object.keys(mapping).sort((a, b) => b.length - a.length);
    
    for (const latexCmd of sortedKeys) {
        result = result.replace(new RegExp(latexCmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), mapping[latexCmd]);
    }
    
    // Remove remaining braces and backslashes for unsupported commands
    result = result.replace(/[{}\\]/g, '');
    
    return result;
}

// Usage in Safari section (replace the fallback text):
var unicodeText = latexToUnicode(d.latex_name);
group.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("x", 0)
    .attr("y", 0)
    .style("fill", "#fff")
    .style("font-size", `${fontSize}px`)
    .style("font-family", "STIXGeneral, 'Times New Roman', serif")
    .style("pointer-events", "none")
    .text(unicodeText);
*/

// Option 3: Canvas-based Rendering with Image Conversion (Medium probability ~60%)
// This renders LaTeX to canvas, then converts to image data URL for SVG
/*
function renderLatexToImage(latex, fontSize, callback) {
    // Create temporary canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = radius * 4;
    canvas.height = fontSize * 2;
    
    // Try to render with KaTeX to canvas (if supported)
    try {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.fontSize = `${fontSize}px`;
        tempDiv.style.color = 'white';
        tempDiv.style.background = 'transparent';
        document.body.appendChild(tempDiv);
        
        renderKaTeX(latex, tempDiv, window.katexOptions);
        
        // Use html2canvas or similar to convert to canvas
        html2canvas(tempDiv, {
            backgroundColor: null,
            scale: 2,
            useCORS: true
        }).then(function(renderedCanvas) {
            document.body.removeChild(tempDiv);
            const dataURL = renderedCanvas.toDataURL('image/png');
            callback(dataURL);
        }).catch(function(error) {
            document.body.removeChild(tempDiv);
            // Fallback to text rendering on canvas
            ctx.fillStyle = 'white';
            ctx.font = `${fontSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(latex, canvas.width/2, canvas.height/2);
            callback(canvas.toDataURL('image/png'));
        });
        
    } catch (e) {
        // Direct canvas text fallback
        ctx.fillStyle = 'white';
        ctx.font = `${fontSize}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(latex, canvas.width/2, canvas.height/2);
        callback(canvas.toDataURL('image/png'));
    }
}

// Usage in Safari section:
renderLatexToImage(d.latex_name, fontSize, function(dataURL) {
    group.append('image')
        .attr('x', -radius)
        .attr('y', -fontSize)
        .attr('width', radius * 2)
        .attr('height', fontSize * 2)
        .attr('href', dataURL)
        .style('pointer-events', 'none');
});
*/

// Option 4: Server-side LaTeX to SVG Conversion (Lower probability ~40% but most robust)
// This sends LaTeX to server for conversion, caches results
/*
const latexCache = new Map();

function renderLatexServerSide(latex, callback) {
    // Check cache first
    if (latexCache.has(latex)) {
        callback(latexCache.get(latex));
        return;
    }
    
    // Send request to server endpoint
    fetch('/api/latex-to-svg', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latex: latex })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.svg) {
            // Cache the result
            latexCache.set(latex, data.svg);
            callback(data.svg);
        } else {
            throw new Error(data.error || 'Server conversion failed');
        }
    })
    .catch(error => {
        console.error('Server LaTeX conversion error:', error);
        // Fallback to plain text
        callback(`<text fill="white" text-anchor="middle" dominant-baseline="middle">${latex}</text>`);
    });
}

// Usage in Safari section:
renderLatexServerSide(d.latex_name, function(svgContent) {
    var foreignObj = group.append('foreignObject')
        .attr('x', -radius)
        .attr('y', -fontSize/2)
        .attr('width', radius * 2)
        .attr('height', fontSize)
        .style('overflow', 'visible');
    
    foreignObj.node().innerHTML = svgContent;
});

// Server endpoint would look like (Python/Flask example):
// @app.route('/api/latex-to-svg', methods=['POST'])
// def latex_to_svg():
//     try:
//         latex = request.json['latex']
//         # Use matplotlib or similar to convert LaTeX to SVG
//         import matplotlib.pyplot as plt
//         import io
//         
//         fig, ax = plt.subplots(figsize=(2, 0.5))
//         ax.text(0.5, 0.5, f'${latex}$', transform=ax.transAxes, 
//                 ha='center', va='center', fontsize=14, color='white')
//         ax.axis('off')
//         
//         svg_buffer = io.StringIO()
//         plt.savefig(svg_buffer, format='svg', transparent=True, bbox_inches='tight')
//         plt.close()
//         
//         return {'success': True, 'svg': svg_buffer.getvalue()}
//     except Exception as e:
//         return {'success': False, 'error': str(e)}
*/