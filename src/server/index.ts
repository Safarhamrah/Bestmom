import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { registerAgentRoute } from './api/agent';
import { registerAuthRoutes } from './api/auth';
import { registerHealthRoute } from './api/health';

const app = express();
const router = express.Router();
const port = Number(process.env.PORT || 8787);

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

console.log('Registering Baby Planner API routes...');
registerHealthRoute(router);
registerAuthRoutes(router);
registerAgentRoute(router);
console.log('Baby Planner API routes registered.');

app.use('/api', router);

app.listen(port, '127.0.0.1', () => {
  console.log(`Baby Planner API listening on http://127.0.0.1:${port}`);
});
