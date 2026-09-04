# SaPTraC Prototype Public Access and Deployment Notes

## Recommended Prototype Option

Use a Cloudflare Quick Tunnel while the application runs on the development computer.
This removes the LAN IP from the QR code and lets a phone open the existing Driver or
Unit Portal over HTTPS.

The computer must remain powered on, connected to the internet, and running both the
frontend and backend. Quick Tunnel URLs are temporary and may change after restart.

## Local Services

| Service | Local address | Purpose |
| --- | --- | --- |
| Vite frontend | `http://localhost:5173` | Driver and Unit public portal |
| Express backend | `http://localhost:3000` | API and database access |
| MongoDB | Atlas or local MongoDB | Persistent application data |

## Quick Tunnel Setup

Install `cloudflared` from Cloudflare, then open separate terminals.

Start the application:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

Create a tunnel for the backend:

```powershell
cloudflared tunnel --url http://localhost:3000
```

Copy the generated HTTPS URL and use it as the backend URL. Update
`frontend/.env`:

```env
VITE_API_URL=https://BACKEND-TUNNEL-URL.trycloudflare.com/api
VITE_SOCKET_URL=https://BACKEND-TUNNEL-URL.trycloudflare.com
```

Restart Vite after changing the environment file.

Create a second tunnel for the frontend:

```powershell
cloudflared tunnel --url http://localhost:5173
```

Copy the generated HTTPS URL and update `backend/.env`:

```env
QR_PUBLIC_BASE_URL=https://FRONTEND-TUNNEL-URL.trycloudflare.com
```

Restart the backend after changing the environment file.

## QR Code Refresh

After setting `QR_PUBLIC_BASE_URL`, regenerate the stored Driver and Unit QR images:

```powershell
cd backend
node src/utils/regenerateDriverQRCodes.js
```

New Drivers automatically receive a QR code containing:

```text
https://FRONTEND-TUNNEL-URL.trycloudflare.com/driver/<persistent-id>
```

The phone camera opens the existing Driver Portal route. The same pattern applies to
Units using `/unit/<persistent-id>`.

## Important Prototype Limitation

Quick Tunnel URLs are not permanent. If Cloudflare assigns a different URL, update
both environment files, restart the services, and regenerate the QR codes again.

For permanent QR codes, use a stable domain and a named Cloudflare Tunnel, or deploy
the frontend and backend to public hosting.

## Deployment Requirements

Before production-like deployment, provide:

- A stable HTTPS frontend URL for `QR_PUBLIC_BASE_URL`.
- A stable HTTPS backend URL for `VITE_API_URL` and `VITE_SOCKET_URL`.
- MongoDB Atlas or another remotely reachable MongoDB deployment.
- A production `JWT_SECRET` kept outside source control.
- CORS restricted to the real frontend origin.
- Persistent object storage for uploaded driver documents and images.
- HTTPS and environment variables configured by the hosting provider.
- A process restart policy and application logs.
- Database backups and a tested restore procedure.
- A stable domain or hostname before printing permanent QR codes.

## Production Environment Shape

Backend:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
QR_PUBLIC_BASE_URL=https://app.example.com
FRONTEND_ORIGIN=https://app.example.com
MONGODB_URI=<managed-mongodb-connection-string>
JWT_SECRET=<strong-secret>
```

Frontend:

```env
VITE_API_URL=https://api.example.com/api
VITE_SOCKET_URL=https://api.example.com
```

## Security Notes

- Do not commit `.env` files or database credentials.
- Do not expose MongoDB directly to the internet.
- Use HTTPS for all public URLs.
- Restrict CORS when moving beyond the prototype.
- Keep the public Driver Portal limited to fields intended for public viewing.
- Do not use a temporary tunnel as the permanent production address.
