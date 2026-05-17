import { Router } from "express";
import { search } from "./search.controller";
import { checkValidJWT } from "@/middlewares/jwt.middleware";

const router = Router();
// GET /api/search?q=hello&conversationId=123

router.get("/", checkValidJWT, search);

export default router;