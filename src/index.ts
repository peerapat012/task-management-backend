import express from "express";

const app = express();
const PORT = 8000;

app.use(express.json());

app.get("/", (_req, res) => {
    res.json({ message: "Task Management API is up and running" });
});

app.listen(PORT, () => {
    console.log(`Server started — listening on http://localhost:${PORT}`);
});
