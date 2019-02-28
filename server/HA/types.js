const TimeUUID = require('cassandra-driver').types.TimeUuid;

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

module.exports = {
    ServerObject: class {
        /**
         * @param {ipaddr.IPv4 | ipaddr.IPv6} ip 
         * @param {Number} port 
         * @param {TimeUUID?} server_session
         */
        constructor(ip, port, server_session = new TimeUUID()){
            this.ip = ip;
            this.port = port;
            this.server_session = server_session;
        }
    
        toString(){
            let ip_str = this.ip.toString();
            if(this.ip.kind() == 'ipv6'){
                ip_str = `[${ip_str}]`
            }
            return `${ip_str}:${this.port}`
        }
    
        equals(other){
            if(other.prototype == this.prototype){
                return this.toString() == other.toString() && this.server_session == other.server_session;
            }
        }
    },

    Connection: class {
        /**
         * @param {String} ip
         * @param {String} server_session
         */
        constructor(ip, server_session){
            this.ip = ip;
            this.server_session = TimeUUID.fromString(server_session);
        }
    }
}
