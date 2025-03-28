function add_arrow_marker(svg, arrow_scale){
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
}