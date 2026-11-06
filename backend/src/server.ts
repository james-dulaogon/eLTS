import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import pool from './config/db';
import userRouter from './routes/userRouter';


const app = express();
const PORT = process.env.PORT || 5001;

// ==========================================
// 1. ROBUST CORS & PREFLIGHT CONFIGURATION
// ==========================================
// This configuration explicitly allows your Vite frontend origin and handles OPTIONS handshakes
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-last-activity'],
    credentials: true
}));

// Intercept preflight OPTIONS calls immediately before any route handling logic
app.options('*', cors());

// ==========================================
// 2. PARSING MIDDLEWARES
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded PDF files securely
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// ==========================================
// 3. MOUNT CORE SYSTEM API ROUTERS
// ==========================================
import authRouter from './routes/authRouter';
import committeeRouter from './routes/committeeRouter';
import measureRouter from './routes/measureRouter';
import sessionRouter from './routes/sessionRouter';

app.use('/api/auth', authRouter);
app.use('/api/committees', committeeRouter);
app.use('/api/measures', measureRouter);
app.use('/api/legislatures', sessionRouter);
app.use('/api/users', userRouter);


app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// ==========================================
// 4. GLOBAL ERROR HANDLER
// ==========================================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('💥 Unhandled Exception Encountered:', err.stack || err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error encountered in eLTS engine.',
            code: err.code || 'UNKNOWN_ERROR'
        }
    });
});

// ==========================================
// 5. SERVER RUNTIME LAUNCHPAD
// ==========================================
const initializeDatabase = async () => {
    try {
        const schemaPath = path.join(__dirname, './config/init_schema.sql');
        const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(sqlSchema);
        console.log('✅ Local database initialization check complete.');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
};

app.listen(PORT, async () => {
    console.log(`🚀 eLTS Backend running locally at http://localhost:${PORT}`);
    await initializeDatabase();
});
