export function validateCharacterQuery(query = {}) {
  // Parse list parameters early so services can assume numeric pagination inputs.
  const errors = [];
  const page = query.page ? Number.parseInt(query.page, 10) : 1;
  const limit = query.limit ? Number.parseInt(query.limit, 10) : 20;

  if (!Number.isFinite(page) || page <= 0) {
    errors.push('page must be a positive integer.');
  }

  if (!Number.isFinite(limit) || limit <= 0) {
    errors.push('limit must be a positive integer.');
  }

  return {
    errors,
    value: {
      page,
      limit,
      includeMeta: query.includeMeta === 'true',
    },
  };
}

export function validateCreateCharacterBody(body = {}) {
  // Trim user-entered text fields to avoid storing accidental whitespace.
  const normalizedBody = {
    ...body,
    name: body?.name?.trim(),
    race: body?.race?.trim(),
    background: body?.background?.trim(),
    alignment: body?.alignment?.trim(),
    notes: body?.notes?.trim(),
    feats: body?.feats?.map((feat) => feat.trim()) || [], // Allow feats
  };

  const errors = [];

  if (!normalizedBody.name) {
    errors.push('Character name is required.');
  }

  if (!normalizedBody.race) {
    errors.push('Character race is required.');
  }

  if (!Array.isArray(normalizedBody.classes) || normalizedBody.classes.length === 0) {
    errors.push('At least one class is required.');
  }

  return {
    errors,
    value: normalizedBody,
  };
}
