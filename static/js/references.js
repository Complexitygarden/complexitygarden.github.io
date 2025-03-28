function format_information(htmlString)
{
    //find all substrings of the format [.*] and replace them with <a href="/references" class="citation-link"> /*SUBSTRING[.*]*/ </a>
    return htmlString.replace(/\[([a-zA-Z0-9]+)\]/g, '<a href="/references" class="citation-link">[$1]</a>')
}