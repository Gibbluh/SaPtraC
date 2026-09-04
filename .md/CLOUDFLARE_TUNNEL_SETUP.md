# SaPTraC Cloudflare Tunnel Setup

This guide makes the local SaPTraC prototype accessible from a phone without using
the computer's LAN IP in the QR code.

## What This Provides

```text
Phone -> Cloudflare HTTPS URL -> Local Vite frontend
Phone -> Cloudflare HTTPS URL -> Local Express backend
```

The computer must stay powered on and connected to the internet while the tunnels
are running.

## 1. Install Cloudflared

Install `cloudflared` for Windows from:

```text
https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

Confirm the installation:

```powershell
cloudflared --version
```

## 2. Start SaPTraC

Open one PowerShell window for the backend:

```powershell
cd F:\XAMPP\htdocs\SaPTraC\backend
npm run dev
```

Open another PowerShell window for the frontend:

```powershell
cd F:\XAMPP\htdocs\SaPTraC\frontend
npm run dev
```

## 3. Create the Backend Tunnel

Open a third PowerShell window:

```powershell
cloudflared tunnel --url http://localhost:3000
```

Copy the HTTPS URL printed by Cloudflare, for example:

```text
https://backend-example.trycloudflare.com
```

## 4. Configure the Frontend API

Update `frontend/.env` using the backend tunnel URL:

```env
VITE_API_URL=https://backend-example.trycloudflare.com/api
VITE_SOCKET_URL=https://backend-example.trycloudflare.com
```

Restart the Vite frontend after changing this file.

## 5. Create the Frontend Tunnel

Open another PowerShell window:

```powershell
cloudflared tunnel --url http://localhost:5173
```

Copy the HTTPS URL printed by Cloudflare, for example:

```text
https://frontend-example.trycloudflare.com
```

## 6. Configure QR URLs

Update `backend/.env`:

```env
QR_PUBLIC_BASE_URL=https://frontend-example.trycloudflare.com
```

Restart the backend after changing this file.

## 7. Regenerate Existing QR Codes

This is required for QR codes already saved in MongoDB:

```powershell
cd F:\XAMPP\htdocs\SaPTraC\backend
node src/utils/regenerateDriverQRCodes.js
```

New Driver QR codes will open:

```text
https://frontend-example.trycloudflare.com/driver/<driver-id>
```

New Unit QR codes will open:

```text
https://frontend-example.trycloudflare.com/unit/<unit-id>
```

## 8. Test From a Phone

1. Turn off Wi-Fi on the phone and use mobile data.
2. Scan a newly generated QR code.
3. Confirm the existing Driver or Unit Portal opens.
4. Confirm the portal can load its data from the backend tunnel.

## Troubleshooting

### The QR displays text

The QR was generated before `QR_PUBLIC_BASE_URL` was configured. Restart the backend
and run the regeneration command again.

### The portal opens but shows an API error

Check that `frontend/.env` uses the backend tunnel URL, including `/api`, then restart
Vite.

### The tunnel URL changed

Quick Tunnel URLs can change after restarting. Update both environment files, restart
the applications, and regenerate the QR codes again.

### The page does not load

All four processes must be running:

- Backend Node process
- Frontend Vite process
- Backend Cloudflare tunnel
- Frontend Cloudflare tunnel

## Permanent Deployment

Quick Tunnels are for prototyping. For permanent QR codes, use a stable domain and a
named Cloudflare Tunnel. Then QR codes do not need to be reissued whenever the local
computer or tunnel process restarts.

Never commit `.env` files, database credentials, or JWT secrets.
