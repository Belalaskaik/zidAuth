# Minimal Zid OAuth Sample (No Express)

This project demonstrates a very small Zid OAuth flow using only Node's built-in `http` module. It keeps the code to just a couple of files while still showing how to redirect for authorization, handle the callback, and fetch merchant details.

## Setup
1. Install dependencies and compile the TypeScript source:
   ```bash
   npm install
   npm run build
   ```
2. Set the required environment variables before starting the server:
   - `ZID_AUTH_URL`
   - `ZID_BASE_API_URL`
   - `ZID_CLIENT_ID`
   - `ZID_CLIENT_SECRET`
   - `MY_BACKEND_URL` (the public URL of this server)
   - `PORT` (optional, defaults to `3000`)
3. Start the compiled server:
   ```bash
   npm start
   ```

## Endpoints
- `GET /zid/auth/redirect` — Redirects the browser to Zid's authorize page using your client ID.
- `GET /zid/auth/callback?code=...` — Exchanges the returned `code` for tokens and fetches the merchant profile, responding with JSON so you can wire in your own logic or redirect.

## Files
- `src/server.ts` — Minimal HTTP server with the redirect and callback handlers.
- `src/zidService.ts` — Small helper class that performs the Zid API calls using Node's `https` module.

You can replace the JSON response in the callback handler with a redirect to your dashboard or any other app-specific logic.
