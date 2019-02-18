#!/bin/bash
#TODO replace with https://www.npmjs.com/package/shelljs
# Test an IP address for validity:
# Usage:
#      valid_ip IP_ADDRESS
#      if [[ $? -eq 0 ]]; then echo good; else echo bad; fi
#   OR
#      if valid_ip IP_ADDRESS; then echo good; else echo bad; fi
#
function valid_ip()
{
    local  ip=$1
    local  stat=1

    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        OIFS=$IFS
        IFS='.'
        ip=($ip)
        IFS=$OIFS
        [[ ${ip[0]} -le 255 && ${ip[1]} -le 255 \
            && ${ip[2]} -le 255 && ${ip[3]} -le 255 ]]
        stat=$?
    fi
}

Domain="$1"
DomainIP=$(host $Domain | awk '/has address/ { print $4 ; exit }')
if valid_ip $Domain ; then
    DomainIP=$Domain
fi
ExternalIP=$(wget -q -O - "http://myexternalip.com/raw")
# if [[ "$Domain" == "localhost"* ]] ; then
#     exit 0 # I'm the server
# fi
if [[ "$DomainIP" = "$ExternalIP" ]] ; then
    exit 0 # I'm the server
else
    ping -c1 -W1 -q $DomainIP &>/dev/null
    if [ $? == 0 ] ; then
        echo $DomainIP
        exit 1 # Server is up but not me
    else
        exit 2 # Server is down
    fi

fi
