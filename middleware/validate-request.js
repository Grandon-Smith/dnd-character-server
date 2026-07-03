import { AppError } from '../utils/app-error.js';

// Maps validator targets to their corresponding request source.
function pickSource(req, source) {
  if (source === 'body') return req.body;
  if (source === 'query') return req.query;
  if (source === 'params') return req.params;
  return undefined;
}

export function validateRequest(validators) {
  return (req, _res, next) => {
    // Stores normalized, trusted values for downstream controller/service code.
    req.validated = req.validated || {};

    for (const [source, validate] of Object.entries(validators)) {
      if (typeof validate !== 'function') {
        continue;
      }

      const data = pickSource(req, source);
      const result = validate(data);

      // Enforce a consistent validator contract: { errors: [], value: ... }.
      if (!result || !Array.isArray(result.errors)) {
        throw new AppError(`Invalid validator response for ${source}`, 500);
      }

      if (result.errors.length > 0) {
        return next(new AppError(result.errors[0], 400));
      }

      req.validated[source] = result.value;
    }

    return next();
  };
}
