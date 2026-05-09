const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context){
  try{
    const params = event.queryStringParameters || {};
    const code = params.code;
    if(!code) return { statusCode:400, body:'Missing code' };
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;
    const redirectUri = process.env.X_REDIRECT_URI;
    if(!clientId || !clientSecret || !redirectUri) return { statusCode:500, body:'X app not configured' };

    const body = new URLSearchParams();
    body.append('code', code);
    body.append('grant_type', 'authorization_code');
    body.append('client_id', clientId);
    body.append('redirect_uri', redirectUri);
    // This exchange requires client_secret for confidential apps
    body.append('code_verifier','challenge');

    const res = await fetch('https://api.twitter.com/2/oauth2/token', { method:'POST', body: body, headers:{ 'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64') } });
    const data = await res.json();
    // Save tokens to secrets file if ADMIN_SECRET is set (quick local convenience)
    try{
      const filePath = path.join(__dirname, '..', 'secrets.json');
      const prev = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath,'utf8')) : {};
      prev.x = prev.x || {};
      prev.x.access_token = data.access_token;
      prev.x.refresh_token = data.refresh_token;
      fs.writeFileSync(filePath, JSON.stringify(prev, null, 2), 'utf8');
    }catch(e){/* ignore write errors */}

    return { statusCode:200, body: 'Authenticated with X. You can close this window.' };
  }catch(e){
    return { statusCode:500, body: 'Error: ' + e.message };
  }
}