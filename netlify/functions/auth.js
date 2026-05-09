// Simple auth function to issue server-side token (example).
// Set ADMIN_SECRET in Netlify environment variables.

exports.handler = async function(event){
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'Only POST' };
  const { secret } = JSON.parse(event.body || '{}');
  if(!process.env.ADMIN_SECRET) return { statusCode:500, body: 'Server not configured' };
  if(secret !== process.env.ADMIN_SECRET) return { statusCode:403, body:'Forbidden' };
  // issue a short-lived token &mdash; here we return a dummy token, implement JWT as needed
  const token = Buffer.from(Math.random().toString()).toString('base64');
  return { statusCode:200, body: JSON.stringify({ token, expiresIn:3600 }) };
}
