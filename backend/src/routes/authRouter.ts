import express, { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_local_only_jwt_secret_key_string';

// SYSTEM LOGIN ENTRY POINT
router.post('/login', async (req: express.Request, res: Response) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: { message: 'Invalid username or password credentials.' } });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: { message: 'Invalid username or password credentials.' } });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            message: 'Authentication successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role }
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// CLERK PROFILE MODIFICATION LOGIC
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { name, email, username, password } = req.body;
    const userId = req.user?.id;

    try {
        let updateQuery = `UPDATE users SET name = $1, email = $2, username = $3`;
        const queryParams = [name, email, username];

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            queryParams.push(passwordHash);
            updateQuery += `, password_hash = $4 WHERE id = $5 RETURNING id, name, email, username, role`;
            queryParams.push(userId);
        } else {
            updateQuery += ` WHERE id = $4 RETURNING id, name, email, username, role`;
            queryParams.push(userId);
        }

        const result = await pool.query(updateQuery, queryParams);
        return res.status(200).json({ message: 'Profile updated successfully', user: result.rows[0] });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
