CREATE KEYSPACE Hermes WITH replication = {
    'class': 'SimpleStrategy', 
    'replication_factor': '1'
} AND durable_writes = true;

CREATE TABLE Hermes.Channels (
    UUID TIMEUUID PRIMARY KEY,
    Name TEXT,
    Members LIST<TEXT>,
    Icon BLOB,
);

CREATE TABLE Hermes.Users (
    User_low TEXT PRIMARY KEY,
    Username TEXT,
    PasswordHash TEXT,
    Channels LIST<TIMEUUID>,
);

CREATE TABLE Hermes.Messages (
    UUID TIMEUUID,
    channel TIMEUUID,
    message TEXT,
    username TEXT,
    PRIMARY KEY((channel, UUID))
);

CREATE TABLE Hermes.Sessions (
    UUID TIMEUUID PRIMARY KEY,
    Username TEXT,
    LastActive TIMESTAMP
);

CREATE TABLE Hermes.Settings (
    Username TEXT PRIMARY KEY,
    Notifications TINYINT,
    Theme TEXT,
    Color TEXT,
    Image BLOB
);

CREATE TABLE Hermes.Tokens (
    UUID UUID PRIMARY KEY
);

INSERT INTO Hermes.Tokens (UUID) values(uuid());
