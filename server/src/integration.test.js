import test from "node:test";
import assert from "node:assert/strict";

test("admin publishes a story that can be searched and read", { skip: process.env.RUN_DB_INTEGRATION !== "true" }, async () => {
  process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/meridian_record_test";
  process.env.JWT_SECRET ||= "integration-test-secret-not-for-production-123456";
  process.env.CLIENT_URL ||= "http://localhost:5173";
  const { default: app } = await import("./index.js");
  const { connectDatabase } = await import("./config/db.js");
  const Article = (await import("./models/Article.js")).default;
  const Category = (await import("./models/Category.js")).default;
  const User = (await import("./models/User.js")).default;
  const Subscriber = (await import("./models/Subscriber.js")).default;
  const bcrypt = (await import("bcryptjs")).default;
  await connectDatabase();
  const mongoose = await import("mongoose");
  if (!mongoose.default.connection.name.endsWith("_test")) {
    await mongoose.default.disconnect();
    throw new Error("Integration tests are restricted to a MongoDB database whose name ends with _test.");
  }
  const server = app.listen(0);
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}/api`;
  const origin = process.env.CLIENT_URL;
  const email = `editor-${Date.now()}@example.test`;
  const password = "integration-only-password-123";
  const category = await Category.create({ name: "Integration", slug: `integration-${Date.now()}` });
  await User.create({ email, passwordHash: await bcrypt.hash(password, 10), role: "admin" });

  try {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);

    const login = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email, password })
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.getSetCookie()[0].split(";")[0];

    const future = new Date(Date.now() + 60_000).toISOString();
    const story = {
      title: "Integration test: editorial draft story",
      slug: `integration-editorial-${Date.now()}`,
      summary: "A test story summary with sufficient detail to satisfy the newsroom validation requirements.",
      body: "## Test body\n\nA complete test paragraph with enough editorial content to validate the API workflow.",
      author: "Test Editor",
      category: category.id,
      tags: ["integration", "test"],
      imageUrl: "",
      imageAlt: "",
      imageCredit: "",
      status: "draft",
      publishAt: future,
      isBreaking: false,
      isFeatured: true,
      isTrending: false,
      isSponsored: false
    };
    const create = await fetch(`${base}/admin/articles`, {
      method: "POST",
      headers: { "content-type": "application/json", origin, cookie },
      body: JSON.stringify(story)
    });
    assert.equal(create.status, 201);
    const created = (await create.json()).article;

    const unauthorized = await fetch(`${base}/admin/articles`, { headers: { origin } });
    assert.equal(unauthorized.status, 401);
    const categoryConflict = await fetch(`${base}/admin/categories/${category.id}`, { method: "DELETE", headers: { origin, cookie } });
    assert.equal(categoryConflict.status, 409);

    const categoryUpdate = await fetch(`${base}/admin/categories/${category.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", origin, cookie },
      body: JSON.stringify({ name: "Integration Updated", slug: category.slug, description: "Updated by integration test." })
    });
    assert.equal(categoryUpdate.status, 200);

    let publicStory = await fetch(`${base}/articles/${story.slug}`);
    assert.equal(publicStory.status, 404, "drafts must not be public");

    story.status = "scheduled";
    story.publishAt = future;
    const schedule = await fetch(`${base}/admin/articles/${created._id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", origin, cookie },
      body: JSON.stringify(story)
    });
    assert.equal(schedule.status, 200);
    publicStory = await fetch(`${base}/articles/${story.slug}`);
    assert.equal(publicStory.status, 404, "future scheduled stories must not be public early");

    story.status = "published";
    story.publishAt = new Date(Date.now() - 1000).toISOString();
    const publish = await fetch(`${base}/admin/articles/${created._id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", origin, cookie },
      body: JSON.stringify(story)
    });
    assert.equal(publish.status, 200);

    const search = await fetch(`${base}/articles?q=editorial%20draft`);
    assert.equal(search.status, 200);
    assert.equal((await search.json()).articles.length, 1);
    publicStory = await fetch(`${base}/articles/${story.slug}`);
    assert.equal(publicStory.status, 200);
    assert.equal((await publicStory.json()).article.title, story.title);

    const subscriberEmail = `reader-${Date.now()}@example.test`;
    const subscribed = await fetch(`${base}/newsletter`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: subscriberEmail, consent: true })
    });
    assert.equal(subscribed.status, 201);
    const subscriber = await Subscriber.findOne({ email: subscriberEmail });
    const removeSubscriber = await fetch(`${base}/admin/subscribers/${subscriber.id}`, { method: "DELETE", headers: { origin, cookie } });
    assert.equal(removeSubscriber.status, 200);

    const wrongOrigin = await fetch(`${base}/admin/articles`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://not-allowed.example", cookie },
      body: JSON.stringify(story)
    });
    assert.equal(wrongOrigin.status, 403);

    const removed = await fetch(`${base}/admin/articles/${created._id}`, { method: "DELETE", headers: { origin, cookie } });
    assert.equal(removed.status, 200);
    const removeCategory = await fetch(`${base}/admin/categories/${category.id}`, { method: "DELETE", headers: { origin, cookie } });
    assert.equal(removeCategory.status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await Promise.all([Article.deleteMany({ slug: new RegExp("^integration-editorial-") }), Category.deleteOne({ _id: category._id }), User.deleteOne({ email }), Subscriber.deleteMany({ email: /@example\.test$/ })]);
    await mongoose.default.connection.dropDatabase();
    await mongoose.default.disconnect();
  }
});
