const dns = require('dns');
const ping = require('ping');
const utils = require('../utils.js');

// TODO Check for local ips like 127.0.0.1, 192.168.*

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