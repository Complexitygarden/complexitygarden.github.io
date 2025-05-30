/**
 * Utility functions for the Complexity Garden application
 */

console.log('Loading utils.js');

/**
 * Renders LaTeX content using KaTeX
 * @param {string} latex - The LaTeX content to render
 * @param {HTMLElement} element - The element to render into
 * @param {Object} options - Optional KaTeX rendering options
 * @returns {boolean} - Whether rendering was successful
 */
function renderKaTeX(latex, element, options = {}) {
    if (!window.katex) {
        console.warn('KaTeX not found, skipping LaTeX rendering');
        return false;
    }

    try {
        // Default options
        const defaultOptions = {
            throwOnError: false,
            displayMode: false
        };

        // Merge default options with provided options
        const renderOptions = { ...defaultOptions, ...options };

        // Render the LaTeX
        katex.render(latex, element, renderOptions);
        return true;
    } catch (err) {
        console.warn('Error rendering LaTeX:', err);
        // Keep the original text if rendering fails
        element.textContent = latex;
        return false;
    }
}

// Export the function
window.renderKaTeX = renderKaTeX;
console.log('utils.js loaded, renderKaTeX exported');

// Shared utility functions

// Global variables
var margin = 100; // Margin between the top of the screen Note: Change based on the top bar size
var id_visualisation_div = "#visualisation_div";

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

// Redrawing the divs based on the window size
function redraw_divs() {
    vis_width = window.innerWidth - margin;
    vis_height = window.innerHeight - margin;
    center_x = vis_width / 2;
    center_y = vis_height / 2;

    d3.select(id_visualisation_div)
        .style("width", vis_width + 'px')
        .style("height", vis_height + 'px')
        .attr("viewBox", "0 0 " + vis_width + " " + vis_height);

    right_width = Math.max(Math.floor(right_width_ratio * window_width) - margin, min_width);
    right_height = window_height - margin;
    if (right_width == min_width) {
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