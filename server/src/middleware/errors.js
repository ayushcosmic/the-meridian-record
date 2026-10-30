export function notFound(req, res) {
  res.status(404).json({ error: "API endpoint not found." });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ error: "Validation failed.", details: Object.values(error.errors).map((item) => item.message) });
  }
  if (error.code === 11000) return res.status(409).json({ error: "That value is already in use." });
  if (error.name === "CastError") return res.status(400).json({ error: "Invalid identifier." });
  if (error.name === "MulterError") return res.status(400).json({ error: error.message });
  console.error(error);
  res.status(error.status || 500).json({ error: error.status ? error.message : "An unexpected server error occurred." });
}
