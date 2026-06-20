import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import patientsRouter from './routes/patients';
import physiciansRouter from './routes/physicians';
import timelineRouter from './routes/timeline';
import accessRouter from './routes/access';
import referralsRouter from './routes/referrals';
import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/physicians', physiciansRouter);
app.use('/api/timeline', timelineRouter);
app.use('/api/access-requests', accessRouter);
app.use('/api/referrals', referralsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
