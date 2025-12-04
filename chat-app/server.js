require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");
const { MongoClient } = require("mongodb");
const cron = require("node-cron");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || null;
const MONGO_URI = process.env.MONGO_URI || null;
const BACKUP_CRON = process.env.BACKUP_CRON || "*/5 * * * *";

let redis = null;
if (REDIS_URL) {
  redis = new Redis(REDIS_URL);
  redis.on("error", (e) => console.error("Redis error:", e.message));
  console.log("Connected to Redis:", REDIS_URL);
} else {
  console.log("Redis not configured — using in-memory chat history");
}

let mongoClient = null;
let mongoDb = null;
if (MONGO_URI) {
  mongoClient = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  mongoClient.connect()
    .then(() => {
      mongoDb = mongoClient.db(); 
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Mongo connection error:", err.message);
      mongoClient = null;
    });
} else {
  console.log("MongoDB not configured — backups disabled");
}

app.use(express.static(path.join(__dirname, "public")));


const inMemoryMessages = []; 
const inMemoryUsers = {};    
const onlineUsersByName = {}; 


const REDIS_CHAT_KEY = (room) => `chat:room:${room}:messages`;
const REDIS_ONLINE_SET = "chat:online_users";
const REDIS_USER_HASH = (socketId) => `chat:user:${socketId}`;

const HISTORY_LIMIT = 200;

async function storeMessage(room, message) {
  if (redis) {
    const key = REDIS_CHAT_KEY(room);
    await redis.lpush(key, JSON.stringify(message));
    await redis.ltrim(key, 0, HISTORY_LIMIT - 1);
  } else {
    const arrKey = room || "global";
    if (!inMemoryMessages[arrKey]) inMemoryMessages[arrKey] = [];
    inMemoryMessages[arrKey].unshift(message);
    inMemoryMessages[arrKey] = inMemoryMessages[arrKey].slice(0, HISTORY_LIMIT);
  }
}

async function fetchRecent(room, count = 50) {
  if (redis) {
    const key = REDIS_CHAT_KEY(room);
    const items = await redis.lrange(key, 0, count - 1);
    return items.map((s) => {
      try { return JSON.parse(s); } catch { return null; }
    }).filter(Boolean).reverse(); 
  } else {
    const arr = inMemoryMessages[room] || [];
    return arr.slice(0, count).reverse();
  }
}

async function addOnlineUser(socketId, userObj) {
  inMemoryUsers[socketId] = userObj;
  const name = userObj.name;
  onlineUsersByName[name] = (onlineUsersByName[name] || 0) + 1;
  if (redis) {
    await redis.sadd(REDIS_ONLINE_SET, name);
    await redis.hset(REDIS_USER_HASH(socketId), "name", userObj.name, "isAdmin", userObj.isAdmin ? "1" : "0", "room", userObj.room || "global");
  }
}

async function removeOnlineUser(socketId) {
  const u = inMemoryUsers[socketId];
  if (!u) return;
  const name = u.name;
  onlineUsersByName[name] = Math.max(0, (onlineUsersByName[name] || 1) - 1);
  if (onlineUsersByName[name] === 0) delete onlineUsersByName[name];
  delete inMemoryUsers[socketId];
  if (redis) {
    await redis.hdel(REDIS_USER_HASH(socketId), "name", "isAdmin", "room");
    
    if (!Object.keys(onlineUsersByName).includes(name)) {
      await redis.srem(REDIS_ONLINE_SET, name);
    }
  }
}

async function broadcastOnlineUsers() {
  let names;
  if (redis) {
    names = await redis.smembers(REDIS_ONLINE_SET);
    const mem = Object.keys(onlineUsersByName);
    names = Array.from(new Set([...(names || []), ...mem]));
  } else {
    names = Object.keys(onlineUsersByName);
  }
  io.emit("onlineUsers", names);
}

io.on("connection", (socket) => {
  socket.on("register", async (payload, ack) => {
    if (!payload || !payload.name) return ack && ack({ ok: false, message: "Name required" });
    const name = payload.name.trim();
    const isAdmin = !!payload.isAdmin;
    const room = payload.room && payload.room.trim() ? payload.room.trim() : "global";

    await addOnlineUser(socket.id, { name, isAdmin, room });

    socket.join(room);

    socket.data = { name, isAdmin, room };

    const history = await fetchRecent(room, 100);
    socket.emit("history", { room, history });

    const joinMsg = { system: true, text: `${name} joined ${room}`, ts: new Date().toISOString(), room };
    io.to(room).emit("message", joinMsg);
    broadcastOnlineUsers();

    ack && ack({ ok: true, room });
  });

  socket.on("sendMessage", async (payload, ack) => {
    const user = socket.data;
    if (!user || !user.name) {
      return ack && ack({ ok: false, message: "Not registered" });
    }
    const room = (payload && payload.room) || user.room || "global";
    const text = (payload && payload.text) ? String(payload.text).trim() : "";
    if (!text) return ack && ack({ ok: false, message: "Empty message" });

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      sender: user.name,
      isAdmin: !!user.isAdmin,
      ts: new Date().toISOString(),
      room
    };

    await storeMessage(room, message);
    io.to(room).emit("message", message);
    ack && ack({ ok: true });
  });

  socket.on("adminBroadcast", async (payload, ack) => {
    const user = socket.data;
    if (!user || !user.isAdmin) return ack && ack({ ok: false, message: "Not authorized" });
    const text = (payload && payload.text) ? String(payload.text).trim() : "";
    if (!text) return ack && ack({ ok: false, message: "Empty" });

    const announcement = {
      id: `ann-${Date.now()}`,
      text,
      sender: user.name,
      isAdmin: true,
      ts: new Date().toISOString(),
      room: "global",
      announcement: true
    };

    await storeMessage("global", announcement);
    io.emit("announcement", announcement);
    ack && ack({ ok: true });
  });

  socket.on("joinRoom", async (roomName, ack) => {
    if (!socket.data || !socket.data.name) return ack && ack({ ok: false, message: "Not registered" });
    const oldRoom = socket.data.room || "global";
    const newRoom = roomName && roomName.trim() ? roomName.trim() : "global";
    socket.leave(oldRoom);
    socket.join(newRoom);
    socket.data.room = newRoom;
    if (redis) {
      await redis.hset(REDIS_USER_HASH(socket.id), "room", newRoom);
    }
    const history = await fetchRecent(newRoom, 100);
    socket.emit("history", { room: newRoom, history });
    io.to(newRoom).emit("message", { system: true, text: `${socket.data.name} joined ${newRoom}`, ts: new Date().toISOString(), room: newRoom });
    ack && ack({ ok: true, room: newRoom });
    broadcastOnlineUsers();
  });

  socket.on("disconnect", async () => {
    const user = inMemoryUsers[socket.id];
    await removeOnlineUser(socket.id);
    if (user) {
      const room = user.room || "global";
      io.to(room).emit("message", { system: true, text: `${user.name} left`, ts: new Date().toISOString(), room });
    }
    broadcastOnlineUsers();
  });
});

async function backupRedisToMongo() {
  if (!redis || !mongoDb) return;
  try {
    const stream = redis.scanStream({ match: "chat:room:*:messages", count: 100 });
    const keys = [];
    for await (const resultKeys of stream) {
      for (const k of resultKeys) keys.push(k);
    }
    for (const key of keys) {
      const room = key.split(":")[2]; 
      const messages = await redis.lrange(key, 0, -1);
      if (!messages || messages.length === 0) continue;
      const docs = messages.map((m) => {
        try { return JSON.parse(m); } catch { return null; }
      }).filter(Boolean).map((obj) => ({ ...obj, backedUpAt: new Date() }));
      if (docs.length === 0) continue;
      const col = mongoDb.collection("chat_messages");
      const ops = docs.map(doc => ({
        updateOne: {
          filter: { id: doc.id },
          update: { $setOnInsert: doc },
          upsert: true
        }
      }));
      if (ops.length) await col.bulkWrite(ops, { ordered: false });
      console.log(`Backed up ${docs.length} messages for room ${room}`);
    }
  } catch (err) {
    console.error("Backup error:", err.message);
  }
}

if (mongoClient && mongoDb) {
  cron.schedule(BACKUP_CRON, () => {
    console.log(`[CRON] Running Redis->Mongo backup at ${new Date().toISOString()}`);
    backupRedisToMongo();
  });
}

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
