
const express = require("express");
const Redis = require("ioredis");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_jwt_key_change_me";
const REDIS_URL = process.env.REDIS_URL || undefined; // e.g. redis://localhost:6379

const redis = new Redis(REDIS_URL);


const users = {};
const userBooks = {};

const generateToken = (user) => jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "8h" });

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Missing token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const BOOKS_CACHE_KEY = (userId) => `books:cache:${userId}`;
const BULK_KEY = (userId) => `bulk:books:${userId}`;
const BULK_PENDING_SET = "bulk:pending_users";


app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email & password required" });

    const exists = Object.values(users).some((u) => u.email === email);
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    users[id] = { id, email, passwordHash };

    userBooks[id] = userBooks[id] || [];

    const token = generateToken(users[id]);
    return res.status(201).json({ message: "User created", token, user: { id, email } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = Object.values(users).find((u) => u.email === email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    return res.json({ message: "Logged in", token, user: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.get("/books", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = BOOKS_CACHE_KEY(userId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] user=${userId}`);
      return res.json(JSON.parse(cached));
    }

    console.log(`[CACHE MISS] user=${userId}`);
    const books = userBooks[userId] || [];
    await redis.set(cacheKey, JSON.stringify(books), "EX", 60);
    return res.json(books);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.post("/books", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, author, ...rest } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });

    const newBook = { id: uuidv4(), title, author: author || "", ...rest };
    userBooks[userId] = userBooks[userId] || [];
    userBooks[userId].push(newBook);

    await redis.del(BOOKS_CACHE_KEY(userId));

    return res.status(201).json({ message: "Book added", book: newBook });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.put("/books/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.id;
    const books = userBooks[userId] || [];
    const idx = books.findIndex((b) => b.id === bookId);
    if (idx === -1) return res.status(404).json({ message: "Book not found" });

    const updated = Object.assign(books[idx], req.body);
    userBooks[userId][idx] = updated;

    await redis.del(BOOKS_CACHE_KEY(userId));

    return res.json({ message: "Book updated", book: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.delete("/books/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.id;
    const books = userBooks[userId] || [];
    const beforeLen = books.length;
    userBooks[userId] = books.filter((b) => b.id !== bookId);
    const afterLen = userBooks[userId].length;

    if (beforeLen === afterLen) return res.status(404).json({ message: "Book not found" });

    await redis.del(BOOKS_CACHE_KEY(userId));

    return res.json({ message: "Book deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


app.post("/books/bulk", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = req.body.books;
    if (!Array.isArray(payload) || payload.length === 0)
      return res.status(400).json({ message: "Provide an array 'books' with at least one book" });

    const toStore = payload.map((b) => ({ id: b.id || uuidv4(), ...b }));

    const key = BULK_KEY(userId);
    await redis.set(key, JSON.stringify(toStore));

    await redis.sadd(BULK_PENDING_SET, userId);

    return res.json({ message: "Books will be added later." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


async function processUserBulk(userId) {
  const key = BULK_KEY(userId);
  const raw = await redis.get(key);
  if (!raw) {
    await redis.srem(BULK_PENDING_SET, userId);
    return { status: "empty" };
  }

  let items;
  try {
    items = JSON.parse(raw);
    if (!Array.isArray(items) || items.length === 0) {
      await redis.del(key);
      await redis.srem(BULK_PENDING_SET, userId);
      return { status: "no_items" };
    }
  } catch (err) {
    console.error(`[CRON] Invalid JSON for user ${userId}, deleting key`, err.message);
    await redis.del(key);
    await redis.srem(BULK_PENDING_SET, userId);
    return { status: "bad_json" };
  }

  userBooks[userId] = userBooks[userId] || [];
  for (const b of items) {
    if (!userBooks[userId].some((existing) => existing.id === b.id)) {
      userBooks[userId].push(b);
    } else {
      console.log(`[CRON] skipping duplicate id ${b.id} for user ${userId}`);
    }
  }

  await redis.del(key);
  await redis.srem(BULK_PENDING_SET, userId);

  await redis.del(BOOKS_CACHE_KEY(userId));

  console.log(`[CRON] processed ${items.length} books for user ${userId}`);
  return { status: "processed", count: items.length };
}

async function runCronOnce() {
  try {
    const pendingUsers = await redis.smembers(BULK_PENDING_SET);
    if (!pendingUsers || pendingUsers.length === 0) {
      console.log(`[CRON] No pending bulk users at ${new Date().toISOString()}`);
      return;
    }
    console.log(`[CRON] Processing pending users: ${pendingUsers.join(", ")}`);

    for (const userId of pendingUsers) {
      try {
        await processUserBulk(userId);
      } catch (err) {
        console.error(`[CRON] Failed processing user ${userId}:`, err.message);
        }
    }
  } catch (err) {
    console.error("[CRON] error:", err.message);
  }
}

cron.schedule("*/2 * * * *", () => {
  console.log(`[CRON] Running bulk processor at ${new Date().toISOString()}`);
  runCronOnce();
});

app.post("/admin/run-bulk-now", async (req, res) => {
  try {
    await runCronOnce();
    return res.json({ message: "Bulk processing triggered" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.get("/", (req, res) => res.send({ status: "ok", time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  console.log(`JWT_SECRET=${JWT_SECRET}`);
});
