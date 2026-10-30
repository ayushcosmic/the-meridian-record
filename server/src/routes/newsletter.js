import { Router } from "express";
import { z } from "zod";
import Subscriber from "../models/Subscriber.js";

const router = Router();
router.post("/", async (req, res) => {
  const parsed = z.object({ email: z.string().trim().email().max(254), consent: z.literal(true) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid email and confirm the subscription consent." });
  try {
    await Subscriber.create({ email: parsed.data.email.toLowerCase() });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: "This email is already subscribed." });
    throw error;
  }
  res.status(201).json({ message: "Thanks for subscribing." });
});
export default router;
