import express from "express";
import tasksRouter from "./routes/tasks";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();
const PORT = 8000;

app.use(express.json());
app.use("/api/tasks", tasksRouter);

app.get("/", (_req, res) => {
    res.json({ message: "Task Management API is up and running" });
});

app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`Server started — listening on http://localhost:${PORT}`);
});
