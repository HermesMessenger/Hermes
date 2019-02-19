// Anything within the tag with $nº will be replaced with that group
const MD_RULES = [
    { regex: /(?:[^*]|^)(\*\*(.+?)\*\*)(?:[^*]|$)/, text_group: 1, tag: '<a class="MD-bold">', replace_group: 0 }, // This one has to go first beacause it overides the latter
    { regex: /\*(.+?)\*/, text_group: 0, tag: '<a class="MD-italics">' },
    { regex: /~(.+?)~/, text_group: 0, tag: '<a class="MD-strike">' },
    { regex: /\[(.+?)\]\(((http:\/\/|https:\/\/).+?)\)/, text_group: 0, tag: '<a class="MD-link" href="$1">' },
]


function MDtoHTML(MD_String) {
    let r = MD_String;
    for (let current_rule of MD_RULES) {
        let current_regex = current_rule.regex;
        let current_regex_global = new RegExp(current_regex.source, 'g');
        let all_matching_strings = r.match(current_regex_global);
        let current_regex_not_global = new RegExp(current_regex.source, '');
        if (all_matching_strings) {
            for (let m_str of all_matching_strings) {
                let match = m_str.match(current_regex_not_global);
                let current_tag = current_rule.tag;
                if(dollar_ms = current_rule.tag.match(/\$(\d+)/g)){
                    for (let dollar_s of dollar_ms){
                        let dollar_m = dollar_s.replace('$','');
                        let group_number = parseInt(dollar_m);
                        current_tag = current_tag.replace(dollar_s, match[group_number+1])
                    }
                }
                let element = $(current_tag).html/* TODO make this XSS invulnerable */(match[current_rule.text_group + 1])
                let to_replace = match[0];
                if(current_rule.replace_group != undefined) to_replace = match[current_rule.replace_group + 1]
                r = r.replace(to_replace, element.prop('outerHTML'));
            }
        }
    }
    return r;
}

function HTMLtoMD(Html) {

}