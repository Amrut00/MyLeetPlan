import jwt from 'jsonwebtoken';

/**
 * Authentication middleware.
 * Reads a Bearer token from the Authorization header, verifies it,
 * and attaches the authenticated user's id to req.userId.
 * Responds with 401 if the token is missing or invalid.
 */
export default function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Sign a JWT for a given user id.
 */
export function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}
