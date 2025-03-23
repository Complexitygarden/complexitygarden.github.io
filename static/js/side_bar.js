$(document).ready(function() {
    $("#leftSidebarMenu").on("click", "#settings_menu_item", function(e) {
        var $submenu = $(this).children("ul");
        // If the submenu is currently animating, ignore this click.
        if ($submenu.is(":animated")) {
            console.log("Avoiding double-clicking which causes the submenu to open and close");
            return;
        }
        $(this).toggleClass("open");
        $submenu.slideToggle("fast");
    });

    // Prevent clicks on the sub-items from toggling the parent's settings menu.
    $("#leftSidebarMenu").on("click", "#settings_menu_item ul", function(e) {
        e.stopPropagation();
    });
});

function toggleGravity(checkbox) {
    window.gravityEnabled = checkbox.checked;
    if (checkbox.checked) {
        // Enable forces and free nodes
        simulation.force("charge_force", d3.forceManyBody().strength(strength));
        simulation.force("center_force", d3.forceCenter(graph_width / 2, graph_height / 2));
        // Unfix all nodes
        simulation.nodes().forEach(node => {
            node.fx = null;
            node.fy = null;
        });
    } else {
        // Fix all nodes in their current positions
        simulation.nodes().forEach(node => {
            node.fx = node.x;
            node.fy = node.y;
        });
        // Remove forces
        simulation.force("charge_force", null);
        simulation.force("center_force", null);
    }
    simulation.alpha(1).restart();
}

function redrawVisualization() {
    // Clear the existing visualization
    vis_svg.selectAll("*").remove();
    
    // Redraw
    create_visualisation();
}