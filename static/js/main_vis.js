// Main javascript file which controls visualisation of the complexity classes

// console.log("Testing if the new version is working.")

// Key variables for visualization coordination
var vis_type = 'graph';
var gravity = true;
var id_visualisation_div = "#visualisation_div";

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// SVG and zoom setup
var vis_svg;
var zoom;

// Initialize the visualization
async function initializeVisualization() {
    try {
        // Initialize network processor
        window.networkProcessor = new NetworkProcessor();
        
        // Load data files
        const [classesData, theoremsData] = await Promise.all([
            fetch('../classes.json').then(response => response.json()),
            fetch('../theorems.json').then(response => response.json())
        ]);

        // Initialize network processor with data
        await networkProcessor.initialize(classesData, theoremsData);

        // Check for shared configuration first
        const urlParams = new URLSearchParams(window.location.search);
        const configParam = urlParams.get('config');
        
        if (configParam) {
            const sharedClasses = decodeSharedConfiguration(configParam);
            if (sharedClasses && Array.isArray(sharedClasses)) {
                // Clear any existing history since we're loading a shared config
                if (window.graphHistory) {
                    window.graphHistory = [];
                    window.currentHistoryIndex = -1;
                }
                
                // Select the shared classes
                let validClasses = 0;
                sharedClasses.forEach(className => {
                    networkProcessor.selectClass(className);
                    
                    // Check if the class is actually selected instead of relying on return value
                    if (networkProcessor.isClassSelected(className)) {
                        validClasses++;
                    }
                });
                
                if (validClasses > 0) {
                    // Track the configuration load AFTER clearing history
                    if (typeof trackVisualizationChange === 'function') {
                        trackVisualizationChange("Shared Configuration Loaded", `Started from shared link with ${validClasses} classes: ${sharedClasses.filter(c => networkProcessor.isClassSelected(c)).join(", ")}`);
                    } else {
                        // Defer the call until the function is available
                        setTimeout(() => {
                            if (typeof trackVisualizationChange === 'function') {
                                trackVisualizationChange("Shared Configuration Loaded", `Started from shared link with ${validClasses} classes: ${sharedClasses.filter(c => networkProcessor.isClassSelected(c)).join(", ")}`);
                            }
                        }, 100);
                    }
                    
                    // Keep config parameter in URL to allow bookmarking of the current configuration
                    // const newURL = window.location.origin + window.location.pathname;
                    // window.history.replaceState({}, document.title, newURL);
                } else {
                    // Fall back to default classes if no shared classes were valid
                    selectDefaultClasses();
                }
            } else {
                // Fall back to default classes if shared config is invalid
                selectDefaultClasses();
            }
        } else {
            // No shared configuration, use default classes
            selectDefaultClasses();
        }

        // Setup SVG and zoom
        setupVisualization();

        // Create initial visualization
        create_visualisation();
    } catch (error) {
        console.error('Error in initialization:', error);
    }
}

// Setup SVG and zoom
function setupVisualization() {
    // Clear any existing SVG
    d3.select(id_visualisation_div).selectAll("*").remove();

    // Create zoom behavior
    zoom = d3.zoom()
        .on("zoom", function() {
            vis_svg.attr("transform", d3.event.transform);
        });

    // Create SVG
    vis_svg = d3.select(id_visualisation_div)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", "0 0 " + window.innerWidth + " " + window.innerHeight)
        .classed("svg-content-responsive", true)
        .call(zoom)
        .append("g");
}

// Create visualization based on selected type
function create_visualisation() {
    if (vis_type === 'graph') {
        draw_graph();
    } else if (vis_type === 'sunburst') {
        draw_sunburst();
    }
}

// Redraw visualization
function redrawVisualization() {
    create_visualisation();
}

//should this function be in a new js file or is it alright here?
function link_classes_information(information_text)
{
    const all_classes = networkProcessor.getAllClasses();

    //sort longest to shortest, so that more complex names match first (like PDQP/qpoly matched before just PDQP)
    const sorted_classes = all_classes.sort((a, b) => b.id.length - a.id.length);


    //fix escaped characters bc we are going to turn this into regex
    const escaped_class_names = sorted_classes.map(c => c.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    //this takes something like BQP?\poly and turns it into BQP\?\\poly (just in case, so that we don't get regex errors)


    //This matches $\\mathsf{CLASS_NAME}$
    //Make sure to always use the dollar signs in the classes.json
    //const regex = new RegExp(`\\$\\\\mathsf\\{(${escaped_class_names.join('|')})\\}\\$`, 'g');

    //this matches just classnames
    const regex = new RegExp(`\\b(${escaped_class_names.join('|')})\\b`, 'g');
    //joins the escaped class names into a single alternation group using "|"

    const segments = information_text.split(/(\$[^$]*\$)/);

    const processed = segments.map(segment =>{
        if (segment.startsWith('$') && segment.endsWith('$')) {
            //inside math mode, don't add dollar signs
            return segment.replace(regex, (match, class_id) => {
                const classData = networkProcessor.getClass(class_id);
                if (!classData) return match;
                const latex = classData.latex_name || class_id;
                
                return `\\mathsf{${latex}}`;
                //return `\\class{clickable-class}{${latex}}`;
                //return `<a role="button" class="clickable-class" onclick="open_side_window(networkProcessor.getClass('${class_id}'))">${latex}</a>`;
            });

        }

        else {
            //outside math mode, add dollar signs

            return segment.replace(regex, (match, class_id) => {
                const classData = networkProcessor.getClass(class_id);
                if (!classData) return match;
                const latex = classData.latex_name || class_id;
                return `<a role="button" class="clickable-class" onclick="open_side_window(networkProcessor.getClass('${class_id}'))">\$${latex}\$</a>`;
            })
        }
    });

    return processed.join('');

}




// Open side window with class information
function open_side_window(d) {
    const classData = networkProcessor.getClass(d.id);
    if (!classData) {
        return;
    }

    const action = "Description";
    track_class_click(classData.id, { action });

    // Store navigation history
    if (!window.classHistory) {
        window.classHistory = [];
    }
    if (!window.classHistoryIndex) {
        window.classHistoryIndex = -1;
    }
    
    // Add to history (only if it's a new navigation, not back/forward)
    if (!window.navigatingHistory) {
        // Remove any history after current index
        window.classHistory = window.classHistory.slice(0, window.classHistoryIndex + 1);
        window.classHistory.push(classData.id);
        window.classHistoryIndex = window.classHistory.length - 1;
    }

    // Show class panel and hide welcome state
    document.getElementById('welcome-state').style.display = 'none';
    document.getElementById('class-panel').style.display = 'flex';

    // Update navigation
    updateNavigationButtons();
    
    // Populate class information
    populateComplexityClassPanel(classData);

    // Open the sidebar
    document.getElementById('openRightSidebarMenu').checked = true;
}

function updateNavigationButtons() {
    const backButton = document.getElementById('back-button');
    const closeButton = document.getElementById('close-panel-button');
    
    // Update back button
    if (AppState.navigationHistory.length > 0) {
        backButton.style.display = 'flex';
        backButton.onclick = () => navigateBack();
    } else {
        backButton.style.display = 'none';
    }
    
    // Setup close button
    closeButton.onclick = () => {
        document.getElementById('openRightSidebarMenu').checked = false;
        AppState.selectedClass = null;
        AppState.navigationHistory = [];
        showWelcomeState();
    };
}

function showWelcomeState() {
    document.getElementById('welcome-state').style.display = 'flex';
    document.getElementById('class-panel').style.display = 'none';
}

function populateComplexityClassPanel(classData) {
    console.log("Populating panel for:", classData.name);
    
    // Get enhanced data
    let enhancedData = null;
    try {
        if (typeof getEnhancedClassData !== 'undefined') {
            enhancedData = getEnhancedClassData(classData.name);
        }
    } catch (error) {
        console.error("Error getting enhanced data:", error);
    }
    
    // If no enhanced data, create basic structure
    if (!enhancedData) {
        enhancedData = {
            examples: [],
            applications: [],
            keyRelationships: [],
            relatedClasses: [],
            references: []
        };
    }
    
    // Populate header
    populateClassHeader(classData);
    
    // Populate brief description
    populateBriefDescription(classData);
    
    // Populate definition
    populateDefinition(classData);
    
    // Populate useful information
    populateUsefulInformationNew(classData, enhancedData);
    
    // Populate links
    populateLinks(classData, enhancedData);
    
    // Populate see also section
    populateSeeAlso(classData, enhancedData);
    
    // Populate references
    populateReferencesNew(classData, enhancedData);
    
    // Process MathJax
    const elementsToTypeset = [
        document.getElementById('class-title'),
        document.getElementById('class-brief-description'),
        document.getElementById('class-description'),
        document.getElementById('class-examples'),
        document.getElementById('class-applications'),
        document.getElementById('class-relationships'),
        document.getElementById('class-links'),
        document.getElementById('related-classes-list'),
        document.getElementById('see-also-tags'),
        document.getElementById('see-also-links')
    ];
    
    MathJax.typesetPromise(elementsToTypeset.filter(el => el)).then(() => {
        setupClickableElements();
    });
}

function populateClassHeader(classData) {
    // Set title and full name
    document.getElementById('class-title').innerHTML = `$${classData.latex_name}$`;
    document.getElementById('class-full-name').textContent = classData.description?.split('.')[0] || classData.name;
    
    // Determine type and update badges
    const typeText = determineComplexityType(classData);
    const isDeterministic = determineDeterministic(classData);
    
    document.getElementById('type-text').textContent = typeText;
    document.getElementById('deterministic-text').textContent = isDeterministic ? 'Deterministic' : 'Non-deterministic';
}

function determineComplexityType(classData) {
    const name = classData.name.toLowerCase();
    if (name.includes('space') || name.includes('pspace') || name.includes('nspace')) {
        return 'space complexity';
    } else if (name.includes('time') || name.includes('p') || name.includes('np') || name.includes('exp')) {
        return 'time complexity';
    }
    return 'complexity';
}

function determineDeterministic(classData) {
    const name = classData.name.toLowerCase();
    return !name.startsWith('n') || name === 'nspace' || name === 'nl';
}

function populateBriefDescription(classData) {
    const briefDescElement = document.getElementById('class-brief-description');
    
    // Create a brief description from the information field or description field
    let briefDesc = '';
    
    if (classData.information) {
        // Extract first 1-2 sentences from information
        const infoText = classData.information.replace(/<[^>]*>/g, ' '); // Remove HTML tags
        const sentences = infoText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        briefDesc = sentences.slice(0, 2).join('. ').trim();
        if (briefDesc && !briefDesc.endsWith('.')) {
            briefDesc += '.';
        }
    } else if (classData.description) {
        // Fallback to description if information is not available
        briefDesc = classData.description;
    }
    
    if (!briefDesc) {
        briefDesc = 'No description available for this complexity class.';
    }
    
    briefDescElement.innerHTML = link_classes_information(briefDesc);
}

function populateDefinition(classData) {
    const descElement = document.getElementById('class-description');
    descElement.innerHTML = link_classes_information(classData.description) || 'No description available';
}

function populateUsefulInformationNew(classData, enhancedData) {
    // Populate examples
    const examplesElement = document.getElementById('class-examples');
    const examplesSection = document.getElementById('examples-section');
    
    if (enhancedData.examples && enhancedData.examples.length > 0) {
        examplesElement.innerHTML = '';
        enhancedData.examples.forEach(example => {
            const li = document.createElement('li');
            li.textContent = example;
            examplesElement.appendChild(li);
        });
        examplesSection.style.display = 'block';
    } else {
        examplesSection.style.display = 'none';
    }
    
    // Populate applications
    const applicationsElement = document.getElementById('class-applications');
    const applicationsSection = document.getElementById('applications-section');
    
    if (enhancedData.applications && enhancedData.applications.length > 0) {
        applicationsElement.innerHTML = '';
        enhancedData.applications.forEach(application => {
            const li = document.createElement('li');
            li.textContent = application;
            applicationsElement.appendChild(li);
        });
        applicationsSection.style.display = 'block';
    } else {
        applicationsSection.style.display = 'none';
    }
    
    // Populate key relationships
    const relationshipsElement = document.getElementById('class-relationships');
    const relationshipsSection = document.getElementById('relationships-section');
    
    if (enhancedData.keyRelationships && enhancedData.keyRelationships.length > 0) {
        relationshipsElement.innerHTML = '';
        enhancedData.keyRelationships.forEach(relationship => {
            const li = document.createElement('li');
            li.innerHTML = link_classes_information(relationship);
            relationshipsElement.appendChild(li);
        });
        relationshipsSection.style.display = 'block';
    } else {
        relationshipsSection.style.display = 'none';
    }
}

function populateLinks(classData, enhancedData) {
    const linksElement = document.getElementById('class-links');
    linksElement.innerHTML = '';
    
    // Check for links in classData or enhancedData
    const linksList = classData.links || enhancedData.links || [];
    
    if (linksList && linksList.length > 0) {
        linksList.forEach(link => {
            const li = document.createElement('li');
            
            if (typeof link === 'object' && link.url) {
                // Link with URL and title
                li.innerHTML = `
                    <a href="${link.url}" target="_blank">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        <span>${link.title}</span>
                    </a>
                `;
            } else if (typeof link === 'string') {
                // Plain text link or URL
                if (link.startsWith('http://') || link.startsWith('https://')) {
                    li.innerHTML = `
                        <a href="${link}" target="_blank">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                            <span>${link}</span>
                        </a>
                    `;
                } else {
                    // Plain text (non-clickable)
                    li.innerHTML = `
                        <div class="link-text">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                            </svg>
                            <span>${link}</span>
                        </div>
                    `;
                }
            }
            
            linksElement.appendChild(li);
        });
    } else {
        // Show a message when no links are available
        const li = document.createElement('li');
        li.innerHTML = '<div class="link-text">No links available for this complexity class.</div>';
        linksElement.appendChild(li);
    }
}

function populateSeeAlso(classData, enhancedData) {
    // Populate Related Classes
    populateSeeAlsoClasses(classData, enhancedData);
    
    // Populate Tags
    populateSeeAlsoTags(classData, enhancedData);
    
    // Populate Links
    populateSeeAlsoLinks(classData, enhancedData);
}

function populateSeeAlsoClasses(classData, enhancedData) {
    const relatedElement = document.getElementById('related-classes-list');
    const sectionElement = document.getElementById('see-also-classes-section');
    relatedElement.innerHTML = '';
    
    // Check for seeAlso classes in classData or enhancedData
    const seeAlsoClasses = classData.seeAlso || enhancedData.seeAlso || enhancedData.relatedClasses || [];
    
    if (seeAlsoClasses && seeAlsoClasses.length > 0) {
        sectionElement.style.display = 'block';
        seeAlsoClasses.slice(0, 3).forEach(relatedClass => {
            const item = document.createElement('div');
            item.className = 'related-class-item clickable-class';
            const className = typeof relatedClass === 'string' ? relatedClass : relatedClass.name;
            item.dataset.class = className;
            item.innerHTML = `
                <div class="related-class-content">
                    <div class="related-class-name">$\\mathsf{${className}}$</div>
                </div>
            `;
            item.onclick = () => {
                handleClassSelect(className);
            };
            relatedElement.appendChild(item);
        });
    } else {
        // Fallback: extract related classes from text
        const textContent = (classData.description || '') + ' ' + (classData.information || '');
        const allClasses = networkProcessor.getAllClasses();
        const foundClasses = [];
        
        Object.keys(allClasses).forEach(className => {
            if (className !== classData.name && 
                (textContent.includes(className) || textContent.includes(`\\mathsf{${className}}`))) {
                foundClasses.push(className);
            }
        });
        
        if (foundClasses.length > 0) {
            sectionElement.style.display = 'block';
            foundClasses.slice(0, 3).forEach(className => {
                const item = document.createElement('div');
                item.className = 'related-class-item clickable-class';
                item.dataset.class = className;
                
                item.innerHTML = `
                    <div class="related-class-content">
                        <div class="related-class-name">$\\mathsf{${className}}$</div>
                    </div>
                `;
                
                relatedElement.appendChild(item);
            });
        } else {
            sectionElement.style.display = 'none';
        }
    }
}

function populateSeeAlsoTags(classData, enhancedData) {
    const tagsElement = document.getElementById('see-also-tags');
    const sectionElement = document.getElementById('see-also-tags-section');
    tagsElement.innerHTML = '';
    
    // Check for tags in classData or enhancedData
    const tagsList = classData.tags || enhancedData.tags || [];
    
    if (tagsList && tagsList.length > 0) {
        sectionElement.style.display = 'block';
        tagsList.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            tagsElement.appendChild(tagElement);
        });
    } else {
        sectionElement.style.display = 'none';
    }
}

function populateSeeAlsoLinks(classData, enhancedData) {
    const linksElement = document.getElementById('see-also-links');
    const sectionElement = document.getElementById('see-also-links-section');
    linksElement.innerHTML = '';
    
    // Check for links in classData or enhancedData
    const linksList = classData.links || enhancedData.links || [];
    
    if (linksList && linksList.length > 0) {
        sectionElement.style.display = 'block';
        linksList.forEach(link => {
            const li = document.createElement('li');
            
            if (typeof link === 'object' && link.url) {
                li.innerHTML = `
                    <a href="${link.url}" target="_blank">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        <span>${link.title}</span>
                    </a>
                `;
            } else if (typeof link === 'string') {
                if (link.startsWith('http://') || link.startsWith('https://')) {
                    li.innerHTML = `
                        <a href="${link}" target="_blank">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                            <span>${link}</span>
                        </a>
                    `;
                } else {
                    li.innerHTML = `<div class="link-text">${link}</div>`;
                }
            }
            
            linksElement.appendChild(li);
        });
    } else {
        sectionElement.style.display = 'none';
    }
}

function populateReferencesNew(classData, enhancedData) {
    const referencesElement = document.getElementById('class-references');
    referencesElement.innerHTML = '';
    
    // Add enhanced references
    if (enhancedData.references && enhancedData.references.length > 0) {
        enhancedData.references.forEach(ref => {
            const item = document.createElement('div');
            item.className = 'reference-item';
            
            if (typeof ref === 'object' && ref.url) {
                item.innerHTML = `
                    <a href="${ref.url}" target="_blank" class="reference-link">
                        ${ref.title}
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                    </a>
                `;
            } else {
                item.innerHTML = `<div class="reference-text">${typeof ref === 'string' ? ref : ref.title}</div>`;
            }
            
            referencesElement.appendChild(item);
        });
    }
    
    // Add Complexity Zoo link
    const zooItem = document.createElement('div');
    zooItem.className = 'reference-item';
    zooItem.innerHTML = `
        <a href="https://complexityzoo.net/Complexity_Zoo:${classData.name.charAt(0).toUpperCase()}#${classData.name.toLowerCase()}" 
           target="_blank" class="reference-link">
            Complexity Zoo
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
        </a>
    `;
    referencesElement.appendChild(zooItem);
}

function setupClickableElements() {
    document.querySelectorAll('.clickable-class').forEach(el => {
        el.onclick = (e) => {
            e.preventDefault();
            const className = el.dataset.class;
            if (className) {
                handleClassSelect(className);
            }
        };
    });
}

// Helper function to navigate back in class history
function navigateBack() {
    AppState.navigateBack();
}

// Helper function to populate useful information sections
function populateUsefulInformation(classData, enhancedData) {
    console.log("Populating useful information for:", classData.name);
    console.log("Enhanced data:", enhancedData);
    
    // Special handling for PSPACE as a test
    if (classData.name === 'PSPACE') {
        console.log("Special PSPACE handling");
        
        // Force populate examples for PSPACE
        const examplesElement = document.getElementById('class-examples');
        if (examplesElement) {
            const pspaceExamples = [
                "Quantified Boolean Formula (QBF)",
                "Geography game", 
                "Regular expression equivalence",
                "Linear space reachability"
            ];
            let examplesHtml = '<ul>';
            pspaceExamples.forEach(example => {
                examplesHtml += `<li>${example}</li>`;
            });
            examplesHtml += '</ul>';
            examplesElement.innerHTML = examplesHtml;
            document.getElementById('examples-subsection').style.display = 'block';
            console.log("PSPACE examples hardcoded successfully");
        }
        
        // Force populate applications for PSPACE
        const applicationsElement = document.getElementById('class-applications');
        if (applicationsElement) {
            const pspaceApplications = [
                "Game theory and two-player games",
                "Model checking and verification",
                "Planning problems in AI",
                "Database query evaluation"
            ];
            let applicationsHtml = '<ul>';
            pspaceApplications.forEach(application => {
                applicationsHtml += `<li>${application}</li>`;
            });
            applicationsHtml += '</ul>';
            applicationsElement.innerHTML = applicationsHtml;
            document.getElementById('applications-subsection').style.display = 'block';
            console.log("PSPACE applications hardcoded successfully");
        }
        
        return; // Skip the rest for PSPACE test
    }
    
    // Regular logic for other classes
    const examplesElement = document.getElementById('class-examples');
    console.log("Examples element:", examplesElement);
    
    if (enhancedData && enhancedData.examples && enhancedData.examples.length > 0) {
        console.log("Found examples:", enhancedData.examples);
        let examplesHtml = '<ul>';
        enhancedData.examples.forEach(example => {
            examplesHtml += `<li>${example}</li>`;
        });
        examplesHtml += '</ul>';
        examplesElement.innerHTML = examplesHtml;
        document.getElementById('examples-subsection').style.display = 'block';
        console.log("Examples populated successfully");
    } else {
        console.log("No examples found, hiding section");
        document.getElementById('examples-subsection').style.display = 'none';
    }

    // Populate applications
    const applicationsElement = document.getElementById('class-applications');
    console.log("Applications element:", applicationsElement);
    
    if (enhancedData && enhancedData.applications && enhancedData.applications.length > 0) {
        console.log("Found applications:", enhancedData.applications);
        let applicationsHtml = '<ul>';
        enhancedData.applications.forEach(application => {
            applicationsHtml += `<li>${application}</li>`;
        });
        applicationsHtml += '</ul>';
        applicationsElement.innerHTML = applicationsHtml;
        document.getElementById('applications-subsection').style.display = 'block';
        console.log("Applications populated successfully");
    } else {
        console.log("No applications found, hiding section");
        document.getElementById('applications-subsection').style.display = 'none';
    }

    // Populate key relationships
    const relationshipsElement = document.getElementById('class-relationships');
    if (enhancedData.keyRelationships && enhancedData.keyRelationships.length > 0) {
        let relationshipsHtml = '<ul>';
        enhancedData.keyRelationships.forEach(relationship => {
            relationshipsHtml += `<li>${link_classes_information(relationship)}</li>`;
        });
        relationshipsHtml += '</ul>';
        relationshipsElement.innerHTML = relationshipsHtml;
        document.getElementById('relationships-subsection').style.display = 'block';
    } else {
        document.getElementById('relationships-subsection').style.display = 'none';
    }

    // Populate additional information from original data
    const additionalInfoElement = document.getElementById('class-additional-info');
    if (classData.information) {
        const processedInfo = link_classes_information(classData.information);
        additionalInfoElement.innerHTML = format_information(processedInfo);
        document.getElementById('additional-info-subsection').style.display = 'block';
    } else {
        document.getElementById('additional-info-subsection').style.display = 'none';
    }
}

// Helper function to populate enhanced related classes section
function populateEnhancedRelatedClasses(classData, enhancedData) {
    const relatedElement = document.getElementById('related-classes-list');
    let relatedHtml = '';
    
    if (enhancedData.relatedClasses && enhancedData.relatedClasses.length > 0) {
        enhancedData.relatedClasses.forEach(relatedClass => {
            const arrow = getRelationshipArrow(relatedClass.direction);
            relatedHtml += `
                <div class="related-class-item clickable-class" data-class="${relatedClass.name}">
                    <div class="related-class-info">
                        <div class="related-class-name">$\\mathsf{${relatedClass.name}}$</div>
                        <div class="related-class-relationship">${relatedClass.relationship}</div>
                    </div>
                    <div class="relationship-arrow">${arrow}</div>
                </div>
            `;
        });
    } else {
        // Fallback to automatic detection
        const allClasses = networkProcessor.getAllClasses();
        const relatedClasses = new Set();
        
        // Look for classes mentioned in the description and information
        const textContent = (classData.description || '') + ' ' + (classData.information || '');
        
        // Extract class names from text (look for \mathsf{...} patterns)
        const classPattern = /\\mathsf\{([^}]+)\}/g;
        let match;
        while ((match = classPattern.exec(textContent)) !== null) {
            const className = match[1];
            if (allClasses[className] && className !== classData.name) {
                relatedClasses.add(className);
            }
        }
        
        if (relatedClasses.size > 0) {
            Array.from(relatedClasses).slice(0, 6).forEach(className => {
                relatedHtml += `
                    <div class="related-class-item clickable-class" data-class="${className}">
                        <div class="related-class-info">
                            <div class="related-class-name">$\\mathsf{${className}}$</div>
                            <div class="related-class-relationship">Related class</div>
                        </div>
                        <div class="relationship-arrow">→</div>
                    </div>
                `;
            });
        }
    }
    
    if (relatedHtml === '') {
        relatedHtml = '<p style="color: rgba(255,255,255,0.6);">No related classes available.</p>';
    }
    
    relatedElement.innerHTML = relatedHtml;
}

// Helper function to get relationship arrow based on direction
function getRelationshipArrow(direction) {
    switch (direction) {
        case 'subset': return '⊆';
        case 'superset': return '⊇';
        case 'equal': return '=';
        case 'complement': return '¬';
        case 'unknown': return '?';
        default: return '→';
    }
}

// Helper function to populate enhanced references section  
function populateEnhancedReferences(classData, enhancedData) {
    const referencesElement = document.getElementById('class-references');
    let referencesHtml = '';
    
    // Use enhanced references if available
    if (enhancedData.references && enhancedData.references.length > 0) {
        referencesHtml += '<ul>';
        enhancedData.references.forEach(ref => {
            referencesHtml += `<li>${ref}</li>`;
        });
        referencesHtml += '</ul>';
    }
    
    // Extract additional references from information text (look for [ABC123] patterns)
    const text = (classData.information || '') + ' ' + (classData.description || '');
    const referencePattern = /\[([A-Za-z0-9]+)\]/g;
    const foundRefs = new Set();
    let match;
    
    while ((match = referencePattern.exec(text)) !== null) {
        foundRefs.add(match[1]);
    }
    
    if (foundRefs.size > 0) {
        if (referencesHtml !== '') referencesHtml += '<br>';
        referencesHtml += '<div class="references-list">';
        foundRefs.forEach(ref => {
            referencesHtml += `<div class="reference-item">[${ref}]</div>`;
        });
        referencesHtml += '</div>';
    }
    
    // Add external resources
    referencesHtml += '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">';
    referencesHtml += '<h4 style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255,255,255,0.8);">External Resources</h4>';
    referencesHtml += `<a href="https://complexityzoo.net/Complexity_Zoo:${classData.name.charAt(0).toUpperCase()}#${classData.name.toLowerCase()}" target="_blank" class="external-link">Complexity Zoo →</a>`;
    referencesHtml += '</div>';
    
    if (referencesHtml === '') {
        referencesHtml = '<p style="color: rgba(255,255,255,0.6);">No references available.</p>';
    }
    
    referencesElement.innerHTML = referencesHtml;
}

// Function to show initial state of right panel
function showInitialPanelState() {
    showWelcomeState();
    
    // Setup close button
    const closeButton = document.getElementById('close-panel-button');
    if (closeButton) {
        closeButton.onclick = () => {
            document.getElementById('openRightSidebarMenu').checked = false;
            showWelcomeState();
        };
    }
}

// Test function to populate content manually
function testPopulateContent() {
    console.log("Testing content population");
    
    // Test populating examples directly
    const examplesElement = document.getElementById('class-examples');
    if (examplesElement) {
        examplesElement.innerHTML = '<ul><li>Test example 1</li><li>Test example 2</li></ul>';
        document.getElementById('examples-subsection').style.display = 'block';
        console.log("Test examples populated");
    } else {
        console.error("Examples element not found");
    }
    
    // Test populating applications
    const applicationsElement = document.getElementById('class-applications');
    if (applicationsElement) {
        applicationsElement.innerHTML = '<ul><li>Test application 1</li><li>Test application 2</li></ul>';
        document.getElementById('applications-subsection').style.display = 'block';
        console.log("Test applications populated");
    } else {
        console.error("Applications element not found");
    }
}

// App State Management (similar to React component)
const AppState = {
    selectedClass: null,
    navigationHistory: [],
    sidebarOpen: false,
    
    setSelectedClass(classId) {
        if (this.selectedClass && this.selectedClass !== classId) {
            this.navigationHistory.push(this.selectedClass);
        }
        this.selectedClass = classId;
        this.updateUI();
    },
    
    navigateBack() {
        const previousClass = this.navigationHistory.pop();
        this.selectedClass = previousClass || null;
        this.updateUI();
    },
    
    navigateToClass(classId) {
        if (this.selectedClass) {
            this.navigationHistory.push(this.selectedClass);
        }
        this.selectedClass = classId;
        this.updateUI();
    },
    
    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        this.updateMobileMenu();
    },
    
    updateUI() {
        // Update navigation buttons
        updateNavigationButtons();
        
        // Update panel content
        if (this.selectedClass) {
            const classData = networkProcessor.getClass(this.selectedClass);
            if (classData) {
                populateComplexityClassPanel(classData);
                document.getElementById('welcome-state').style.display = 'none';
                document.getElementById('class-panel').style.display = 'flex';
            }
        } else {
            showWelcomeState();
        }
    },
    
    updateMobileMenu() {
        const menuIcon = document.getElementById('menu-icon');
        const closeIcon = document.getElementById('close-icon');
        const leftSidebar = document.getElementById('leftSidebarMenu');
        
        if (this.sidebarOpen) {
            menuIcon.style.display = 'none';
            closeIcon.style.display = 'block';
            leftSidebar.style.display = 'block';
        } else {
            menuIcon.style.display = 'block';
            closeIcon.style.display = 'none';
            leftSidebar.style.display = '';
        }
    }
};

// Initialize mobile menu toggle
function initializeMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            AppState.toggleSidebar();
        });
    }
}

// Update the open_side_window function to use AppState
function handleClassSelect(classId) {
    AppState.setSelectedClass(classId);
    document.getElementById('openRightSidebarMenu').checked = true;
}

// Initialize visualization when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeVisualization();
    showInitialPanelState();
    initializeMobileMenu();
    
    console.log("Complexity Class Explorer initialized");
});

// Add after other initialization code
function initializeVisualizationControls() {
    // Set up visualization type selector
    const visTypeSelect = document.getElementById('vis-type-select');
    if (visTypeSelect) {
        visTypeSelect.addEventListener('change', function(e) {
            const oldType = vis_type;
            vis_type = e.target.value;
            create_visualisation();
            trackSettingsChange("Visualization Type", `Changed from ${oldType} to ${vis_type}`);
        });
    }
}

// Call initialization when the window loads
window.addEventListener('load', initializeVisualizationControls);

// Helper function to decode shared configuration
function decodeSharedConfiguration(encodedConfig) {
    try {
        const jsonString = atob(encodedConfig);
        const classes = JSON.parse(jsonString);
        return classes;
    } catch (error) {
        return null;
    }
}

// Helper function to select default classes
function selectDefaultClasses() {
    const defaultClasses = ["P", "PSPACE", "BQP", "NP"];

    // Temporarily disable URL updates while loading the default configuration
    const previousUpdateSetting = networkProcessor.updateLocation;
    networkProcessor.updateLocation = false;

    const actuallySelected = [];
    defaultClasses.forEach(className => {
        networkProcessor.selectClass(className);
        if (networkProcessor.isClassSelected(className)) {
            actuallySelected.push(className);
        }
    });

    // Re-enable URL updates for future user interactions
    networkProcessor.updateLocation = previousUpdateSetting;

    // Track the initial setup
    if (typeof trackVisualizationChange === 'function') {
        trackVisualizationChange("Initial Load", `Default classes selected: ${actuallySelected.join(", ")}`);
    } else {
        setTimeout(() => {
            if (typeof trackVisualizationChange === 'function') {
                trackVisualizationChange("Initial Load", `Default classes selected: ${actuallySelected.join(", ")}`);
            }
        }, 100);
    }
}
