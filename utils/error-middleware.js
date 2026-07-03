export function notFoundHandler(req, res) {
  return res.status(404).json({
    ok: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (res.headersSent) {
    return;
  }

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    ok: false,
    message: err.message || "Internal server error",
  });
}
