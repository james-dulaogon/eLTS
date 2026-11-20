import express, { Response } from "express";
import pool from "../config/db";
import { uploadEngine } from "../config/multerConfig";
import {
  authenticateToken,
  authorizeRoles,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";

const router = express.Router();

// 1. HIGH-SPEED INTERNAL QUERY DASHBOARD (Admin, Clerks, Officials)
router.get(
  "/matrix",
  authenticateToken,
  authorizeRoles("Admin", "Document_Clerk", "Official"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const queryText = `
        SELECT 
          lm.id,
          lm.legislature_id,
          lm.tracking_number AS "Tracking No.",
          lm.subject_text AS "Subject",
          CONCAT(lm.cr_number, ' - ', c.name) AS "CR NO.",
          lm.committee_hearing_date AS "Committee Hearing Date",
          lm.measure_type AS "Measure Type",
          lm.ordinance_resolution_number AS "Ordinance/Resolution No.",
          lm.remarks AS "Remarks",
          lm.doc_received_url,
          lm.committee_report_url,
          lm.scanned_measure_url
      FROM legislative_measures lm
      INNER JOIN committees c ON lm.committee_id = c.id
      ORDER BY lm.id ASC;
    `;
      const result = await pool.query(queryText);
      return res.status(200).json(result.rows);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
);

// 2. ADDING MEASURE API (Admin, Document Clerks)
router.post(
  "/upload-measure",
  authenticateToken,
  authorizeRoles("Admin", "Document_Clerk"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        tracking_number,
        subject_text,
        cr_number,
        committee_id,
        committee_hearing_date,
        measure_type,
        ordinance_resolution_number,
        legislature_id,
        remarks,
      } = req.body;

      const insertQuery = `
            INSERT INTO legislative_measures (
                tracking_number, subject_text, cr_number, committee_id,
                committee_hearing_date,  measure_type, ordinance_resolution_number, legislature_id, remarks, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;
        `;

      const result = await pool.query(insertQuery, [
        tracking_number,
        subject_text,
        cr_number,
        committee_id,
        committee_hearing_date,
        measure_type,
        ordinance_resolution_number,
        legislature_id,
        remarks,
        req.user?.id,
      ]);

      return res.status(201).json({
        message: "Legislative measure saved successfully.",
        id: result.rows[0].id,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
);

// 3. PRIVATE CITIZEN PUBLIC TRACKING SEARCH (No auth token required, zero file paths leaked)
router.get("/public-track", async (req: express.Request, res: Response) => {
  const { tn } = req.query;
  if (!tn) {
    return res.status(400).json({
      error: "Please provide a valid reference Tracking Number (TN NO.).",
    });
  }

  try {
    const publicQuery = `
          SELECT
            lm.tracking_number AS "Tracking No.",
            lm.subject_text AS "Subject",
            lm.committee_hearing_date AS "Last Action Date",
            CASE
            WHEN lm.scanned_measure_url IS NOT NULL THEN 'Enacted / Passed'
            ELSE 'In Committee Review'
            END AS "Current Status",
            lm.remarks AS "Progress Timeline / Remarks"
            FROM legislative_measures lm
          WHERE lm.tracking_number LIKE '%' || $1 || '%';
        `;
    const result = await pool.query(publicQuery, [tn.toString()]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "No active legislative documents match that tracking number.",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get(
  "/metrics",
  authenticateToken,
  authorizeRoles("Admin", "Document_Clerk", "Official"),
  async (req: express.Request, res: Response) => {
    try {
      const statsQuery = `
        SELECT 
            COUNT(*)::int AS total_received,
            COUNT(CASE WHEN measure_type = 'ordinance' THEN 1 END)::int AS total_ordinances,
            COUNT(CASE WHEN measure_type = 'resolution' THEN 1 END)::int AS total_resolutions,
            COUNT(CASE WHEN scanned_measure_url IS NOT NULL THEN 1 END)::int AS total_enacted,
            COUNT(CASE WHEN remarks ILIKE '%return%' THEN 1 END)::int AS total_returned,
            COUNT(CASE WHEN committee_hearing_date IS NOT NULL THEN 1 END)::int AS total_committee_hearings
        FROM legislative_measures;
    `;
      const result = await pool.query(statsQuery);
      return res.status(200).json(result.rows[0]);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
);

router.put(
  "/upload-single-attachment",
  authenticateToken,
  authorizeRoles("Admin", "Document_Clerk"),
  uploadEngine.any(), // Flexibly catches whatever file input trigger keys are sent
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!id || !files || files.length === 0) {
      return res
        .status(400)
        .json({ error: "Missing target validation criteria items." });
    }

    const uploadedFile = files[0];
    const fileUrlPath = `/uploads/${uploadedFile.filename}`;

    // Map the incoming file identifier field to its database column counterpart
    let targetColumn = "";
    if (uploadedFile.fieldname === "doc_received")
      targetColumn = "doc_received_url";
    else if (uploadedFile.fieldname === "committee_report")
      targetColumn = "committee_report_url";
    else if (uploadedFile.fieldname === "scanned_measure")
      targetColumn = "scanned_measure_url";

    if (!targetColumn) {
      return res
        .status(400)
        .json({ error: "Invalid assignment parameter target context key." });
    }

    try {
      const updateRawQuery = `
        UPDATE legislative_measures 
        SET ${targetColumn} = $1 
        WHERE id = $2;
      `;
      await pool.query(updateRawQuery, [fileUrlPath, id]);
      return res
        .status(200)
        .json({ message: "Attachment successfully uploaded." });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
);

router.get(
  "/detail/:id",
  authenticateToken,
  authorizeRoles("Admin", "Document_Clerk", "Official"),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Reject non-numeric route parameters to block SQL query vulnerabilities
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error:
          "Validation Error: Invalid database record primary identifier parameter.",
      });
    }

    try {
      const metadataQuery = `
        SELECT 
            lm.id,
            lm.tracking_number,
            lm.subject_text,
            lm.cr_number,
            c.name AS committee_name,
            lm.committee_id,
            lm.committee_hearing_date,
            lm.measure_type,
            lm.ordinance_resolution_number,
            lm.remarks,
            l.term_label AS legislature_term,
            l.term_label,
            u.name AS encoded_by,
            lm.created_at,
            lm.doc_received_url,
            lm.committee_report_url,
            lm.scanned_measure_url
        FROM legislative_measures as lm
        INNER JOIN committees c ON lm.committee_id = c.id
        INNER JOIN legislatures l ON lm.legislature_id = l.id
        LEFT JOIN users u ON lm.created_by = u.id
        WHERE lm.id = $1
        LIMIT 1;
      `;

      const result = await pool.query(metadataQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error:
            "Legislative measure record not found.",
        });
      }
      return res.status(200).json(result.rows[0]);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
);

// UPDATE ENDPOINT: SAVE MODIFIED ROW METADATA ONLY
router.put(
  "/update/:id",
  authenticateToken,
  authorizeRoles("Admin", "Document_Clerk"),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Verify record identifier parameters
    if (!id || Array.isArray(id) || isNaN(Number(id))) {
      return res.status(400).json({
        error:
          "Validation Error: Invalid database record primary identifier parameter.",
      });
    }

    const {
      tracking_number,
      subject_text,
      cr_number,
      committee_id,
      committee_hearing_date,
      legislature_id,
      measure_type,
      remarks,
      ordinance_resolution_number,
    } = req.body;

    // Direct structural validation checks for required non-nullable fields
    if (
      !tracking_number ||
      !subject_text ||
      !cr_number ||
      !committee_id ||
      !committee_hearing_date ||
      !measure_type ||
      !legislature_id
    ) {
      return res.status(400).json({
        error:
          "Validation Error: Missing mandatory legislative document metadata fields.",
      });
    }

    try {
      const updateQuery = `
        UPDATE legislative_measures
        SET 
          tracking_number = $1,
          subject_text = $2,
          cr_number = $3,
          committee_id = $4,
          committee_hearing_date = $5,
          measure_type = $6,
          legislature_id = $7,
          remarks = $8,
          ordinance_resolution_number = $9,
          updated_by = $10,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING id;
      `;
      const queryParams = [
        tracking_number.trim(),
        subject_text.trim(),
        cr_number.trim(),
        parseInt(committee_id, 10),
        committee_hearing_date,
        measure_type,
        parseInt(legislature_id, 10),
        remarks ? remarks.trim() : null,
        ordinance_resolution_number ? ordinance_resolution_number.trim() : null,
        req.user?.id,
        parseInt(id, 10),
      ];

      const result = await pool.query(updateQuery, queryParams);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error:
            "Data Persist Fault: Target legislative document row could not be located.",
        });
      }

      return res.status(200).json({
        message: "Legislative measure tracking node successfully updated.",
        id: result.rows[0].id,
      });
    } catch (error: any) {
      // Check for structural database constraints (e.g. unique tracking number clashes)
      if (error.code === "23505") {
        return res.status(400).json({
          error:
            "System Constraint Failure: This tracking number configuration is already assigned.",
        });
      }
      return res.status(500).json({ error: error.message });
    }
  },
);

export default router;
