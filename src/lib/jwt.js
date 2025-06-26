// src/lib/jwt.js
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const EXPIRY = "30d"; // you can tweak this in one place

/**
 * Sign a payload (e.g. { sub: userId }) into a JWT.
 * @param {object} payload
 * @returns {string} JWT
 */
export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

/**
 * Verify a JWT and return its decoded payload.
 * Throws if invalid/expired.
 * @param {string} token
 * @returns {object} Decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
