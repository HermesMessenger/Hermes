import cassandra from 'cassandra-driver'
import { config } from './utils/config'

const authProvider = new cassandra.auth.PlainTextAuthProvider(config.db.username, config.db.password)
const client = new cassandra.Client({ contactPoints: config.db.hosts, localDataCenter: config.db.datacenter, authProvider, keyspace: config.db.keyspace })

const SESSION_TIMEOUT = 60 * 60 * 24 * 7 // A week in seconds
const BOT_SESSION_TIMEOUT = 60 * 60 * 24 * 30 * 3 // 3 months in seconds
const DEFAULT_IMAGE = '/9j/4AAQSkZJRgABAQEASABIAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwAEAgMDAwIEAwMDBAQEBAUJBgUFBQULCAgGCQ0LDQ0NCwwMDhAUEQ4PEw8MDBIYEhMVFhcXFw4RGRsZFhoUFhcW/8AACwgAgACAAQERAP/EABwAAQACAwEBAQAAAAAAAAAAAAAGBwMEBQIBCP/EADgQAAICAQICBwQJAwUAAAAAAAABAgMEBREGIQcSEzFBUWFxgZGhFBUiMlKxweHwIzOyQmOCktH/2gAIAQEAAD8A/RQAAAAAAAAAAAAAAAAAAAAAAAAABkxaLsjIhRRXKy2x9WMYrdtk74a4Foqgr9Xfa2Nb9hCW0I+1rm37OXtJZhYGFhxUcbEopS/BWonrMw8TKj1cnFpuT8LK1L8yLcR8C4eRB3aVL6Nd39lJt1y/Vfl6EBzsa/Dyp4+TXKu2t7Si/AwgAAAAs7o84fhpmnrMyIL6Zet3uudUX3RXr5/DwJMACP8AHOg16xp0p1QSzKYt1S8ZL8D9H4eT95Vkk4ycZJxaezT70fAAAAdfgbBjn8T41M1vXCXaT9VHnt73sveW6AACqukvAjhcU2uEdoZMVckvN7qXzTfvOAAAACV9ECT4nu3S3WJLb/vAskAAFe9MiX1phPbn2Muf/IhoAAAO70cZccTi7H672jf1qm/Vrl80i1wAAVf0qZayeKpVRe6xao1vbz5yf+W3uI2AAAD1XOULIzhJxlFpxku9PzLc4R1erWdIryOsu2glG+K/0z/8fev2OsADncSanRpGl2ZlzTcVtXDfnOXgv54blQZV1mTk2ZF0utZbNynLzbe7MYAAAB0eGdSz9N1KNmApWTn9mVKTkrV5NItfSMi3LwoX3YluLOX3qrdusv2+HsNwGvqWRPFw53wxrciUVyqrScpFUcW6rqGqalKWdCVKr3UMdppVr2Px82coAAAA7/CHC2XrUlfY3Rhp87Guc/SK/Xu9pYui6Rp+lUKvCxlB7bSm1vKXtf8AEdAAGhrOk6fqtHZZuNCzZfZl3Tj7Jd6K74w4VytHbyKW78Pf+5t9qv0kv1/IjwAABIuAOHXrGY8jJTWHRJdf/cl+Ffr+5Z1VcKq1XXFRhBJRilskl4IyAAAx21wtrddkVKE01KMlumn4MrLpA4c+qMpZWLFvDulsl39lL8L9PL+bxwAA2NKw7tQ1GnCoW9l01Fb9y82/RLd+4uHSMKjTtOqwseO1dUeqn4t+Lfq3zNsAAAGrquHTn4FuHfFOu6PVfmvJr1T5lPaxhW6dqd+Ff9+mbjvt95eD962ZrAAm3Q/p6nfk6nOO6r/o1P1fOXy2+LJ8AAAACB9MGnJSxtUrjt1v6NrXxi/8vkQcAFs9HmKsXhLEW2zti7ZPz6z3Xy2O2AAAADi8e4v0zhPMhtzrr7WL8nH7T+Sa95UoALr0mpU6VjUpbKumEfhFI2QAAAAYNQgrsG+p81OqUfimikgf/9k='
const DEFAULT_BOT_IMAGE = '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'
const DEFAULT_CHAT_IMAGE = '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'
const globalChannelUUID = '13814000-1dd2-11b2-8080-808080808080'

export interface Channel extends cassandra.types.Row {
  uuid: string;
  name: string;
  members: string[];
  admins: string[];
  icon: string;
}

export interface Message extends cassandra.types.Row {
  uuid: string;
  channel: string;
  message: string;
  username: string;
}

export interface Settings extends cassandra.types.Row {
  username: string;
  notifications: number;
  theme: string;
  color: string;
  image: string;
}

export function TimeUUID (buffer?: Buffer): string {
  if (buffer) {
    return new cassandra.types.TimeUuid(buffer).toString()
  } else {
    return cassandra.types.TimeUuid.now().toString()
  }
}

function getRandomHEXPart (): string {
  // Random RGB part to hex
  let hexString = (Math.floor(Math.random() * 150 + 50)).toString(16)

  if (hexString.length % 2) {
    hexString = '0' + hexString // Pad it of it's small
  }

  return hexString
}

function createColor (): string {
  return getRandomHEXPart() + getRandomHEXPart() + getRandomHEXPart()
}

// #region  MESSAGES
// #region   - Getting messages

/**
 * Get the latest 100 messages of a channel
 * @param channel The channel UUID
 * @param uuid The message UUID from which to get messages
 * @returns An array of 100 messages
 */
export async function get100Messages (channel: string, uuid?: string): Promise<Message[]> {
  let query = 'SELECT Username, Message, Channel, UUID FROM Messages WHERE channel=? ORDER BY UUID DESC LIMIT 100;'
  let data = [channel]

  if (uuid) {
    query = 'SELECT Username, Message, Channel, UUID FROM Messages WHERE channel=? AND UUID<? ORDER BY UUID DESC LIMIT 100;'
    data = [channel, uuid]
  }

  const res = await client.execute(query, data, { prepare: true })

  return res.rows as Message[] // They come in from last to first
}

/**
 * Get a single message from a channel
 * @param channel The channel UUID
 * @param uuid The message UUID
 * @returns The message
 */
export async function getSingleMessage (channel: string, uuid: string): Promise<Message> {
  const query = 'SELECT Username, Message, toTimestamp(UUID) as TimeSent, UUID FROM Messages WHERE channel=? and UUID=?;'
  const data = [channel, uuid]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows[0] as Message
}

/**
 * Get the sender of a message
 * @param channel The channel UUID
 * @param uuid The message UUID
 * @returns The message's sender
 */
export async function getMessageSender (channel: string, uuid: string): Promise<string> {
  const query = 'SELECT Username FROM Messages WHERE channel=? AND UUID=?;'
  const data = [channel, uuid]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows[0] && res.rows[0].username
}

/**
 * Get messages sent after the UUID
 * @param channel The channel UUID
 * @param uuid The message UUID from which to get messages
 * @returns An array of messages
 */
export async function getMessagesFrom (channel: string, uuid: string): Promise<Message[]> {
  const query = 'SELECT Username, Message, toTimestamp(UUID) as TimeSent, UUID FROM Messages WHERE channel=? and UUID>? ORDER BY UUID;'
  const data = [channel, uuid]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows as Message[]
}

// #endregion
// #region   - Adding messages

/**
 * Add a new message
 * @param channel The channel UUID to join
 * @param user The user that sent the message
 * @param message The message to add
 */
export async function addMessage (channel: string, user: string, message: string): Promise<string> {
  const query = 'INSERT INTO Messages (UUID, Channel, Username, Message) values(?,?,?,?);'
  const messageUUID = TimeUUID()
  const data = [messageUUID, channel, user, message]

  await client.execute(query, data, { prepare: true })

  return messageUUID
}

/**
 * Add a message saying that someone created a channel
 * @param channel The channel UUID to join
 * @param user The user that sent the message
 */
export async function addCreateMessage (channel: string, user: string): Promise<string> {
  return addMessage(channel, 'Admin', `@${user} has created the chat.`)
}

/**
 * Add a message saying that someone joined a channel
 * @param channel The channel UUID to join
 * @param user The user that sent the message
 */
export async function addWelcomeMessage (channel: string, user: string): Promise<string> {
  return addMessage(channel, 'Admin', `@${user} has joined the chat.`)
}

/**
 * Add a message saying that someone left a channel
 * @param channel The channel UUID to join
 * @param user The user that sent the message
 */
export async function addLeaveMessage (channel: string, user: string): Promise<string> {
  return addMessage(channel, 'Admin', `@${user} has left the chat.`)
}

/**
 * Add a message saying that someone was promoted to admin
 * @param channel The channel UUID to join
 * @param admin The user making the promotion
 * @param newAdmin The user gettning promoted
 */
export async function addPromoteMessage (channel: string, admin: string, newAdmin: string): Promise<string> {
  return addMessage(channel, 'Admin', `@${admin} has made @${newAdmin} an admin.`)
}

/**
 * Add a message saying that someone was demoted to member
 * @param channel The channel UUID to join
 * @param admin The user making the demotion
 * @param oldAdmin The user gettning demoted
 */
export async function addDemoteMessage (channel: string, admin: string, oldAdmin: string): Promise<string> {
  return addMessage(channel, 'Admin', `@${admin} has removed @${oldAdmin} as an admin.`)
}

// #endregion
// #region   - Editing | deleting messages

/**
 * Edit a message
 * @param channel The channel the message is in
 * @param uuid The message UUID
 * @param newmessage The new message
 */
export async function editMessage (channel: string, uuid: string, newmessage: string): Promise<void> {
  const query = 'UPDATE Messages SET message=? WHERE channel=? and UUID=?;'
  const data = [newmessage, channel, uuid]

  await client.execute(query, data, { prepare: true })
}

/**
 * Delete a message
 * @param channel The channel the message is in
 * @param uuid The message UUID
 */
export async function deleteMessage (channel: string, uuid: string): Promise<void> {
  const query = 'DELETE FROM Messages WHERE channel=? and UUID=?;'
  const data = [channel, uuid]

  await client.execute(query, data, { prepare: true })
}

// #endregion

// #region  CHANNELS
// #region   - Getting channels

/**
 * Get the list of channels a user belongs to
 * @param user The user to get the channels for
 * @returns An array of channel UUIDs the user belongs to
 */
export async function getChannels (user: string): Promise<string[]> {
  const query = 'SELECT Channels FROM Users WHERE user_low=?;'
  const data = [user.toLowerCase()]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows[0] && res.rows[0].channels
}

/**
 * Get the properties of a channel
 * @param channel The channel to get the properties for
 * @returns The channel's properties
 */
export async function getChannelProperties (channel: string): Promise<Channel> {
  const query = 'SELECT uuid, blobAsText(icon) as icon, members, admins, name FROM Channels WHERE UUID=?;'
  const data = [channel]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows[0] as Channel
}

/**
 * Check whether a channel exists
 * @param channel The channel to check
 * @returns If the channel exists
 */
export async function channelExists (channel: string): Promise<boolean> {
  const query = 'SELECT COUNT (*) as count from Channels where UUID = ?;'
  const data = [channel]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows[0] && res.rows[0] && res.rows[0].count.low !== 0
}

// #endregion
// #region   - Joining | leaving | creating channels

/**
 * Add a user to a channel
 * @param user The user to add to the channel
 * @param channel The channel to join
 * @param makeAdmin Whether to make the user an admin
 */
export async function joinChannel (user: string, channel: string, makeAdmin?: boolean): Promise<void> {
  const queries = [
    {
      query: 'UPDATE Users SET channels = channels + ? WHERE User_low = ?;',
      params: [[channel], user.toLowerCase()]
    },
    {
      query: 'UPDATE Channels SET members = members + ? WHERE UUID = ?;',
      params: [[user.toLowerCase()], channel]
    }
  ]

  if (makeAdmin) {
    queries.push({
      query: 'UPDATE Channels SET admins = admins + ? WHERE UUID = ?;',
      params: [[user.toLowerCase()], channel]
    })
  }

  await client.batch(queries, { prepare: true })
}

/**
 * Remove a user from a channel
 * @param user The user to remove
 * @param channel The channel to remove from
 */
export async function leaveChannel (user: string, channel: string): Promise<void> {
  const queries = [
    {
      query: 'UPDATE Users SET channels = channels - ? WHERE User_low = ?;',
      params: [[channel], user.toLowerCase()]
    },
    {
      query: 'UPDATE Channels SET members = members - ? WHERE UUID = ?;',
      params: [[user.toLowerCase()], channel]
    },
    {
      query: 'UPDATE Channels SET admins = admins - ? WHERE UUID = ?;',
      params: [[user.toLowerCase()], channel]
    }
  ]

  await client.batch(queries, { prepare: true })
}

/**
 * Create a channel
 * @param user The user to get the channels for
 * @returns The channel's UUID
 */
export async function createChannel (user: string, name: string): Promise<string> {
  const query = 'INSERT INTO Channels (UUID, Name, Members, Admins, Icon) values(?,?,?,?,textAsBlob(?));'
  const channelUUID = TimeUUID()
  const data = [channelUUID, name, [], [], DEFAULT_CHAT_IMAGE]

  await client.execute(query, data, { prepare: true })
  await joinChannel(user.toLowerCase(), channelUUID, true)

  return channelUUID.toString()
}

// #endregion
// #region   - Channel roles

/**
 * Check whether a user belongs to a channel
 * @param user The user to check
 * @param channel The channel to check
 * @returns If the user is in the channel
 */
export async function isMember (user: string, channel: string): Promise<boolean> {
  const query = 'SELECT COUNT (*) as count from Channels WHERE uuid = ? AND members CONTAINS ?;'
  const data = [channel, user.toLowerCase()]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows[0] && res.rows[0].count.low !== 0
}

/**
 * Check whether a user is an admin of a channel
 * @param user The user to check
 * @param channel The channel to check
 * @returns If the user is an admin
 */
export async function isAdmin (user: string, channel: string): Promise<boolean> {
  const query = 'SELECT COUNT (*) as count from Channels WHERE uuid = ? AND admins CONTAINS ?;'
  const data = [channel, user.toLowerCase()]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows[0] && res.rows[0].count.low !== 0
}

/**
 * Make a user an admin of a channel
 * @param user The user to make admin
 * @param channel The channel to add to
 */
export async function makeAdmin (user: string, channel: string): Promise<void> {
  const query = 'UPDATE Channels SET admins = admins + ? WHERE UUID = ?;'
  const data = [[user], channel]

  await client.execute(query, data, { prepare: true })
}

/**
 * Remove a user as an admin of a channel
 * @param user The user to remove
 * @param channel The channel to remove from
 */
export async function removeAdmin (user: string, channel: string): Promise<void> {
  const query = 'UPDATE Channels SET admins = admins - ? WHERE UUID = ?;'
  const data = [[user], channel]

  await client.execute(query, data, { prepare: true })
}

// #endregion

// #region  SETTINGS
// #region   - Getting settings

/**
 * Get a user's settings
 * @param username The user whose settings to get
 * @returns The user's settings
 */
export async function getSettings (username: string): Promise<Settings> {
  const query = 'SELECT color, notifications, blobAsText(image) as image, theme FROM Settings WHERE username=?;'
  const data = [username.toLowerCase()]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows[0] as Settings
}

/**
 * Get a user's display name
 * @param username The lowercase username
 * @returns The display name (in correct casing)
 */
export async function getDisplayName (username: string): Promise<void> {
  const query = 'SELECT username FROM Users WHERE user_low=?;'
  const data = [username.toLowerCase()]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows[0] && res.rows[0].username
}

// #endregion
// #region   - Saving settings

/**
 * Save a user's settings
 * @param username The user whose settings to update
 * @param color The user's new color
 * @param notifications The user's notifications
 * @param imageB64 The user's profile picture (in base64)
 * @param theme The user's theme
 */
export async function saveSettings (username: string, color: string, notifications = 0, imageB64 = DEFAULT_IMAGE, theme = 'hermes'): Promise<void> {
  const query = 'INSERT INTO Settings(Username,Notifications,Theme,Color,Image) values(?,?,?,?,textAsBlob(?));'
  const data = [username.toLowerCase(), notifications, theme, color, imageB64]

  await client.execute(query, data, { prepare: true })
}

// #endregion

// #region USERS
// #region   - Login | Logout

/**
 * Log in a user
 * @param user The user to log in
 * @param bot Wheter the user is a bot
 * @returns The user's session UUID
 */
export async function login (user: string, bot = false): Promise<string> {
  const query = 'INSERT INTO Sessions (UUID, Username) values(?,?) IF NOT EXISTS USING TTL ?;'
  const uuid = TimeUUID()
  const data = [uuid, user, bot ? BOT_SESSION_TIMEOUT : SESSION_TIMEOUT]

  await client.execute(query, data, { prepare: true })

  return uuid.toString()
}

/**
 * Log out a user
 * @param uuid The session to log out
 */
export async function logout (uuid: string): Promise<void> {
  const query = 'DELETE FROM Sessions WHERE UUID=?;'
  const data = [uuid]

  await client.execute(query, data, { prepare: true })
}

// #endregion
// #region   - Creating users

/**
 * Add a user to the DB
 * @param user The user (name) to add
 * @param passwordHash The hash of the user's password
 * @returns The user's session UUID
 */
export async function register (user: string, passwordHash: string, bot = false): Promise<string> {
  const query = 'INSERT INTO Users (User_low, Username, PasswordHash, Channels) values(?,?,?,?) IF NOT EXISTS;'
  const data = [user.toLowerCase(), user, passwordHash, []]

  await client.execute(query, data, { prepare: true })
  await saveSettings(user, createColor(), bot ? 2 : 0, bot ? DEFAULT_BOT_IMAGE : DEFAULT_IMAGE)
  await joinChannel(user, globalChannelUUID)

  const uuid = await login(user, bot)

  return uuid
}

// #endregion
// #region   - Getting users

/**
 * Get the password hash for a user
 * @param user The user to get the hash for
 * @returns The password hash
 */
export async function getPasswordHash (user: string): Promise<string> {
  const query = 'SELECT PasswordHash from Users where User_low = ?;'
  const data = [user.toLowerCase()]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows[0] && res.rows[0].passwordhash
}

/**
 * Get the username of a session UUID
 * @param uuid The session UUID
 * @returns The username corresponding to the UUID
 */
export async function getUserForUUID (uuid: string): Promise<string> {
  const query = 'SELECT Username FROM Sessions WHERE UUID=?'
  const data = [uuid]

  const res = await client.execute(query, data, { prepare: true })

  return res.rows[0].username
}

/**
 * Check if user is already registered
 * @param user The username to check
 * @returns If the user is registered or not
 */
export async function userExists (user: string): Promise<boolean> {
  const query = 'SELECT COUNT (*) as count from Users where User_low = ?;'
  const data = [user.toLowerCase()]

  const res = await client.execute(query, data, { prepare: true })

  return !(res.rows[0] && res.rows[0].count.low === 0)
}

// #endregion
// #region   - Updating users

/**
 * Update the password hash of a user
 * @param user The user to change the password for
 * @param passwordHash The new password hash
 */
export async function updatePasswordHash (user: string, passwordHash: string): Promise<void> {
  const query = 'UPDATE Users SET passwordHash=? WHERE User_low=?;'
  const data = [passwordHash, user.toLowerCase()]

  await client.execute(query, data, { prepare: true })
}

// #endregion

export function close (callback: () => unknown): void {
  client.shutdown(callback)
}
