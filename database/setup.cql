CREATE KEYSPACE Hermes WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'}  AND durable_writes = true;

CREATE TABLE Hermes.Users (
    UUID TIMEUUID,
    Username TEXT,
    PasswordHash TEXT,
    PRIMARY KEY(UUID, Username)
);

CREATE TABLE Hermes.Messages (
    UUID TIMEUUID,
    channel TEXT,
    message TEXT,
    username TEXT,
    PRIMARY KEY(channel, UUID)
);

CREATE TABLE Hermes.Sessions (
    UUID TIMEUUID PRIMARY KEY,
    Username TEXT,
    LastActive TIMESTAMP
);

CREATE TABLE Hermes.Settings (
    UUID TIMEUUID,
    Username TEXT,
    Notifications TINYINT,
    Dark BOOLEAN,
    Color TEXT,
    Image BLOB,
    PRIMARY KEY(UUID, Username)
);

CREATE TABLE Hermes.TOKENS (
    UUID UUID PRIMARY KEY
);

INSERT INTO Hermes.TOKENS (UUID) values(uuid());
