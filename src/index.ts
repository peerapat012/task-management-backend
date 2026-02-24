import express from "express";
import tasksRouter from "./routes/tasks";

const app = express();
const PORT = 8000;

app.use(express.json());
app.use("/api/tasks", tasksRouter);

app.get("/", (_req, res) => {
    res.json({ message: "Task Management API is up and running" });
});

app.listen(PORT, () => {
    console.log(`Server started — listening on http://localhost:${PORT}`);
});
