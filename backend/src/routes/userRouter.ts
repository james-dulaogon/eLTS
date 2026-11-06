import express, { Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

// 1. FETCH ALL USER ACCOUNTS (Exclusive to Admin)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('Admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userListQuery = `
        SELECT 
          id, 
          name, 
          email, 
          username, 
          role, 
          created_at 
        FROM users 
        ORDER BY role ASC, name ASC;
      `;
      const result = await pool.query(userListQuery);
      return res.status(200).json(result.rows);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// 2. CREATE A NEW USER ACCOUNT (Exclusive to Admin)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('Admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { name, email, username, password, role } = req.body;

    // Validate structural requirements
    if (!name || !email || !username || !password || !role) {
      return res.status(400).json({ error: 'Validation Error: All user configuration fields are mandatory.' });
    }

    // Validate role constraint choices against enum types
    const validRoles = ['Admin', 'Document_Clerk', 'Official', 'Private_Citizen'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Validation Error: Invalid role category specified.' });
    }

    try {
      // Hash the password securely via bcrypt before saving to PostgreSQL
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const insertUserQuery = `
        INSERT INTO users (name, email, username, password_hash, role)
        VALUES ($1, $2, $3, $4, $5::user_role)
        RETURNING id, name, email, username, role, created_at;
      `;

      const result = await pool.query(insertUserQuery, [
        name.trim(),
        email.trim().toLowerCase(),
        username.trim().toLowerCase(),
        passwordHash,
        role
      ]);

      return res.status(201).json({
        message: 'User account created successfully inside repository registries.',
        user: result.rows[0]
      });
    } catch (error: any) {
      // Catch unique violation error code (e.g. duplicate username or email)
      if (error.code === '23505') {
        return res.status(400).json({ error: 'System Constraint Conflict: This username or email address is already registered.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }
);

export default router;
