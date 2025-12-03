require("dotenv").config();
const express = require("express");
const Redis = require("ioredis");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const { v4: uuidv4 } = require("uuid");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const stream = require("stream");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_jwt_key_change_me";
const REDIS_URL = process.env.REDIS_URL || undefined;

const redis = new Redis(REDIS_URL);

const users = {};
const userBooks = {};

const generateToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "8h" });

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ message: "Missing token" });

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const BOOKS_CACHE_KEY = (userId) => `books:cache:${userId}`;
const BULK_KEY = (userId) => `bulk:books:${userId}`;
const BULK_PENDING_SET = "bulk:pending_users";
const BULK_STATUS_KEY = (userId) => `bulk_status:${userId}`;
const BULK_STATUS_SET = "bulk_status_users";

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "email & password required" });

    if (Object.values(users).some((u) => u.email === email))
      return res.status(409).json({ message: "Email already registered" });

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    users[id] = { id, email, passwordHash };
    userBooks[id] = [];

    const token = generateToken(users[id]);
    res.status(201).json({ message: "User created", token, user: { id, email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.json({ message: "Logged in", token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/books", authMiddleware, async (req, res) => {
  try {
    const key = BOOKS_CACHE_KEY(req.user.id);
    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const books = userBooks[req.user.id] || [];
    await redis.set(key, JSON.stringify(books), "EX", 60);
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/books", authMiddleware, async (req, res) => {
  try {
    const { title, author, ...rest } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });

    const newBook = { id: uuidv4(), title, author: author || "", ...rest };
    userBooks[req.user.id].push(newBook);
    await redis.del(BOOKS_CACHE_KEY(req.user.id));

    res.status(201).json({ message: "Book added", book: newBook });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/books/:id", authMiddleware, async (req, res) => {
  try {
    const books = userBooks[req.user.id];
    const idx = books.findIndex((b) => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Book not found" });

    books[idx] = { ...books[idx], ...req.body };
    await redis.del(BOOKS_CACHE_KEY(req.user.id));

    res.json({ message: "Book updated", book: books[idx] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/books/:id", authMiddleware, async (req, res) => {
  try {
    const books = userBooks[req.user.id];
    const newBooks = books.filter((b) => b.id !== req.params.id);
    if (newBooks.length === books.length)
      return res.status(404).json({ message: "Book not found" });

    userBooks[req.user.id] = newBooks;
    await redis.del(BOOKS_CACHE_KEY(req.user.id));
    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/books/bulk", authMiddleware, async (req, res) => {
  try {
    const books = req.body.books;
    if (!Array.isArray(books) || books.length === 0)
      return res.status(400).json({ message: "Provide books array" });

    const formatted = books.map((b) => ({ id: b.id || uuidv4(), ...b }));
    await redis.set(BULK_KEY(req.user.id), JSON.stringify(formatted));
    await redis.sadd(BULK_PENDING_SET, req.user.id);

    res.json({ message: "Books will be added later." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function processUserBulk(userId) {
  const raw = await redis.get(BULK_KEY(userId));
  if (!raw) {
    await redis.srem(BULK_PENDING_SET, userId);
    return;
  }

  let items;
  try {
    items = JSON.parse(raw);
    if (!Array.isArray(items) || items.length === 0) {
      await redis.del(BULK_KEY(userId));
      await redis.srem(BULK_PENDING_SET, userId);
      return;
    }
  } catch {
    await redis.del(BULK_KEY(userId));
    await redis.srem(BULK_PENDING_SET, userId);
    return;
  }

  let success = 0;
  let fail = 0;

  for (const b of items) {
    if (!userBooks[userId].some((x) => x.id === b.id)) {
      userBooks[userId].push(b);
      success++;
    } else fail++;
  }

  await redis.del(BULK_KEY(userId));
  await redis.srem(BULK_PENDING_SET, userId);
  await redis.del(BOOKS_CACHE_KEY(userId));

  const status = {
    userId,
    successCount: success,
    failCount: fail,
    processedAt: new Date().toISOString(),
    total: items.length
  };

  await redis.set(BULK_STATUS_KEY(userId), JSON.stringify(status));
  await redis.sadd(BULK_STATUS_SET, userId);
}

async function runBulkProcessorOnce() {
  const users = await redis.smembers(BULK_PENDING_SET);
  for (const u of users) await processUserBulk(u);
}

cron.schedule("*/2 * * * *", runBulkProcessorOnce);

app.post("/admin/run-bulk-now", async (req, res) => {
  await runBulkProcessorOnce();
  res.json({ message: "Bulk run completed" });
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

function generateStatusPdfBuffer(obj) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const pass = new stream.PassThrough();
    const chunks = [];
    pass.on("data", (c) => chunks.push(c));
    pass.on("end", () => resolve(Buffer.concat(chunks)));
    pass.on("error", reject);

    doc.pipe(pass);
    doc.fontSize(20).text("Bulk Insert Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`User ID: ${obj.userId}`);
    doc.text(`Processed At: ${obj.processedAt}`);
    doc.text(`Total Submitted: ${obj.total}`);
    doc.text(`Success: ${obj.successCount}`);
    doc.text(`Failed: ${obj.failCount}`);
    doc.end();
  });
}

async function sendUserReport(userId) {
  const raw = await redis.get(BULK_STATUS_KEY(userId));
  if (!raw) {
    await redis.srem(BULK_STATUS_SET, userId);
    return;
  }

  let status;
  try {
    status = JSON.parse(raw);
  } catch {
    await redis.del(BULK_STATUS_KEY(userId));
    await redis.srem(BULK_STATUS_SET, userId);
    return;
  }

  const user = users[userId];
  if (!user) return;

  let pdf;
  try {
    pdf = await generateStatusPdfBuffer(status);
  } catch {
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: user.email,
      subject: "Books Bulk Insert Report",
      text: "Attached is your bulk insert report.",
      attachments: [
        {
          filename: `report-${userId}.pdf`,
          content: pdf,
          contentType: "application/pdf"
        }
      ]
    });

    await redis.del(BULK_STATUS_KEY(userId));
    await redis.srem(BULK_STATUS_SET, userId);
  } catch {}
}

async function runReportJobOnce() {
  const users = await redis.smembers(BULK_STATUS_SET);
  for (const u of users) await sendUserReport(u);
}

cron.schedule("*/5 * * * *", runReportJobOnce);

app.post("/admin/run-reports-now", async (req, res) => {
  await runReportJobOnce();
  res.json({ message: "Reports job done" });
});

app.get("/admin/my-bulk-status", authMiddleware, async (req, res) => {
  const raw = await redis.get(BULK_STATUS_KEY(req.user.id));
  res.json(raw ? JSON.parse(raw) : null);
});

app.get("/", (req, res) =>
  res.send({ status: "ok", time: new Date().toISOString() })
);

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
