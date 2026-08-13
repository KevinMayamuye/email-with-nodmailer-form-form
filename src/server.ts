import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initMailer, sendFormNotification } from './email.js';

function agentLog(payload: Record<string, unknown>): void {
  try {
    fs.appendFileSync(path.join(process.cwd(), 'debug-5cda17.log'), JSON.stringify({ sessionId: '5cda17', timestamp: Date.now(), ...payload }) + '\n');
  } catch {
    /* ignore */
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/contact', async (req, res) => {
  const name = String(req.body.name ?? '').trim();
  const email = String(req.body.email ?? '').trim();
  const message = String(req.body.message ?? '').trim();

  // #region agent log
  agentLog({runId:'pre-fix',hypothesisId:'D',location:'src/server.ts:POST /api/contact',message:'Contact request received',data:{hasName:Boolean(name),hasEmail:Boolean(email),hasMessage:Boolean(message),messageLen:message.length}});
  fetch('http://127.0.0.1:7926/ingest/3462e6a1-5f38-4ec0-aba6-357cd6233682',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5cda17'},body:JSON.stringify({sessionId:'5cda17',runId:'pre-fix',hypothesisId:'D',location:'src/server.ts:POST /api/contact',message:'Contact request received',data:{hasName:Boolean(name),hasEmail:Boolean(email),hasMessage:Boolean(message),messageLen:message.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (!name || !email || !message) {
    res.status(400).json({ ok: false, error: 'All fields are required.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: 'Invalid email address.' });
    return;
  }
  if (message.length > 4000) {
    res.status(400).json({ ok: false, error: 'Message is too long.' });
    return;
  }

  const result = await sendFormNotification({ name, email, message });
  // #region agent log
  agentLog({runId:'pre-fix',hypothesisId:'D',location:'src/server.ts:POST /api/contact:result',message:'Contact handler result',data:{ok:result.ok,error:result.error,hasPreviewUrl:Boolean(result.previewUrl)}});
  fetch('http://127.0.0.1:7926/ingest/3462e6a1-5f38-4ec0-aba6-357cd6233682',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5cda17'},body:JSON.stringify({sessionId:'5cda17',runId:'pre-fix',hypothesisId:'D',location:'src/server.ts:POST /api/contact:result',message:'Contact handler result',data:{ok:result.ok,error:result.error,hasPreviewUrl:Boolean(result.previewUrl)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  res.status(result.ok ? 200 : 500).json(result);
});

const port = parseInt(process.env.PORT || '3000', 10);

try {
  await initMailer();
  app.listen(port, () => {
    console.log(`Test form: http://localhost:${port}`);
  });
} catch (err) {
  console.error('[smtp] Startup failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
