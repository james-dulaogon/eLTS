import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_local_only_jwt_secret_key_string';
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes session activity lock

// Extend express Request interface locally to bundle verified payload parameters
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: 'Admin' | 'Document_Clerk' | 'Official' | 'Private_Citizen';
    };
}

/**
 * Main JWT Verification and Idle Inactivity Activity Validation Middleware
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expects format: "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: { message: 'Access Denied: Missing Authentication Token.' } });
    }

    try {
        // 1. Verify standard JWT integrity
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };

        // 2. Validate Idle Inactivity Window
        // The client must pass its tracking header timestamp on active navigation events
        const clientLastActivity = req.headers['x-last-activity'];

        if (clientLastActivity) {
            const lastActivityTime = parseInt(clientLastActivity as string, 10);
            const currentTime = Date.now();

            if (currentTime - lastActivityTime > IDLE_TIMEOUT_MS) {
                return res.status(403).json({
                    error: {
                        message: 'Session Expired: System logged out due to 10 minutes of inactivity.',
                        code: 'SESSION_IDLE_TIMEOUT'
                    }
                });
            }
        }

        next();
    } catch (error) {
        return res.status(403).json({ error: { message: 'Access Denied: Invalid or expired token profile.' } });
    }
};

/**
 * High-Security Role Authorization Guard
 * Rejects operations if the user's role metadata does not intersect permitted parameters
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: { message: 'Unauthorized Operation: Access restricted for this user account role tier.' }
            });
        }
        next();
    };
};
