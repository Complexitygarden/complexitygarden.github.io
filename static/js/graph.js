// Drawing a graph of complexity classes using D3


// Key properties
var graph_drawn = false,// Indicator whether the graph has been drawn
    click_timeout = null;// Timeout for click events - prevents counting double clicks as single clicks and double clicks simultaneously
var nodeMenuDiv = null; // Currently open node context-menu element
var rotationIntervals = []; // Holds d3.interval handlers for rotating equal-class labels
var prevNodeNames = new Set(); // Track nodes that were already visualised to animate colour of newly added ones
var pendingColorTransitions = []; // stores {sel, level} for nodes awaiting search close

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
window.forcesEnabled = false; // New setting: spring forces to neighbours

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
    // console.log("Updating graph values");
    // console.log("Width: " + width);
    if (width < 600) {
        // console.log("Small screen");
        radius = width / 3;
    } else if (width < 800) {
        // console.log("Medium screen");
        radius = width / 4;
    } else {
        // console.log("Large screen");
        radius = width / 8;
    }
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
        // INSERT: also hide node context menu
        hideNodeMenu();
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
        
        rotationIntervals.forEach(function(i){ i.stop(); });
        rotationIntervals = [];
        
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
    .range(["#8FBC8F", "#2D5016"]);

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

    // Mark new nodes (not present in previous render)
    data.nodes.forEach(n => { n.isNew = !prevNodeNames.has(n.name); });

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
        if (window.forcesEnabled){
            if (node.name in data.root_nodes || node.name in data.top_nodes){
                node.fx = node.x;
                node.fy = node.y;
            } else {
                node.fx = null;
                node.fy = null;
            }
        } else if (window.gravityEnabled){
            if (node.name in data.root_nodes){
                node.y = -5000;
                node.fx = node.x;
                node.fy = node.y;
            } else if (node.name in data.top_nodes){
                node.y = 5000;
                node.fx = node.x;
                node.fy = node.y;
            }
        } else {
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
    if (window.forcesEnabled){
        let repulsion = -Math.max(200, radius*10);
        simulation
            .force("charge_force", d3.forceManyBody().strength(repulsion))
            .force("center_force", null)
            .force("links", link_force)
            .force("collision", d3.forceCollide().radius(radius * 2))
            .alpha(1)
            .restart();
    } else if (window.gravityEnabled){
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

    // Re-fix root and top nodes (important after forces set)
    if (window.forcesEnabled){
        simulation.nodes().forEach(function(n){
            if (isRootOrTop(n.name)){
                n.fx = n.x;
                n.fy = n.y;
            }
        });
    }

    // Adding tick actions
    simulation.on("tick", tickActions);

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
                .style("stroke", "#2D5016")
                .style("fill", "none")
                .attr("points", get_points);
        })
        .on("mouseover", function(d) {
            d3.select(this).select(".link-visible")
                .style("stroke", "#4F7942")
                .attr("stroke-width", 12);
            // Arrow highlight
            arrowLayer.selectAll(".arrow")
                .filter(a => a.source === d.source && a.target === d.target)
                .style("stroke", "#4F7942")
                .style("fill", "#4F7942");
        })
        .on("mouseout", function(d) {
            d3.select(this).select(".link-visible")
                .style("stroke", "#2D5016")
                .attr("stroke-width", 2);
            // Arrow reset
            arrowLayer.selectAll(".arrow")
                .filter(a => a.source === d.source && a.target === d.target)
                .style("stroke", "#2D5016")
                .style("fill", "#2D5016");
        })
        .on("click", function(d) {
            d3.event.preventDefault();
            d3.event.stopPropagation();
            showEdgeMenu(d, d3.event.pageX, d3.event.pageY);
        })
        .on("dblclick", function(d) {
            // Get the source and target class names
            hideNodeMenu();
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
        .style("stroke", "#2D5016")
        .style("fill", "#2D5016")
        .attr("d", function(d) {
            var midX = (d.source.x + d.target.x) / 2;
            var midY = (d.source.y + d.target.y) / 2;
            var size = 10 * arrow_scale;
            return `M ${midX-size} ${midY-size} L ${midX+size} ${midY} L ${midX-size} ${midY+size} Z`;
        })
        .on("mouseover", function(d) {
            // Arrow highlight
            d3.select(this)
                .style("stroke", "#4F7942")
                .style("fill", "#4F7942");
            // Arrow highlight
            link.filter(l => l.source === d.source && l.target === d.target)
                .select(".link-visible")
                .style("stroke", "#4F7942")
                .attr("stroke-width", 12);
        })
        .on("mouseout", function(d) {
            // Arrow reset
            d3.select(this)
                .style("stroke", "#2D5016")
                .style("fill", "#2D5016");
            // Arrow reset
            link.filter(l => l.source === d.source && l.target === d.target)
                .select(".link-visible")
                .style("stroke", "#2D5016")
                .attr("stroke-width", 2);
        })
        .on("click", function(d) {
            d3.event.preventDefault();
            d3.event.stopPropagation();
            showEdgeMenu(d, d3.event.pageX, d3.event.pageY);
        })
        .on("dblclick", function(d) {
            // Get the source and target class names
            hideNodeMenu();
            var sourceClass = d.source.name;
            var targetClass = d.target.name;
            
            expand(sourceClass, targetClass, true);
        });
    }

    // Calculate dynamic colour timing based on number of new nodes (capped at 4)
    const newNodeCount = data.nodes.filter(n => n.isNew).length;
    const colorFactor = Math.min(newNodeCount, 4);
    const redHoldMs = 1000 * colorFactor;   // stay red
    const fadeMs    = 1000 * colorFactor;   // fade duration

    function draw_nodes(){
        nodeGroups = node.append("g")
            .on("mouseover", function(d) {
                d3.select(this).select("circle")
                    .attr("fill", d => d3.rgb(colorScale(d.level)).brighter(0.3))
                    .attr("stroke", "#2D5016");
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
            .attr("fill", d => d.isNew ? "#a11f1f" : colorScale(d.level))
            .attr("stroke", "none")
            .attr("stroke-width", 3)
            .each(function(d){
                if(d.isNew){
                    var circleSel = d3.select(this);
                    var body = document.body;
                    var searchOpen = body.classList.contains('search-active') || body.classList.contains('mobile-search-open');
                    if (searchOpen) {
                        // defer transition until search closes
                        pendingColorTransitions.push({sel: circleSel, level: d.level, fade: fadeMs});
                    } else {
                        // wait for calculated red hold before starting the fade
                        setTimeout(function() {
                            circleSel.transition().duration(fadeMs).attr('fill', colorScale(d.level));
                        }, redHoldMs);
                    }
                }
            });
    
        // REPLACE placeholder with visual (non-interactive) plus button indicator
        nodeGroups.append("g")
            .attr("class", "equal-classes-button")
            .attr("transform", `translate(${-0.7*radius}, ${-0.7*radius})`)
            .style("display", d => d.equal_classes && d.equal_classes.length > 0 ? "block" : "none")
            .style("pointer-events", "none") // disable all interactions
            .each(function() {
                const g = d3.select(this);
                // Background circle
                g.append("circle")
                    .attr("r", radius/6)
                    .attr("fill", "#2D5016")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1);
                // Plus sign
                g.append("text")
                    .attr("text-anchor", "middle")
                    .attr("dy", "0.35em")
                    .style("fill", "#fff")
                    .style("font-size", `${radius/4}px`)
                    .style("pointer-events", "none")
                    .text("+");
            });

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
                    // Helper: render KaTeX and fit width for the given latex string
                    function renderLatexAndFit(targetEl, latexStr) {
                        try {
                            targetEl.innerHTML = ""; // clear previous
                            targetEl.style.fontSize = `${fontSize}px`;

                            const tempDiv = document.createElement('div');
                            tempDiv.style.position = 'absolute';
                            tempDiv.style.visibility = 'hidden';
                            tempDiv.style.fontSize = `${fontSize}px`;
                            document.body.appendChild(tempDiv);
                            renderKaTeX(latexStr, tempDiv, window.katexOptions);
                            const textWidth = tempDiv.offsetWidth;
                            document.body.removeChild(tempDiv);

                            renderKaTeX(latexStr, targetEl, window.katexOptions);

                            if (textWidth > radius * 1.5) {
                                targetEl.style.fontSize = `${fontSize * 0.7}px`;
                                renderKaTeX(latexStr, targetEl, window.katexOptions);
                            }
                        } catch (e) {
                            console.error('KaTeX rendering error:', e);
                            targetEl.textContent = latexStr;
                        }
                    }

                    // INITIAL RENDER
                    renderLatexAndFit(this, d.latex_name);

                    // ADD: start rotating between equal classes (if any)
                    if (d.equal_classes && d.equal_classes.length > 0) {
                        // Pass helper into rotation closure
                        setupLabelRotation(d3.select(this), [d].concat(d.equal_classes), renderLatexAndFit);
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

        // Helper: rotates the label among equal classes with fade-out / fade-in
        function setupLabelRotation(labelSelection, classCycle, renderHelper) {
            if (!classCycle || classCycle.length <= 1) return; // nothing to rotate
            var idx = 0;
            labelSelection.style("opacity", 1);
            var interval = d3.interval(function() {
                idx = (idx + 1) % classCycle.length;
                var nextClass = classCycle[idx];
                labelSelection.transition().duration(500).style("opacity", 0)
                    .on("end", function() {
                        // Use the provided render helper for proper sizing
                        if (renderHelper) {
                            renderHelper(this, nextClass.latex_name);
                        }
                        d3.select(this).transition().duration(500).style("opacity", 1);
                    });
            }, 3000); // rotate every 3 seconds
            rotationIntervals.push(interval);
        }

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
        
        // Override updatePinnedTooltips to a safe no-op since equal-class buttons are now hidden
        updatePinnedTooltips = function() { /* disabled with rotating label implementation */ };
        
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
            
        // === New single-click behaviour: show context menu ===
        node.on("click", function(d) {
            d3.event.preventDefault();
            d3.event.stopPropagation();
            showNodeMenu(d, d3.event.pageX, d3.event.pageY);
        });

        node.on("dblclick", function(d) {
            // Ensure any open menu is hidden
            hideNodeMenu();
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
        if (window.gravityEnabled) {
            // gravity mode keeps nodes fixed when gravity disabled? already handled elsewhere
            d.fx = d.x;
            d.fy = d.y;
        } else if (window.forcesEnabled) {
            // let it float under forces
            if (!isRootOrTop(d.name)){
                d.fx = null;
                d.fy = null;
            }
        } else {
            d.fx = d.x;
            d.fy = d.y;
        }

        // Persist manual node position back to the NetworkProcessor so that later redraws respect user placement
        if (window.networkProcessor && typeof window.networkProcessor.setManualPosition === 'function') {
            try {
                var savedXNorm = d.x / window.innerWidth;
                var savedYNorm = d.y / window.innerHeight;
                window.networkProcessor.setManualPosition(d.name, savedXNorm, savedYNorm);
                // console.log('[Graph] Persisted manual position for', d.name, {savedXNorm, savedYNorm});
            } catch (e) {
                console.error('Failed to persist manual position', e);
            }
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

        // Track the deletion in history
        trackVisualizationChange("Class Deleted", `Deleted complexity class: ${className}`);
        
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
            const classes = networkProcessor.getConnectedClasses(sourceClass, true);
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
    // Update set of previously visualised nodes
    var body = document.body;
    var searchOpenNow = body.classList.contains('search-active') || body.classList.contains('mobile-search-open');
    if (searchOpenNow) {
        // Only add nodes that were not freshly created (isNew false)
        data.nodes.forEach(function(n){ if(!n.isNew){ prevNodeNames.add(n.name);} });
    } else {
        prevNodeNames = new Set(data.nodes.map(n => n.name));
    }

    // Make delete/expand utilities accessible to the context menu
    window.expandNodeRef = function(className) {
        expand(className, null, false);
    };
    window.deleteNodeRef = delete_node;
    window.expandEdgeRef = function(sourceClass, targetClass) {
         expand(sourceClass, targetClass, true);
    };

    // Helper to check if node is root or top
    function isRootOrTop(name){
        return (Array.isArray(data.root_nodes) && data.root_nodes.includes(name)) ||
               (Array.isArray(data.top_nodes)  && data.top_nodes.includes(name));
    }
}

// ===== Helper functions for node context menu =====
function hideNodeMenu() {
    if (nodeMenuDiv) {
        nodeMenuDiv.remove();
        nodeMenuDiv = null;
    }
}

function showNodeMenu(d, pageX, pageY) {
    // Close any existing menu first
    hideNodeMenu();

    // Build a simple HTML dropdown anchored to the click position
    nodeMenuDiv = d3.select("body").append("div")
        .attr("class", "node-context-menu")
        .style("position", "absolute")
        .style("left", pageX + "px")
        .style("top", pageY + "px")
        .style("background", "#ffffff")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
        .style("padding", "4px 0")
        .style("z-index", "10000");

    // Build menu options dynamically
    var hasEquals = d.equal_classes && d.equal_classes.length > 0;
    var options = [
        { type:"text", label: "Expand", action: function() { hideNodeMenu(); if (window.expandNodeRef) { window.expandNodeRef(d.name); } } },
        { type:"text", label: "Remove", action: function() { hideNodeMenu(); if (window.deleteNodeRef) { window.deleteNodeRef(d); } } }
    ];

    // Main description entry
    if (hasEquals) {
        options.push({ type:"latex", latex: d.latex_name, suffix: ": Description", action: function() { hideNodeMenu(); open_side_window(d); } });
        d.equal_classes.forEach(function(eq) {
            options.push({ type:"latex", latex: eq.latex_name, suffix: ": Description", action: function() { hideNodeMenu(); open_side_window(eq); } });
        });
    } else {
        options.push({ type:"text", label: "Description", action: function() { hideNodeMenu(); open_side_window(d); } });
    }

    options.forEach(function(opt) {
        var row = nodeMenuDiv.append("div")
            .style("padding", "6px 16px")
            .style("cursor", "pointer")
            .style("font-family", "Arial, sans-serif")
            .on("mouseover", function() { d3.select(this).style("background", "#f0f0f0"); })
            .on("mouseout", function() { d3.select(this).style("background", "transparent"); })
            .on("click", opt.action);

        if (opt.type === "latex") {
            var holder = row.append("span").node();
            try {
                renderKaTeX(opt.latex, holder, window.katexOptions);
            } catch(e) {
                row.append("span").text(opt.latex);
            }
            row.append("span").text(opt.suffix);
        } else {
            row.text(opt.label);
        }
    });

    // Prevent clicks inside the menu from bubbling up and closing it immediately
    nodeMenuDiv.on("click", function() { d3.event.stopPropagation(); });
}

// Close the menu when clicking anywhere else on the page
document.addEventListener("click", function(evt) {
    if (nodeMenuDiv && nodeMenuDiv.node() && !nodeMenuDiv.node().contains(evt.target)) {
        hideNodeMenu();
    }
});

// ===== Helper function for edge context menu =====
function showEdgeMenu(linkData, pageX, pageY) {
    hideNodeMenu();

    nodeMenuDiv = d3.select("body").append("div")
        .attr("class", "edge-context-menu")
        .style("position", "absolute")
        .style("left", pageX + "px")
        .style("top", pageY + "px")
        .style("background", "#ffffff")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
        .style("padding", "4px 0")
        .style("z-index", "10000");

    var options = [
        { label: "Expand", action: function() { hideNodeMenu(); if (window.expandEdgeRef) { window.expandEdgeRef(linkData.source.name, linkData.target.name); } } }
    ];

    options.forEach(function(opt) {
        nodeMenuDiv.append("div")
            .style("padding", "6px 16px")
            .style("cursor", "pointer")
            .style("font-family", "Arial, sans-serif")
            .text(opt.label)
            .on("mouseover", function() { d3.select(this).style("background", "#f0f0f0"); })
            .on("mouseout", function() { d3.select(this).style("background", "transparent"); })
            .on("click", opt.action);
    });

    nodeMenuDiv.on("click", function() { d3.event.stopPropagation(); });
}
// ==================================================

// Observe changes to body class list to trigger pending transitions when search closes
if (typeof MutationObserver !== 'undefined') {
    var bodyObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            if (m.attributeName === 'class') {
                var body = document.body;
                var searchOpen = body.classList.contains('search-active') || body.classList.contains('mobile-search-open');
                if (!searchOpen && pendingColorTransitions.length > 0) {
                    // Launch pending transitions
                    pendingColorTransitions.forEach(function(item) {
                        const dur = item.fade || 1500;
                        item.sel.transition().duration(dur).attr('fill', colorScale(item.level));
                        prevNodeNames.add(item.sel.datum().name); // mark as visualised
                    });
                    pendingColorTransitions = [];
                }
            }
        });
    });
    bodyObserver.observe(document.body, { attributes: true });
}