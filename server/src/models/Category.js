import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 240, default: "" },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);
