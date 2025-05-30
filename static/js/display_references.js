document.addEventListener("DOMContentLoaded", function() {
    const cached_html = sessionStorage.getItem("references_html");
    const references_div = document.getElementById("references-list");


    if (cached_html)
    {
        //Only load the references once, then cache it in session storage
        
        references_div.innerHTML = cached_html;
        scroll_and_highlight_target(3000);
    }
    else
    {

        fetch("../static/references.json")
        .then(response => response.json())
        .then(data => {
            const references_array = data.references;
            //Load each reference into the page


            references_array.forEach(element => {
                //remove the brackets
                const identifier = element.identifier;



                const author = format_author(element.fields.author);
                const title   = element.fields.title ?? "";
                //Change all these to this so that if an element is missing it doesnt look weird with the floating commas later on
                const journal = element.fields.journal ? element.fields.journal + "," : "";
                const volume  = element.fields.volume  ?  "vol. " + element.fields.volume + ",": "";
                const number  = element.fields.number ?? "";
                const pages   = element.fields.pages ?? "";
                const year    = element.fields.year ?? "";
                const doi     = element.fields.doi ?? "";
                const url     = element.fields.url ?? "";


                //append <p> element to the references div
                references_div.innerHTML += 
                `
                <p id="${identifier}"> 
                    [${identifier}] ${author}, "<em>${title}</em>," ${journal} ${volume}, no. ${number}, pp. ${pages}, ${year}, doi:${doi}. 
                </p>
                `;
            });


            //Set these generated html to session storage
            sessionStorage.setItem("references_html", references_div.innerHTML);

            scroll_and_highlight_target(3000);


        })
        .catch(error => console.log("ERROR LOADING REFERENCE.JSON", error));
    }

});





function format_author(author_string)
{
    parts = author_string.split(",");

    //just checking for single authors for now
    if (parts.length === 2)
    {
        last_name = parts[0].trim();
        first_name = parts[1].trim();
        return `${first_name.charAt(0)}. ${last_name}`;
    }

    return author_string;
}


function scroll_and_highlight_target(duration)
{
    const hash = window.location.hash;

    if (hash) //exists
    {
        const target_element = document.querySelector(hash); //there should be only one 
        if (target_element)
        {
            target_element.scrollIntoView({behavior: "smooth", block:"center"});

            target_element.classList.add("highlight");

            setTimeout(() => {
                target_element.classList.remove("highlight");
            }, duration);
        }
    }
}


function format_information(htmlString)
{
    //return a hyperlink with a url anchor at the references page 
    return htmlString.replace(/\[([a-zA-Z0-9]+)\]/g, `<a target="_blank" href="references.html#$1" class="citation-link">[$1]</a>`);
}