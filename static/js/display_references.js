document.addEventListener("DOMContentLoaded", function() {
    fetch("/static/references.json")
    .then(response => response.json())
    .then(data => {
        const references_array = data.references;

        const references_div = document.getElementById("references-list");

        //Load each reference into the page
        references_array.forEach(element => {
            //remove the brackets
            const identifier = element.identifier;

            //create a div to store the element
            entry = document.createElement("div");

            entry.classList.add("reference-entry");

            entry.id = identifier;


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


            //construct reference

            entry.innerHTML = 
            `
            <p> 
                [${identifier}] ${author}, "<em>${title}</em>," ${journal} ${volume}, no. ${number}, pp. ${pages}, ${year}, doi:${doi}. 
            </p>
            `;

            references_div.appendChild(entry);
        });


        
        //console.log(document.querySelector(window.location.hash));

        scroll_and_highlight_target(3000);

        
    })
    .catch(error => console.log("ERROR LOADING REFERENCE.JSON", error));
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
