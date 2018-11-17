CREATE KEYSPACE Hermes WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3'}  AND durable_writes = true;

CREATE TABLE Hermes.Users (
    UUID TIMEUUID,
    Username TEXT,
    PasswordHash TEXT,
    PRIMARY KEY(UUID, Username)
);

/* This could be replicated so that there are channels, each with its own table */
CREATE TABLE Hermes.Messages (
    Username TEXT,
    Message TEXT,
    TimeSent TIMESTAMP PRIMARY KEY
);

CREATE TABLE Hermes.Sessions (
    UUID TIMEUUID PRIMARY KEY,
    Username TEXT,
    LastActive TIMESTAMP
);

CREATE TABLE Hermes.Settings (
    UUID TIMEUUID,
    Username TEXT,
    Notifications BOOLEAN,
    Color TEXT,
    /*TODO: ADD PROFILE PICTURES*/
    PRIMARY KEY(UUID, Username)
);

