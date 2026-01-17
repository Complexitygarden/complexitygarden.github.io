document.addEventListener("DOMContentLoaded", function() {
    const cached_html = false;//sessionStorage.getItem("references_html");
    const references_div = document.getElementById("references-list");


    if (cached_html)
    {
        //Only load the references once, then cache it in session storage
        
        references_div.innerHTML = cached_html;
        scroll_and_highlight_target(3000);
    }
    else
    {

        url_references = "https://raw.githubusercontent.com/Complexitygarden/dataset/refs/heads/main/references/references.json"
        fetch(url_references)
        .then(response => response.json())
        .then(data => {
            const references_array = data.references;
            console.log(references_array);
            //Sort references alphabetically by identifier
            references_array.sort((a, b) => a.identifier.localeCompare(b.identifier));
            console.log(references_array);
            //Load each reference into the page


            references_array.forEach(element => {
                //remove the brackets
                const identifier = element.identifier;



                const author = format_author(element.fields.author);
                const title = element.fields.title ?? "";
                
                // Build the citation parts conditionally
                let citation_parts = [];
                
                // Add journal if present
                if (element.fields.journal) {
                    citation_parts.push(element.fields.journal);
                }
                
                // Add volume if present
                if (element.fields.volume) {
                    citation_parts.push(`vol. ${element.fields.volume}`);
                }
                
                // Add number if present
                if (element.fields.number) {
                    citation_parts.push(`no. ${element.fields.number}`);
                }
                
                // Add pages if present
                if (element.fields.pages) {
                    citation_parts.push(`pp. ${element.fields.pages}`);
                }
                
                // Add year if present
                if (element.fields.year) {
                    citation_parts.push(element.fields.year);
                }
                
                // Join citation parts with commas
                const citation_info = citation_parts.length > 0 ? citation_parts.join(', ') : '';
                
                // Add DOI if present
                const doi_part = element.fields.doi ? `, doi:${element.fields.doi}` : '';
                
                // Add URL link if present
                const url_part = element.fields.url ? ` <a href="${element.fields.url}" target="_blank" class="reference-url">[Link]</a>` : '';

                //append <p> element to the references div
                references_div.innerHTML += 
                `
                <p id="${identifier}" style="margin-left: 2em;"> 
                    [${identifier}] ${author}, "<em>${title}</em>"${citation_info ? ', ' + citation_info : ''}${doi_part}.${url_part}
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