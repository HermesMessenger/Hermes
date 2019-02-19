// Anything within the tag with $nº will be replaced with that group
const MD_RULES = [
    {regex: /\*\*(.+?)\*\*/, text_group: 0, tag: '<a class="MD-bold">'}, // This one has to go first beacause it overides the latter
    {regex: /\*(.+?)\*/g, text_group: 0, tag: '<a class="MD-italics">'},
    {regex: /~(.+?)~/g, text_group: 0, tag: '<a class="MD-strike">'},
    {regex: /\[(.+?)\]\((.+?)\)/g, text_group: 0, tag: '<a class="MD-link" href="$1">'},
]

function MDtoHTML(MD_String){
    console.log(MD_String);
    let current_rule = MD_RULES[0];
    let current_regex = current_rule.regex;
    current_regex_global = new RegExp(current_regex.source, 'g');
    all_matching_strings = MD_String.match(current_regex_global);
    current_regex_not_global = new RegExp(current_regex.source, '');
    let r = $('<span>');
    for (m_str of all_matching_strings) {
        let match = m_str.match(current_regex_not_global);
        let element = $(current_rule.tag /* TODO replace the $* */).text(match[current_rule.text_group+1])
        console.log(match, element[0])
    }
    
}

function HTMLtoMD(Html){

}