import mongoose from "mongoose";

const correctionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  text: { type: String, required: true, trim: true, maxlength: 1000 }
}, { _id: false });

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 180 },
  summary: { type: String, required: true, trim: true, maxlength: 360 },
  body: { type: String, required: true, maxlength: 100000 },
  author: { type: String, required: true, trim: true, maxlength: 100 },
  authorRole: { type: String, trim: true, maxlength: 100, default: "Staff Correspondent" },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  tags: { type: [String], default: [], validate: [(tags) => tags.length <= 20, "Maximum 20 tags."] },
  imageUrl: { type: String, trim: true, default: "" },
  imageAlt: { type: String, trim: true, maxlength: 240, default: "" },
  imageCredit: { type: String, trim: true, maxlength: 240, default: "" },
  status: { type: String, enum: ["draft", "scheduled", "published", "archived"], default: "draft", index: true },
  publishAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isBreaking: { type: Boolean, default: false, index: true },
  breakingPriority: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false, index: true },
  isTrending: { type: Boolean, default: false, index: true },
  isOpinion: { type: Boolean, default: false, index: true },
  isSponsored: { type: Boolean, default: false },
  readingTime: { type: Number, default: 3, min: 1, max: 120 },
  views: { type: Number, default: 0, min: 0 },
  metaTitle: { type: String, trim: true, maxlength: 120, default: "" },
  metaDescription: { type: String, trim: true, maxlength: 240, default: "" },
  canonicalUrl: { type: String, trim: true, maxlength: 2048, default: "" },
  focusKeywords: { type: [String], default: [] },
  corrections: { type: [correctionSchema], default: [] }
}, { timestamps: true });

articleSchema.index({ title: "text", summary: "text", body: "text", tags: "text" });
articleSchema.index({ status: 1, publishAt: -1 });
articleSchema.index({ category: 1, status: 1, publishAt: -1 });
articleSchema.index({ isBreaking: 1, status: 1, publishAt: -1 });
articleSchema.index({ isFeatured: 1, status: 1, publishAt: -1 });
articleSchema.index({ isOpinion: 1, status: 1, publishAt: -1 });
articleSchema.index({ views: -1, status: 1 });

export default mongoose.model("Article", articleSchema);
