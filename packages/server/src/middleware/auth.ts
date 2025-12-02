/**
 * Lens Service v3 - Authentication Middleware
 *
 * JWT-based authentication for API routes.
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
}

export interface JwtPayload {
  sub: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Authentication Middleware
 */
export function authMiddleware(secret: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;

      req.userId = decoded.sub;
      req.sessionId = decoded.sessionId;

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
  };
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export function optionalAuthMiddleware(secret: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue without user context
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      req.userId = decoded.sub;
      req.sessionId = decoded.sessionId;
    } catch {
      // Invalid token, but continue anyway
    }

    next();
  };
}

/**
 * Generate JWT token
 */
export function generateToken(
  userId: string,
  secret: string,
  options: {
    sessionId?: string;
    expiresIn?: string | number;
  } = {}
): string {
  const payload: JwtPayload = {
    sub: userId,
    sessionId: options.sessionId,
  };

  return jwt.sign(payload, secret, {
    expiresIn: options.expiresIn ?? '24h',
  });
}
