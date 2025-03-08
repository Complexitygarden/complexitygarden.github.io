/*
Main javascript file
*/
var arrow_scale = 3.5;
var drawn = 0;

const body = $('body');
const searchBar = $('#complexity_class_search_bar');

// Distribution of divs
var graph_width_ratio = 1,
    right_width_ratio = 0,
    margin = 100, // Change based on the top bar size
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
var node_distance = radius * 4;

// Gravity variables
window.gravityEnabled = false;

// Information about user interaction
var user_interaction = {
    selected_class: null
}

// This should be done in python - gonna put it there soon (hopefully)
function calculateNodeLevels(nodes, links) {
    const outgoing = {};
    const incoming = {};
    nodes.forEach(node => {
        outgoing[node.name] = [];
        incoming[node.name] = [];
    });
    links.forEach(link => {
        outgoing[link.source.name || link.source].push(link.target.name || link.target);
        incoming[link.target.name || link.target].push(link.source.name || link.source);
    });
    
    // Find root nodes (no incoming edges)
    const rootNodes = nodes.filter(node => incoming[node.name].length === 0);
    
    // Calculate minimum levels (from top down)
    const minLevels = {};
    rootNodes.forEach(root => {
        minLevels[root.name] = 0;
    });
    
    let queue = [...rootNodes];
    while (queue.length > 0) {
        const current = queue.shift();
        const currentLevel = minLevels[current.name];
        
        outgoing[current.name].forEach(targetName => {
            if (!(targetName in minLevels) || minLevels[targetName] < currentLevel + 1) {
                minLevels[targetName] = currentLevel + 1;
                queue.push(nodes.find(n => n.name === targetName));
            }
        });
    }

    // Find leaf nodes (no outgoing edges)
    const leafNodes = nodes.filter(node => outgoing[node.name].length === 0);
    
    // Calculate maximum levels (from bottom up)
    const maxLevels = {};
    const maxLevel = Math.max(...Object.values(minLevels));
    leafNodes.forEach(leaf => {
        maxLevels[leaf.name] = maxLevel;
    });
    
    queue = [...leafNodes];
    while (queue.length > 0) {
        const current = queue.shift();
        const currentLevel = maxLevels[current.name];
        
        incoming[current.name].forEach(sourceName => {
            if (!(sourceName in maxLevels) || maxLevels[sourceName] > currentLevel - 1) {
                maxLevels[sourceName] = currentLevel - 1;
                queue.push(nodes.find(n => n.name === sourceName));
            }
        });
    }
    
    // Set each node's level to the average of its min and max levels
    nodes.forEach(node => {
        node.level = Math.floor((minLevels[node.name] + maxLevels[node.name]) / 2);
        node.maxLevel = maxLevel;
    });
}

// Color scale
var colorScale = d3.scaleLinear()
    .range(["#63B3ED", "#2C5282"]);

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
        // Find the root node (node with only incoming edges) and top node (node with only outgoing edges)
        console.log(data);
        let outgoingEdges = new Set(data.links.map(link => link.source));
        let incomingEdges = new Set(data.links.map(link => link.target));
        let rootNode = data.nodes.find(node => !outgoingEdges.has(node.name));
        let topNode = data.nodes.find(node => !incomingEdges.has(node.name));

        // Initialize positions for nodes
        data.nodes.forEach(node => {
            if (node === rootNode) {
                // Position root node at the top center
                node.x = graph_width / 2;
                node.y = -5000; // Placing it extremely to the top - the force will return it
                node.fx = node.x;
                node.fy = node.y;
            } else if (node === topNode) {
                // Position top node at the bottom center
                node.x = graph_width / 2;
                node.y = 5000; // Placing it extremely to the bottom - the force will return it
                node.fx = node.x;
                node.fy = node.y;
            }
            else {
                // Random positions for other nodes
                node.x = Math.random() * graph_width;
                node.y = (Math.random() * graph_height * 0.7) + (graph_height * 0.3); // Position below the root
            }
        });

         // Unfixing the root node - so that it drags around, but it is still at the top of the screen
        setTimeout(function() {
            if (rootNode !== null && rootNode !== undefined) {
                rootNode.fx = null;
                rootNode.fy = null;
            }
            if (topNode !== null && topNode !== undefined) {
                topNode.fx = null;
                topNode.fy = null;
            }
        }, 500);

        // Reset simulation with new data
        simulation.nodes(data.nodes);
        
        // Adjust strength based on number of nodes
        let nodeCount = data.nodes.length;
        let adjustedStrength = nodeCount <= 5 ? 5*strength : strength;  // Use weaker force for small graphs

        //add forces
        var link_force = d3.forceLink(data.links)
            .id(function(d) { return d.name; })
            .distance(node_distance)
            .strength(1);  // Add a strong link force (1 is maximum)
            
        simulation
            .force("charge_force", d3.forceManyBody().strength(adjustedStrength))
            .force("center_force", d3.forceCenter(graph_width / 2, graph_height / 2))
            .force("links", link_force)
            .force("collision", d3.forceCollide().radius(radius * 2))  // Add collision detection
            .alpha(1)    // Reset the simulation's internal timer
            .restart();  // Restart the simulation
        
        // If gravity is disabled, let the simulation run briefly then fix nodes
        if (window.gravityEnabled === false) {
            setTimeout(function() {
                // Remove forces
                simulation
                    .force("charge_force", null)
                    .force("center_force", null);
                
                // Position and fix nodes based on their level
                const nodesPerLevel = {};
                data.nodes.forEach(node => {
                    if (!nodesPerLevel[node.level]) {
                        nodesPerLevel[node.level] = [];
                    }
                    nodesPerLevel[node.level].push(node);
                });

                // For each level, distribute nodes evenly across the width
                Object.entries(nodesPerLevel).forEach(([level, nodes]) => {
                    const spacing = 3*graph_width / (nodes.length + 1);
                    nodes.forEach((node, index) => {
                        // Calculate y position based on level (higher level = lower on screen)
                        const levelSpacing = graph_height / 3;
                        node.y = (node.maxLevel - node.level) * levelSpacing + levelSpacing/2;
                        // Evenly space x positions
                        node.x = spacing * (index + 1);
                        // Fix the position
                        node.fx = node.x;
                        node.fy = node.y;
                    });
                });
                
                simulation.alpha(1).restart();
            }, 1000); // Let gravity work for 1 second
        }
        
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
            });
    
        // Arrow layer
        var arrowLayer = layer1.append("g").attr("class", "arrow-layer");
        
        // Arrows
        arrowLayer.selectAll(".arrow")
            .data(data.links)
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
            });

        function draw_everything(){
            var nodeGroups = node.append("g")
            .on("mouseover", function(d) {
                d3.select(this).select("circle")
                    .attr("fill", d => d3.rgb(colorScale(d.level)).brighter(0.3))
                    .attr("stroke", "#2c5282");
            })
            .on("mouseout", function(d) {
                d3.select(this).select("circle")
                    .attr("fill", d => colorScale(d.level))
                    .attr("stroke", "none");
            });

            // Adding the circle
            nodeGroups.append("circle")
            .attr("r", radius)
            .attr("fill", d => colorScale(d.level))
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
    
        // Calculating levels and color scale
        calculateNodeLevels(data.nodes, data.links);
        colorScale.domain([0, d3.max(data.nodes, d => d.maxLevel)]);
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

        // After drawing everything and letting the simulation run a bit
        setTimeout(function() {
            var svgElement = d3.select("#graph_viz svg");
            var bounds = svg.node().getBBox();
            var padding_scale = 1;

            if (nodeCount == 1){
                console.log("Only one node");
                padding_scale = 0.4;
            } else {
                padding_scale = 0.7;
            }
            
            // Calculate scale to fit with some padding
            var scale = Math.min(
                (graph_width*padding_scale) / bounds.width,
                (graph_height*padding_scale) / bounds.height
            );

            // Calculate translation to center the graph
            var transform = d3.zoomIdentity
                .translate(
                    (graph_width - bounds.width * scale) / 2 - bounds.x * scale,
                    (graph_height - bounds.height * scale) / 2 - bounds.y * scale
                )
                .scale(scale);
            
            // Apply the transform smoothly
            svgElement.transition()
                .duration(750)
                .call(zoom.transform, transform);
        }, 2000);
    });
    drawn = 1;
}





// Javascript file which creates a sidewindow
function open_side_window(d, force_open = true) {
    if (user_interaction.selected_class == d.name && !force_open){
        return;
    }
    user_interaction.selected_class = d.name;

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

    if(body.hasClass('search-active')){
            body.removeClass('search-active');
            searchBar.blur();
    }
}

draw_graph();