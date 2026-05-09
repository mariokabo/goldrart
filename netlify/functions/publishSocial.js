// Netlify Function: publishSocial
// Usage: POST JSON { title, description, url } and set environment variables for each platform

const fetch = require('node-fetch');

exports.handler = async function(event, context){
  if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const body = JSON.parse(event.body || '{}');
  const { title, description, url } = body;

  const results = {};

  // Telegram (works if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set)
  const secretsPath = require('path').join(__dirname,'..','secrets.json');
  let localSecrets = {};
  try{ localSecrets = require(secretsPath); }catch(e){ /* ok if missing */ }

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || (localSecrets && localSecrets.telegram && localSecrets.telegram.bot_token);
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || (localSecrets && localSecrets.telegram && localSecrets.telegram.chat_id);
  if(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID){
    try{
      const text = `*${title}*\n${description}\n${url}`;
      const tgResp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,{
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode:'Markdown' })
      });
      results.telegram = await tgResp.json();
    }catch(e){ results.telegram = { error: e.message } }
  } else results.telegram = { skipped: true };

  // Twilio / WhatsApp send (if configured)
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || (localSecrets && localSecrets.twilio && localSecrets.twilio.sid);
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || (localSecrets && localSecrets.twilio && localSecrets.twilio.token);
  const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM || (localSecrets && localSecrets.twilio && localSecrets.twilio.from);
  if(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM){
    try{
      // Example: send a WhatsApp message to an admin number (configurable). For product-level publishing you may extend with recipients.
      if(process.env.WHATSAPP_TO || (localSecrets && localSecrets.twilio && localSecrets.twilio.to)){
        const to = process.env.WHATSAPP_TO || (localSecrets && localSecrets.twilio && localSecrets.twilio.to);
        const bodyPayload = `*${title}*\n${description}\n${url}`;
        const params = new URLSearchParams();
        params.append('To', `whatsapp:${to}`);
        params.append('From', TWILIO_FROM);
        params.append('Body', bodyPayload);
        const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, { method:'POST', body: params, headers: { 'Authorization': 'Basic ' + Buffer.from(TWILIO_SID + ':' + TWILIO_TOKEN).toString('base64') } });
        results.whatsapp = await resp.json();
      } else results.whatsapp = { skipped:true, reason:'no recipient configured (WHATSAPP_TO)'};
    }catch(e){ results.whatsapp = { error: e.message } }
  } else results.whatsapp = { skipped:true };

  // X (Twitter) placeholder: requires OAuth keys and implementation
  if(process.env.X_API_KEY){
    results.x = { message: 'Configure X API credentials in environment and implement OAuth.' };
  } else results.x = { skipped:true };

  // Facebook/Instagram placeholder
  if(process.env.FB_PAGE_ACCESS_TOKEN && process.env.FB_PAGE_ID){
    // Example: publish to page feed (requires App review and permissions)
    try{
      const fbResp = await fetch(`https://graph.facebook.com/${process.env.FB_PAGE_ID}/feed`,{
        method:'POST', body: new URLSearchParams({ message: `${title}\n${description}\n${url}`, access_token: process.env.FB_PAGE_ACCESS_TOKEN })
      });
      results.facebook = await fbResp.json();
    }catch(e){ results.facebook = { error: e.message } }
  } else results.facebook = { skipped:true };

  // TikTok placeholder
  if(process.env.TIKTOK_TOKEN){ results.tiktok = { message: 'Configure TikTok SDK or API.' }; } else results.tiktok = { skipped:true };

  return { statusCode: 200, body: JSON.stringify(results) };
}
