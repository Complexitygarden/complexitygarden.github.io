// Add debounce timer at the top of the file
let lastSelectTopResultTime = 0;
// Index of the currently highlighted search result
let currentSearchIndex = -1;

// Add constant for mobile breakpoint
const MOBILE_BREAKPOINT = 600;

const searchTracker = new SearchBurstTracker(
    1000,
    2,
    (value, meta) => console.log("[search]", meta.reason, value, meta)
);

$(document).ready(function(){
    const body = $('body');
    const searchBar = $('#complexity_class_search_bar');
    const searchContainer = $('.search-container');
    const filterButton = $('.filter-button');
    const searchDropdown = $('.search-dropdown');
    
    // Elements used for mobile behaviour
    const searchIcon = $('.search-icon');

    // Create an exit / close button for the full-screen search on mobile
    const exitButton = $('<button class="search-exit" aria-label="Close">&times;</button>');
    // Append the button only once
    if ($('.search-exit').length === 0){
        $('.search-container').append(exitButton);
    }

    // Utility function to determine if we are in mobile view
    function isMobileView(){
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    /* ============== Mobile search state management ============== */
    function setMobileCollapsed(){
        $('body').addClass('mobile-search-collapsed')
                    .removeClass('mobile-search-open');
        $('body').removeClass('search-active');
        searchBar.val('');
        searchBar.blur();
    }

    function openMobileSearch(){
        $('body').removeClass('mobile-search-collapsed')
                    .addClass('mobile-search-open search-active');

        /* Clear any inline sizing that may have been added by resizeSearchInput */
        searchContainer.attr('style','');
        searchBar.attr('style','');
        filterButton.attr('style','');

        // Ensure full-screen dimensions if any inline styles remain
        searchContainer.css({
            'width': '100%',
            'height': '100%'
        });
        searchBar.css({
            'width': '100%',
            'max-width': '100%',
            'flex': '0 0 auto'
        });

        // Show all classes initially for easier selection
        // console.log('openMobileSearch: calling search_vals');
        search_vals('');
        
        // Fallback: try again after a short delay if networkProcessor wasn't ready
        setTimeout(function() {
            // console.log('openMobileSearch: fallback search_vals call');
            search_vals('');
        }, 100);
        
        searchBar.focus();
    }

    function closeMobileSearch(){
        setMobileCollapsed();
        // Re-apply responsive sizing
        resizeSearchInput();
    }

    // Apply correct state on initial load and on resize
    function applyMobileState(){
        if (isMobileView()){
            if (!$('body').hasClass('mobile-search-collapsed') && !$('body').hasClass('mobile-search-open')){
                $('body').addClass('mobile-search-collapsed');
            }
            // Make search icon clickable on mobile
            searchIcon.css('pointer-events','auto');
        } else {
            // Desktop view – ensure mobile classes are removed
            $('body').removeClass('mobile-search-collapsed mobile-search-open');
            $('body').removeClass('search-active');
            searchIcon.css('pointer-events','none');
        }
    }

    applyMobileState();
    $(window).on('resize', applyMobileState);

    /* ============== Event bindings ============== */
    // Clicking the search icon opens the full-screen search on mobile
    searchIcon.on('click', function(){
        if (isMobileView() && $('body').hasClass('mobile-search-collapsed')){
            openMobileSearch();
        }
    });

    /* ================= Filter dropdown toggle ================= */
    filterButton.on('click', function(event){
        event.stopPropagation();
        const dropdown = $(this).siblings('.filter-dropdown');
        // Toggle visibility explicitly (works on mobile where :hover has no effect)
        if (dropdown.is(':visible')){
            dropdown.hide();
        } else {
            // Close any other open dropdowns first
            $('.filter-dropdown').hide();
            dropdown.show();
        }
    });

    // Hide the filter dropdown when clicking outside of it
    $(document).on('click', function(event){
        if (!$(event.target).closest('.filter-container').length){
            $('.filter-dropdown').hide();
        }
    });

    // Exit button closes the full-screen search on mobile
    exitButton.on('click', function(){
        if ($('body').hasClass('mobile-search-open')){
            closeMobileSearch();
        }
    });

    function adjustPlaceholder(){
        if(window.innerWidth < 600){
            if(searchBar.attr('data-short')!=='1'){
                searchBar.attr('data-short','1');
                searchBar.attr('placeholder','Search');
            }
        } else {
            if(searchBar.attr('data-short')==='1'){
                searchBar.attr('data-short','0');
                searchBar.attr('placeholder','Search complexity classes');
            }
        }
    }
    // Run on load
    adjustPlaceholder();
    // Run on resize
    $(window).on('resize', adjustPlaceholder);
    
    /* Dynamically size the search input on very small screens to avoid
       overlap with the icons. We subtract the filter-button width and
       a fixed padding (30 px) from the viewport width. */
    function resizeSearchInput(){
        const viewport = window.innerWidth;

        const isMobile = viewport < 600;
        const isTablet = viewport >= 600 && viewport < 800;

        const btnWidth = filterButton.outerWidth() || 60;

        if (isMobile || isTablet){
            // dynamic available width
            var sidePadding = 300; // internal spacing within container
            if (isMobile){
                sidePadding = 220;
            }
            const available = viewport - sidePadding - btnWidth;
            const newWidth = Math.max(available, 10);

            searchBar.css({
                'flex': '0 0 ' + newWidth + 'px',
                'max-width': newWidth + 'px'
            });

            // ensure button height matches input height
            const inputH = searchBar.outerHeight();
            filterButton.css({
                'height': inputH + 'px',
                'width': inputH + 'px'
            });

            // center container by explicit width
            searchContainer.css('width', (newWidth + btnWidth + 20) + 'px');
        } else {
            // desktop - reset overrides
            searchBar.css({ 'flex':'', 'max-width':'', 'width':'' });
            filterButton.css({ 'height':'', 'width':'' });
            searchContainer.css('width','');
        }
    }

    resizeSearchInput();
    $(window).on('resize', resizeSearchInput);
    
    // Show dropdown and overlay when focusing on search
    searchBar.on('focus', function() {
        body.addClass('search-active');
        searchTracker.onFocus(searchBar.val());
        search_vals(''); // Show all classes initially
    });
    
    // Hide dropdown and overlay when clicking outside
    $(document).on('click', function(event) {
        // Skip automatic closing when the full-screen mobile search is open
        if (body.hasClass('mobile-search-open')){
            return;
        }

        // If click is outside search container
        if (!searchContainer.is(event.target) && searchContainer.has(event.target).length === 0) {
            body.removeClass('search-active');
            searchBar.blur();
        }
    });
    
    // Close search on escape key
    $(document).on('keydown', function(event) {
        if (event.key === 'Escape') {
            if(body.hasClass('mobile-search-open')){
                // Always close mobile full-screen search on Escape
                closeMobileSearch();
            } else if(body.hasClass('search-active')){
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

        // Arrow key navigation within search results
        if (body.hasClass('search-active')) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();

                const itemsCount = $('#complexity_class_search_results li').length;
                if (itemsCount === 0) return;

                if (event.key === 'ArrowDown') {
                    currentSearchIndex = (currentSearchIndex + 1) % itemsCount;
                } else {
                    currentSearchIndex = (currentSearchIndex - 1 + itemsCount) % itemsCount;
                }

                highlightSearchResult(currentSearchIndex);
            }
        }

        // Clicking enter when searching will select the highlighted search result (or top if none)
        if (event.key === 'Enter' && body.hasClass('search-active')){
            event.preventDefault(); // Prevent form submission
            searchTracker.onEnter($('#complexity_class_search_bar').val()); //Track information when enter is clicked
            const now = Date.now();
            if (now - lastSelectTopResultTime > 500) { // debounce
                lastSelectTopResultTime = now;
                select_search_result(currentSearchIndex);
            }
        }
    });
    
    // Prevent clicks inside search container from closing dropdown
    searchContainer.on('click', function(event) {
        event.stopPropagation();
    });
    
    searchBar.on('input', function(e){
        var query = $(this).val();
        searchTracker.onInput(query, e.originalEvent);
        search_vals(query);
    });
    
    // Initialize the listed classes
    // search_vals("");

    function adjustDropdownWidth(){
        const totalWidth = searchBar.outerWidth() + filterButton.outerWidth();
        searchDropdown.css('width', totalWidth + 'px');
    }

    // Call once and on resize/focus
    adjustDropdownWidth();
    $(window).on('resize', adjustDropdownWidth);
    searchBar.on('focus', adjustDropdownWidth);

    /* =====================
       Auto-open search on typing
       ===================== */
    $(document).on('keydown', function(event) {
        // Ignore if any modifier keys are pressed
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }

        // Only trigger for single printable characters (letters / digits)
        if (event.key.length !== 1 || !/[a-zA-Z0-9]/.test(event.key)) {
            return;
        }

        // Ignore typing when about is open or we are already in the search bar
        const aboutModal = document.getElementById('about-modal-overlay');
        const aboutModalOpen = aboutModal && aboutModal.style.display !== 'none';

        const active = document.activeElement;
        const inputFocused = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);

        if (aboutModalOpen || inputFocused) {
            return;
        }

        // If the search is already active, let the normal flow happen
        if (body.hasClass('search-active')) {
            return;
        }

        // Prevent default so the key doesn't get typed elsewhere
        event.preventDefault();

        const typedChar = event.key;

        if (isMobileView()) {
            // Open full-screen search on mobile
            openMobileSearch();
        } else {
            // Activate desktop search overlay
            body.addClass('search-active');
        }

        // Insert the typed character and focus the search bar
        searchBar.val(typedChar);
        searchBar.focus();

        // Ensure dropdown width is correct and results are updated
        if (typeof adjustDropdownWidth === 'function') {
            adjustDropdownWidth();
        }
        search_vals(typedChar);
    });
});

function search_vals(query) {
    // console.log('search_vals called with query:', query);
    
    if (!window.networkProcessor) {
        console.error('NetworkProcessor not found on window object');
        return;
    }
    
    if (!window.networkProcessor.initialized) {
        console.warn('NetworkProcessor not initialized, will retry search_vals in 200ms');
        setTimeout(() => search_vals(query), 200);
        return;
    }

    const searchResults = document.getElementById('complexity_class_search_results');
    if (!searchResults) {
        console.error('Search results element not found');
        return;
    }
    // console.log('Found search results element:', searchResults);

    try {
        // Get all classes from network processor
        const allClasses = window.networkProcessor.getAllClasses();
        // console.log('Retrieved all classes:', {
        //     count: allClasses.length,
        //     firstFew: allClasses.slice(0, 3),
        //     classIds: allClasses.map(c => c.id)
        // });
        
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

        // console.log('Filtered and sorted classes:', {
        //     count: filteredClasses.length,
        //     query: query,
        //     firstFew: filteredClasses.slice(0, 3),
        //     classIds: filteredClasses.map(c => c.id)
        // });

        // Clear previous results
        searchResults.innerHTML = '';
        // console.log('Cleared previous search results');

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
        //console.log('Added filtered classes to search results');

        // Reset and highlight the first result by default
        currentSearchIndex = filteredClasses.length > 0 ? 0 : -1;
        highlightSearchResult(currentSearchIndex);

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

    const action = checkbox.checked ? 'Selected' : 'Deselected';
    track_class_click(className, { action });
    console.log(`[TRACKING] ${className} and action: ${action}...`);

    console.log('Selected classes after update:', 
        Array.from(window.networkProcessor.getSelectedClasses()));
    
    console.log('Calling create_visualisation');
    create_visualisation();
}

function select_top_search_result() {
    // console.log('select_top_search_result called');
    
    const searchResults = document.getElementById('complexity_class_search_results');
    if (!searchResults) {
        console.error('Search results element not found');
        return;
    }
    // console.log('Found search results element:', searchResults);

    const firstResult = searchResults.querySelector('li:first-child');
    console.log('First result element:', firstResult);

    if (firstResult) {
        const checkbox = firstResult.querySelector('input[type="checkbox"]');
        // console.log('Found checkbox:', checkbox);

        if (checkbox) {
            // console.log('Current checkbox state:', checkbox.checked);
            checkbox.checked = !checkbox.checked;
            // console.log('New checkbox state:', checkbox.checked);
            
            // Create and dispatch a change event to trigger handleClassSelection
            const event = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(event);
            // console.log('Dispatched change event');
        } else {
            console.error('No checkbox found in first result');
        }
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

// Deleting a class from the visualisation
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

/* ======================================================
   Helper to visually highlight the currently selected
   <li> element inside the search results list.
   ======================================================*/
function highlightSearchResult(index) {
    const listItems = $('#complexity_class_search_results li');
    listItems.removeClass('search-selected');

    if (index >= 0 && index < listItems.length) {
        const item = listItems.eq(index);
        item.addClass('search-selected');

        // Ensure the highlighted item is visible in the scroll viewport
        if (typeof item[0]?.scrollIntoView === 'function') {
            item[0].scrollIntoView({ block: 'nearest' });
        }
    }
}

/* ======================================================
   Toggle the checkbox of the search result at the given
   index and trigger the same logic as a user click.
   ======================================================*/
function select_search_result(index) {
    const listItems = $('#complexity_class_search_results li');
    if (listItems.length === 0) return;

    if (index < 0 || index >= listItems.length) {
        index = 0; // Fallback to the first item
    }

    const targetItem = listItems.eq(index);
    const checkbox = targetItem.find('input[type="checkbox"]')[0];
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        const changeEvent = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(changeEvent);
    }
}
