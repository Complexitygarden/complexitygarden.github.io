// Main file which visualises a sunburst of complexity classes
var sunburst_drawn = false;
var alert_shown = false;

// Updating variables
function update_sunburst_values(width){

}

// Currently just testing the sunburst - this will most likely be rewritten

function draw_sunburst() {
    console.log("Drawing sunburst");
    
    // Show experimental warning
    if (!alert_shown) {
        alert("Note: The complexity class visualization is an experimental feature");
        alert_shown = true;
    }
    
    vis_svg.selectAll('path').remove();
    vis_svg.selectAll('text').remove();
    
    d3.json('/get_complexity_sunburst', function(response) {
        if (!response.success) {
            console.error("Failed to get valid sunburst data");
            return;
        }

        if (response.data.children.length === 0) {
            console.error("No data to draw sunburst");
            return;
        }

        console.log("Response:", response.data);

        const data = response.data;
        const width = vis_width;
        const height = vis_height;
        const radius = Math.min(width, height) / 2;

        vis_svg.attr("transform", `translate(${width / 2},${height / 2})`);

        // Find all possible paths from root to leaf
        function findAllPaths(nodes) {
            const paths = [];
            const maxLevel = data.max_level;
            
            function buildPath(currentPath, level) {
                if (level > maxLevel) {
                    console.log("Complete path found:", currentPath.map(n => n.name).join(" -> "));
                    paths.push([...currentPath]);
                    return;
                }

                // Find nodes that can be at this level based on their level range
                const nodesAtLevel = nodes.filter(node => 
                    node.level_start <= level && node.level_end >= level
                );

                if (nodesAtLevel.length === 0) {
                    // If no nodes at this level, extend the last node in the path
                    const lastNode = currentPath[currentPath.length - 1];
                    if (lastNode && lastNode.level_end >= level) {
                        console.log(`Level ${level}: Extending ${lastNode.name} to next level`);
                        buildPath(currentPath, level + 1);
                    } else {
                        console.log("Path complete (no more valid nodes):", currentPath.map(n => n.name).join(" -> "));
                        paths.push([...currentPath]);
                    }
                } else {
                    // Always consider staying with the current node if possible
                    const lastNode = currentPath[currentPath.length - 1];
                    if (lastNode && lastNode.level_end >= level) {
                        console.log(`Level ${level}: Staying with current node ${lastNode.name}`);
                        buildPath(currentPath, level + 1);
                    }

                    console.log(`Level ${level}: Considering nodes:`, nodesAtLevel.map(n => n.name).join(", "));
                    nodesAtLevel.forEach(node => {
                        // Skip if this would be the same as staying with current node
                        if (lastNode && node.name === lastNode.name) {
                            return;
                        }

                        // Check if this node can connect to the previous node
                        if (!lastNode || 
                            (node.contains_level[lastNode.name] !== undefined || 
                             lastNode.contains_level[node.name] !== undefined)) {
                            console.log(`Level ${level}: Adding ${node.name} to path`);
                            currentPath.push(node);
                            buildPath(currentPath, level + 1);
                            currentPath.pop();
                        } else {
                            console.log(`Level ${level}: Skipping ${node.name} - no valid connection to ${lastNode?.name}`);
                        }
                    });
                }
            }

            buildPath([], 0);
            console.log("\nAll found paths:");
            paths.forEach((path, i) => {
                console.log(`Path ${i + 1}:`, path.map(n => n.name).join(" -> "));
            });
            return paths;
        }

        // Get all valid paths
        const allPaths = findAllPaths(data.children);

        // Normalize paths to have same length by duplicating nodes where needed
        console.log("\nNormalizing paths:");
        const normalizedPaths = allPaths.map((path, pathIndex) => {
            const normalized = new Array(data.max_level + 1).fill(null);
            
            path.forEach(node => {
                for (let level = node.level_start; level <= node.level_end; level++) {
                    if (!normalized[level]) {
                        console.log(`Path ${pathIndex + 1}, Level ${level}: Adding ${node.name}`);
                        normalized[level] = {
                            ...node,
                            displayLevel: level,
                            originalNode: node
                        };
                    }
                }
            });

            // Fill any remaining gaps with the last valid node
            for (let i = 0; i < normalized.length; i++) {
                if (!normalized[i] && i > 0) {
                    console.log(`Path ${pathIndex + 1}, Level ${i}: Filling gap with ${normalized[i - 1].name}`);
                    normalized[i] = {
                        ...normalized[i - 1],
                        displayLevel: i,
                        originalNode: normalized[i - 1].originalNode
                    };
                }
            }

            console.log(`Normalized path ${pathIndex + 1}:`, normalized.map(n => n.name).join(" -> "));
            return normalized;
        });

        // Group similar path segments
        console.log("\nGrouping similar path segments:");
        const pathGroups = new Map();
        normalizedPaths.forEach((path, pathIndex) => {
            path.forEach((node, level) => {
                const key = `${level}-${node.name}`;
                if (!pathGroups.has(key)) {
                    pathGroups.set(key, {
                        node: node,
                        paths: new Set(),
                        level: level
                    });
                    console.log(`Created new group for ${node.name} at level ${level}`);
                }
                pathGroups.get(key).paths.add(pathIndex);
                console.log(`Added path ${pathIndex + 1} to group ${key}`);
            });
        });

        // Log the final groups
        console.log("\nFinal path groups:");
        pathGroups.forEach((group, key) => {
            console.log(`Group ${key}:`);
            console.log(`  Node: ${group.node.name}`);
            console.log(`  Level: ${group.level}`);
            console.log(`  Paths: ${Array.from(group.paths).map(p => p + 1).join(", ")}`);
        });

        // Assign angles based on path groups
        const nodeAngles = new Map();
        const totalPaths = normalizedPaths.length;
        const anglePerPath = (2 * Math.PI) / totalPaths;

        // Sort path groups by level and number of paths they contain
        const sortedGroups = Array.from(pathGroups.values())
            .sort((a, b) => a.level - b.level || b.paths.size - a.paths.size);

        sortedGroups.forEach(group => {
            const pathIndices = Array.from(group.paths);
            const startAngle = Math.min(...pathIndices) * anglePerPath;
            const endAngle = (Math.max(...pathIndices) + 1) * anglePerPath;
            
            const key = `${group.node.name}-${group.level}`;
            nodeAngles.set(key, {
                start: startAngle,
                end: endAngle,
                level: group.level
            });
        });

        // Create arcs using the new angle assignments
        const allArcs = [];
        sortedGroups.forEach(group => {
            const angle = nodeAngles.get(`${group.node.name}-${group.level}`);
            
            allArcs.push({
                ...group.node.originalNode,
                startAngle: angle.start,
                endAngle: angle.end,
                innerRadius: (group.level * radius) / (data.max_level + 1),
                outerRadius: ((group.level + 1) * radius) / (data.max_level + 1),
                displayLevel: group.level
            });
        });

        // Create and draw arcs
        const arc = d3.arc()
            .innerRadius(d => d.innerRadius)
            .outerRadius(d => d.outerRadius)
            .startAngle(d => d.startAngle)
            .endAngle(d => d.endAngle);

        const paths = vis_svg.selectAll('path')
            .data(allArcs)
            .enter()
            .append('path')
            .attr('d', arc)
            .style('fill', d => d3.schemeCategory10[d.name.length % 10])
            .style('stroke', 'white')
            .style('stroke-width', '1px')
            .style('opacity', 1)
            .on('mouseover', function(d) {
                d3.select(this)
                    .style('fill', d => d3.rgb(d3.select(this).style('fill')).brighter(0.3));
                open_side_window({name: d.name}, false);
            })
            .on('mouseout', function(d) {
                const originalColor = d3.schemeCategory10[d.name.length % 10];
                d3.select(this).style('fill', originalColor);
            })
            .on('click', function(d) {
                open_side_window({name: d.name}, true);
            });

        // Add labels only for main arcs
        const labels = vis_svg.selectAll('text')
            .data(allArcs)
            .enter()
            .append('text')
            .style('fill', 'white')
            .style('font-size', '10px')
            .attr('transform', d => {
                const angle = (d.startAngle + d.endAngle) / 2;
                const labelRadius = (d.innerRadius + d.outerRadius) / 2;
                const x = Math.cos(angle - Math.PI / 2) * labelRadius;
                const y = Math.sin(angle - Math.PI / 2) * labelRadius;
                const rotation = (angle * 180 / Math.PI) + (angle > Math.PI ? 180 : 0);
                return `translate(${x},${y}) rotate(${rotation})`;
            })
            .attr('text-anchor', 'middle')
            .text(d => d.label || d.name);

        sunburst_drawn = true;
    });
}