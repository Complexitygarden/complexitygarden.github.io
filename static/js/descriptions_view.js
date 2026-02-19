

function renderDescriptionsView() {
    const container = document.getElementById('mainInner');
    console.log("Descriptions view page: changing the container");
    
    //console.log(container);

    if (!container) return;

    // Clear existing visualization
    container.innerHTML = '';

    // Get selected classes from network processor
    const selectedClasses = window.networkProcessor ? 
        window.networkProcessor.getSelectedClasses() : [];

    console.log(window.networkProcessor.getSelectedClasses());

    if (selectedClasses.length === 0) {
        container.innerHTML = `
            <div class="descriptions-empty-state">
                <p>No complexity classes selected.</p>
                <p>Use the search bar to add classes to view their descriptions.</p>
            </div>
        `;
        return;
    }

    // Create descriptions container
    const descriptionsContainer = document.createElement('div');
    descriptionsContainer.className = 'descriptions-container';
    descriptionsContainer.innerHTML = `
        <div class="descriptions-header">
            <div class="results-count" id="descResultsCount"></div>
        </div>
        <div class="descriptions-grid" id="descriptionsGrid"></div>
    `;
    container.appendChild(descriptionsContainer);

    // Build and render cards
    const classes = selectedClasses.map(classId => {
        const classData = window.networkProcessor.getClass(classId);
        if (!classData) return null; 
        return toDescriptionCardShape(classId, classData);
    }).filter(Boolean);

    renderDescriptionCards(classes);
}

function toDescriptionCardShape(id, classData) {
    return {
        id: id.toLowerCase(),
        name: classData.name || id,
        latex_name: classData.latex_name || id,
        fullName: classData.description || '',
        tags: classData.tags || ['Complexity'],
        definition: classData.definition || 'No definition available.',
        information: classData.information || '',
        see_also: classData.see_also || []
    };
}

function renderDescriptionCards(classes) {
    const grid = document.getElementById('descriptionsGrid');
    const resultsCount = document.getElementById('descResultsCount');

    if (!grid) return;

    resultsCount.textContent = `Showing ${classes.length} complexity ${classes.length === 1 ? 'class' : 'classes'}`;

    grid.innerHTML = classes.map(c => createDescriptionCard(c)).join('');

    // Add event listeners to accordion triggers
    document.querySelectorAll('.desc-accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', toggleDescriptionAccordion);
    });

    // Add clicks to see also buttons
    document.querySelectorAll('.desc-see-also-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            addDescriptionClassById(btn.dataset.classId);
        });
    });

    // Process MathJax for LaTeX rendering
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([grid]).catch(err => console.log('MathJax error:', err));
    }
}

function createDescriptionCard(complexityClass) {
    const definition = createDescriptionAccordionItem('Definition', 
        `<p>${formatDescriptionContent(complexityClass.definition)}</p>`);

    const information = complexityClass.information ? 
        createDescriptionAccordionItem('Useful Information', 
            `<p>${formatDescriptionContent(complexityClass.information)}</p>`) : '';

    const seeAlsoItems = (Array.isArray(complexityClass.see_also) ? complexityClass.see_also : [])
        .map(rel => {
            const relId = rel.trim().toUpperCase();
            const relClass = window.networkProcessor ? window.networkProcessor.getClass(relId) : null;
            const label = relClass?.name || rel;

            return `
                <li>
                    <button
                        type="button"
                        class="desc-see-also-add desc-see-also-btn"
                        data-class-id="${relId}"
                    >${label}</button>
                </li>
            `;
        })
        .join('');

    const seeAlso = seeAlsoItems.length > 0 ? 
        createDescriptionAccordionItem('See Also', `<ul>${seeAlsoItems}</ul>`) : '';

    const tagsHtml = (Array.isArray(complexityClass.tags) ? complexityClass.tags : [complexityClass.tags])
        .filter(Boolean)
        .map(tag => `<span class="desc-badge">${tag}</span>`)
        .join(' ');

    return `
        <div class="desc-card">
            <div class="desc-card-header">
                <h2 class="desc-card-title">$${complexityClass.latex_name}$</h2>
                <p class="desc-card-subtitle">${complexityClass.fullName}</p>
                ${tagsHtml}
            </div>
            <div class="desc-card-content">
                ${definition}
                ${information}
                ${seeAlso}
            </div>
        </div>
    `;
}

function createDescriptionAccordionItem(title, content) {
    return `
        <div class="desc-accordion-item">
            <button class="desc-accordion-trigger">
                ${title}
                <svg class="desc-accordion-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="desc-accordion-content">
                <div class="desc-accordion-content-inner">
                    ${content}
                </div>
            </div>
        </div>
    `;
}

function toggleDescriptionAccordion(e) {
    const trigger = e.currentTarget;
    const content = trigger.nextElementSibling;
    const isActive = trigger.classList.contains('active');

    if (isActive) {
        trigger.classList.remove('active');
        content.style.maxHeight = null;
    } else {
        trigger.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
    }
}

function addDescriptionClassById(classId) {
    if (!classId || !window.networkProcessor) return;

    const id = String(classId).toUpperCase();

    // Already selected
    if (window.networkProcessor.isClassSelected(id)) return;

    // Select the class
    window.networkProcessor.selectClass(id);

    // Re-render descriptions view
    renderDescriptionsView();

    // Track the change
    if (typeof trackVisualizationChange === 'function') {
        trackVisualizationChange("Class Added from Description", `Added ${id} via See Also`);
    }
}

function formatDescriptionContent(text) {
    if (!text) return '';
    
    // Use the existing link_classes_information function if available
    if (typeof link_classes_information === 'function') {
        return link_classes_information(text);
    }
    return text;
}

// Make function globally available
window.renderDescriptionsView = renderDescriptionsView;