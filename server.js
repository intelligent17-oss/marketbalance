/**
 * Intelligent Marketplace – Wallet Backend
 * ROLE: Static balance provider + Telegram relay
 */

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ SERVE STATIC FILES (balance.js)
app.use(express.static("public"));

const BOT_TOKEN = process.env.BOT_TOKEN;

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ Wallet backend running");
});

/* =========================
   TELEGRAM RELAY (OPTIONAL BACKUP)
========================= */
app.post("/notify", async (req, res) => {
  const { chatId, message } = req.body;

  if (!chatId || !message) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Telegram relay failed:", err.message);
    res.status(500).json({ error: "Telegram relay failed" });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Wallet backend started on port", PORT);
});