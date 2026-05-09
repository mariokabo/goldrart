exports.handler = async function(event, context){
  // Builds X OAuth2 authorize URL and redirects
  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = process.env.X_REDIRECT_URI; // must match callback function
  if(!clientId || !redirectUri) return { statusCode:400, body: 'X client id or redirect uri not configured' };
  const state = Math.random().toString(36).slice(2);
  const scope = encodeURIComponent('tweet.read tweet.write users.read offline.access');
  const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
  return { statusCode:302, headers:{ Location: url } };
}