import { Router } from "express";
import Category from "../models/Category.js";

const router = Router();
router.get("/", async (req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  res.json({ categories });
});
export default router;
