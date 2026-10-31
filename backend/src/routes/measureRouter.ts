import express, { Response } from 'express';
import pool from '../config/db';
import { uploadEngine } from '../config/multerConfig';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

const eltsUploadFields = uploadEngine.fields([
    { name: 'doc_received', maxCount: 1 },
    { name: 'committee_report', maxCount: 1 },
    { name: 'scanned_measure', maxCount: 1 }
]);

// 1. HIGH-SPEED INTERNAL QUERY DASHBOARD (Admin, Clerks, Officials)
router.get('/matrix', authenticateToken, authorizeRoles('Admin', 'Document_Clerk', 'Official'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const queryText = `
            SELECT
                lm.id,
                lm.tracking_number AS "Tracking No.",
                lm.subject_text AS "Subject",
                CONCAT(lm.cr_number, ' - ', c.name) AS "CR NO.",
                lm.committee_hearing_date AS "Committee Hearing Date",
                lm.ordinance_resolution_number AS "Ordinance/Resolution No.",
                lm.remarks AS "Remarks",
                lm.doc_received_url,
                lm.committee_report_url,
                lm.scanned_measure_url
            FROM legislative_measures lm
            INNER JOIN committees c ON lm.committee_id = c.id
            INNER JOIN legislatures l ON lm.legislature_id = l.id
            WHERE l.is_active = TRUE
            ORDER BY lm.id ASC;
        `;
        const result = await pool.query(queryText);
        return res.status(200).json(result.rows);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// 2. INGESTION ENGINE TRACKING ENDPOINT (Admin, Document Clerks)
router.post('/upload-measure', authenticateToken, authorizeRoles('Admin', 'Document_Clerk'), eltsUploadFields, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const docReceivedUrl = files['doc_received'] ? `/uploads/${files['doc_received'][0].filename}` : null;
        const committeeReportUrl = files['committee_report'] ? `/uploads/${files['committee_report'][0].filename}` : null;
        const scannedMeasureUrl = files['scanned_measure'] ? `/uploads/${files['scanned_measure'][0].filename}` : null;

        if (!docReceivedUrl || !committeeReportUrl) {
            return res.status(400).json({ error: 'Validation Error: Documents received and committee reports are mandatory uploads.' });
        }

        const { tracking_number, subject_text, cr_number, committee_id, committee_hearing_date, legislature_id, remarks } = req.body;

        const insertQuery = `
            INSERT INTO legislative_measures (
                tracking_number, subject_text, cr_number, committee_id,
                committee_hearing_date, legislature_id, remarks,
                doc_received_url, committee_report_url, scanned_measure_url, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id;
        `;

        const result = await pool.query(insertQuery, [
            tracking_number, subject_text, cr_number, committee_id,
            committee_hearing_date, legislature_id, remarks,
            docReceivedUrl, committeeReportUrl, scannedMeasureUrl, req.user?.id
        ]);

        return res.status(201).json({ message: 'Legislative measure cataloged successfully.', id: result.rows[0].id });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// 3. PRIVATE CITIZEN PUBLIC TRACKING SEARCH (No auth token required, zero file paths leaked)
router.get('/public-track', async (req: express.Request, res: Response) => {
    const { tn } = req.query;
    if (!tn) {
        return res.status(400).json({ error: 'Please provide a valid reference Tracking Number (TN NO.).' });
    }

    try {
        const publicQuery = `
            SELECT
                lm.tracking_number AS "Tracking No.",
                lm.subject_text AS "Subject",
                lm.committee_hearing_date AS "Last Action Date",
                CASE
                    WHEN lm.ordinance_resolution_number IS NOT NULL THEN 'Enacted / Passed'
                    ELSE 'In Committee Review'
                END AS "Current Status",
                lm.remarks AS "Progress Timeline / Remarks"
            FROM legislative_measures lm
            WHERE lm.tracking_number = $1
            LIMIT 1;
        `;
        const result = await pool.query(publicQuery, [tn.toString()]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No active legislative documents match that tracking number.' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
