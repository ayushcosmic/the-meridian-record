import test from "node:test";
import assert from "node:assert/strict";
import { escapeRegex, parseArticle } from "./validation.js";

const validArticle = {
  title: "A useful newsroom demonstration",
  slug: "useful-newsroom-demonstration",
  summary: "A sufficiently detailed summary used to verify editorial input validation.",
  body: "## Demonstration\n\nThis article body contains enough text to pass validation.",
  author: "Test Editor",
  category: "507f1f77bcf86cd799439011",
  tags: ["testing"],
  imageUrl: "",
  imageAlt: "",
  imageCredit: "",
  status: "draft",
  publishAt: "2026-10-29T12:00:00.000Z",
  isBreaking: false,
  isFeatured: false,
  isTrending: false,
  isSponsored: false
};

test("accepts a valid article and converts publication time to Date", () => {
  const parsed = parseArticle(validArticle);
  assert.equal(parsed.slug, validArticle.slug);
  assert.ok(parsed.publishAt instanceof Date);
});

test("rejects malformed slugs and insecure image URLs", () => {
  assert.throws(() => parseArticle({ ...validArticle, slug: "../not-a-slug" }), /slug/);
  assert.throws(() => parseArticle({ ...validArticle, imageUrl: "http://images.example.com/story.jpg" }), /imageUrl/);
});

test("escapes all regular-expression metacharacters in a search string", () => {
  assert.equal(escapeRegex("india.+(trade)?"), "india\\.\\+\\(trade\\)\\?");
});
