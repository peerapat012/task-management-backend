import { Router } from "express";
import { createTask, deleteTask, getAllTasks, getTaskById, updateTask } from "../controllers/task.controller";
import { authorize, authorizeRole } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authorize, authorizeRole("user"), getAllTasks);
router.get("/:id", authorize, authorizeRole("user"), getTaskById);
router.post("/", authorize, authorizeRole("user"), createTask);
router.put("/:id", authorize, authorizeRole("user"), updateTask);
router.delete("/:id", authorize, authorizeRole("user"), deleteTask);

export default router;