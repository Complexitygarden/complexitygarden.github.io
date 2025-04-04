function format_information(htmlString)
{
    //return a hyperlink with a url anchor at the references page 
    return htmlString.replace(/\[([a-zA-Z0-9]+)\]/g, `<a href="/references#$1" class="citation-link" target="_blank">[$1]</a>`)
}