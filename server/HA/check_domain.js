const dns = require('dns');
const utils = require('../utils.js');
const config = require('../../config.json')

// TODO Check for ips that match, this ips will be compared to a local (WiFi) network IP:
//10.0.0.0      ->  10.255.255.255  (Private network)
//172.16.0.0    –>  172.31.255.255  (Private network)
//192.168.0.0   ->  192.168.255.255 (Private network)
// TODO Check for ips that match, this ips will be compared be port, as they're localhost:
//127.0.0.0     ->  127.255.255.255 (Host)

module.exports = function (domain) {
    return new Promise((resolve, reject) => {
        let match = domain.match(/(.+?)(?::(\d+))?$/);
        let domain_address = match[1];
        let port = match[2];

        dns.lookup(domain_address, function (err, main_ip) {

            if (err) { reject(err); return }
            if (main_ip == '127.0.0.1' && port == config.port) { resolve({ status: 0 }); return; } // I'm the server
            utils.request('GET', 'http://myexternalip.com/raw').then(my_ip => {
                if (main_ip == my_ip) resolve({ status: 0 }); // I'm the server
                else {
                    let adress = main_ip;
                    if (port) adress += `:${port}`;
                    utils.request('GET', adress + '/api/teapot').then(body => {
                        if (body == '418') resolve({ status: 1, ip: main_ip }); // Server is up but not me
                        else resolve({ status: 2 }); // Server is down
                    });
                }
            }).catch(err => {
                resolve({ status: 3 }); // I'm not connected to the internet
            });
        });
    });
}