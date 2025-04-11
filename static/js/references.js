function format_information(htmlString)
{
    //return a hyperlink with a url anchor at the references page 
    return htmlString.replace(/\[([a-zA-Z0-9]+)\]/g, `<a target="_blank" href="/references#$1" class="citation-link">[$1]</a>`);
}