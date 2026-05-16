import express from 'express';
import cors from 'cors';
import { initializeMidnight, verifyNullifier } from './midnight.js';

const app = express();
app.use(cors());
app.use(express.json());

let ready = false;

app.get('/health', (_req, res) => {
  res.json({ status: ready ? 'ready' : 'initializing' });
});

app.post('/verify', async (req, res) => {
  if (!ready) {
    res.status(503).json({ error: 'SERVICE_NOT_READY', message: 'Bridge is initializing, try again shortly' });
    return;
  }

  const { nullifier, domain } = req.body as { nullifier?: string; domain?: string };

  if (!nullifier || typeof nullifier !== 'string' || !/^[0-9a-f]{64}$/i.test(nullifier)) {
    res.status(400).json({ error: 'INVALID_NULLIFIER', message: 'nullifier must be a 64-char hex string' });
    return;
  }

  try {
    const txHash = await verifyNullifier(nullifier);
    res.status(200).json({ ok: true, txHash });
  } catch (err: any) {
    if (err.message?.includes('Nullifier already used') || err.message?.includes('already used')) {
      res.status(409).json({ error: 'NULLIFIER_ALREADY_USED' });
    } else {
      console.error('Verify error:', err.message);
      res.status(500).json({ error: 'VERIFICATION_FAILED', message: err.message });
    }
  }
});

const PORT = 3000;

app.listen(PORT, async () => {
  console.log(`\nHumanProof Bridge Server`);
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`\nInitializing Midnight connection...`);
  console.log(`(Make sure Docker stack is running: docker compose -f standalone.yml up)\n`);

  try {
    await initializeMidnight();
    ready = true;
    console.log(`\n✓ Ready. Accepting requests on POST http://localhost:${PORT}/verify\n`);
  } catch (err: any) {
    console.error(`\n✗ Midnight initialization failed: ${err.message}`);
    console.error('Check that the Docker stack is running and healthy.');
    process.exit(1);
  }
});
