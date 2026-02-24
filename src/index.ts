import express from "express";

const app = express();
const PORT = 8000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
    res.json({ message: "Task Management API is up and running 🚀" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Server started — listening on http://localhost:${PORT}`);
});
