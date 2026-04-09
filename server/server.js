import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './src/sockets/index.js';
import pairingController from './src/controllers/pairingController.js';

dotenv.config();

console.log('SERVER_URL:', process.env.SERVER_URL);
console.log('CLIENT_URL:', process.env.CLIENT_URL);

const app = express();
const httpServer = createServer(app);

// Build allowed origins list — always include both localhost and LAN IP
// so the webapp works whether opened via localhost or the IP address
const allowedOrigins = [
  'http://localhost:5173',                              // always allowed (local dev)
  'http://127.0.0.1:5173',                             // alternate localhost
  process.env.CLIENT_URL,                              // e.g. http://192.168.1.5:5173
].filter(Boolean) // remove undefined if CLIENT_URL not set

console.log('Allowed origins:', allowedOrigins);

function isOriginAllowed(origin) {
  // React Native has no origin — always allow
  if (!origin) return true
  return allowedOrigins.includes(origin)
}

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) callback(null, true)
    else callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SYNCLYNK server is running',
    allowedOrigins,  // helpful for debugging
  });
});

// Pairing endpoint
app.post('/api/pair', pairingController.generatePairingCode);

// Socket.IO setup
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`SYNCLYNK server running on port ${PORT}`);
});