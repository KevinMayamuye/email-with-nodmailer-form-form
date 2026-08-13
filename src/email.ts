import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

function agentLog(payload: Record<string, unknown>): void {
  try {
    fs.appendFileSync(path.join(process.cwd(), 'debug-5cda17.log'), JSON.stringify({ sessionId: '5cda17', timestamp: Date.now(), ...payload }) + '\n');
  } catch {
    /* ignore */
  }
}

let transporter: Transporter | null = null;

function createTransporter(options: {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
}): Transporter {
  return nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    auth:
      options.user && options.pass
        ? { user: options.user, pass: options.pass }
        : undefined,
  });
}

export async function initMailer(): Promise<void> {
  let host = process.env.SMTP_HOST?.trim();
  let port = parseInt(process.env.SMTP_PORT || '587', 10);
  let secure = process.env.SMTP_SECURE === 'true';
  let user = process.env.SMTP_USER?.trim();
  let pass = process.env.SMTP_PASS?.trim();

  // #region agent log
  agentLog({runId:'pre-fix',hypothesisId:'A',location:'src/email.ts:initMailer',message:'SMTP config at startup',data:{host,port,secure,hasUser:Boolean(user),hasPass:Boolean(pass),isGmail:host==='smtp.gmail.com'}});
  fetch('http://127.0.0.1:7926/ingest/3462e6a1-5f38-4ec0-aba6-357cd6233682',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5cda17'},body:JSON.stringify({sessionId:'5cda17',runId:'pre-fix',hypothesisId:'A',location:'src/email.ts:initMailer',message:'SMTP config at startup',data:{host,port,secure,hasUser:Boolean(user),hasPass:Boolean(pass),isGmail:host==='smtp.gmail.com'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (host === 'smtp.gmail.com' && (!user || !pass)) {
    throw new Error(
      'Gmail SMTP needs SMTP_USER and SMTP_PASS. Use an App Password from https://myaccount.google.com/apppasswords — not your Gmail login password.'
    );
  }

  const useEthereal =
    !host || host === 'smtp.ethereal.email';

  if (useEthereal && (!user || !pass)) {
    const account = await nodemailer.createTestAccount();
    host = account.smtp.host;
    port = account.smtp.port;
    secure = account.smtp.secure;
    user = account.user;
    pass = account.pass;
    console.log('[smtp] Created Ethereal test account (messages are not delivered to a real inbox)');
    console.log('[smtp] Login: https://ethereal.email/login');
    console.log('[smtp] User:', account.user);
    console.log('[smtp] Pass:', account.pass);
    // #region agent log
    agentLog({runId:'pre-fix',hypothesisId:'A',location:'src/email.ts:initMailer:ethereal',message:'Using Ethereal test account instead of Gmail',data:{host,port}});
    fetch('http://127.0.0.1:7926/ingest/3462e6a1-5f38-4ec0-aba6-357cd6233682',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5cda17'},body:JSON.stringify({sessionId:'5cda17',runId:'pre-fix',hypothesisId:'A',location:'src/email.ts:initMailer:ethereal',message:'Using Ethereal test account instead of Gmail',data:{host,port},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  if (!host) {
    throw new Error('SMTP_HOST is required');
  }

  transporter = createTransporter({ host, port, secure, user, pass });
  try {
    await transporter.verify();
    console.log(`[smtp] Connection verified (${host}:${port})`);
    // #region agent log
    agentLog({runId:'pre-fix',hypothesisId:'B',location:'src/email.ts:initMailer:verify',message:'SMTP verify succeeded',data:{host,port,secure}});
    fetch('http://127.0.0.1:7926/ingest/3462e6a1-5f38-4ec0-aba6-357cd6233682',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5cda17'},body:JSON.stringify({sessionId:'5cda17',runId:'pre-fix',hypothesisId:'B',location:'src/email.ts:initMailer:verify',message:'SMTP verify succeeded',data:{host,port,secure},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  } catch (err) {
    // #region agent log
    agentLog({runId:'pre-fix',hypothesisId:'B',location:'src/email.ts:initMailer:verify',message:'SMTP verify failed',data:{host,port,secure,error:err instanceof Error?err.message:String(err)}});
    fetch('http://127.0.0.1:7926/ingest/3462e6a1-5f38-4ec0-aba6-357cd6233682',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5cda17'},body:JSON.stringify({sessionId:'5cda17',runId:'pre-fix',hypothesisId:'B',location:'src/email.ts:initMailer:verify',message:'SMTP verify failed',data:{host,port,secure,error:err instanceof Error?err.message:String(err)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw err;
  }
}

export async function sendFormNotification(payload: {
  name: string;
  email: string;
  message: string;
}): Promise<{ ok: boolean; error?: string; previewUrl?: string }> {
  if (!transporter) {
    return { ok: false, error: 'Mailer is not initialised.' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Form Test'}" <${process.env.EMAIL_FROM || 'noreply@example.com'}>`,
      to: process.env.FORM_TO || 'you@example.com',
      replyTo: payload.email,
      subject: `Website enquiry from ${payload.name}`,
      text: [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        '',
        payload.message,
      ].join('\n'),
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) {
      console.log('[email] Preview:', previewUrl);
    }

    // #region agent log
    agentLog({runId:'pre-fix',hypothesisId:'C',location:'src/email.ts:sendFormNotification',message:'sendMail returned',data:{accepted:info.accepted,rejected:info.rejected,response:info.response,hasPreviewUrl:Boolean(previewUrl),toIsGmail:String(process.env.FORM_TO||'').includes('gmail.com')}});
    fetch('http://127.0.0.1:7926/ingest/3462e6a1-5f38-4ec0-aba6-357cd6233682',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5cda17'},body:JSON.stringify({sessionId:'5cda17',runId:'pre-fix',hypothesisId:'C',location:'src/email.ts:sendFormNotification',message:'sendMail returned',data:{accepted:info.accepted,rejected:info.rejected,response:info.response,hasPreviewUrl:Boolean(previewUrl),toIsGmail:String(process.env.FORM_TO||'').includes('gmail.com')},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    return { ok: true, previewUrl };
  } catch (err: unknown) {
    console.error('[email] Send failed:', err);
    // #region agent log
    agentLog({runId:'pre-fix',hypothesisId:'C',location:'src/email.ts:sendFormNotification',message:'sendMail threw',data:{error:err instanceof Error?err.message:String(err)}});
    fetch('http://127.0.0.1:7926/ingest/3462e6a1-5f38-4ec0-aba6-357cd6233682',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5cda17'},body:JSON.stringify({sessionId:'5cda17',runId:'pre-fix',hypothesisId:'C',location:'src/email.ts:sendFormNotification',message:'sendMail threw',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Email send failed.',
    };
  }
}
