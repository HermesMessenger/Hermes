//TODO: check for more XSS cases & fix them
//TODO: make code blocks not have MD --> HTML in them


// ### RULES FOR THE MD -> HTML PARSER ### //
// Anything within the tag with $nº will be replaced with that group
const MD_RULES = [
    { regex: /(\*\*(.+?)\*\*)/, text_group: 1, tag: '<b class="MD-bold">', replace_group: 0 }, // This one has to go first beacause it overides the latter
    { regex: /(?:[^*]|^)(\*([^*](?:.*?[^*])?)\*)(?:[^*]|$)/, text_group: 1, tag: '<i class="MD-italics">', replace_group: 0 },
    { regex: /~(.+?)~/, text_group: 0, tag: '<strike class="MD-strike">' },
    { regex: /\[(.+?)\]\(((?:http:\/\/|https:\/\/).+?)\)/, text_group: 0, tag: '<a class="MD-link" href="$1">' },
    { regex: /`(.+?)`/, text_group: 0, tag: '<code class="MD-code">' }, //TODO: No tags should be inside the code element
]

// ### RULES FOR THE HTML -> MD PARSER ### //
const HTML_RULES = [
    { tag: 'b', class: 'MD-bold', md: '**$TEXT**' },
    { tag: 'i', class: 'MD-italics', md: '*$TEXT*' },
    { tag: 'strike', class: 'MD-strike', md: '~$TEXT~' },
    { tag: 'a', class: 'MD-link', md: '[$TEXT]($HREF)' },
    { tag: 'code', class: 'MD-code', md: '`$TEXT`' },
]

/**
 * @param {String} HTML representing any number of sibling elements
 * @return {NodeList} 
 */
function htmlToElements(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
}

function escapeHTML(html) {
    return $('<div>').text(html).html();
}

/**
 * This function removes all the HTML whose class is not one of the rules classes
 */

function removeXSS(html_str) {
    let nodes = htmlToElements(html_str);
    let result = '';
    for (let node of nodes) {
        if (node.childNodes.length > 0) {
            let isXSS = true;
            for (let rule of HTML_RULES) {
                if (node.classList.contains(rule.class) && node.nodeName == rule.tag.toUpperCase()) {
                    isXSS = false;
                }
            }
            if (isXSS) {
                console.log('XSS', node);
                let inner_html = node.innerHTML;
                node.innerHTML = escapeHTML(removeXSS(inner_html));
                result += escapeHTML(node.outerHTML);
            }else{
                let inner_html = node.innerHTML;
                node.innerHTML = removeXSS(inner_html);
                result += node.outerHTML;
            }
        } else {
            let isXSS = true;
            if(node.nodeName != '#text'){
                for (let rule of HTML_RULES) {
                    if (node.classList.contains(rule.class) && node.nodeName == rule.tag.toUpperCase()) {
                        isXSS = false;
                        break;
                    }
                }
            }else{
                isXSS = false;
            }
            let node_repr = node.nodeValue;
            if (isXSS) {
                console.log('XSS', node);
                node_repr = escapeHTML(node.outerHTML);
            }else{
                if(node.outerHTML) node_repr = node.outerHTML;
            }
            result += node_repr;
        }
    }
    return result;
}


function MDtoHTML(MD_String) {
    let r = MD_String;
    for (let current_rule of MD_RULES) {
        let current_regex = current_rule.regex;
        let current_regex_global = new RegExp(current_regex.source, 'g'); // Set to global to find all matches
        let all_matching_strings = r.match(current_regex_global);
        let current_regex_not_global = new RegExp(current_regex.source, ''); // Set to not global to find the groups in each match
        if (all_matching_strings) {
            for (let m_str of all_matching_strings) {
                
                let match = m_str.match(current_regex_not_global);
                let current_tag = current_rule.tag;
                if (dollar_ms = current_rule.tag.match(/\$(\d+)/g)) {
                    for (let dollar_s of dollar_ms) {
                        let dollar_m = dollar_s.replace('$', '');
                        let group_number = parseInt(dollar_m);
                        current_tag = current_tag.replace(dollar_s, match[group_number + 1])
                    }
                }
                let element = $(current_tag).html(removeXSS(match[current_rule.text_group + 1]))
                let to_replace = match[0];
                if (current_rule.replace_group != undefined) to_replace = match[current_rule.replace_group + 1]
                r = r.replace(to_replace, element.prop('outerHTML'));
            }
        }
    }
    return r;
}

function HTMLtoMD(html) {
    let nodes = htmlToElements(html);
    let md = '';
    for (node of nodes) {
        let innerMD = ''
        if (node.childNodes.length > 0) {
            for (let rule of HTML_RULES) {
                if (node.classList.contains(rule.class)) {
                    let replaceVal = rule.md;
                    let href = node.getAttribute('href');
                    let inner_html = node.innerHTML;
                    let html_to_md = HTMLtoMD(inner_html);
                    replaceVal = replaceVal.replace('$TEXT', html_to_md);
                    if (href) {
                        replaceVal = replaceVal.replace('$HREF', href);
                    }
                    innerMD = replaceVal;
                    break;
                }
            }
        } else {
            if (node.nodeValue != null) {
                innerMD = node.nodeValue;
            }
        }

        md += innerMD;
    }
    return md;
}