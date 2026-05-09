Goldrart — Static Frontend Showcase

What I added:
- A modern static frontend site (no backend). Files:
  - index.html
  - css/style.css
  - js/app.js
  - Use your provided assets: logo.jpg, mini.png, Dreaming Holiday.otf

How to run locally:
1. Open `index.html` in a modern browser (Chrome/Edge/Firefox).
2. For best results, serve via a static server (optional):
   - Python 3: `python -m http.server 8000`
   - Node: `npx serve .`

Notes on security:
- Uses Content-Security-Policy meta tag and external scripts/styles (avoid inline JS) to improve safety.
- Cart data stored encrypted in `localStorage` using Web Crypto with a per-session key.
- For production hosting, serve over HTTPS (Netlify, Vercel, Cloudflare Pages) and add server-side headers.

Serverless publishing and auth (Netlify functions)
- I added example Netlify Functions at `netlify/functions/*.js`:
  - `publishSocial.js`: posts content to Telegram (if `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are configured) and includes placeholders for X/Facebook/Instagram/TikTok.
  - `auth.js`: simple auth scaffold that exchanges a server-side `ADMIN_SECRET` for a token; adapt to use JWT for production.

How to deploy functions on Netlify
1. Create a Netlify site and link the repository.
2. In Netlify site settings, add the environment variables you need:
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
   - `FB_PAGE_ACCESS_TOKEN`, `FB_PAGE_ID` (if you want Facebook/Instagram posting)
   - `ADMIN_SECRET` (used by `auth.js`)
3. Netlify will automatically build functions in the `netlify/functions` folder.

Client-side admin hardening
- Admin login now compares a SHA-256 hash of the password and issues a short session token stored in `sessionStorage`. This prevents plain-text password checks in accidental copies. For real production security, use the provided `auth` serverless function and validate against a server-side secret.

Admin users and Owners (client-only)
- You can set up admin accounts in `admin_users.json` (or import via Admin -> Import Admin Users).
- Passwords must be stored as SHA-256 hex hashes. For quick testing, the Owners `kirollas` and `AhmeD5347` are seeded with the temporary password `Mario1234$$` (change this by importing a new file or using the admin importer).
- All admin actions that modify the site (Bake, Apply cleaned catalog, Normalize refs, Import Admin Users) are now subject to Owner approval: non-Owner admins create pending requests stored in `localStorage` (`gold_admin_pending`) and Owners can Accept/Reject them from the Admin panel. An audit log is kept in `gold_admin_audit`.

Next steps I can do for you:
- Replace placeholder product images with real images, add product admin UI, improve UI animations, connect to a headless CMS.
 - Complete server-side OAuth integrations for X/Facebook/TikTok and implement scheduled posting.
 - Make admin auth server-side (JWT) so site edits require a server token.
 - Add image upload support (S3, Cloudinary) and an admin media library.
