// ### RULES FOR THE MD -> HTML PARSER ### //
// Anything within the tag with $nº will be replaced with that group
let MD_RULES = [
    { regex: /(\*\*([\S\s]+?)\*\*)/, text_group: 1, tag: '<b class="MD-bold">', replace_group: 0 }, // This one has to go first beacause it overides the latter
    { regex: /(?:[^*]|^)(\*([^*](?:[\S\s]*?[^*])?)\*)(?:[^*]|$)/, text_group: 1, tag: '<i class="MD-italics">', replace_group: 0 },
    { regex: /~([\S\s]+?)~/, text_group: 0, tag: '<strike class="MD-strike">' },
    { regex: /\[([\S\s]+?)\]\(((?:http:\/\/|https:\/\/).+?)\)/, text_group: 0, tag: '<a class="MD-link" href="$1" target="_blank" rel="noopener">' },
    { regex: /`([\S\s]+?)`/, text_group: 0, tag: '<code class="MD-code">', escapeMD: true },
    { regex: /\|\|([\S\s]+?)\|\|/, text_group: 0, tag: '<div class="MD-spoiler spoiler-hidden" onclick="spoilerOnClick(this)">'},
    { regex: /!\[((?:http:\/\/|https:\/\/).+?)\]/, text_group: 0, tag: '<img class="MD-img" src="$0">'}
]

// ### RULES FOR THE HTML -> MD PARSER ### //
let HTML_RULES = [
    { tag: 'b', class: 'MD-bold', md: '**$TEXT**' },
    { tag: 'i', class: 'MD-italics', md: '*$TEXT*' },
    { tag: 'strike', class: 'MD-strike', md: '~$TEXT~' },
    { tag: 'a', class: 'MD-link', md: '[$TEXT]($HREF)' },
    { tag: 'code', class: 'MD-code', md: '`$TEXT`' },
    { tag: 'div', class: 'MD-spoiler', md: '||$TEXT||' },
    { tag: 'img', class: 'MD-img', md: '![$SRC]' },
    { tag: 'span', class: 'quote', md: '"quote"' }, //Make the MD parser remove quotes (For editing it's changed)
    { tag: 'a', class: 'MD-link-explicit', md: '$TEXT' }, // Ignore links
    { tag: 'b', class: 'mention', md: '$TEXT' }, // Ignore mentions
]

function getCustomRules(original, changed) {
    let result = [];
    let rule_tags = [];
    let rule_classes = [];
    for (let rule of original) {

        if (changed.constructor === Array) {
            for (let changed_rule of changed) {
                let new_rule = {};
                if (rule.tag == changed_rule.tag && rule.class == changed_rule.class) {
                    new_rule = changed_rule;
                } else {
                    new_rule = rule;
                }
                result.push(new_rule);
                rule_tags.push(new_rule.tag);
                rule_classes.push(new_rule.class);
            }
        } else {
            if (rule.tag == changed.tag && rule.class == changed.class) {
                new_rule = changed;
            } else {
                new_rule = rule;
            }
            result.push(new_rule);
            rule_tags.push(new_rule.tag);
            rule_classes.push(new_rule.class);
        }

    }
    if (changed.constructor === Array) {
        for (let changed_rule of changed) {
            if (!rule_tags.includes(changed_rule.tag) || !rule_classes.includes(changed_rule.class)) {
                result.push(changed_rule);
            }
        }
    } else {
        if (!rule_tags.includes(changed.tag) || !rule_classes.includes(changed.class)) {
            result.push(changed);
        }
    }
    return result;
}

/**
 * @param {String} HTML representing any number of sibling elements
 * @return {NodeList} 
 */
function htmlToElements(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
}

const HTML_ESCAPE_RULES = [
    { char: '<', escape: '$ESCAPED_LT', html_escape: '&lt;' },
    { char: '&', escape: '$ESCAPED_AMP', html_escape: '&amp;' }
]

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

/**
 * Internal Markdown function, DO NOT USE.
 */
function convertHTML(html) {
    let r = html;
    for (let rule of HTML_ESCAPE_RULES) {
        r = r.replaceAll(rule.char, rule.escape);
    }
    return r;
}
/**
 * Internal Markdown function, DO NOT USE.
 */
function deconvertHTML(html) {
    let r = html;
    for (let rule of HTML_ESCAPE_RULES) {
        r = r.replaceAll(rule.escape, rule.html_escape);
    }
    return r;
}

/**
 * Internal Markdown function, DO NOT USE.
 * This function removes all the HTML whose class is not one of the rules classes
 */

function removeXSS(html_str, rules = HTML_RULES) {
    let nodes = htmlToElements(html_str);
    let result = '';
    for (let node of nodes) {
        if (node.childNodes.length > 0) {
            let isXSS = true;
            for (let rule of rules) {
                if (node.classList.contains(rule.class) && node.nodeName == rule.tag.toUpperCase()) {
                    isXSS = false;
                }
            }
            if (isXSS) {
                console.log('XSS', node);
                let inner_html = node.innerHTML;
                node.innerHTML = convertHTML(removeXSS(inner_html, rules));
                result += convertHTML(node.outerHTML);
            } else {
                let inner_html = node.innerHTML;
                node.innerHTML = removeXSS(inner_html, rules);
                result += node.outerHTML;
            }
        } else {
            let isXSS = true;
            if (node.nodeName != '#text') {
                for (let rule of rules) {
                    if (node.classList.contains(rule.class) && node.nodeName == rule.tag.toUpperCase()) {
                        isXSS = false;
                        break;
                    }
                }
            } else {
                isXSS = false;
            }
            let node_repr = node.nodeValue;
            if (isXSS) {
                console.log('XSS', node);
                node_repr = convertHTML(node.outerHTML);
            } else {
                if (node.outerHTML) node_repr = node.outerHTML;
            }
            result += node_repr;
        }
    }
    return result;
}


function MDtoHTML(MD_String, rules = MD_RULES, html_rules = HTML_RULES) {
    let r = convertHTML(MD_String);
    for (let current_rule of rules) {
        let current_regex = current_rule.regex;
        let current_regex_global = new RegExp(current_regex.source, 'gm'); // Set to global to find all matches
        let all_matching_strings = r.match(current_regex_global);
        let current_regex_not_global = new RegExp(current_regex.source, 'm'); // Set to not global to find the groups in each match
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
                let element = current_rule.escapeMD ? $(current_tag).text(convertHTML(HTMLtoMD(match[current_rule.text_group + 1], html_rules))) : $(current_tag).html(removeXSS(match[current_rule.text_group + 1]))
                
                let to_replace = match[0];
                if (current_rule.replace_group != undefined) to_replace = match[current_rule.replace_group + 1]
                r = r.replace(to_replace, element.prop('outerHTML'));
            }
        }
    }
    return r;
}

function HTMLtoMD(html, rules = HTML_RULES) {
    let nodes = htmlToElements(html);
    let md = '';
    for (node of nodes) {
        let innerMD = ''

        if (node.childNodes.length > 0) {

            for (let rule of rules) {

                if (node.classList.contains(rule.class) && node.nodeName == rule.tag.toUpperCase()) {
                    let replaceVal = rule.md;
                    let href = node.getAttribute('href');
                    let src = node.getAttribute('src');
                    let inner_html = node.innerHTML;
                    let html_to_md = HTMLtoMD(inner_html, rules);
                    replaceVal = replaceVal.replace('$TEXT', html_to_md);
                    if (href) replaceVal = replaceVal.replace('$HREF', href);
                    if (src)  replaceVal = replaceVal.replace('$SRC', src);
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