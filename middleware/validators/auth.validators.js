// Lightweight email format guard for API input validation.
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRegisterBody(body = {}) {
  // Normalize incoming auth fields so downstream logic uses one shape.
  const email = body?.email?.trim()?.toLowerCase();
  const password = body?.password;
  const username = body?.username?.trim();
  const errors = [];

  if (!email || !password || !username) {
    errors.push('email, username, and password are required.');
  }

  if (email && !isValidEmail(email)) {
    errors.push('Please provide a valid email address.');
  }

  if (password && password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  return {
    errors,
    value: {
      email,
      password,
      username,
    },
  };
}

export function validateLoginBody(body = {}) {
  // Login only needs credentials; normalization keeps strategy lookups consistent.
  const email = body?.email?.trim()?.toLowerCase();
  const password = body?.password;
  const errors = [];

  if (!email || !password) {
    errors.push('email and password are required.');
  }

  return {
    errors,
    value: {
      email,
      password,
    },
  };
}

export function validateForgotPasswordIdentityBody(body = {}) {
  const email = body?.email?.trim()?.toLowerCase();
  const username = body?.username?.trim();
  const errors = [];

  if (!email || !username) {
    errors.push('email and username are required.');
  }

  if (email && !isValidEmail(email)) {
    errors.push('Please provide a valid email address.');
  }

  return {
    errors,
    value: {
      email,
      username,
    },
  };
}

export function validateForgotPasswordResetBody(body = {}) {
  const email = body?.email?.trim()?.toLowerCase();
  const username = body?.username?.trim();
  const newPassword = body?.newPassword;
  const errors = [];

  if (!email || !username || !newPassword) {
    errors.push('email, username, and newPassword are required.');
  }

  if (email && !isValidEmail(email)) {
    errors.push('Please provide a valid email address.');
  }

  if (newPassword && newPassword.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  return {
    errors,
    value: {
      email,
      username,
      newPassword,
    },
  };
}
