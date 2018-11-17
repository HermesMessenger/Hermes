CREATE KEYSPACE Hermes WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3'}  AND durable_writes = true;

CREATE TABLE Hermes.Users (
    uuid TIMEUUID,
    username TEXT,
    password_hash TEXT,
    PRIMARY KEY(uuid, username)
);
/* This could be replicated so that there are channels, each with it's own table */
CREATE TABLE Hermes.Messages (
    username TEXT,
    body TEXT,
    time_sent TIMESTAMP PRIMARY KEY
);

CREATE TABLE Hermes.Sessions (
    uuid TIMEUUID,
    username TEXT,
    last_active_time TIMESTAMP,
    PRIMARY KEY(uuid)
);

CREATE TABLE Hermes.Settings (
    uuid TIMEUUID,
    username TEXT,
    notifications BOOLEAN,
    color TEXT,
    /*TODO: ADD PROFILE PICTURES*/
    PRIMARY KEY(uuid, username)
);

