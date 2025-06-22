class NetworkProcessor {
    constructor() {
        // console.log('Creating new NetworkProcessor instance');
        this.classes = new Map();
        this.theorems = [];
        this.selectedClasses = new Set();
        this.classesIdentifiers = [];
        this.trimmedNetwork = [];
        this.visualizedTrimmedNetwork = {};
        this.maxAvgLevel = -1;
        this.minLevel = -1;
        this.maxMaxLevel = -1;
        this.updateLocation = true;
        this.rootNodes = [];
        this.topNodes = [];
        this.initialized = false;
    }

    async initialize(classesData, theoremsData) {
        // console.log('Initializing NetworkProcessor with data:', {
        //     classesCount: Object.keys(classesData.class_list).length,
        //     theoremsCount: theoremsData.theorems.length,
        //     classesDataKeys: Object.keys(classesData.class_list),
        //     firstTheorem: theoremsData.theorems[0]
        // });

        try {
            // Process classes
            // console.log('Processing classes...');
            for (const [className, classData] of Object.entries(classesData.class_list)) {
                // console.log(`Adding class: ${className}`, classData);
                this.addClass(className, classData);
            }
            // console.log(`Processed ${this.classes.size} classes`);

            // Process theorems
            // console.log('Processing theorems...');
            for (const theorem of theoremsData.theorems) {
                // console.log(`Processing theorem:`, theorem);
                this.addTheorem(theorem);
            }
            // console.log(`Processed ${this.theorems.length} theorems`);

            // Process equality theorems
            // console.log('Processing equality theorems...');
            this.processEqualityTheorems();

            // Set root and top nodes
            // console.log('Setting root and top nodes...');
            this.setRootAndTopNodes();

            this.initialized = true;
            // console.log('NetworkProcessor initialized with:', {
            //     classes: this.classes.size,
            //     theorems: this.theorems.length,
            //     selectedClasses: this.selectedClasses.size,
            //     classNames: Array.from(this.classes.keys()),
            //     theoremTypes: this.theorems.map(t => t.type)
            // });
        } catch (error) {
            console.error('Error initializing NetworkProcessor:', error);
            throw error;
        }
    }

    addClass(name, data) {
        if (!name || !data) {
            // console.warn('Invalid class data:', { name, data });
            return;
        }

        // console.log(`Adding class ${name} with data:`, data);
        this.classes.set(name, {
            id: name,
            name: data.name || name,
            latex_name: data.latex_name || name,
            description: data.description || '',
            information: data.information || '',
            contains: new Set(),
            within: new Set(),
            equals: new Set(),
            trim_contains: new Set(),
            trim_within: new Set(),
            trim_equals: new Set(),
            relationships: new Set(),
            top: data.top || false,
            bottom: data.bottom || false,
            level: data.level || 0,
            x: 0,  // Initialize position
            y: 0,  // Initialize position
            visible: false,
            coClass: data.coClass || null
        });
        this.classesIdentifiers.push(name);
        // console.log(`Class ${name} added successfully. Current class count: ${this.classes.size}`);
    }

    addTheorem(theorem) {
        if (!theorem || !theorem.type) {
            // console.warn('Invalid theorem data:', theorem);
            return;
        }

        // console.log(`Adding theorem of type ${theorem.type}:`, theorem);

        if (theorem.type === 'containment') {
            const smallClass = this.classes.get(theorem.small);
            const largeClass = this.classes.get(theorem.large);
            
            // console.log(`Looking for classes:`, {
            //     small: theorem.small,
            //     large: theorem.large,
            //     smallFound: !!smallClass,
            //     largeFound: !!largeClass
            // });
            
            if (smallClass && largeClass) {
                // small is contained within large
                smallClass.within.add(theorem.large);
                largeClass.contains.add(theorem.small);
                smallClass.relationships.add(theorem.large);
                largeClass.relationships.add(theorem.small);
                // console.log(`Added containment relationship: ${theorem.small} is contained within ${theorem.large}`);
            } else {
                // console.warn('Classes not found for theorem:', {
                //     theorem,
                //     availableClasses: Array.from(this.classes.keys())
                // });
            }
        } else if (theorem.type === 'equality') {
            const classA = this.classes.get(theorem.a);
            const classB = this.classes.get(theorem.b);
            
            // console.log(`Looking for equality classes:`, {
            //     classA: theorem.class_a,
            //     classB: theorem.class_b,
            //     classAFound: !!classA,
            //     classBFound: !!classB,
            //     availableClasses: Array.from(this.classes.keys())
            // });
            
            if (classA && classB) {
                classA.equals.add(theorem.b);
                classB.equals.add(theorem.a);
                // console.log(`Added equality relationship: ${theorem.class_a} = ${theorem.class_b}`);
            } else {
                // console.warn('Classes not found for equality theorem:', {
                //     theorem,
                //     availableClasses: Array.from(this.classes.keys())
                // });
            }
        }
        this.theorems.push(theorem);
    }

    processEqualityTheorems() {
        // This method is now just for logging and verification
        // console.log('Verifying equality theorems...');
        const equalityTheorems = this.theorems.filter(t => t.type === 'equality');
        // console.log(`Found ${equalityTheorems.length} equality theorems`);

        for (const theorem of equalityTheorems) {
            const classA = this.classes.get(theorem.a);
            const classB = this.classes.get(theorem.b);
            
            // console.log(`Verifying equality relationship:`, {
            //     theorem,
            //     classAFound: !!classA,
            //     classBFound: !!classB,
            //     classAEquals: classA ? Array.from(classA.equals) : [],
            //     classBEquals: classB ? Array.from(classB.equals) : []
            // });
        }
    }

    getClass(name) {
        if (!this.initialized) {
            // console.warn('NetworkProcessor not initialized');
            return null;
        }
        return this.classes.get(name);
    }

    getTheorem(index) {
        return this.theorems[index];
    }

    getAllClasses() {
        if (!this.initialized) {
            // console.warn('NetworkProcessor not initialized');
            return [];
        }
        return Array.from(this.classes.values());
    }

    getAllTheorems() {
        return this.theorems;
    }

    isClassSelected(name) {
        if (!this.initialized) {
            // console.warn('NetworkProcessor not initialized');
            return false;
        }
        return this.selectedClasses.has(name);
    }

    selectClass(name) {
        if (!this.initialized) {
            // console.warn('NetworkProcessor not initialized');
            return;
        }
        if (this.classes.has(name)) {
            this.selectedClasses.add(name);

            // Update URL with the new selection so the state can be bookmarked
            if (this.updateLocation && typeof window.updateURLWithConfig === 'function') {
                window.updateURLWithConfig();
            }
        } else {
            // console.warn('Class not found:', name);
        }
    }

    deselectClass(name) {
        if (!this.initialized) {
            // console.warn('NetworkProcessor not initialized');
            return;
        }
        const existed = this.selectedClasses.delete(name);

        // Only update the URL if something actually changed to avoid unnecessary history churn
        if (existed && this.updateLocation && typeof window.updateURLWithConfig === 'function') {
            window.updateURLWithConfig();
        }
    }

    getSelectedClasses() {
        return Array.from(this.selectedClasses);
    }

    processTrimmedClassList(classList) {
        if (classList.length === 0) {
            return [];
        }

        // console.log('Processing class list:', classList);
        const graphClassList = []; // The classes we are visualizing
        const visDict = {};
        const equalGroups = new Map(); // Maps each class to its group of equal classes

        // First pass: identify groups of equal classes
        for (const className of classList) {
            const classData = this.classes.get(className);
            if (!classData) continue;

            // If this class has equal classes, find or create its group
            if (classData.equals.size > 0) {
                let foundGroup = false;
                // Check if any of its equal classes are already in a group
                for (const equalClass of classData.equals) {
                    if (equalGroups.has(equalClass)) {
                        equalGroups.get(equalClass).add(className);
                        equalGroups.set(className, equalGroups.get(equalClass));
                        foundGroup = true;
                        break;
                    }
                }
                // If no group found, create a new one
                if (!foundGroup) {
                    const newGroup = new Set([className, ...classData.equals]);
                    for (const equalClass of newGroup) {
                        equalGroups.set(equalClass, newGroup);
                    }
                }
            }
        }

        // Second pass: select main class for each group and process relationships
        for (const className of classList) {
            const classData = this.classes.get(className);
            if (!classData) continue;

            // Get the group this class belongs to (or create a singleton group)
            const group = equalGroups.get(className) || new Set([className]);
            
            // Find the main class for this group (if not already selected)
            let mainClass = null;
            if (!visDict[className]) {
                // Select main class based on number of connections and alphabetical order
                mainClass = Array.from(group)
                    .filter(c => classList.includes(c)) // Only consider selected classes
                    .sort((a, b) => {
                        const aClass = this.classes.get(a);
                        const bClass = this.classes.get(b);
                        const aConnections = aClass.contains.size + aClass.within.size;
                        const bConnections = bClass.contains.size + bClass.within.size;
                        if (bConnections !== aConnections) {
                            return bConnections - aConnections; // More connections first
                        }
                        return a.localeCompare(b); // Alphabetical order as tiebreaker
                    })[0];

                const mainClassData = this.classes.get(mainClass);

                // First, collect all containment relationships from all selected equal classes
                const allContains = new Set();
                const allWithin = new Set();
                
                // Collect relationships from all equal classes in the group
                // console.log('\nCollecting relationships from all equal classes:');
                // console.log('- Group:', Array.from(group));
                for (const equalClass of group) {
                    const equalClassData = this.classes.get(equalClass);
                    // console.log(`\nFrom ${equalClass}:`);
                    // console.log('- Contains:', Array.from(equalClassData.contains));
                    // console.log('- Within:', Array.from(equalClassData.within));
                    
                    // Add all relationships to our sets
                    for (const contained of equalClassData.contains) {
                        allContains.add(contained);
                    }
                    for (const within of equalClassData.within) {
                        allWithin.add(within);
                    }
                }

                // console.log('\nCollected all relationships:');
                // console.log('- All contains:', Array.from(allContains));
                // console.log('- All within:', Array.from(allWithin));

                // Now set all relationships for each equal class
                for (const equalClass of group) {
                    if (classList.includes(equalClass)) {
                        visDict[equalClass] = [mainClass];
                        
                        const equalClassData = this.classes.get(equalClass);
                        // console.log(`\nSetting relationships for ${equalClass}:`);
                        // console.log('- Before setting:');
                        // console.log('  trim_contains:', Array.from(equalClassData.trim_contains));
                        // console.log('  trim_within:', Array.from(equalClassData.trim_within));
                        
                        // Clear existing trimmed relationships
                        equalClassData.trim_contains = new Set();
                        equalClassData.trim_within = new Set();
                        
                        // Only set relationships for the main class
                        if (equalClass === mainClass) {
                            // Set all contains relationships
                            for (const contained of allContains) {
                                equalClassData.trim_contains.add(contained);
                                // Add bidirectional relationship
                                const containedClass = this.classes.get(contained);
                                if (containedClass) {
                                    containedClass.trim_within.add(equalClass);
                                }
                            }
                            
                            // Set all within relationships
                            for (const within of allWithin) {
                                equalClassData.trim_within.add(within);
                                // Add bidirectional relationship
                                const withinClass = this.classes.get(within);
                                if (withinClass) {
                                    withinClass.trim_contains.add(equalClass);
                                }
                            }
                        }
                        
                        // console.log('- After setting:');
                        // console.log('  trim_contains:', Array.from(equalClassData.trim_contains));
                        // console.log('  trim_within:', Array.from(equalClassData.trim_within));
                    }
                }
                graphClassList.push(mainClass);
            }
        }

        // Remove duplicates
        const uniqueGraphClassList = [...new Set(graphClassList)];
        this.visualizedTrimmedNetwork = visDict;

        // Set trim_main_class for classes which are the main class
        for (const mainClass of Object.keys(visDict)) {
            const classData = this.classes.get(mainClass);
            if (!classData) continue;

            if (!visDict[mainClass].includes(mainClass)) {
                classData.trim_main_class = visDict[mainClass][0];
            } else {
                classData.trim_main_class = null;
            }
        }

        return uniqueGraphClassList;
    }

    variablesForProcessing(trimClassList, classesDict) {
        // console.log('\n=== Setting up Processing Variables ===');
        // console.log('Trim class list:', trimClassList);
        
        const nodeQueue = [trimClassList[0]];
        const taggedVertex = {};
        const processedVertex = {};

        // Initialize all vertices as not tagged and not processed
        for (const className of classesDict.keys()) {
            taggedVertex[className] = false;
            processedVertex[className] = false;
        }

        // Tag vertices that are in the trimmed network
        for (const className of trimClassList) {
            taggedVertex[className] = true;
        }

        // console.log('Initialized dictionaries:');
        // console.log('- Tagged vertices:', taggedVertex);
        // console.log('- Processed vertices:', processedVertex);
        // console.log('- Initial queue:', nodeQueue);

        return { nodeQueue, taggedVertex, processedVertex };
    }

    getTrimmedNetworkJson() {
        if (!this.initialized) {
            // console.warn('NetworkProcessor not initialized');
            return { nodes: [], links: [] };
        }

        // console.log('=== Starting Network Processing ===');
        // console.log('Selected classes:', Array.from(this.selectedClasses));
        
        // Reset all trimmed relationships by copying original relationships
        // console.log('Resetting trimmed relationships...');
        for (const classData of this.classes.values()) {
            classData.trim_contains = new Set(classData.contains);
            classData.trim_within = new Set(classData.within);
            classData.trim_equals = new Set(classData.equals);
            classData.visible = false;
        }
        
        // First, process the class list to handle equality theorems
        const processedClassList = this.processTrimmedClassList(Array.from(this.selectedClasses));
        // console.log('Processed class list:', processedClassList);
        
        // Basic cases
        if (processedClassList.length === 0) {
            // console.log('No classes to process, returning empty network');
            return { nodes: [], links: [], maxLevel: 0, root_nodes: [], top_nodes: [] };
        }

        // Set up variables for processing
        // console.log('Setting up processing variables...');
        const { nodeQueue, taggedVertex, processedVertex } = this.variablesForProcessing(processedClassList, this.classes);
        // console.log('Initial queue:', nodeQueue);
        // console.log('Tagged vertices:', taggedVertex);
        // console.log('Processed vertices:', processedVertex);

        // Process all nodes
        // console.log('=== Processing Nodes ===');
        while (nodeQueue.length > 0) {
            const currentClassIdentifier = nodeQueue.shift();
            const currentClass = this.classes.get(currentClassIdentifier);
            processedVertex[currentClassIdentifier] = true;

            // console.log(`\nProcessing node: ${currentClassIdentifier}`);
            // console.log('Current queue size:', nodeQueue.length);
            // console.log('Queue:', nodeQueue);

            // Skip if class not found
            if (!currentClass) {
                // console.log(`Class ${currentClassIdentifier} not found, skipping`);
                continue;
            }

            // Get all neighbors
            const neighbors = new Set();
            // console.log(`Getting neighbors for ${currentClassIdentifier}:`);
            // console.log('- Contains:', Array.from(currentClass.contains));
            // console.log('- Within:', Array.from(currentClass.within));

            // Add all neighbors, not just the ones in selected classes
            for (const contained of currentClass.contains) {
                neighbors.add(contained);
                // console.log(`Added contained neighbor: ${contained}`);
            }
            for (const within of currentClass.within) {
                neighbors.add(within);
                // console.log(`Added within neighbor: ${within}`);
            }

            // Add unprocessed neighbors to queue
            for (const neighbor of neighbors) {
                if (!processedVertex[neighbor] && !nodeQueue.includes(neighbor)) {
                    nodeQueue.push(neighbor);
                    // console.log(`Added unprocessed neighbor to queue: ${neighbor}`);
                } else {
                    // console.log(`Skipping neighbor ${neighbor} - already processed or in queue`);
                }
            }

            // Process the current node if not tagged
            if (!taggedVertex[currentClassIdentifier]) {
                // console.log(`Turning vertex into edge: ${currentClassIdentifier}`);
                this.turnVertexIntoEdge(currentClass);
            }
        }

        // Drop direct edges
        // console.log('\n=== Dropping Direct Edges ===');
        const pairsToDelete = [];
        for (const className of processedClassList) {
            const source = this.classes.get(className);
            if (!source) {
                // console.warn(`Source class not found: ${className}`);
                continue;
            }

            // console.log(`\nChecking edges for ${className}:`);
            // console.log('Trim contains:', Array.from(source.trim_contains));
            // console.log('Trim within:', Array.from(source.trim_within));

            for (const target of source.trim_within) {
                // Check that source is smaller than target (source ⊆ target)
                if (!this.classes.get(target).trim_contains.has(source.id)) {
                    // console.warn(`WARNING: Relationship direction may be wrong: ${source.id} (should be smaller) -> ${target} (should be bigger)`);
                }
                // console.log(`\nChecking edge ${source.id} (smaller) -> ${target} (bigger):`);
                const hasIndirect = this.hasIndirectPath(source.id, target);
                // console.log(`Has indirect path: ${hasIndirect}`);
                
                if (hasIndirect) {
                    // console.log(`Found indirect path in trimmed network for ${source.id} -> ${target}, removing direct edge`);
                    pairsToDelete.push([source, target]);
                }
            }
        }

        // Remove the direct edges
        // console.log('\n=== Removing Direct Edges ===');
        // console.log(`Found ${pairsToDelete.length} edges to remove:`, pairsToDelete.map(([s, t]) => `${s.id} -> ${t}`));
        
        for (const [source, target] of pairsToDelete) {
            // console.log(`\nRemoving edge ${source.id} -> ${target}:`);
            // console.log(`Before removal:`);
            // console.log(`- ${source.id}.trim_within:`, Array.from(source.trim_within));
            // console.log(`- ${target}.trim_contains:`, Array.from(this.classes.get(target).trim_contains));
            
            source.trim_within.delete(target);
            const targetClass = this.classes.get(target);
            targetClass.trim_contains.delete(source.id);
            
            // console.log(`After removal:`);
            // console.log(`- ${source.id}.trim_within:`, Array.from(source.trim_within));
            // console.log(`- ${target}.trim_contains:`, Array.from(targetClass.trim_contains));
        }

        // Set root and top nodes
        // console.log('\n=== Setting Root and Top Nodes ===');
        this.rootNodes = [];
        this.topNodes = [];

        for (const className of processedClassList) {
            const classData = this.classes.get(className);
            if (!classData) continue;

            // console.log(`\nChecking node ${className}:`);
            // console.log('- Trim within:', Array.from(classData.trim_within));
            // console.log('- Trim contains:', Array.from(classData.trim_contains));

            // A root node (smallest class) has no classes it contains in the trimmed network
            if (classData.trim_contains.size === 0) {
                this.rootNodes.push(className);
                // console.log(`Added root node: ${className}`);
            }

            // A top node (biggest class) has no classes containing it in the trimmed network
            if (classData.trim_within.size === 0) {
                this.topNodes.push(className);
                // console.log(`Added top node: ${className}`);
            }
        }

        // Set levels for all classes
        // console.log('\n=== Setting Levels ===');
        this.setLevels();

        // Set positions for all classes
        // console.log('\n=== Setting Positions ===');
        this.setPositions();

        // Create nodes and links for the final network
        // console.log('\n=== Creating Final Network ===');
        const nodes = [];
        const links = [];

        var x_scale = (1 + (this.maxAvgLevel + 1) / 25)/3000;

        for (const className of processedClassList) {
            const classData = this.classes.get(className);
            if (!classData) continue;

            // console.log(`\nProcessing final node ${className}:`);
            // console.log('- Trim contains:', Array.from(classData.trim_contains));

            // Add node
            nodes.push({
                id: classData.id,
                name: classData.name,
                latex_name: classData.latex_name,
                level: classData.level || 0,
                savedX: classData.x *x_scale,  // Normalize to 0-1 range
                // Scale vertical spacing dynamically: the more levels in the graph,
                // the larger the savedY value so that levels appear further apart when rendered.
                // We use a simple linear factor based on maxAvgLevel (computed in setLevels).
                savedY: classData.y / 1000,
                equal_classes: Array.from(classData.equals)
                    .filter(name => this.selectedClasses.has(name))
                    .map(name => this.classes.get(name))
            });
            // console.log(`Added node: ${className} at position (${classData.x}, ${classData.y})`);

            // Add links - from smaller to bigger classes
            for (const biggerClass of classData.trim_within) {
                links.push({
                    source: className,  // Smaller class
                    target: biggerClass,  // Bigger class
                    type: 'containment'
                });
                // console.log(`Added link: ${className} -> ${biggerClass} (smaller -> bigger)`);
            }
        }

        // console.log('\n=== Final Network ===');
        // console.log('Nodes:', nodes);
        // console.log('Links:', links);
        // console.log('Root nodes:', this.rootNodes);
        // console.log('Top nodes:', this.topNodes);

        return {
            nodes,
            links,
            maxLevel: Math.max(...nodes.map(n => n.level), 0),
            root_nodes: this.rootNodes,
            top_nodes: this.topNodes
        };
    }

    turnVertexIntoEdge(vertex) {
        // console.log(`\n=== Turning Vertex into Edge ===`);
        // console.log(`Processing vertex: ${vertex.id}`);
        
        // A class is "larger" if it contains other classes
        // A class is "smaller" if it is contained within other classes
        const largerClasses = Array.from(vertex.trim_within);  // Classes that contain this vertex
        const smallerClasses = Array.from(vertex.trim_contains);  // Classes that this vertex contains
        
        // console.log('Selected classes:', Array.from(this.selectedClasses));
        // console.log('Larger classes (containing this vertex):', largerClasses);
        // console.log('Smaller classes (contained by this vertex):', smallerClasses);

        // Connect each smaller class to each larger class
        for (const smaller of smallerClasses) {
            for (const larger of largerClasses) {
                if (larger !== smaller) {
                    const largerClass = this.classes.get(larger);
                    const smallerClass = this.classes.get(smaller);
                    
                    // console.log(`\nConnecting ${larger} -> ${smaller} (larger contains smaller):`);
                    // console.log(`- Before: ${larger} largerClass.trim_contains =`, Array.from(largerClass.trim_contains));
                    // console.log(`- Before: ${smaller} smallerClass.trim_within =`, Array.from(smallerClass.trim_within));
                    
                    if (!largerClass.trim_contains.has(smaller)) {
                        largerClass.trim_contains.add(smaller);
                        // console.log(`Added ${smaller} to ${larger}'s trim_contains (larger now contains smaller)`);
                    }
                    if (!smallerClass.trim_within.has(larger)) {
                        smallerClass.trim_within.add(larger);
                        // console.log(`Added ${larger} to ${smaller}'s trim_within (smaller is now within larger)`);
                    }
                    
                    // console.log(`- After: ${larger} largerClass.trim_contains =`, Array.from(largerClass.trim_contains));
                    // console.log(`- After: ${smaller} smallerClass.trim_within =`, Array.from(smallerClass.trim_within));
                }
            }
        }

        // Remove vertex's relationships
        // console.log(`\nRemoving vertex ${vertex.id}'s relationships:`);
        // console.log('- Before removal:');
        // console.log(`  trim_contains (classes this vertex contains):`, Array.from(vertex.trim_contains));
        // console.log(`  trim_within (classes containing this vertex):`, Array.from(vertex.trim_within));
        
        for (const smaller of smallerClasses) {
            const smallerClass = this.classes.get(smaller);
            smallerClass.trim_within.delete(vertex.id);
            // console.log(`Removed ${vertex.id} from ${smaller}'s trim_within (${smaller} is no longer within ${vertex.id})`);
        }
        for (const larger of largerClasses) {
            const largerClass = this.classes.get(larger);
            largerClass.trim_contains.delete(vertex.id);
            // console.log(`Removed ${vertex.id} from ${larger}'s trim_contains (${larger} no longer contains ${vertex.id})`);
        }

        // Clear the vertex's relationships
        vertex.trim_contains = new Set();
        vertex.trim_within = new Set();
        
        // console.log('- After removal:');
        // console.log(`  trim_contains (classes this vertex contains):`, Array.from(vertex.trim_contains));
        // console.log(`  trim_within (classes containing this vertex):`, Array.from(vertex.trim_within));

        // Log the final state of all neighbors' relationships
        // console.log('\n=== Final State of Neighbors ===');
        // console.log('Larger classes (that contained the vertex):');
        for (const larger of largerClasses) {
            const largerClass = this.classes.get(larger);
            // console.log(`${larger}:`);
            // console.log(`  - Contains (larger -> smaller):`, Array.from(largerClass.trim_contains));
            // console.log(`  - Within (larger <- smaller):`, Array.from(largerClass.trim_within));
        }
        
        // console.log('\nSmaller classes (that were contained by the vertex):');
        for (const smaller of smallerClasses) {
            const smallerClass = this.classes.get(smaller);
            // console.log(`${smaller}:`);
            // console.log(`  - Contains (smaller -> smaller):`, Array.from(smallerClass.trim_contains));
            // console.log(`  - Within (smaller <- larger):`, Array.from(smallerClass.trim_within));
        }
    }

    getTrimmedSunburstJson() {
        return {
            name: "Complexity Classes",
            children: this.trimmedNetwork.map(name => ({
                name,
                ...this.classes.get(name)
            }))
        };
    }

    setRootAndTopNodes() {
        // console.log('\n=== Setting Root and Top Nodes ===');
        // console.log('Selected classes:', Array.from(this.selectedClasses));
        
        this.rootNodes = [];
        this.topNodes = [];

        // Only consider selected classes
        for (const className of this.selectedClasses) {
            const classData = this.classes.get(className);
            if (!classData) {
                // console.warn(`Class not found: ${className}`);
                continue;
            }

            // console.log(`\nChecking node ${className}:`);
            // console.log('- Within classes:', Array.from(classData.within));
            // console.log('- Contains classes:', Array.from(classData.contains));
            // console.log('- Selected classes:', Array.from(this.selectedClasses));

            // A root node (smallest class) has no classes it contains in the trimmed network
            const hasNoContainedClasses = Array.from(classData.contains)
                .every(containedClass => !this.selectedClasses.has(containedClass));
            // console.log(`- Has no contained classes: ${hasNoContainedClasses}`);
            
            if (hasNoContainedClasses) {
                this.rootNodes.push(className);
                // console.log(`Added root node: ${className}`);
            }

            // A top node (biggest class) has no classes containing it in the trimmed network
            const hasNoContainingClasses = Array.from(classData.within)
                .every(containingClass => !this.selectedClasses.has(containingClass));
            // console.log(`- Has no containing classes: ${hasNoContainingClasses}`);
            
            if (hasNoContainingClasses) {
                this.topNodes.push(className);
                // console.log(`Added top node: ${className}`);
            }
        }

        // console.log('\nFinal results:');
        // console.log('Root nodes:', this.rootNodes);
        // console.log('Top nodes:', this.topNodes);
    }

    getClassesBetween(sourceClass, targetClass) {
        if (!this.initialized) {
            // console.warn('NetworkProcessor not initialized');
            return [];
        }

        const source = this.classes.get(sourceClass);
        const target = this.classes.get(targetClass);

        if (!source || !target) {
            // console.warn('Source or target class not found:', { sourceClass, targetClass });
            return [];
        }

        // console.log('\n=== Finding Classes Between ===');
        // console.log('Source:', sourceClass, source);
        // console.log('Target:', targetClass, target);

        // Find all paths between source and target
        const paths = this.findAllPaths(source, target);
        if (paths.length === 0) {
            // console.log('No paths found between classes');
            return [];
        }

        // Collect all classes that appear in any path
        const betweenClasses = new Set();
        for (const path of paths) {
            // Skip source and target classes
            for (let i = 1; i < path.length - 1; i++) {
                betweenClasses.add(path[i].id);
            }
        }

        // console.log('\nFinal between classes:', Array.from(betweenClasses));

        // Only return classes that are not already selected
        const newClasses = Array.from(betweenClasses).filter(c => !this.selectedClasses.has(c));
        return newClasses;
    }

    findAllPaths(source, target, visited = new Set()) {
        // Add current node to visited
        visited.add(source.id);
        
        // Base case: if we've reached the target
        if (source.id === target.id) {
            return [[source]];
        }
        
        const paths = [];
        
        // Get all nodes that contain this class (nodes above)
        for (const higherNodeId of source.within) {
            const higherNode = this.classes.get(higherNodeId);
            if (!visited.has(higherNodeId)) {
                // Recursively find paths from the higher node to target
                const subPaths = this.findAllPaths(higherNode, target, new Set(visited));
                // Add current node to the beginning of each found path
                for (const path of subPaths) {
                    paths.push([source, ...path]);
                }
            }
        }
        
        return paths;
    }

    getConnectedClasses(className, coClass = false) {
        if (!this.initialized) {
            // console.warn('NetworkProcessor not initialized');
            return [];
        }

        const classData = this.classes.get(className);
        if (!classData) {
            // console.warn('Class not found:', className);
            return [];
        }

        const connected = new Set();
        
        // Add classes that contain this class
        for (const [name, data] of this.classes.entries()) {
            if (data.contains.has(className)) {
                connected.add(name);
            }
        }

        // Add classes that this class contains
        for (const target of classData.contains) {
            connected.add(target);
        }

        // Add equal classes
        for (const equal of classData.equals) {
            connected.add(equal);
        }

        // Add co-class
        console.log(classData);
        console.log(classData.coClass);
        if (coClass && classData.coClass !== null) {
            connected.add(classData.coClass);
        }

        // Only return classes that are not already selected
        return Array.from(connected).filter(c => !this.selectedClasses.has(c));
    }

    hasIndirectPath(source, target, avoidNode = null) {
        // console.log(`\n=== Finding Indirect Path ===`);
        // console.log(`Looking for indirect path from ${source} (smaller) to ${target} (bigger)`);
        
        // DFS to find an indirect path from source to target, following trim_within (smaller -> bigger)
        const stack = [];
        const visited = new Set();
        stack.push(source);
        visited.add(source);
        // console.log(`Starting DFS from ${source}`);

        while (stack.length > 0) {
            var current = stack.pop();
            // Skip if this is the node we want to avoid
            if (avoidNode && current === avoidNode) {
                continue;
            }
            // console.log(`\nVisiting node: ${current}`);
            var neighbors = this.classes.get(current).trim_within;
            // console.log(`Neighbors (bigger classes containing ${current}): ${Array.from(neighbors).join(', ')}`);
            
            for (const neighbor of neighbors) {
                if (neighbor === target) {
                    if(current==source) {
                        // console.log(`Skipping direct edge to target: ${current} -> ${target}`);
                        continue; // skip direct edge
                    } else {
                        // console.log(`Found indirect path to target: ${current} -> ${target}`);
                        return true;
                    }
                } else if (!visited.has(neighbor)) {
                    // console.log(`Adding unvisited neighbor to stack: ${neighbor}`);
                    visited.add(neighbor);
                    stack.push(neighbor);
                } else{
                    // console.log(`Skipping visited neighbor: ${neighbor}`);
                }
            }
        }
        // console.log(`No indirect path found from ${source} to ${target}`);
        return false;
    }

    setLevels() {
        // console.log('\n=== Setting Levels ===');
        if (this.selectedClasses.size === 0) {
            // console.log('No classes selected, skipping level setting');
            return;
        }

        // Reset all levels to -1
        for (const classData of this.classes.values()) {
            classData.level = -1;
        }

        // Find root nodes (no nodes contain them) and leaf nodes (they don't contain any nodes)
        const rootNodes = [];
        const leafNodes = [];
        for (const className of this.selectedClasses) {
            const classData = this.classes.get(className);
            if (!classData) continue;

            const hasContainingClasses = Array.from(classData.trim_within)
                .some(within => this.selectedClasses.has(within));
            const hasContainedClasses = Array.from(classData.trim_contains)
                .some(contains => this.selectedClasses.has(contains));

            // console.log(`\nChecking node ${className}:`);
            // console.log('- Has containing classes:', hasContainingClasses);
            // console.log('- Has contained classes:', hasContainedClasses);
            // console.log('- Trim within:', Array.from(classData.trim_within));
            // console.log('- Trim contains:', Array.from(classData.trim_contains));

            if (!hasContainingClasses) {
                rootNodes.push(className);
                // console.log(`Found root node: ${className}`);
            }
            if (!hasContainedClasses) {
                leafNodes.push(className);
                // console.log(`Found leaf node: ${className}`);
            }
        }

        // Calculate minimum levels (from bottom up)
        const minLevels = {};
        for (const leaf of leafNodes) {
            minLevels[leaf] = 0;  // Leaf nodes start at level 0
            // console.log(`Set leaf node ${leaf} to level 0`);
        }

        // Process queue for bottom-up
        const queue = [...leafNodes];
        while (queue.length > 0) {
            const current = queue.shift();
            const currentLevel = minLevels[current];
            const currentClass = this.classes.get(current);

            for (const source of currentClass.trim_within) {
                if (!this.selectedClasses.has(source)) continue;
                if (!(source in minLevels) || minLevels[source] < currentLevel + 1) {
                    minLevels[source] = currentLevel + 1;
                    queue.push(source);
                }
            }
        }

        // Calculate maximum levels (from top down)
        const maxLevels = {};
        // Start root nodes at a fixed level (number of levels - 1)
        const maxLevel = Object.keys(minLevels).length - 1;
        for (const root of rootNodes) {
            maxLevels[root] = maxLevel;
            // console.log(`Set root node ${root} to max level ${maxLevel}`);
        }

        // Process queue for top-down
        const topDownQueue = [...rootNodes];
        while (topDownQueue.length > 0) {
            const current = topDownQueue.shift();
            const currentLevel = maxLevels[current];
            const currentClass = this.classes.get(current);

            // console.log(`\nProcessing node ${current} at level ${currentLevel}:`);
            // console.log('Contains:', Array.from(currentClass.trim_contains));

            for (const target of currentClass.trim_contains) {
                if (!this.selectedClasses.has(target)) continue;
                const newLevel = currentLevel - 1;
                if (!(target in maxLevels) || maxLevels[target] > newLevel) {
                    maxLevels[target] = newLevel;
                    // console.log(`Set ${target} to max level ${newLevel}`);
                    topDownQueue.push(target);
                }
            }
        }

        // Set each node's level to the average of its min and max levels
        this.maxAvgLevel = 0;
        this.maxMaxLevel = 0;
        const levels = {};

        for (const className of this.selectedClasses) {
            const classData = this.classes.get(className);
            if (!classData) continue;

            const minLevel = minLevels[className] || 0;
            const maxLevel = maxLevels[className] || 0;  // Changed from maxLevel to 0 as default
            const avgLevel = Math.ceil((minLevel + maxLevel) / 2);

            // console.log(`\nSetting level for ${className}:`);
            // console.log('- Min level:', minLevel);
            // console.log('- Max level:', maxLevel);
            // console.log('- Average level:', avgLevel);
            // console.log('- Is leaf node:', leafNodes.includes(className));

            classData.maxLevel = maxLevel;
            classData.level = avgLevel;

            if (!(avgLevel in levels)) {
                levels[avgLevel] = [];
            }
            levels[avgLevel].push(classData);

            this.maxAvgLevel = Math.max(this.maxAvgLevel, avgLevel);
            this.maxMaxLevel = Math.max(this.maxMaxLevel, maxLevel);
        }

        this.minLevel = 0;

        // console.log('Levels set:', {
        //     maxAvgLevel: this.maxAvgLevel,
        //     maxMaxLevel: this.maxMaxLevel,
        //     minLevel: this.minLevel,
        //     levels: Object.keys(levels).map(level => ({
        //         level: parseInt(level),
        //         classes: levels[level].map(c => c.id)
        //     }))
        // });
    }

    setPositions() {
        // console.log('\n=== Setting Positions ===');
        if (this.selectedClasses.size === 0) {
            // console.log('No classes selected, skipping position setting');
            return;
        }

        // Get visible nodes and their levels
        const nodesPerLevel = {};
        let maxLevel = 0;
        for (const className of this.selectedClasses) {
            const classData = this.classes.get(className);
            if (!classData) continue;

            const level = classData.level;
            if (!(level in nodesPerLevel)) {
                nodesPerLevel[level] = [];
            }
            nodesPerLevel[level].push(classData);
            maxLevel = Math.max(maxLevel, level);
        }

        // Sort nodes within each level by ID for deterministic ordering
        for (const level in nodesPerLevel) {
            nodesPerLevel[level].sort((a, b) => a.id.localeCompare(b.id));
        }

        // Sort levels from top to bottom
        const sortedLevels = Object.keys(nodesPerLevel).sort((a, b) => parseInt(a) - parseInt(b));
        const width = 1500;
        const height = 1000;

        // console.log('Processing levels:', sortedLevels);

        // First pass: top to bottom
        for (let i = 0; i < sortedLevels.length; i++) {
            const currentLevel = parseInt(sortedLevels[i]);
            const currentNodes = nodesPerLevel[currentLevel];
            
            // console.log(`\nProcessing level ${currentLevel} with ${currentNodes.length} nodes`);

            if (i === 0) {
                // For the first level, just space nodes evenly
                for (let idx = 0; idx < currentNodes.length; idx++) {
                    currentNodes[idx].x = width * (idx + 1) / (currentNodes.length + 1);
                    // console.log(`Set initial position for ${currentNodes[idx].id}: x = ${currentNodes[idx].x}`);
                }
            } else {
                // Calculate barycenter for each node
                const nodePositions = [];
                for (const node of currentNodes) {
                    // Get nodes below this one that it's connected to
                    const connectedNodes = Array.from(node.trim_contains)
                        .filter(target => this.selectedClasses.has(target))
                        .map(target => this.classes.get(target));

                    let barycenter;
                    if (connectedNodes.length > 0) {
                        barycenter = connectedNodes.reduce((sum, n) => sum + n.x, 0) / connectedNodes.length;
                        // console.log(`Calculated barycenter for ${node.id} from ${connectedNodes.length} connected nodes: ${barycenter}`);
                    } else {
                        // If no connections, place based on position in list
                        barycenter = width * (nodePositions.length + 1) / (currentNodes.length + 1);
                        // console.log(`No connections for ${node.id}, using default position: ${barycenter}`);
                    }
                    nodePositions.push([node, barycenter]);
                }

                // Sort nodes by their barycenter
                nodePositions.sort((a, b) => a[1] - b[1]);

                // Assign x positions while maintaining minimum spacing
                const minSpacing = width / (currentNodes.length + 1);
                for (let idx = 0; idx < nodePositions.length; idx++) {
                    nodePositions[idx][0].x = minSpacing * (idx + 1);
                    // console.log(`Set position for ${nodePositions[idx][0].id}: x = ${nodePositions[idx][0].x}`);
                }
            }
        }

        // Second pass: bottom to top (averaging with first pass positions)
        for (let i = sortedLevels.length - 1; i >= 0; i--) {
            const currentLevel = parseInt(sortedLevels[i]);
            const currentNodes = nodesPerLevel[currentLevel];

            if (i === sortedLevels.length - 1) {
                continue; // Skip bottom level as it's already positioned
            }

            const nextLevel = parseInt(sortedLevels[i + 1]);
            const nextNodes = nodesPerLevel[nextLevel];

            // console.log(`\nAveraging positions for level ${currentLevel} with next level ${nextLevel}`);

            // Calculate and average with bottom-up barycenter
            for (const node of currentNodes) {
                const connectedNodes = nextNodes.filter(n => 
                    node.trim_contains.has(n.id) || n.trim_within.has(node.id)
                );

                if (connectedNodes.length > 0) {
                    const bottomUpBarycenter = connectedNodes.reduce((sum, n) => sum + n.x, 0) / connectedNodes.length;
                    // Average with current position
                    node.x = (node.x + bottomUpBarycenter) / 2;
                    // console.log(`Averaged position for ${node.id}: x = ${node.x} (from ${connectedNodes.length} connected nodes)`);
                }
            }
        }

        // Set y positions based on levels
        for (const level in nodesPerLevel) {
            const levelSpacing = height * 0.5;
            const yPos = (maxLevel - parseInt(level)) * levelSpacing + levelSpacing / 2;
            // console.log(`\nSetting y positions for level ${level}: y = ${yPos}`);

            for (const node of nodesPerLevel[level]) {
                const oldX = node.x;
                const oldY = node.y;
                node.y = yPos;
                node.x = node.x * 3;
                // console.log(`Position for ${node.id}: (${oldX}, ${oldY}) -> (${node.x}, ${node.y})`);
            }
        }

        // Verify positions were set
        // console.log('\n=== Verifying Positions ===');
        for (const className of this.selectedClasses) {
            const classData = this.classes.get(className);
            if (classData) {
                // console.log(`${className}: level=${classData.level}, position=(${classData.x}, ${classData.y})`);
            }
        }
    }
}

// Create a global instance
// console.log('Creating global NetworkProcessor instance');
window.networkProcessor = new NetworkProcessor(); 