
const express = require("express");
const Redis = require("ioredis");

const app = express();
app.use(express.json());


const redis = new Redis();

let items = [
  { id: 1, name: "Item One" },
  { id: 2, name: "Item Two" }
];


const ITEMS_CACHE_KEY = "items:all";

app.get("/items", async (req, res) => {
  try {
    
    const cachedData = await redis.get(ITEMS_CACHE_KEY);

    if (cachedData) {
      console.log("📌 Returning data from Redis Cache");
      return res.json(JSON.parse(cachedData));
    }

    
    console.log("📌 Cache miss — returning data from DB");
    await redis.set(ITEMS_CACHE_KEY, JSON.stringify(items), "EX", 60); // 60 sec TTL

    return res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/items", async (req, res) => {
  try {
    const newItem = {
      id: items.length + 1,
      name: req.body.name,
    };

    items.push(newItem);

    
    await redis.del(ITEMS_CACHE_KEY);

    return res.status(201).json({ message: "Item added", item: newItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return res.status(404).json({ message: "Item not found" });

    items[index].name = req.body.name;

    // Invalidate Cache
    await redis.del(ITEMS_CACHE_KEY);

    return res.json({ message: "Item updated", item: items[index] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    items = items.filter((item) => item.id !== id);

    
    await redis.del(ITEMS_CACHE_KEY);

    return res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(3000, () => console.log("🚀 Server running on port 3000"));
