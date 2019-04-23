const IPs = require('./IPs.json')

function ipv4ToInt(ip) {
    try {
        let ipOctets = ip.split('.')

        ipOctets.forEach((element, index) => {
            ipOctets[index] = BigInt(element) // Convert octets to BigInts
        })

        return (ipOctets[0] << 24n) + (ipOctets[1] << 16n) + (ipOctets[2] << 8n) + (ipOctets[3])

    } catch (err) {
        return // Invalid IP - IPv6 isn't supported (yet) as our current server can't even receive those requests
    }
}


function binarySearch(ip) {

    let start = 0
    let stop = IPs.length - 1
    let middle = Math.floor((start + stop) / 2)

    while (start < stop) {
        let currentIP = IPs[middle]

        if (ip >= currentIP.start && ip <= currentIP.end) {
            return currentIP.country

        } else if (ip < currentIP.start) {
            stop = middle

        } else {
            start = middle
        }

        middle = Math.ceil((start + stop) / 2)
    }
}

module.exports.getCountry = function (ip) {
    let int = ipv4ToInt(ip)
    let country = binarySearch(int)
    return country
}

