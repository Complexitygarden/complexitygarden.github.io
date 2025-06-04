// Add debounce timer at the top of the file
let lastSelectTopResultTime = 0;

$(document).ready(function(){
    const body = $('body');
    const searchBar = $('#complexity_class_search_bar');
    const searchContainer = $('.search-container');
    
    // Show dropdown and overlay when focusing on search
    searchBar.on('focus', function() {
        body.addClass('search-active');
        search_vals(''); // Show all classes initially
    });
    
    // Hide dropdown and overlay when clicking outside
    $(document).on('click', function(event) {
        // If click is outside search container
        if (!searchContainer.is(event.target) && searchContainer.has(event.target).length === 0) {
            body.removeClass('search-active');
            searchBar.blur();
        }
    });
    
    // Close search on escape key
    $(document).on('keydown', function(event) {
        if (event.key === 'Escape') {
            if(body.hasClass('search-active')){
                var query = searchBar.val();
                if (query.length > 0){
                    searchBar.val('');
                    search_vals('');
                } else{
                    body.removeClass('search-active');
                    searchBar.blur();
                }
            }
            
            // Close left sidebar if open
            $('#openLeftSidebarMenu').prop('checked', false);
            
            // Close right sidebar if open
            $('#openRightSidebarMenu').prop('checked', false);
        }

        // Clicking enter when searching will select the top search result
        if (event.key === 'Enter' && body.hasClass('search-active')){
            event.preventDefault(); // Prevent form submission
            const now = Date.now();
            if (now - lastSelectTopResultTime > 500) { // Only call if more than 500ms since last call
                lastSelectTopResultTime = now;
                select_top_search_result();
            }
        }
    });
    
    // Prevent clicks inside search container from closing dropdown
    searchContainer.on('click', function(event) {
        event.stopPropagation();
    });
    
    searchBar.on('input', function(){
        var query = $(this).val();
        search_vals(query);
    });
    
    // Initialize the listed classes
    // search_vals("");
});

function search_vals(query) {
    console.log('search_vals called with query:', query);
    
    if (!window.networkProcessor) {
        console.error('NetworkProcessor not found on window object');
        return;
    }
    
    if (!window.networkProcessor.initialized) {
        console.error('NetworkProcessor not initialized');
        return;
    }

    const searchResults = document.getElementById('complexity_class_search_results');
    if (!searchResults) {
        console.error('Search results element not found');
        return;
    }
    console.log('Found search results element:', searchResults);

    try {
        // Get all classes from network processor
        const allClasses = window.networkProcessor.getAllClasses();
        console.log('Retrieved all classes:', {
            count: allClasses.length,
            firstFew: allClasses.slice(0, 3),
            classIds: allClasses.map(c => c.id)
        });
        
        // Filter classes based on query
        const filteredClasses = allClasses.filter(d => 
            d.name.toLowerCase().includes(query.toLowerCase()) ||
            d.latex_name.toLowerCase().includes(query.toLowerCase())
        );

        // Sort filtered classes based on multiple criteria
        filteredClasses.sort((a, b) => {
            const queryLower = query.toLowerCase();
            const aNameLower = a.name.toLowerCase();
            const bNameLower = b.name.toLowerCase();
            const aLatexLower = a.latex_name.toLowerCase();
            const bLatexLower = b.latex_name.toLowerCase();

            // Calculate minimum distance for each class
            const getMinDistance = (text) => {
                const nameIndex = text.indexOf(queryLower);
                const latexIndex = text.indexOf(queryLower);
                if (nameIndex === -1 && latexIndex === -1) return Infinity;
                if (nameIndex === -1) return latexIndex;
                if (latexIndex === -1) return nameIndex;
                return Math.min(nameIndex, latexIndex);
            };

            const aDistance = getMinDistance(aNameLower + aLatexLower);
            const bDistance = getMinDistance(bNameLower + bLatexLower);

            // First sort by distance
            if (aDistance !== bDistance) {
                return aDistance - bDistance;
            }

            // If distances are equal, sort by which text appears first
            const aFirstIndex = Math.min(
                aNameLower.indexOf(queryLower) === -1 ? Infinity : aNameLower.indexOf(queryLower),
                aLatexLower.indexOf(queryLower) === -1 ? Infinity : aLatexLower.indexOf(queryLower)
            );
            const bFirstIndex = Math.min(
                bNameLower.indexOf(queryLower) === -1 ? Infinity : bNameLower.indexOf(queryLower),
                bLatexLower.indexOf(queryLower) === -1 ? Infinity : bLatexLower.indexOf(queryLower)
            );

            if (aFirstIndex !== bFirstIndex) {
                return aFirstIndex - bFirstIndex;
            }

            // If both distance and position are equal, sort alphabetically
            return a.name.localeCompare(b.name);
        });

        console.log('Filtered and sorted classes:', {
            count: filteredClasses.length,
            query: query,
            firstFew: filteredClasses.slice(0, 3),
            classIds: filteredClasses.map(c => c.id)
        });

        // Clear previous results
        searchResults.innerHTML = '';
        console.log('Cleared previous search results');

        // Add filtered classes to results
        filteredClasses.forEach(d => {
            const isSelected = window.networkProcessor.isClassSelected(d.id);
            // console.log(`Processing class ${d.id}:`, {
            //     name: d.name,
            //     latex_name: d.latex_name,
            //     isSelected: isSelected
            // });

            const infoIcon = `<button class="info-icon" data-class="${d.id}" onclick="open_side_window({id: '${d.id}'})">i</button>`;
            const checkbox = `<input type="checkbox" id="${d.id}" ${isSelected ? 'checked' : ''} onchange="handleClassSelection(this)">`;
            const label = `<label class="container"><span class="latex-name">${d.latex_name}</span>${checkbox}<span class="checkmark"></span></label>`;
            searchResults.innerHTML += `<li>${infoIcon}${label}</li>`;
        });
        console.log('Added filtered classes to search results');

        // Render LaTeX using the utility function
        searchResults.querySelectorAll('.latex-name').forEach(element => {
            renderKaTeX(element.textContent, element);
        });
    } catch (error) {
        console.error('Error in search_vals:', error);
        console.error('Error stack:', error.stack);
        searchResults.innerHTML = '<li class="search-error">Error loading classes</li>';
    }
}

function handleClassSelection(checkbox) {
    console.log('handleClassSelection called with checkbox:', {
        id: checkbox.id,
        checked: checkbox.checked
    });

    if (!window.networkProcessor) {
        console.error('NetworkProcessor not found on window object');
        return;
    }
    
    if (!window.networkProcessor.initialized) {
        console.error('NetworkProcessor not initialized');
        return;
    }

    const className = checkbox.id;
    console.log('Processing class selection:', {
        className: className,
        currentState: checkbox.checked ? 'selected' : 'deselected'
    });

    if (checkbox.checked) {
        console.log(`Selecting class: ${className}`);
        window.networkProcessor.selectClass(className);
        trackClassSelection(className + " (Selected)");
    } else {
        console.log(`Deselecting class: ${className}`);
        window.networkProcessor.deselectClass(className);
        trackClassSelection(className + " (Deselected)");
    }

    console.log('Selected classes after update:', 
        Array.from(window.networkProcessor.getSelectedClasses()));
    
    console.log('Calling create_visualisation');
    create_visualisation();
}

function select_top_search_result() {
    console.log('select_top_search_result called');
    
    const searchResults = document.getElementById('complexity_class_search_results');
    if (!searchResults) {
        console.error('Search results element not found');
        return;
    }
    console.log('Found search results element:', searchResults);

    const firstResult = searchResults.querySelector('li:first-child');
    console.log('First result element:', firstResult);

    if (firstResult) {
        const checkbox = firstResult.querySelector('input[type="checkbox"]');
        console.log('Found checkbox:', checkbox);

        if (checkbox) {
            console.log('Current checkbox state:', checkbox.checked);
            checkbox.checked = !checkbox.checked;
            console.log('New checkbox state:', checkbox.checked);
            
            // Create and dispatch a change event to trigger handleClassSelection
            const event = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(event);
            console.log('Dispatched change event');
        } else {
            console.error('No checkbox found in first result');
        }
    } else {
        console.error('No search results found');
    }
}

function select_all() {
    $('#complexity_class_search_results input[type="checkbox"]').each(function() {
        if (!this.checked) {
            this.checked = true;
        }
    });
    all_class_request(true);
    trackVisualizationChange("Select All", "Selected all visible complexity classes");
}

function deselect_all() {
    $('#complexity_class_search_results input[type="checkbox"]').each(function() {
        if (this.checked) {
            this.checked = false;
        }
    });
    all_class_request(false);
    trackVisualizationChange("Deselect All", "Deselected all complexity classes");
}

function all_class_request(select) {
    if (!window.networkProcessor || !window.networkProcessor.initialized) {
        console.error('NetworkProcessor not initialized');
        return;
    }

    // Get all classes from the search results
    const allClasses = window.networkProcessor.getAllClasses();
    
    // Update each class's selection state
    allClasses.forEach(classData => {
        if (select) {
            window.networkProcessor.selectClass(classData.id);
        } else {
            window.networkProcessor.deselectClass(classData.id);
        }
    });

    // Update the visualization
    create_visualisation();
}

function select_class_list(class_list, select){
    $('#complexity_class_search_results input[type="checkbox"]').each(function() {
        if (this.checked != select && class_list.includes(this.id)) {
            this.checked = select;
        }
    });
}

function delete_class(class_name){
    fetch(`/delete_class?class_name=${class_name.toUpperCase()}`)
        .then(response => response.json())
        .then(data => {
            if (data.success){
                // Deleting the class from the search bar
                select_class_list([class_name.toUpperCase()], false);
                // Deleting the node from the graph
            }
        });
}

function ajaxRequest(inp) {
    console.log(inp);
    var checked = document.getElementById(inp.id).checked;
    console.log("Sending data to the server that the checkbox is", checked);
    if (checked) {
       checked = 1;
    } else {
       checked = 0;
    }
 
 
    // Use the XMLHttpRequest API
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      console.log("Result sent to server!");
    }
    xhttp.open("POST", "/searchresults", true);
    xhttp.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
    xhttp.onreadystatechange=function()
    {
      if(xhttp.readyState==4 && xhttp.status == 200)
      {
         // We changed the graph -> redrawing it
        create_visualisation();
      }
    }
    xhttp.send("name=" + inp.id + "&checked=" +checked);
  }