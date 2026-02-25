import { Router } from "express";
import authorize from "../middlewares/auth.middleware";
import { getAllUsers, getUserById } from "../controllers/user.controller";

const router = Router();

router.get("/", authorize, getAllUsers);
router.get("/:id", authorize, getUserById);

export default router;
