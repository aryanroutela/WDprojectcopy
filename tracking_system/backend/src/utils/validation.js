/**
 * Input validation utilities
 */

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password) {
  // Minimum 6 characters
  return password && password.length >= 6;
}

export function isValidRole(role) {
  return ['passenger', 'driver'].includes(role);
}

export function isValidSeatStatus(status) {
  return ['empty', 'standing', 'full'].includes(status);
}

export function isValidCoordinate(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function isValidSpeed(speed) {
  return typeof speed === 'number' && speed >= 0;
}

export function isValidUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validateLocationUpdate(data) {
  const errors = [];

  if (!data.lat || !data.lng || !data.speed) {
    errors.push('Missing required fields: lat, lng, speed');
  } else if (!isValidCoordinate(data.lat, data.lng)) {
    errors.push('Invalid coordinates');
  } else if (!isValidSpeed(data.speed)) {
    errors.push('Invalid speed value');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateSeatReport(data) {
  const errors = [];

  if (!data.busId || !data.status) {
    errors.push('Missing required fields: busId, status');
  } else if (!isValidUUID(data.busId)) {
    errors.push('Invalid bus ID');
  } else if (!isValidSeatStatus(data.status)) {
    errors.push('Invalid seat status');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateRegistration(data) {
  const errors = [];

  if (!data.name || !data.email || !data.password || !data.role) {
    errors.push('Missing required fields: name, email, password, role');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  } else if (!isValidPassword(data.password)) {
    errors.push('Password must be at least 6 characters');
  } else if (!isValidRole(data.role)) {
    errors.push('Invalid role');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLogin(data) {
  const errors = [];

  if (!data.email || !data.password) {
    errors.push('Missing required fields: email, password');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
