import express from "express";
import cookieParser from "cookie-parser";
import tasksRouter from "./routes/tasks";
import authRouter from "./routes/auth";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();
const PORT = 8000;

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);

app.get("/", (_req, res) => {
    res.json({ message: "Task Management API is up and running" });
});

app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`Server started — listening on http://localhost:${PORT}`);
});
