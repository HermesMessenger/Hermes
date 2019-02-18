const dns = require('dns');
const ping = require('ping');
const utils = require('../utils.js');

// TODO Check for ips that match, this ips will be compared to a local (WiFi) network IP:
//10.0.0.0      ->  10.255.255.255  (Private network)
//172.16.0.0    –>  172.31.255.255  (Private network)
//192.168.0.0   ->  192.168.255.255 (Private network)
// TODO Check for ips that match, this ips will be compared be port, as they're localhost:
//127.0.0.0     ->  127.255.255.255 (Host)

module.exports = check_domain_func = function(domain) {
    return new Promise((resolve, reject) => {
        dns.lookup(domain, function(err, main_ip) {
            if(err){reject(err);return}
            utils.request('GET', 'http://myexternalip.com/raw').then(my_ip => {
                console.log(main_ip, my_ip);
                if(main_ip == my_ip) resolve(0); // I'm the server
                else {
                    ping.sys.probe(main_ip, function(isAlive){
                        if (isAlive) resolve(1); // Server is up but not me
                        else resolve(2); // Server is down
                    });
                }
            }).catch(err => {
                throw err;
            });
        });
    });
}