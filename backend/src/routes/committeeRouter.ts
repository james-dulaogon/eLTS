import express, { Response } from "express";
import pool from "../config/db";
import {
  authenticateToken,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = express.Router();

// FETCH REGISTRY (Accessible to Admin, Clerks, and Officials)
router.get(
  "/",
  authenticateToken,
  authorizeRoles("Admin", "Document_Clerk", "Official"),
  async (req: express.Request, res: Response) => {
    try {
      const result = await pool.query(
        "SELECT id, name FROM committees ORDER BY name DESC",
      );
      return res.status(200).json(result.rows);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
);

// ADD NEW COMMITTEE (Exclusive to Admin)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin"),
  async (req: express.Request, res: Response) => {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Committee name cannot be blank." });
    }
    try {
      const result = await pool.query(
        "INSERT INTO committees (name) VALUES ($1) RETURNING id, name",
        [name.trim()],
      );
      return res
        .status(201)
        .json({
          message: "Committee registered successfully.",
          data: result.rows[0],
        });
    } catch (error: any) {
      if (error.code === "23505") {
        return res
          .status(400)
          .json({
            error: "System Error: This committee name is already registered.",
          });
      }
      return res.status(500).json({ error: error.message });
    }
  },
);

// UPDATE COMMITTEE NAME (Exclusive to Admin)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('Admin'),
  async (req: express.Request, res: express.Response) => {
    const id = req.params.id as string;
    const { name } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Validation Error: Invalid committee ID parameter.' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Validation Error: Committee name cannot be blank.' });
    }

    try {
      const updateQuery = `
        UPDATE committees
        SET name = $1
        WHERE id = $2
        RETURNING id, name;
      `;

      const result = await pool.query(updateQuery, [name.trim(), parseInt(id, 10)]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Committee record not found.' });
      }

      return res.status(200).json({
        message: 'Committee updated successfully.',
        data: result.rows[0]
      });
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'System Error: This committee name already exists.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }
);


export default router;
