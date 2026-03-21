import QRCode from 'qrcode';
import store from '../utils/inMemoryStore.js';
import { v4 as uuidv4 } from 'uuid';

class PairingController {
  async generatePairingCode(req, res) {
    try {
      const deviceId = uuidv4();
      const pairingCode = store.createPendingPair(deviceId);

      // FIX 1: key must be "pairingCode" — the mobile app reads parsed.pairingCode
      // FIX 2: include deviceId so the mobile can register before pairing
      // FIX 3: server URL from env so mobile connects to the right server
      const qrData = JSON.stringify({
        pairingCode,                                              // was "code" — broke mobile parsing
        deviceId,                                                 // mobile needs this for register-device
        server: process.env.SERVER_URL || 'http://localhost:3000'
      });

      const qrCode = await QRCode.toDataURL(qrData);

      res.json({
        success: true,
        deviceId,
        pairingCode,
        qrCode
      });
    } catch (error) {
      console.error('[PAIR] Failed to generate pairing code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate pairing code'
      });
    }
  }
}

export default new PairingController();