#!/bin/bash

Domain="$1"
DomainIP=$(host $Domain | awk '/has address/ { print $4 ; exit }')
ExternalIP=$(wget -q -O - "http://myexternalip.com/raw")
if [[ "$Domain" == "localhost"* ]] ; then
    exit 0 # I'm the server
fi
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