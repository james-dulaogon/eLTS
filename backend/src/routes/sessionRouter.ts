import express from 'express';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import pool from '../config/db';

const router = express.Router();

// Get active legislature data - Available to all logged-in accounts
router.get('/current', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
    try {
        const result = await pool.query('SELECT * FROM legislatures WHERE is_active = TRUE LIMIT 1');
        return res.status(200).json(result.rows[0]);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// Switch active legislature - Exclusive high-security administrative override capability
router.put('/switch', authenticateToken, authorizeRoles('Admin'), async (req: AuthenticatedRequest, res: express.Response) => {
    const { targetLegislatureId } = req.body;

    try {
        await pool.query('BEGIN'); // Initialize transactional processing barrier

        // Disable old configurations
        await pool.query('UPDATE legislatures SET is_active = FALSE');

        // Elevate targeted designation configuration parameters
        const updateResult = await pool.query(
            `UPDATE legislatures
             SET is_active = TRUE, updated_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 RETURNING *`,
            [req.user?.id, targetLegislatureId]
        );

        await pool.query('COMMIT');
        return res.status(200).json({ message: 'Legislative focus updated successfully', data: updateResult.rows[0] });
    } catch (error: any) {
        await pool.query('ROLLBACK');
        return res.status(500).json({ error: error.message });
    }
});

export default router;
