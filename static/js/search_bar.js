$(document).ready(function(){
    const searchBar = $('#complexity_class_search_bar');
    const body = $('body');
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
               body.removeClass('search-active');
               searchBar.blur();
            }
            
            // Close left sidebar if open
            $('#openLeftSidebarMenu').prop('checked', false);
            
            // Close right sidebar if open
            $('#openRightSidebarMenu').prop('checked', false);
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
         draw_graph();
      }
    }
    xhttp.send("name=" + inp.id + "&checked=" +checked);
  }