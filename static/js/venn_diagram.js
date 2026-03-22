// Venn Diagram Visualization for Complexity Classes

var vennDrawn = false;
var vennChart = null;

// Define multiple Venn diagram configurations
function getVennDiagrams() {
    return [
        {
            title: "Basic Hierarchy",
            description: "P ⊆ NP ⊆ PSPACE (nested containment)",
            sets: [
                {sets: ['PSPACE'], size: 100},
                {sets: ['NP'], size: 60},
                {sets: ['P'], size: 30},
                {sets: ['PSPACE', 'NP'], size: 60},
                {sets: ['NP', 'P'], size: 30},
                {sets: ['PSPACE', 'P'], size: 30},
                {sets: ['PSPACE', 'NP', 'P'], size: 30}
            ]
        },
        {
            title: "NP vs co-NP",
            description: "P ⊆ (NP ∩ co-NP) - but NP ≠ co-NP is open",
            sets: [
                {sets: ['NP'], size: 70},
                {sets: ['co-NP'], size: 70},
                {sets: ['P'], size: 35},
                {sets: ['NP', 'co-NP'], size: 35}, // Intersection contains at least P
                {sets: ['NP', 'P'], size: 35},
                {sets: ['co-NP', 'P'], size: 35},
                {sets: ['NP', 'co-NP', 'P'], size: 35}
            ]
        },
        {
            title: "NP vs BQP (Incomparable)",
            description: "Neither NP ⊆ BQP nor BQP ⊆ NP - partial overlap",
            sets: [
                {sets: ['NP'], size: 80},
                {sets: ['BQP'], size: 80},
                {sets: ['P'], size: 35},
                {sets: ['NP', 'BQP'], size: 35}, // Intersection contains at least P
                {sets: ['NP', 'P'], size: 35},
                {sets: ['BQP', 'P'], size: 35},
                {sets: ['NP', 'BQP', 'P'], size: 35}
            ]
        },
        {
            title: "PSPACE = IP (Equality)",
            description: "PSPACE equals IP - complete overlap",
            sets: [
                {sets: ['PSPACE'], size: 100},
                {sets: ['IP'], size: 100},
                {sets: ['PSPACE', 'IP'], size: 100} // Perfect overlap
            ]
        },
        {
            title: "Extended Hierarchy",
            description: "P ⊆ NP ⊆ PSPACE ⊆ EXPTIME",
            sets: [
                {sets: ['EXPTIME'], size: 140},
                {sets: ['PSPACE'], size: 100},
                {sets: ['NP'], size: 60},
                {sets: ['P'], size: 30},
                {sets: ['EXPTIME', 'PSPACE'], size: 100},
                {sets: ['PSPACE', 'NP'], size: 60},
                {sets: ['NP', 'P'], size: 30},
                {sets: ['EXPTIME', 'PSPACE', 'NP'], size: 60},
                {sets: ['PSPACE', 'NP', 'P'], size: 30},
                {sets: ['EXPTIME', 'P'], size: 30},
                {sets: ['EXPTIME', 'NP'], size: 60},
                {sets: ['EXPTIME', 'PSPACE', 'P'], size: 30},
                {sets: ['EXPTIME', 'NP', 'P'], size: 30},
                {sets: ['EXPTIME', 'PSPACE', 'NP', 'P'], size: 30}
            ]
        },
        {
            title: "Space Hierarchy",
            description: "L ⊆ NL ⊆ P ⊆ PSPACE",
            sets: [
                {sets: ['PSPACE'], size: 100},
                {sets: ['P'], size: 70},
                {sets: ['NL'], size: 45},
                {sets: ['L'], size: 25},
                {sets: ['PSPACE', 'P'], size: 70},
                {sets: ['P', 'NL'], size: 45},
                {sets: ['NL', 'L'], size: 25},
                {sets: ['PSPACE', 'NL'], size: 45},
                {sets: ['PSPACE', 'L'], size: 25},
                {sets: ['P', 'L'], size: 25},
                {sets: ['PSPACE', 'P', 'NL'], size: 45},
                {sets: ['P', 'NL', 'L'], size: 25},
                {sets: ['PSPACE', 'NL', 'L'], size: 25},
                {sets: ['PSPACE', 'P', 'L'], size: 25},
                {sets: ['PSPACE', 'P', 'NL', 'L'], size: 25}
            ]
        },
        {
            title: "Probabilistic Classes",
            description: "RP ⊆ BPP ⊆ P/poly",
            sets: [
                {sets: ['P/poly'], size: 80},
                {sets: ['BPP'], size: 55},
                {sets: ['RP'], size: 35},
                {sets: ['P/poly', 'BPP'], size: 55},
                {sets: ['BPP', 'RP'], size: 35},
                {sets: ['P/poly', 'RP'], size: 35},
                {sets: ['P/poly', 'BPP', 'RP'], size: 35}
            ]
        },
        {
            title: "Quantum Classes",
            description: "BQP ⊆ QMA - quantum advantage",
            sets: [
                {sets: ['QMA'], size: 100},
                {sets: ['BQP'], size: 60},
                {sets: ['QMA', 'BQP'], size: 60}
            ]
        }
    ];
}

// Draw a single Venn diagram
function drawSingleVenn(container, diagramData, width, height) {
    var svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background", "#FFFFFF")
        .style("border", "1px solid #D4E4D4")
        .style("border-radius", "8px");
    
    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("class", "venn-diagram-title")
        .style("font-size", "14px")
        .style("font-weight", "700")
        .style("fill", "#2D5016")
        .text(diagramData.title);
    
    // Add description
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 45)
        .attr("text-anchor", "middle")
        .attr("class", "venn-diagram-description")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text(diagramData.description);
    
    var chartGroup = svg.append("g");
    
    // Get only single-set elements (individual classes)
    var singleSets = diagramData.sets.filter(function(s) { return s.sets.length === 1; });
    
    // Sort by size (largest first for outer circles)
    singleSets.sort(function(a, b) { return (b.size || 0) - (a.size || 0); });
    
    // Layout parameters
    var centerX = width / 2;
    var baseRadius = Math.min(width * 0.35, 140); // Base radius for largest circle
    var radiusDecrement = 30; // How much smaller each inner circle is
    
    // Calculate the largest radius to position all circles touching at bottom
    var largestRadius = baseRadius;
    var bottomY = height - 60; // Bottom position where all circles touch
    
    // Draw concentric circles, all centered horizontally but positioned so they touch at bottom
    singleSets.forEach(function(set, index) {
        var radius = baseRadius - (index * radiusDecrement);
        var cy = bottomY - radius; // Position so bottom of circle touches bottomY
        
        var g = chartGroup.append("g")
            .attr("class", "venn-circle")
            .datum(set);
        
        // Draw circle
        g.append("circle")
            .attr("cx", centerX)
            .attr("cy", cy)
            .attr("r", radius)
            .style("fill", "#4F7942")
            .style("fill-opacity", 0.15)
            .style("stroke", "#2D5016")
            .style("stroke-width", 1.5)
            .style("stroke-opacity", 0.5);
        
        // Add label near top of circle
        g.append("text")
            .attr("x", centerX)
            .attr("y", cy - radius + 20)
            .attr("text-anchor", "middle")
            .style("fill", "#1A1A1A")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("font-family", "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
            .style("pointer-events", "none")
            .text(set.sets[0]);
    });
    
    // Add interactivity with context menu like graph view
    chartGroup.selectAll(".venn-circle")
        .on("mouseover", function(d) {
            d3.select(this).select("circle")
                .transition()
                .duration(150)
                .style("fill-opacity", 0.35)
                .style("stroke-width", 2);
        })
        .on("mouseout", function(d) {
            d3.select(this).select("circle")
                .transition()
                .duration(150)
                .style("fill-opacity", 0.15)
                .style("stroke-width", 1.5);
        })
        .on("click", function(d) {
            // Only handle single class clicks (not intersections)
            if (d.sets.length === 1) {
                var className = d.sets[0];
                console.log('Venn diagram clicked:', className);
                
                // Show context menu like in graph view
                showVennNodeMenu(d, className, d3.event.pageX, d3.event.pageY);
                
                // Prevent event bubbling
                d3.event.stopPropagation();
            }
        })
        .style("cursor", "pointer");
}

// Get selected classes from networkProcessor
function getSelectedClasses() {
    if (window.networkProcessor && typeof window.networkProcessor.getSelectedClasses === 'function') {
        return window.networkProcessor.getSelectedClasses();
    }
    return [];
}

// Get relationship between two classes based on theorems
function getRelationshipType(classA, classB) {
    if (!window.networkProcessor) {
        return 'unknown';
    }
    
    var classDataA = window.networkProcessor.getClass(classA);
    var classDataB = window.networkProcessor.getClass(classB);
    
    if (!classDataA || !classDataB) {
        return 'unknown';
    }
    
    // Check for equality (complete overlap)
    if (classDataA.equals && classDataA.equals.has(classB)) {
        return 'equal';
    }
    
    // Check for containment (one inside the other)
    if (classDataA.contains && classDataA.contains.has(classB)) {
        return 'contains'; // A ⊇ B
    }
    if (classDataA.within && classDataA.within.has(classB)) {
        return 'within'; // A ⊆ B
    }
    
    // Check for transitive containment
    if (classDataA.contains) {
        for (var intermediate of classDataA.contains) {
            var intermediateData = window.networkProcessor.getClass(intermediate);
            if (intermediateData && intermediateData.contains && intermediateData.contains.has(classB)) {
                return 'contains';
            }
        }
    }
    
    if (classDataA.within) {
        for (var intermediate of classDataA.within) {
            var intermediateData = window.networkProcessor.getClass(intermediate);
            if (intermediateData && intermediateData.within && intermediateData.within.has(classB)) {
                return 'within';
            }
        }
    }
    
    // No known relationship - they might be incomparable or disjoint
    return 'incomparable';
}

// Generate Venn data from selected classes with relationship awareness
function generateVennFromSelection() {
    var selectedClasses = getSelectedClasses();
    
    if (selectedClasses.length === 0) {
        return null;
    }
    
    // Create sets for each class
    var sets = [];
    var classNames = selectedClasses.map(function(cls) {
        return cls.id || cls.name || cls;
    });
    
    // Build relationship matrix
    var relationships = {};
    classNames.forEach(function(classA) {
        relationships[classA] = {};
        classNames.forEach(function(classB) {
            if (classA !== classB) {
                relationships[classA][classB] = getRelationshipType(classA, classB);
            }
        });
    });
    
    // Add individual sets with sizes based on hierarchy
    classNames.forEach(function(className, index) {
        var baseSize = 350;  // Increased significantly to ensure labels fit inside
        // Adjust size based on relationships - larger classes get bigger circles
        var containsCount = 0;
        var withinCount = 0;
        classNames.forEach(function(otherClass) {
            if (className !== otherClass) {
                var rel = relationships[className][otherClass];
                if (rel === 'contains') containsCount++;
                if (rel === 'within') withinCount++;
            }
        });
        
        // Classes that contain more should be larger
        var size = baseSize + (containsCount * 50) - (withinCount * 40);
        
        sets.push({
            sets: [className],
            size: Math.max(200, size),  // Ensure minimum size so all classes are visible
            label: className
        });
    });
    
    // Add intersections based on actual relationships
    if (classNames.length >= 2) {
        // Two-way intersections - only if there's a known relationship
        for (var i = 0; i < classNames.length; i++) {
            for (var j = i + 1; j < classNames.length; j++) {
                var rel = relationships[classNames[i]][classNames[j]];
                var reverseRel = relationships[classNames[j]][classNames[i]];
                
                var intersectionSize = 0;
                
                if (rel === 'equal') {
                    // Complete overlap for equal classes
                    var sizeA = sets.find(function(s) { return s.sets.length === 1 && s.sets[0] === classNames[i]; }).size;
                    var sizeB = sets.find(function(s) { return s.sets.length === 1 && s.sets[0] === classNames[j]; }).size;
                    intersectionSize = Math.min(sizeA, sizeB);
                } else if (rel === 'contains') {
                    // i contains j, so intersection is size of j
                    intersectionSize = sets.find(function(s) { return s.sets.length === 1 && s.sets[0] === classNames[j]; }).size;
                } else if (rel === 'within') {
                    // i within j, so intersection is size of i
                    intersectionSize = sets.find(function(s) { return s.sets.length === 1 && s.sets[0] === classNames[i]; }).size;
                } else if (rel === 'incomparable') {
                    // Incomparable: minimal overlap
                    // Special case: NP vs BQP only overlap at P (minimal known intersection)
                    var sizeA = sets.find(function(s) { return s.sets.length === 1 && s.sets[0] === classNames[i]; }).size;
                    var sizeB = sets.find(function(s) { return s.sets.length === 1 && s.sets[0] === classNames[j]; }).size;
                    
                    // Very small overlap representing only known common ground (e.g., P)
                    intersectionSize = Math.min(sizeA, sizeB) * 0.15;  // Reduced from 0.3 to show minimal overlap
                }
                
                if (intersectionSize > 0) {
                    sets.push({
                        sets: [classNames[i], classNames[j]],
                        size: intersectionSize
                    });
                }
            }
        }
    }
    
    if (classNames.length >= 3) {
        // Three-way intersections - only if relationships support it
        for (var i = 0; i < classNames.length; i++) {
            for (var j = i + 1; j < classNames.length; j++) {
                for (var k = j + 1; k < classNames.length; k++) {
                    // Check if all three have some relationship
                    var rel_ij = relationships[classNames[i]][classNames[j]];
                    var rel_ik = relationships[classNames[i]][classNames[k]];
                    var rel_jk = relationships[classNames[j]][classNames[k]];
                    
                    // Only add if there's actual overlap among all three
                    if (rel_ij !== 'incomparable' || rel_ik !== 'incomparable' || rel_jk !== 'incomparable') {
                        var sizeA = sets.find(function(s) { return s.sets.length === 1 && s.sets[0] === classNames[i]; }).size;
                        var sizeB = sets.find(function(s) { return s.sets.length === 1 && s.sets[0] === classNames[j]; }).size;
                        var sizeC = sets.find(function(s) { return s.sets.length === 1 && s.sets[0] === classNames[k]; }).size;
                        
                        sets.push({
                            sets: [classNames[i], classNames[j], classNames[k]],
                            size: Math.min(sizeA, sizeB, sizeC) * 0.3
                        });
                    }
                }
            }
        }
    }
    
    if (classNames.length >= 4) {
        // Four-way intersection - only if they're all related
        var allRelated = true;
        for (var i = 0; i < 4; i++) {
            for (var j = i + 1; j < 4; j++) {
                var rel = relationships[classNames[i]][classNames[j]];
                if (rel === 'incomparable') {
                    allRelated = false;
                    break;
                }
            }
            if (!allRelated) break;
        }
        
        if (allRelated) {
            sets.push({
                sets: classNames.slice(0, 4),
                size: 15
            });
        }
    }
    
    return {sets: sets, relationships: relationships};
}

// Draw separate individual relationship diagrams like in the first image
function drawSeparateRelationshipDiagrams(container, selectedData, containerWidth, containerHeight) {
    console.log('drawSeparateRelationshipDiagrams called with:', selectedData);
    
    // Get individual classes
    var classNames = selectedData
        .filter(function(d) { return d.sets.length === 1; })
        .map(function(d) { return d.sets[0]; });
    
    console.log('Individual classes found:', classNames);
    
    if (classNames.length < 2) {
        // If less than 2 classes, show a single diagram
        drawSingleClassDiagram(container, classNames[0] || "No Classes", containerWidth, containerHeight);
        return;
    }
    
    // Create one unified diagram showing all relationships in concentric circles
    drawUnifiedRelationshipDiagram(container, classNames, containerWidth, containerHeight);
}

// Draw unified relationship diagram with all classes in concentric circles
function drawUnifiedRelationshipDiagram(container, classNames, containerWidth, containerHeight) {
    // Define the complexity class hierarchy for proper ordering
    var hierarchy = ['P', 'BQP', 'NP', 'PSPACE', 'EXPTIME'];
    
    // Sort selected classes by hierarchy (innermost to outermost)
    var sortedClasses = classNames.filter(function(className) {
        return hierarchy.includes(className);
    }).sort(function(a, b) {
        return hierarchy.indexOf(a) - hierarchy.indexOf(b);
    });
    
    // Add any classes not in hierarchy at the end
    classNames.forEach(function(className) {
        if (!hierarchy.includes(className)) {
            sortedClasses.push(className);
        }
    });
    
    console.log('Sorted classes for unified diagram:', sortedClasses);
    
    // Create the main container
    var mainContainer = container.append("div")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("padding", "40px")
        .style("max-width", "500px")
        .style("margin", "0 auto");
    
    // Add title
    mainContainer.append("h2")
        .style("color", "#2D5016")
        .style("margin", "0 0 10px 0")
        .style("font-size", "24px")
        .style("font-weight", "600")
        .style("text-align", "center")
        .text("Complexity Class Relationships");
    
    // Add subtitle
    mainContainer.append("p")
        .style("color", "#666")
        .style("margin", "0 0 30px 0")
        .style("font-size", "14px")
        .style("text-align", "center")
        .text("Concentric circles showing containment relationships");
    
    // Create the diagram container with exact styling from the image
    var diagramContainer = mainContainer.append("div")
        .style("background", "#FFFFFF")
        .style("border", "3px solid #8A2BE2")
        .style("width", "400px")
        .style("height", "400px")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("position", "relative");
    
    // Create SVG that fills the container exactly
    var svgSize = 400;
    var svg = diagramContainer.append("svg")
        .attr("width", svgSize)
        .attr("height", svgSize)
        .style("display", "block");
    
    // Define gradient exactly like in the image
    var defs = svg.append("defs");
    
    // Create linear gradient from blue to purple like in the image
    var gradient = defs.append("linearGradient")
        .attr("id", "circleGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
    
    gradient.append("stop")
        .attr("offset", "0%")
        .style("stop-color", "#4169E1")
        .style("stop-opacity", 1);
        
    gradient.append("stop")
        .attr("offset", "100%")
        .style("stop-color", "#8A2BE2")
        .style("stop-opacity", 1);
    
    var centerX = svgSize / 2;
    var centerY = svgSize / 2;
    
    // Calculate radii to match the image - evenly spaced concentric circles
    // All circles should touch the bottom of the container
    var maxRadius = 180; // Largest circle touches bottom
    var minRadius = 40;
    var numCircles = Math.max(sortedClasses.length, 4); // Ensure at least 4 circles like in image
    
    // Create evenly spaced radii like in the image
    var radii = [];
    for (var i = 0; i < numCircles; i++) {
        var radius = maxRadius - (i * (maxRadius - minRadius) / (numCircles - 1));
        radii.push(radius);
    }
    
    // Position circles so they all touch the bottom edge (like in the image)
    var bottomY = svgSize - 20; // Bottom edge of the container with small margin
    
    // Draw concentric circles from outermost to innermost (exactly like in the image)
    radii.forEach(function(radius, index) {
        var className = sortedClasses[numCircles - 1 - index] || 'Class ' + (index + 1);
        
        // Calculate center Y so circle touches bottom
        var circleCenterY = bottomY - radius;
        
        // Create circle with gradient stroke exactly like in the image
        var circle = svg.append("circle")
            .attr("cx", centerX)
            .attr("cy", circleCenterY)
            .attr("r", radius)
            .style("fill", "none")
            .style("stroke", "url(#circleGradient)")
            .style("stroke-width", 5)
            .style("opacity", 1)
            .style("cursor", "pointer")
            .on("mouseover", function() {
                d3.select(this)
                    .style("stroke-width", 7)
                    .style("opacity", 1);
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("stroke-width", 5)
                    .style("opacity", 1);
            })
            .on("click", function() {
                var className = sortedClasses[numCircles - 1 - index];
                if (className && window.networkProcessor && typeof window.networkProcessor.getClass === 'function') {
                    var classData = window.networkProcessor.getClass(className);
                    if (classData) {
                        // Show context menu like in graph view
                        showVennNodeMenu({sets: [className]}, className, d3.event.pageX, d3.event.pageY);
                        
                        // Prevent event bubbling
                        d3.event.stopPropagation();
                    }
                }
            });
        
        // Add class labels positioned strategically
        if (sortedClasses[numCircles - 1 - index]) {
            var labelX, labelY;
            
            // Position labels based on circle size and new positioning
            if (index === 0) { // Outermost circle
                labelX = centerX;
                labelY = circleCenterY - radius + 25;
            } else if (index === radii.length - 1) { // Innermost circle  
                labelX = centerX;
                labelY = circleCenterY;
            } else { // Middle circles
                var angle = -Math.PI / 3; // Upper left position
                labelX = centerX + (radius - 30) * Math.cos(angle);
                labelY = circleCenterY + (radius - 30) * Math.sin(angle);
            }
            
            svg.append("text")
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .style("fill", "#2D5016")
                .style("font-size", "16px")
                .style("font-weight", "700")
                .style("pointer-events", "none")
                .style("text-shadow", "2px 2px 4px rgba(255,255,255,0.8)")
                .text(className);
        }
    });
    
    // Add a legend below the diagram
    var legendContainer = mainContainer.append("div")
        .style("margin-top", "20px")
        .style("font-size", "12px")
        .style("color", "#666")
        .style("text-align", "center")
        .style("max-width", "400px");
    
    legendContainer.append("p")
        .style("margin", "5px 0")
        .text("Each circle contains all the complexity classes inside it");
        
    legendContainer.append("p")
        .style("margin", "5px 0")
        .style("font-style", "italic")
        .text("Click on any circle to learn more about that complexity class");
}

// Draw single class diagram when only one class is selected
function drawSingleClassDiagram(container, className, containerWidth, containerHeight) {
    var svg = container.append("svg")
        .attr("width", Math.min(containerWidth * 0.6, 400))
        .attr("height", Math.min(containerHeight * 0.6, 400))
        .style("display", "block")
        .style("margin", "20px auto")
        .style("border", "1px solid #D4E4D4")
        .style("border-radius", "8px")
        .style("background", "#FFFFFF");
    
    var centerX = svg.attr("width") / 2;
    var centerY = svg.attr("height") / 2;
    var radius = Math.min(centerX, centerY) * 0.6;
    
    // Draw circle
    svg.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", radius)
        .style("fill", "#4F7942")
        .style("fill-opacity", 0.2)
        .style("stroke", "#2D5016")
        .style("stroke-width", 3);
    
    // Add label
    svg.append("text")
        .attr("x", centerX)
        .attr("y", centerY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("fill", "#1A1A1A")
        .style("font-size", "18px")
        .style("font-weight", "600")
        .text(className);
}

// Draw all Venn diagrams in a grid
function drawVennDiagram(container_width, container_height) {
    if (vennDrawn) {
        return;
    }
    
    var container = d3.select("#vennDiagram");
    container.selectAll("*").remove();
    
    // Use full viewport dimensions
    var width = container_width || window.innerWidth;
    var height = container_height || (window.innerHeight - 56);
    
    // Check if there are selected classes
    var selectedVennDataObj = generateVennFromSelection();
    
    if (selectedVennDataObj && selectedVennDataObj.sets && selectedVennDataObj.sets.length > 0) {
        // Draw single Venn diagram for selected classes
        var mainDiv = container.append("div")
            .style("width", "100%")
            .style("height", "100%")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("padding", "20px 40px")
            .style("box-sizing", "border-box")
            .style("overflow-y", "auto");
        
        var headerContainer = mainDiv.append("div")
            .style("text-align", "center")
            .style("margin-bottom", "20px")
            .style("width", "100%");
        
        headerContainer.append("h2")
            .style("color", "#2D5016")
            .style("margin", "0 0 10px 0")
            .style("font-size", "28px")
            .style("font-weight", "600")
            .text("Selected Complexity Classes");
        
        headerContainer.append("p")
            .style("color", "#666")
            .style("margin", "0")
            .style("font-size", "15px")
            .style("line-height", "1.5")
            .text("Venn diagram showing actual relationships from theorems");
        
        // Create centered SVG container with proper sizing
        var svgWidth = Math.min(width * 0.95, 1600);  // Even larger canvas
        var svgHeight = Math.min(height * 0.85, 1200);
        
        var svgContainer = mainDiv.append("div")
            .style("width", "100%")
            .style("display", "flex")
            .style("justify-content", "center")
            .style("align-items", "center")
            .style("margin-bottom", "20px");
        
        var svg = svgContainer.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .attr("viewBox", "0 0 " + svgWidth + " " + svgHeight)
            .style("background", "#FFFFFF")
            .style("border", "2px solid #D4E4D4")
            .style("border-radius", "12px")
            .style("box-shadow", "0 4px 12px rgba(79, 121, 66, 0.15)")
            .style("display", "block");
        
        var chartGroup = svg.append("g")
            .attr("transform", "translate(80, 80)");  // Centered with less padding for more space
        
        // Create venn diagram using venn.js
        try {
            console.log('About to create Venn diagram with data:', selectedVennDataObj.sets);
            
            var chart = venn.VennDiagram()
                .width(svgWidth - 160)  // Less padding = bigger circles
                .height(svgHeight - 160)
                .padding(15);  // More padding between circles for better readability
            
            console.log('Calling venn diagram chart...');
            chartGroup.datum(selectedVennDataObj.sets).call(chart);
            console.log('Venn diagram created successfully');
            
            // Style the circles with different colors based on relationship type
            chartGroup.selectAll(".venn-circle path")
                .style("fill-opacity", 0.18)
                .style("stroke-width", 2)  // Clean, professional thickness
                .style("stroke", "#4F7942")
                .style("stroke-opacity", 0.7);
            
            // Hide intersections by making them invisible
            chartGroup.selectAll("g")
                .each(function(d) {
                    if (d.sets.length > 1) {
                        // This is an intersection - make it invisible
                        d3.select(this).select("path")
                            .style("fill", "transparent")
                            .style("fill-opacity", 0)
                            .style("stroke", "none")
                            .style("pointer-events", "none");  // Don't capture mouse events
                    } else {
                        // Individual circle
                        d3.select(this).select("path")
                            .style("fill", "#4F7942");
                    }
                });
            
            // Add interactivity with educational tooltips
            chartGroup.selectAll("g")
                .on("mouseover", function(d, i) {
                    // Skip hover effects for intersections (they're invisible)
                    if (d.sets.length > 1) return;
                    
                    d3.select(this).select("path")
                        .transition()
                        .duration(200)
                        .style("fill-opacity", 0.4)
                        .style("stroke-width", 3);
                    
                    // Show tooltip for individual circles only
                    var tooltipText = d.sets[0] + ": Click to expand or view description";
                    
                    // Create tooltip
                    var tooltip = d3.select("body").append("div")
                        .attr("class", "venn-tooltip")
                        .style("position", "absolute")
                        .style("background", "rgba(45, 80, 22, 0.95)")
                        .style("color", "white")
                        .style("padding", "10px 15px")
                        .style("border-radius", "6px")
                        .style("font-size", "13px")
                        .style("pointer-events", "none")
                        .style("z-index", "10000")
                        .style("max-width", "300px")
                        .style("left", d3.event.pageX + 15 + "px")
                        .style("top", d3.event.pageY + 15 + "px")
                        .text(tooltipText);
                })
                .on("mouseout", function(d, i) {
                    d3.select(this).select("path")
                        .transition()
                        .duration(200)
                        .style("fill-opacity", d.sets.length > 1 ? 0 : 0.18)  // Keep intersections invisible
                        .style("stroke-width", 2);
                    
                    // Remove tooltip
                    d3.selectAll(".venn-tooltip").remove();
                })
                .on("mousemove", function() {
                    // Move tooltip with mouse
                    d3.selectAll(".venn-tooltip")
                        .style("left", d3.event.pageX + 15 + "px")
                        .style("top", d3.event.pageY + 15 + "px");
                })
                .on("click", function(d, i) {
                    if (d.sets.length === 1) {
                        var className = d.sets[0];
                        showVennContextMenu(className, d3.event.pageX, d3.event.pageY);
                        d3.event.stopPropagation();
                    } else if (d.sets.length > 1) {
                        // Clicked on intersection - show info about the intersection
                        var intersectionInfo = 'Intersection of: ' + d.sets.join(', ');
                        console.log(intersectionInfo);
                    }
                });
            
            // Style text labels - ensure they stay inside circles
            chartGroup.selectAll("text")
                .style("fill", "#2D5016")
                .style("font-size", function(d) {
                    // Smaller font for longer names
                    var maxLen = Math.max.apply(null, d.sets.map(function(s) { return s.length; }));
                    return maxLen > 6 ? "16px" : "18px";
                })
                .style("font-weight", "700")
                .style("pointer-events", "none")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .each(function(d) {
                    // Only show label for individual sets, not intersections
                    if (d.sets.length > 1) {
                        d3.select(this).style("display", "none");
                    }
                });
                
        } catch (error) {
            console.error('Error drawing Venn diagram:', error);
            mainDiv.append("p")
                .style("color", "#CC0000")
                .style("text-align", "center")
                .style("margin-top", "20px")
                .text("Error: " + error.message + ". Try selecting different classes.");
        }
        
    } else {
        // No classes selected - show the grid of example diagrams
        var mainDiv = container.append("div")
            .style("width", "100%")
            .style("height", "100%")
            .style("overflow-y", "auto")
            .style("padding", "20px")
            .style("box-sizing", "border-box");
        
        mainDiv.append("h2")
            .style("text-align", "center")
            .style("color", "#2D5016")
            .style("margin-bottom", "10px")
            .style("font-size", "24px")
            .text("Complexity Class Relationships");
        
        mainDiv.append("p")
            .style("text-align", "center")
            .style("color", "#666")
            .style("margin-bottom", "10px")
            .style("font-size", "14px")
            .text("Select classes using the search bar to see their Venn diagram");
        
        mainDiv.append("p")
            .style("text-align", "center")
            .style("color", "#999")
            .style("margin-bottom", "30px")
            .style("font-size", "12px")
            .style("font-style", "italic")
            .text("Or explore these example relationships:");
        
        // Create grid container for examples
        var gridContainer = mainDiv.append("div")
            .style("display", "grid")
            .style("grid-template-columns", "repeat(auto-fit, minmax(350px, 1fr))")
            .style("gap", "20px")
            .style("max-width", "1400px")
            .style("margin", "0 auto");
        
        // Get all diagram configurations
        var diagrams = getVennDiagrams();
        
        // Calculate individual diagram size
        var diagramWidth = 350;
        var diagramHeight = 300;
        
        // Draw each diagram
        diagrams.forEach(function(diagramData) {
            var diagramContainer = gridContainer.append("div")
                .style("background", "#FFFFFF")
                .style("border-radius", "8px")
                .style("box-shadow", "0 2px 8px rgba(79, 121, 66, 0.1)")
                .style("overflow", "hidden");
            
            drawSingleVenn(diagramContainer, diagramData, diagramWidth, diagramHeight);
        });
    }
    
    vennDrawn = true;
}

// Resize venn diagram when window is resized
function resizeVennDiagram() {
    if (!vennDrawn) return;
    
    vennDrawn = false;
    drawVennDiagram(window.innerWidth, window.innerHeight - 56);
}

// Toggle between graph and venn diagram views
function toggleVennView() {
    console.log('toggleVennView called');
    
    var graphContainer = d3.select("#center");
    var vennContainer = d3.select("#vennDiagram");
    var toggleBtn = d3.select("#vennToggleBtn");
    
    console.log('Containers:', graphContainer.node(), vennContainer.node());
    
    var isVennVisible = vennContainer.style("display") !== "none";
    console.log('isVennVisible:', isVennVisible);
    
    if (isVennVisible) {
        // Switch to graph view
        vennContainer.style("display", "none");
        graphContainer.style("display", "block");
        toggleBtn.html('<i class="fa fa-circle-o"></i> Venn View');
    } else {
        // Switch to venn view
        graphContainer.style("display", "none");
        vennContainer.style("display", "block");
        toggleBtn.html('<i class="fa fa-project-diagram"></i> Graph View');
        
        // Draw venn diagram if not already drawn
        try {
            if (!vennDrawn) {
                console.log('Calling drawVennDiagram...');
                drawVennDiagram(window.innerWidth, window.innerHeight - 56);
                console.log('drawVennDiagram completed');
            }
        } catch (error) {
            console.error('Error in drawVennDiagram:', error);
            alert('Error loading Venn diagram: ' + error.message);
        }
    }
}

// Show related classes and their Venn diagrams
function showRelatedClassesVenn(className) {
    console.log('Showing related classes for:', className);
    
    // Get the class data
    if (!window.networkProcessor || typeof window.networkProcessor.getClass !== 'function') {
        console.error('networkProcessor not available');
        return;
    }
    
    var classData = window.networkProcessor.getClass(className);
    if (!classData) {
        console.error('Class not found:', className);
        return;
    }
    
    // Get all related classes
    var relatedClasses = getRelatedClasses(className);
    console.log('Related classes:', relatedClasses);
    
    if (relatedClasses.length === 0) {
        alert('No related classes found for ' + className);
        return;
    }
    
    // Redraw with related classes view
    vennDrawn = false;
    drawRelatedClassesView(className, relatedClasses);
}

// Get all classes related to the given class
function getRelatedClasses(className) {
    var related = [];
    
    // If there are currently selected classes, use those
    var selectedClasses = getSelectedClasses();
    if (selectedClasses.length > 0) {
        selectedClasses.forEach(function(cls) {
            var clsId = cls.id || cls.name || cls;
            if (clsId !== className) {
                related.push(clsId);
            }
        });
        return related;
    }
    
    // Otherwise, try to find relationships from networkProcessor
    if (!window.networkProcessor) return related;
    
    var classData = window.networkProcessor.getClass(className);
    if (!classData) return related;
    
    // Get all classes from networkProcessor
    var allClasses = window.networkProcessor.classes || {};
    
    // Find classes that have relationships with the target class
    Object.keys(allClasses).forEach(function(key) {
        var cls = allClasses[key];
        var clsId = cls.id || cls.name;
        
        if (clsId === className) return; // Skip self
        
        // Check if there's a relationship
        var hasRelation = false;
        
        // Check containment relationships
        if (cls.contains && cls.contains.includes(className)) hasRelation = true;
        if (cls.containedBy && cls.containedBy.includes(className)) hasRelation = true;
        if (classData.contains && classData.contains.includes(clsId)) hasRelation = true;
        if (classData.containedBy && classData.containedBy.includes(clsId)) hasRelation = true;
        
        // Also check if the class is in the current graph
        if (window.networkProcessor.isClassSelected && window.networkProcessor.isClassSelected(clsId)) {
            hasRelation = true;
        }
        
        if (hasRelation) {
            related.push(clsId);
        }
    });
    
    return related;
}

// Draw the related classes view with multiple Venn diagrams
function drawRelatedClassesView(centerClass, relatedClasses) {
    var container = d3.select("#vennDiagram");
    container.selectAll("*").remove();
    
    var width = window.innerWidth;
    var height = window.innerHeight - 56;
    
    // Create main container
    var mainDiv = container.append("div")
        .style("width", "100%")
        .style("height", "100%")
        .style("overflow-y", "auto")
        .style("padding", "20px")
        .style("box-sizing", "border-box");
    
    // Add back button
    var headerDiv = mainDiv.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "20px");
    
    headerDiv.append("button")
        .style("background", "rgba(79, 121, 66, 0.1)")
        .style("border", "1px solid #4F7942")
        .style("color", "#2D5016")
        .style("padding", "0.5rem 1rem")
        .style("border-radius", "0.375rem")
        .style("cursor", "pointer")
        .style("font-size", "14px")
        .style("margin-right", "20px")
        .text("← Back to Selection")
        .on("click", function() {
            vennDrawn = false;
            drawVennDiagram();
        });
    
    // Add header
    headerDiv.append("h2")
        .style("color", "#2D5016")
        .style("font-size", "24px")
        .style("margin", "0")
        .text("Classes Related to " + centerClass);
    
    mainDiv.append("p")
        .style("text-align", "center")
        .style("color", "#666")
        .style("margin-bottom", "30px")
        .style("font-size", "14px")
        .text("Showing " + relatedClasses.length + " related class" + (relatedClasses.length !== 1 ? "es" : ""));
    
    // Create grid container
    var gridContainer = mainDiv.append("div")
        .style("display", "grid")
        .style("grid-template-columns", "repeat(auto-fit, minmax(350px, 1fr))")
        .style("gap", "20px")
        .style("max-width", "1400px")
        .style("margin", "0 auto");
    
    // Create a Venn diagram for each related class
    relatedClasses.forEach(function(relatedClass) {
        var diagramData = {
            title: centerClass + " & " + relatedClass,
            description: "Relationship between these classes",
            sets: generatePairVennData(centerClass, relatedClass)
        };
        
        var diagramContainer = gridContainer.append("div")
            .style("background", "#FFFFFF")
            .style("border-radius", "8px")
            .style("box-shadow", "0 2px 8px rgba(79, 121, 66, 0.1)")
            .style("overflow", "hidden");
        
        drawSingleVenn(diagramContainer, diagramData, 350, 300);
    });
    
    vennDrawn = true;
}

// Generate Venn data for a pair of classes
function generatePairVennData(class1, class2) {
    return [
        {sets: [class1], size: 80},
        {sets: [class2], size: 80},
        {sets: [class1, class2], size: 40}
    ];
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Don't auto-draw, wait for user to toggle
    console.log("Venn diagram module loaded");
});

// ===== Context Menu System for Venn Diagrams =====
var vennContextMenuDiv = null;

function hideVennContextMenu() {
    if (vennContextMenuDiv) {
        vennContextMenuDiv.remove();
        vennContextMenuDiv = null;
    }
    // Remove click listener
    d3.select("body").on("click.venn-context", null);
}

function showVennContextMenu(className, pageX, pageY) {
    // Close any existing menu
    hideVennContextMenu();
    
    // Get class data
    var classData = null;
    if (window.networkProcessor && typeof window.networkProcessor.getClass === 'function') {
        classData = window.networkProcessor.getClass(className);
    }
    
    if (!classData) {
        console.error('Class data not found for:', className);
        return;
    }
    
    // Create context menu
    vennContextMenuDiv = d3.select("body").append("div")
        .attr("class", "venn-context-menu")
        .style("position", "absolute")
        .style("left", pageX + "px")
        .style("top", pageY + "px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "8px")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
        .style("padding", "8px 0")
        .style("min-width", "180px")
        .style("z-index", "10000")
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "14px");
    
    // Add title
    vennContextMenuDiv.append("div")
        .style("padding", "8px 16px")
        .style("font-weight", "600")
        .style("color", "#2D5016")
        .style("border-bottom", "1px solid #eee")
        .style("margin-bottom", "4px")
        .text(className);
    
    // Expand option
    var expandOption = vennContextMenuDiv.append("div")
        .attr("class", "menu-option")
        .style("padding", "8px 16px")
        .style("cursor", "pointer")
        .style("transition", "background 0.2s")
        .on("mouseover", function() {
            d3.select(this).style("background", "#f0f0f0");
        })
        .on("mouseout", function() {
            d3.select(this).style("background", "white");
        })
        .on("click", function() {
            expandVennClass(className);
            hideVennContextMenu();
        });
    
    expandOption.append("span")
        .style("margin-right", "8px")
        .text("");
    expandOption.append("span")
        .text("Expand");
    
    // Description option
    var descOption = vennContextMenuDiv.append("div")
        .attr("class", "menu-option")
        .style("padding", "8px 16px")
        .style("cursor", "pointer")
        .style("transition", "background 0.2s")
        .on("mouseover", function() {
            d3.select(this).style("background", "#f0f0f0");
        })
        .on("mouseout", function() {
            d3.select(this).style("background", "white");
        })
        .on("click", function() {
            showVennClassDescription(className);
            hideVennContextMenu();
        });
    
    descOption.append("span")
        .style("margin-right", "8px")
        .text("");
    descOption.append("span")
        .text("Description");
    
    // Remove option
    var removeOption = vennContextMenuDiv.append("div")
        .attr("class", "menu-option")
        .style("padding", "8px 16px")
        .style("cursor", "pointer")
        .style("transition", "background 0.2s")
        .style("border-top", "1px solid #eee")
        .style("margin-top", "4px")
        .on("mouseover", function() {
            d3.select(this).style("background", "#ffebee");
        })
        .on("mouseout", function() {
            d3.select(this).style("background", "white");
        })
        .on("click", function() {
            removeVennClass(className);
            hideVennContextMenu();
        });
    
    removeOption.append("span")
        .style("margin-right", "8px")
        .style("color", "#d32f2f")
        .text("");
    removeOption.append("span")
        .style("color", "#d32f2f")
        .text("Remove");
    
    // Close menu when clicking outside
    setTimeout(function() {
        d3.select("body").on("click.venn-context", function() {
            hideVennContextMenu();
        });
    }, 10);
    
    // Prevent the menu from going off-screen
    var menuNode = vennContextMenuDiv.node();
    var menuRect = menuNode.getBoundingClientRect();
    
    if (menuRect.right > window.innerWidth) {
        vennContextMenuDiv.style("left", (pageX - menuRect.width) + "px");
    }
    if (menuRect.bottom > window.innerHeight) {
        vennContextMenuDiv.style("top", (pageY - menuRect.height) + "px");
    }
}

// Expand a class to show related classes (comprehensive like graph view)
function expandVennClass(className) {
    console.log('Expanding class:', className);
    
    if (!window.networkProcessor) return;
    
    var classData = window.networkProcessor.getClass(className);
    if (!classData) return;
    
    // Custom single-node expansions for specific classes
    var customExpansions = {
        'PSPACE': 'QEPH',
        'NP': 'co_CP',
        'P': 'LOSSY',
        'BQP': 'QCMA'
    };
    
    // Check if this class has a custom expansion
    if (customExpansions[className]) {
        var targetClass = customExpansions[className];
        
        // Check if the target class exists
        if (window.networkProcessor.getClass(targetClass)) {
            // Add the single class
            if (window.networkProcessor.selectClass) {
                window.networkProcessor.selectClass(targetClass);
            }
            
            // Redraw Venn diagram
            vennDrawn = false;
            drawVennDiagram();
            
            // Show success message
            showExpandMessage(className, 'Added ' + targetClass);
            return;
        } else {
            alert('Class "' + targetClass + '" not found in the data.');
            return;
        }
    }
    
    // Default behavior: Add just ONE related class (prevents clutter)
    var targetClass = null;
    
    // Try to find one good class to add - prefer smaller classes (contained) over larger ones
    if (classData.contains && classData.contains.length > 0) {
        // Add the first contained class (smaller complexity class)
        targetClass = Array.from(classData.contains)[0];
    } else if (classData.within && classData.within.length > 0) {
        // If no contained classes, add the first containing class (larger complexity class)
        targetClass = Array.from(classData.within)[0];
    }
    
    if (!targetClass) {
        var msg = 'No additional classes to expand for ' + className;
        if (classData.equals && classData.equals.size > 0) {
            msg += '.\n\nNote: This class has ' + classData.equals.size + ' equivalent name(s): ' + 
                   Array.from(classData.equals).join(', ') + 
                   '\n(These represent the same complexity class, so they are not added separately)';
        }
        alert(msg);
        return;
    }
    
    // Add the single class
    if (window.networkProcessor.selectClass) {
        window.networkProcessor.selectClass(targetClass);
    }
    
    // Redraw Venn diagram
    vennDrawn = false;
    drawVennDiagram();
    
    // Show success message
    showExpandMessage(className, 'Added ' + targetClass);
}

// Show dialog for selecting which classes to add
function showExpandDialog(className, relatedClasses) {
    // Create overlay
    var overlay = d3.select('body').append('div')
        .style('position', 'fixed')
        .style('top', '0')
        .style('left', '0')
        .style('width', '100%')
        .style('height', '100%')
        .style('background', 'rgba(0,0,0,0.5)')
        .style('z-index', '9998')
        .on('click', function() {
            overlay.remove();
            dialog.remove();
        });
    
    // Create dialog
    var dialog = d3.select('body').append('div')
        .style('position', 'fixed')
        .style('top', '50%')
        .style('left', '50%')
        .style('transform', 'translate(-50%, -50%)')
        .style('background', 'white')
        .style('padding', '30px')
        .style('border-radius', '12px')
        .style('box-shadow', '0 8px 32px rgba(0,0,0,0.3)')
        .style('max-width', '600px')
        .style('max-height', '80vh')
        .style('overflow-y', 'auto')
        .style('z-index', '9999');
    
    dialog.append('h3')
        .style('margin', '0 0 10px 0')
        .style('color', '#2D5016')
        .style('font-size', '20px')
        .text('Expand ' + className);
    
    dialog.append('p')
        .style('margin', '0 0 20px 0')
        .style('color', '#666')
        .style('font-size', '14px')
        .html('Select related classes to add to the Venn diagram:<br><small>💡 Tip: Select 2-4 classes for best readability</small>');
    
    // Add "Select All" and "Clear All" buttons
    var selectButtonsDiv = dialog.append('div')
        .style('margin-bottom', '15px')
        .style('display', 'flex')
        .style('gap', '10px');
    
    selectButtonsDiv.append('button')
        .style('padding', '6px 12px')
        .style('background', '#E8F5E9')
        .style('color', '#2E7D32')
        .style('border', '1px solid #4CAF50')
        .style('border-radius', '4px')
        .style('cursor', 'pointer')
        .style('font-size', '12px')
        .text('✓ Select All')
        .on('click', function() {
            dialog.selectAll('input[type=checkbox]').property('checked', true);
        });
    
    selectButtonsDiv.append('button')
        .style('padding', '6px 12px')
        .style('background', '#FFEBEE')
        .style('color', '#C62828')
        .style('border', '1px solid #EF5350')
        .style('border-radius', '4px')
        .style('cursor', 'pointer')
        .style('font-size', '12px')
        .text('✗ Clear All')
        .on('click', function() {
            dialog.selectAll('input[type=checkbox]').property('checked', false);
        });
    
    // Add checkboxes for each related class
    relatedClasses.forEach(function(rel) {
        // Check if this is a header
        if (rel.header) {
            dialog.append('div')
                .style('margin-top', '15px')
                .style('margin-bottom', '8px')
                .style('font-weight', '700')
                .style('color', '#4F7942')
                .style('font-size', '14px')
                .style('border-bottom', '2px solid #E0E0E0')
                .style('padding-bottom', '5px')
                .text(rel.text);
            return;
        }
        
        var label = dialog.append('label')
            .style('display', 'block')
            .style('padding', '10px')
            .style('margin', '5px 0')
            .style('background', '#f8f9fa')
            .style('border-radius', '6px')
            .style('cursor', 'pointer')
            .style('transition', 'background 0.2s')
            .on('mouseover', function() {
                d3.select(this).style('background', '#e9ecef');
            })
            .on('mouseout', function() {
                d3.select(this).style('background', '#f8f9fa');
            });
        
        label.append('input')
            .attr('type', 'checkbox')
            .attr('value', rel.name)
            .style('margin-right', '10px');
        
        label.append('span')
            .style('font-weight', '600')
            .style('font-size', '14px')
            .text(rel.name);
        
        label.append('span')
            .style('margin-left', '10px')
            .style('color', '#666')
            .style('font-size', '12px')
            .text(rel.label);
    });
    
    // Add buttons
    var buttonContainer = dialog.append('div')
        .style('margin-top', '20px')
        .style('display', 'flex')
        .style('gap', '10px')
        .style('justify-content', 'flex-end');
    
    buttonContainer.append('button')
        .style('padding', '10px 20px')
        .style('background', '#6c757d')
        .style('color', 'white')
        .style('border', 'none')
        .style('border-radius', '6px')
        .style('cursor', 'pointer')
        .style('font-size', '14px')
        .text('Cancel')
        .on('click', function() {
            overlay.remove();
            dialog.remove();
        });
    
    buttonContainer.append('button')
        .style('padding', '10px 20px')
        .style('background', '#4F7942')
        .style('color', 'white')
        .style('border', 'none')
        .style('border-radius', '6px')
        .style('cursor', 'pointer')
        .style('font-size', '14px')
        .text('Add Selected')
        .on('click', function() {
            var selected = [];
            dialog.selectAll('input[type=checkbox]:checked').each(function() {
                selected.push(d3.select(this).attr('value'));
            });
            
            if (selected.length === 0) {
                alert('Please select at least one class to add.');
                return;
            }
            
            if (selected.length > 6) {
                if (!confirm('You selected ' + selected.length + ' classes. This may make the Venn diagram hard to read. Continue anyway?')) {
                    return;
                }
            }
            
            // Add selected classes
            if (window.networkProcessor.selectClass) {
                selected.forEach(function(cls) {
                    window.networkProcessor.selectClass(cls);
                });
                
                // Redraw Venn diagram
                vennDrawn = false;
                drawVennDiagram();
            }
            
            overlay.remove();
            dialog.remove();
        });
}

// Show class description
function showVennClassDescription(className) {
    console.log('Showing description for:', className);
    
    if (!window.networkProcessor) return;
    
    var classData = window.networkProcessor.getClass(className);
    if (!classData) return;
    
    // Check if there's a sidebar we can open
    if (window.populateClassDescriptionSidebar) {
        window.populateClassDescriptionSidebar(className);
        // Open the right sidebar
        d3.select("#openRightSidebarMenu").property("checked", true);
    } else {
        // Fallback: show description in an alert
        var description = classData.description || classData.information || 'No description available.';
        alert(className + '\\n\\n' + description);
    }
}

// Remove class from diagram
function removeVennClass(className) {
    console.log('Removing class:', className);
    
    if (!window.networkProcessor || !window.networkProcessor.deselectClass) return;
    
    // Deselect the class
    window.networkProcessor.deselectClass(className);
    
    // Redraw Venn diagram
    vennDrawn = false;
    drawVennDiagram();
}

// ===== Context Menu System (similar to graph view) =====
var vennNodeMenuDiv = null; // Currently open node context-menu element

function hideVennNodeMenu() {
    if (vennNodeMenuDiv) {
        vennNodeMenuDiv.remove();
        vennNodeMenuDiv = null;
    }
}

function showVennNodeMenu(d, className, pageX, pageY) {
    // Close any existing menu first
    hideVennNodeMenu();

    // Get class data from networkProcessor
    var classData = null;
    if (window.networkProcessor && typeof window.networkProcessor.getClass === 'function') {
        classData = window.networkProcessor.getClass(className);
    }

    if (!classData) {
        console.error('Class data not found for:', className);
        return;
    }

    // Build a simple HTML dropdown anchored to the click position
    vennNodeMenuDiv = d3.select("body").append("div")
        .attr("class", "venn-node-context-menu")
        .style("position", "absolute")
        .style("left", pageX + "px")
        .style("top", pageY + "px")
        .style("background", "#ffffff")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
        .style("padding", "4px 0")
        .style("z-index", "10000")
        .style("font-family", "Arial, sans-serif")
        .style("min-width", "120px");

    // Build menu options dynamically (similar to graph view)
    var hasEquals = classData.equal_classes && classData.equal_classes.length > 0;
    var options = [
        { type:"text", label: "Expand", action: function() { hideVennNodeMenu(); expandVennNode(className); } },
        { type:"text", label: "Remove", action: function() { hideVennNodeMenu(); removeVennNode(className); } }
    ];

    // Main description entry
    if (hasEquals) {
        options.push({ type:"latex", latex: classData.latex_name, suffix: ": Description", action: function() { hideVennNodeMenu(); open_side_window(classData); } });
        classData.equal_classes.forEach(function(eq) {
            options.push({ type:"latex", latex: eq.latex_name, suffix: ": Description", action: function() { hideVennNodeMenu(); open_side_window(eq); } });
        });
    } else {
        options.push({ type:"text", label: "Description", action: function() { hideVennNodeMenu(); open_side_window(classData); } });
    }

    options.forEach(function(opt) {
        var row = vennNodeMenuDiv.append("div")
            .style("padding", "6px 16px")
            .style("cursor", "pointer")
            .style("font-size", "14px")
            .on("mouseover", function() { d3.select(this).style("background", "#f0f0f0"); })
            .on("mouseout", function() { d3.select(this).style("background", "transparent"); })
            .on("click", opt.action);

        if (opt.type === "latex" && window.katex) {
            var holder = row.append("span").node();
            try {
                // Use KaTeX to render mathematical notation
                window.katex.render(opt.latex, holder, {throwOnError: false});
            } catch(e) {
                row.append("span").text(opt.latex);
            }
            row.append("span").text(opt.suffix);
        } else {
            row.text(opt.label);
        }
    });

    // Prevent clicks inside the menu from bubbling up and closing it immediately
    vennNodeMenuDiv.on("click", function() { d3.event.stopPropagation(); });
}

// Expand functionality - add related nodes to the Venn diagram with enhanced visualization
function expandVennNode(className) {
    console.log('Expanding Venn node:', className);
    
    if (!window.networkProcessor) {
        console.error('networkProcessor not available');
        return;
    }

    // Get class data
    var classData = window.networkProcessor.getClass(className);
    if (!classData) {
        console.error('Class data not found for:', className);
        return;
    }

    // Get all possible related classes with different relationship types
    var relatedClasses = getExpandableClasses(className, classData);
    
    if (relatedClasses.length === 0) {
        // Show a helpful message
        showExpandMessage(className, "No additional related classes found to expand.");
        return;
    }

    // Show expansion options to user
    showExpandOptions(className, relatedClasses);
}

// Get all classes that can be expanded from the given class
function getExpandableClasses(className, classData) {
    var related = [];
    var addedClasses = new Set();

    // Get currently selected classes to avoid duplicates
    var currentClasses = getSelectedClasses().map(function(cls) {
        return cls.id || cls.name || cls;
    });

    // Add contained classes (classes inside this one)
    if (classData.contains && Array.isArray(classData.contains)) {
        classData.contains.forEach(function(containedClass) {
            if (!currentClasses.includes(containedClass) && !addedClasses.has(containedClass)) {
                related.push({
                    name: containedClass,
                    type: 'contained',
                    description: 'Classes contained within ' + className
                });
                addedClasses.add(containedClass);
            }
        });
    }

    // Add containing classes (classes that contain this one)
    if (classData.containedBy && Array.isArray(classData.containedBy)) {
        classData.containedBy.forEach(function(containingClass) {
            if (!currentClasses.includes(containingClass) && !addedClasses.has(containingClass)) {
                related.push({
                    name: containingClass,
                    type: 'containing',
                    description: 'Classes that contain ' + className
                });
                addedClasses.add(containingClass);
            }
        });
    }

    // Add equivalent classes
    if (classData.equal_classes && Array.isArray(classData.equal_classes)) {
        classData.equal_classes.forEach(function(eqClass) {
            var eqClassName = eqClass.id || eqClass.name;
            if (eqClassName && !currentClasses.includes(eqClassName) && !addedClasses.has(eqClassName)) {
                related.push({
                    name: eqClassName,
                    type: 'equivalent',
                    description: 'Classes equivalent to ' + className
                });
                addedClasses.add(eqClassName);
            }
        });
    }

    // Add classes from common complexity theory relationships
    var commonRelationships = getCommonRelationships(className);
    commonRelationships.forEach(function(relClass) {
        if (!currentClasses.includes(relClass) && !addedClasses.has(relClass)) {
            related.push({
                name: relClass,
                type: 'related',
                description: 'Commonly related to ' + className
            });
            addedClasses.add(relClass);
        }
    });

    return related;
}

// Get commonly related classes based on complexity theory knowledge
function getCommonRelationships(className) {
    var relationships = {
        'P': ['L', 'NL', 'NC', 'AC', 'RP', 'ZPP'],
        'NP': ['co-NP', 'UP', 'FNP', 'Σ₂ᴾ', 'AM'],
        'BQP': ['QMA', 'PP', 'PostBQP'],
        'PSPACE': ['QIP', 'IP', 'NPSPACE', 'coNPSPACE'],
        'EXPTIME': ['NEXPTIME', '2EXPTIME', 'ELEMENTARY'],
        'L': ['REG', 'CFL'],
        'NL': ['UL', 'SL'],
        'co-NP': ['coAM', 'coRP']
    };

    return relationships[className] || [];
}

// Show expansion options to the user
function showExpandOptions(className, relatedClasses) {
    // Close any existing menu
    hideVennNodeMenu();

    // Create expansion dialog
    var expandDialog = d3.select("body").append("div")
        .attr("class", "venn-expand-dialog")
        .style("position", "fixed")
        .style("top", "50%")
        .style("left", "50%")
        .style("transform", "translate(-50%, -50%)")
        .style("background", "white")
        .style("border", "2px solid #4F7942")
        .style("border-radius", "12px")
        .style("box-shadow", "0 8px 32px rgba(0,0,0,0.3)")
        .style("padding", "20px")
        .style("z-index", "11000")
        .style("max-width", "500px")
        .style("max-height", "70vh")
        .style("overflow-y", "auto")
        .style("font-family", "Arial, sans-serif");

    // Add title
    expandDialog.append("h3")
        .style("margin", "0 0 15px 0")
        .style("color", "#2D5016")
        .style("text-align", "center")
        .text("Expand " + className);

    expandDialog.append("p")
        .style("margin", "0 0 20px 0")
        .style("color", "#666")
        .style("text-align", "center")
        .style("font-size", "14px")
        .text("Select which related classes to add to the diagram:");

    // Group classes by type
    var groupedClasses = {};
    relatedClasses.forEach(function(cls) {
        if (!groupedClasses[cls.type]) {
            groupedClasses[cls.type] = [];
        }
        groupedClasses[cls.type].push(cls);
    });

    // Create checkboxes for each group
    Object.keys(groupedClasses).forEach(function(type) {
        var group = expandDialog.append("div")
            .style("margin", "10px 0")
            .style("padding", "10px")
            .style("background", "#f8f9fa")
            .style("border-radius", "6px");

        group.append("h4")
            .style("margin", "0 0 8px 0")
            .style("color", "#2D5016")
            .style("font-size", "14px")
            .text(getTypeLabel(type));

        groupedClasses[type].forEach(function(cls) {
            var checkbox = group.append("label")
                .style("display", "block")
                .style("margin", "4px 0")
                .style("cursor", "pointer")
                .style("font-size", "13px");

            checkbox.append("input")
                .attr("type", "checkbox")
                .attr("value", cls.name)
                .style("margin-right", "8px");

            checkbox.append("span")
                .text(cls.name);
        });
    });

    // Add buttons
    var buttonContainer = expandDialog.append("div")
        .style("display", "flex")
        .style("gap", "10px")
        .style("justify-content", "center")
        .style("margin-top", "20px");

    buttonContainer.append("button")
        .style("padding", "8px 16px")
        .style("background", "#4F7942")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "6px")
        .style("cursor", "pointer")
        .text("Add Selected")
        .on("click", function() {
            var selectedClasses = [];
            expandDialog.selectAll("input[type=checkbox]:checked").each(function() {
                selectedClasses.push(d3.select(this).attr("value"));
            });
            
            if (selectedClasses.length > 0) {
                addClassesToDiagram(selectedClasses, className);
            }
            expandDialog.remove();
        });

    buttonContainer.append("button")
        .style("padding", "8px 16px")
        .style("background", "#6c757d")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "6px")
        .style("cursor", "pointer")
        .text("Cancel")
        .on("click", function() {
            expandDialog.remove();
        });

    // Close on escape
    d3.select("body").on("keydown.expand", function() {
        if (d3.event.keyCode === 27) { // Escape key
            expandDialog.remove();
            d3.select("body").on("keydown.expand", null);
        }
    });
}

function getTypeLabel(type) {
    var labels = {
        'contained': ' Classes Contained Within',
        'containing': ' Classes That Contain',
        'equivalent': ' Equivalent Classes',
        'related': ' Related Classes'
    };
    return labels[type] || type;
}

// Add selected classes to diagram with animation
function addClassesToDiagram(selectedClasses, expandedFrom) {
    console.log('Adding classes to diagram:', selectedClasses, 'expanded from:', expandedFrom);

    // Add classes to networkProcessor
    selectedClasses.forEach(function(className) {
        if (window.networkProcessor.selectClass) {
            window.networkProcessor.selectClass(className);
        }
    });

    // Store animation info
    window.vennExpansionInfo = {
        newClasses: selectedClasses,
        expandedFrom: expandedFrom,
        timestamp: Date.now()
    };

    // Redraw the Venn diagram with animation
    vennDrawn = false;
    drawVennDiagram();

    // Show success message
    showExpandMessage(expandedFrom, 
        'Added ' + selectedClasses.length + ' new class' + 
        (selectedClasses.length === 1 ? '' : 'es') + ': ' + selectedClasses.join(', ')
    );
}

// Show expansion message
function showExpandMessage(className, message) {
    var messageDiv = d3.select("body").append("div")
        .style("position", "fixed")
        .style("top", "20px")
        .style("right", "20px")
        .style("background", "#4F7942")
        .style("color", "white")
        .style("padding", "12px 16px")
        .style("border-radius", "6px")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
        .style("z-index", "12000")
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "14px")
        .style("max-width", "300px")
        .style("opacity", 0);

    messageDiv.html('<strong>' + className + '</strong><br>' + message);

    messageDiv.transition()
        .duration(300)
        .style("opacity", 1);

    setTimeout(function() {
        messageDiv.transition()
            .duration(300)
            .style("opacity", 0)
            .remove();
    }, 4000);
}

// Remove functionality - remove node from Venn diagram
function removeVennNode(className) {
    console.log('Removing Venn node:', className);
    
    if (!window.networkProcessor) {
        console.error('networkProcessor not available');
        return;
    }

    // Deselect the class
    if (window.networkProcessor.deselectClass) {
        window.networkProcessor.deselectClass(className);
    }

    // Redraw the Venn diagram without the removed class
    vennDrawn = false;
    drawVennDiagram();
    
    console.log('Removed class from Venn diagram:', className);
}

// Close the menu when clicking anywhere else on the page
document.addEventListener("click", function(evt) {
    if (vennNodeMenuDiv && vennNodeMenuDiv.node() && !vennNodeMenuDiv.node().contains(evt.target)) {
        hideVennNodeMenu();
    }
});

// Hide menu on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        hideVennNodeMenu();
    }
});

// ===== Enhanced Visual Features =====

// Show relationship preview on hover
function showRelationshipPreview(className, x, y) {
    if (!window.networkProcessor) return;
    
    var classData = window.networkProcessor.getClass(className);
    if (!classData) return;
    
    var preview = d3.select("body").append("div")
        .attr("class", "relationship-preview")
        .style("position", "absolute")
        .style("left", (x - 100) + "px")
        .style("top", (y - 10) + "px")
        .style("background", "rgba(79, 121, 66, 0.95)")
        .style("color", "white")
        .style("padding", "6px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("font-family", "Arial, sans-serif")
        .style("z-index", "9999")
        .style("pointer-events", "none")
        .style("opacity", 0);
    
    var content = className;
    if (classData.contains && classData.contains.length > 0) {
        content += " ⊃ " + classData.contains.slice(0, 3).join(", ");
        if (classData.contains.length > 3) content += "...";
    }
    
    preview.text(content)
        .transition()
        .duration(200)
        .style("opacity", 1);
}

function hideRelationshipPreview() {
    d3.selectAll(".relationship-preview")
        .transition()
        .duration(200)
        .style("opacity", 0)
        .remove();
}

// Add expansion indicator
function addExpansionIndicator(x, y, className) {
    var indicator = d3.select("svg").append("g")
        .attr("class", "expansion-indicator")
        .attr("transform", "translate(" + x + "," + y + ")");
    
    indicator.append("circle")
        .attr("r", 8)
        .style("fill", "#FF6B35")
        .style("opacity", 0)
        .transition()
        .duration(500)
        .style("opacity", 0.8);
    
    indicator.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("fill", "white")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .style("opacity", 0)
        .text("★")
        .transition()
        .delay(200)
        .duration(300)
        .style("opacity", 1);
    
    // Auto-remove after 3 seconds
    setTimeout(function() {
        d3.selectAll(".expansion-indicator")
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();
    }, 3000);
}

// Add relationship lines between classes
function addRelationshipLines(sortedClasses, radii, centerX, bottomY) {
    var svg = d3.select("svg");
    
    // Clear existing relationship lines
    svg.selectAll(".relationship-line").remove();
    
    // Only show lines if we have expansion info
    if (!window.vennExpansionInfo || !window.vennExpansionInfo.newClasses) return;
    
    var expandedFrom = window.vennExpansionInfo.expandedFrom;
    var newClasses = window.vennExpansionInfo.newClasses;
    
    // Find positions of expanded class and new classes
    sortedClasses.forEach(function(className, i) {
        var radius = radii[sortedClasses.length - 1 - i];
        var centerY = bottomY - radius;
        
        if (className === expandedFrom) {
            // Draw lines to each new class
            newClasses.forEach(function(newClassName) {
                var newIndex = sortedClasses.indexOf(newClassName);
                if (newIndex !== -1) {
                    var newRadius = radii[sortedClasses.length - 1 - newIndex];
                    var newCenterY = bottomY - newRadius;
                    
                    // Draw animated dashed line
                    svg.append("line")
                        .attr("class", "relationship-line")
                        .attr("x1", centerX)
                        .attr("y1", centerY)
                        .attr("x2", centerX) // Start at same position
                        .attr("y2", centerY)
                        .style("stroke", "#FF6B35")
                        .style("stroke-width", 2)
                        .style("stroke-dasharray", "5,5")
                        .style("opacity", 0.7)
                        .transition()
                        .duration(800)
                        .attr("x2", centerX)
                        .attr("y2", newCenterY);
                }
            });
        }
    });
    
    // Auto-remove lines after 4 seconds
    setTimeout(function() {
        svg.selectAll(".relationship-line")
            .transition()
            .duration(1000)
            .style("opacity", 0)
            .remove();
    }, 4000);
}

// Clear expansion info after diagram is drawn
setTimeout(function() {
    if (window.vennExpansionInfo) {
        delete window.vennExpansionInfo;
    }
}, 5000);
