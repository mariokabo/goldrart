const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context){
  if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const adminSecret = process.env.ADMIN_SECRET;
  const header = (event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'] || '').toString();
  if(!adminSecret || header !== adminSecret){
    return { statusCode: 401, body: JSON.stringify({error:'Unauthorized'}) };
  }
  try{
    const body = JSON.parse(event.body || '{}');
    // basic validation: ensure it's an object
    if(!body || typeof body !== 'object') return { statusCode:400, body: JSON.stringify({error:'Invalid payload'}) };
    const filePath = path.join(__dirname, '..', 'secrets.json');
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), {encoding:'utf8'});
    return { statusCode:200, body: JSON.stringify({ok:true, storedAt:filePath}) };
  }catch(e){
    return { statusCode:500, body: JSON.stringify({error: e.message}) };
  }
}