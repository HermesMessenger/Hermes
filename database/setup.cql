CREATE KEYSPACE Hermes WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3'}  AND durable_writes = true;

CREATE TABLE Hermes.Users (
    UUID TIMEUUID,
    Username TEXT,
    PasswordHash TEXT,
    PRIMARY KEY(UUID, Username)
);

CREATE TABLE Hermes.Messages (
    channel TEXT,
    timesent TIMESTAMP,
    message TEXT,
    username TEXT,
    PRIMARY KEY(channel, timesent)
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

