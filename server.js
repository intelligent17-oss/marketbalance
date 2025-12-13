/**
 * Intelligent Marketplace – Wallet Backend
 * ROLE: Relay + Helper (NON-AUTHORITATIVE)
 * Render Free Plan Safe
 */

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   ENV VARIABLES (REQUIRED)
========================= */
const BOT_TOKEN = process.env.BOT_TOKEN;   // Telegram bot token
const ADMIN_ID = process.env.ADMIN_ID;     // Admin Telegram ID

/* =========================
   RUNTIME MEMORY (TEMP)
   Clears when Render sleeps
========================= */
const runtimeBalances = {}; // { userId: balance }

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ Wallet backend running (relay mode)");
});

/* =========================
   GET MIRROR BALANCE
   (NOT SOURCE OF TRUTH)
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
   Frontend may call this
========================= */
app.post("/mirror/balance", (req, res) => {
  const { userId, balance } = req.body;

  if (!userId || typeof balance !== "number") {
    return res.status(400).json({ error: "Invalid payload" });
  }

  runtimeBalances[userId] = balance;

  res.json({
    success: true,
    mirrored: true
  });
});

/* =========================
   TELEGRAM RELAY
   BACKUP NOTIFIER
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