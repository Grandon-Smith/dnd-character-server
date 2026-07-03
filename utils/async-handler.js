// Wrap async controllers so thrown/rejected errors flow to Express error middleware.
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
