/*
Main javascript file
*/
// import { arrow1 } from "./utils/arrow";
var arrow_scale = 1; // Need to fix the scaling - anything above 1 acts weird

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


// Adding the graph

d3.json("https://raw.githubusercontent.com/dmilosch/dmilosch.github.io/refs/heads/main/network.json", function(data){

    //set up the simulation 
    var simulation = d3.forceSimulation()
    //add nodes
    .nodes(data.nodes);
    
    
    //add forces
    //we're going to add a charge to each node 
    //also going to add a centering force
    //and a link force
    var link_force =  d3.forceLink(data.links)
      .id(function(d) { return d.name; });
    simulation
    .force("charge_force", d3.forceManyBody().strength(strength))
    .force("center_force", d3.forceCenter(graph_width / 2, graph_height / 2))
    .force("links",link_force);
    
    
    //add tick instructions: 
    simulation.on("tick", tickActions );
    
    function edgeColor(d){
    // if(d.type == "A"){
    // return "blue";
    // }
    // if(d.type == "B"){
    // return "red";
    // }
    // return "green";
    return "red"
    }
    
    // Returning the label
    function nodeLabel(d){return d.label}
    
    const arrow = d3.arrow1()
        .scale(arrow_scale)
        .id("my-arrow")
        .attr("fill", "red")
        .attr("stroke", "red");
     
    svg.call(arrow);
    
    // Layers - Created in their order from behind to the front
    var layer1 = svg.append("g");
    var layer2 = svg.append("g");
    
    
    // //draw circles for the links
    var node = layer2.attr("class", "nodes")
    .selectAll("circle")
    .data(data.nodes)
    .enter()
    .append("g");
    
    var link = layer1.attr("class", "links")
    .selectAll(".links")
    .data(data.links)
    .enter()
    .append("polyline");

    function draw_everything(){
        link
        .attr("stroke-width", 2)
        .style("stroke",edgeColor)
        .attr("marker-mid", "url(#my-arrow)")
        .attr("points",get_points);

        // Adding the circle
        node.append("circle")
        .attr("r", radius)
        .attr("fill", "#0B192C");

        // Adding a label on the circle
        node.append('text')
        .text(nodeLabel)
        .attr("text-anchor", "middle")
        .style("fill", "#FF6500")
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
    
    // Testing lines
    
    // svg.append("polyline")
    //     .attr("marker-mid", "url(#my-arrow)")
    //     .attr("points", [[5, 10],[25,10] ,[55, 10]])
    //     .attr("stroke", "steelblue")
    //     .attr("stroke-width", 2);
    
    
    // Clicking events
    node.on("dblclick", open_side_window);
    
    // Javascript file which creates a sidewindow
    function open_side_window(d){
        console.log(d)
        graph_width_ratio = 0.9,
        right_width_ratio = 0.1;
        redraw_divs();
    }
    
    });