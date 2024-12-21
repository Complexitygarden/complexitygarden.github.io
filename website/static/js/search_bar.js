$(document).ready(function(){
   $('#complexity_class_search_bar').on('input', function(){
      var query = $(this).val();
      search_vals(query)
   });
   // Initializing the listed classes
   search_vals("")
});

function search_vals(query){
      $.get('/search_complexity_classes', {query: query}, function(data){
         $('#complexity_class_search_results').empty();
         data.forEach(function(d){
           if (d.value){
              $('#complexity_class_search_results').append('<li class="leftSidebarMenuInner_sub_li"><label class="container">' + d.name + '<input type="checkbox" id="' + d.name +'" onchange="ajaxRequest(this)" checked><span class="checkmark"></span></label></li>');
           } else {
              $('#complexity_class_search_results').append('<li class="leftSidebarMenuInner_sub_li"><label class="container">' + d.name + '<input type="checkbox" id="' + d.name +'" onchange="ajaxRequest(this)"><span class="checkmark"></span></label></li>');
           }
         });
      });
}

function ajaxRequest(inp) {
    console.log(inp);
    var checked = document.getElementById(inp.value).checked;
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
    xhttp.send("name=" + inp.value + "&checked=" +checked);
  }