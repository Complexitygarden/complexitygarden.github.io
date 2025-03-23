$(document).ready(function(){
    const body = $('body');
    const searchBar = $('#complexity_class_search_bar');
    const searchContainer = $('.search-container');
    
    // Show dropdown and overlay when focusing on search
    searchBar.on('focus', function() {
        body.addClass('search-active');
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
        if (event.key === 'Enter'){
            if(body.hasClass('search-active')){
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
    search_vals("");
});

function search_vals(query){
      $.get('/search_complexity_classes', {query: query}, function(data){
         $('#complexity_class_search_results').empty();
         data.forEach(function(d){
            const infoIcon = '<button class="info-icon" data-class="' + d.name + '" onclick="open_side_window({name: \'' + d.name + '\'})">i</button>';
            if (d.value){
               $('#complexity_class_search_results').append('<li>' + infoIcon + '<label class="container">' + d.name + '<input type="checkbox" id="' + d.name +'" onchange="ajaxRequest(this)" checked><span class="checkmark"></span></label></li>');
            } else {
               $('#complexity_class_search_results').append('<li>' + infoIcon + '<label class="container">' + d.name + '<input type="checkbox" id="' + d.name +'" onchange="ajaxRequest(this)"><span class="checkmark"></span></label></li>');
            }
         });
      });
}

function select_top_search_result(){
    // Selecting/Deselecting the top search result
    var top_result = $('#complexity_class_search_results li:first-child');
    if (top_result.length) {
        var checkbox = top_result.find('input[type="checkbox"]');
        // Switching the checkbox
        checkbox.prop('checked', !checkbox.prop('checked'));
        ajaxRequest(checkbox[0]);
    }
}

function select_all() {
    $('#complexity_class_search_results input[type="checkbox"]').each(function() {
        if (!this.checked) {
            this.checked = true;
        }
    });
    all_class_request(true);
}

function deselect_all() {
    $('#complexity_class_search_results input[type="checkbox"]').each(function() {
        if (this.checked) {
            this.checked = false;
        }
    });
    all_class_request(false);
}

function all_class_request(select) {
    $.get('/all_class_request', {select: select}, function(data) {
        if (data.success) {
            create_visualisation();
        }
    });
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