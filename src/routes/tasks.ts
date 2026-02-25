import { Router } from "express";
import { createTask, deleteTask, getAllTasks, getTaskById, updateTask } from "../controllers/task.controller";
import authorize from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authorize, getAllTasks);
router.get("/:id", authorize, getTaskById);
router.post("/", authorize, createTask);
router.put("/:id", authorize, updateTask);
router.delete("/:id", authorize, deleteTask);

export default router;