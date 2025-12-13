/**
 * Intelligent Marketplace – Wallet Backend
 * ROLE: Relay + Helper (NON-AUTHORITATIVE)
 */

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

/* =========================
   TEMP RUNTIME MEMORY
========================= */
const runtimeBalances = {};

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ Wallet backend running (relay mode)");
});

/* =========================
   GET MIRROR BALANCE
========================= */
app.get("/wallet/:userId", (req, res) => {
  const { userId } = req.params;

  if (typeof runtimeBalances[userId] !== "number") {
    return res.json({ exists: false });
  }

  res.json({
    exists: true,
    balance: runtimeBalances[userId]
  });
});

/* =========================
   MIRROR BALANCE (OPTIONAL)
========================= */
app.post("/mirror/balance", (req, res) => {
  const { userId, balance } = req.body;

  if (!userId || typeof balance !== "number") {
    return res.status(400).json({ error: "Invalid payload" });
  }

  runtimeBalances[userId] = balance;

  res.json({ success: true });
});

/* =========================
   TELEGRAM RELAY (BACKUP)
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