# SaPTraC Realistic Deployment Requirements

This is the general setup needed to make SaPTraC accessible from any network
without depending on a LAN IP, Cloudflare Tunnel, or the developer's computer.

## Recommended Architecture

```text
Phone or browser
        |
        v
https://saptrac.example.com       Frontend: built Vite application
        |
        v
https://api.saptrac.example.com   Backend: Node.js and Express
        |
        v
MongoDB Atlas or managed MongoDB
```

Uploaded documents and images should use object storage instead of the server's
local filesystem.

## Required Components

### 1. Public Hosting

You need an always-on public hosting provider for the frontend and backend. Common
choices are:

- One VPS running both services.
- A static frontend host plus a separate Node.js backend host.
- A platform such as Render, Railway, Fly.io, or similar.

The host must provide a public IP or public hostname, outbound internet access, and
the ability to run Node.js.

### 2. Domain Name and DNS

Buy or assign a domain, for example:

```text
saptrac.example.com       frontend
api.saptrac.example.com   backend API
```

Create DNS records pointing those names to the hosting services. A stable domain is
important because printed QR codes should not change.

### 3. HTTPS Certificate

Use HTTPS for both frontend and backend. A normal production setup uses a reverse
proxy such as Nginx or Caddy with a Let's Encrypt certificate.

Do not use plain HTTP for public login, JWT requests, uploads, or QR portal access.

### 4. Frontend Deployment

Build the Vite application:

```powershell
cd frontend
npm install
npm run build
```

Publish the generated `frontend/dist` directory through the frontend host or a web
server. Configure the frontend with the public API URL before building:

```env
VITE_API_URL=https://api.saptrac.example.com/api
VITE_SOCKET_URL=https://api.saptrac.example.com
```

The web server must support SPA fallback so `/driver/<id>` and `/unit/<id>` load the
React application instead of returning a 404.

### 5. Backend Deployment

Run the existing Node.js application on the backend host:

```powershell
cd backend
npm install --omit=dev
npm start
```

Configure:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
FRONTEND_ORIGIN=https://saptrac.example.com
QR_PUBLIC_BASE_URL=https://saptrac.example.com
```

Use a process manager such as `systemd`, PM2, or the hosting provider's service
manager so the backend restarts automatically after a crash or server restart.

### 6. MongoDB

Use MongoDB Atlas or another managed MongoDB provider. Configure the backend with:

```env
MONGODB_URI=<managed-mongodb-connection-string>
```

Allow only the deployment server's outbound IP where possible. Do not expose MongoDB
to the whole internet, and enable backups before real operational use.

### 7. File and Image Storage

The backend currently handles uploaded driver documents and images. Production
deployment should store these in Cloudinary, Amazon S3, Cloudflare R2, or another
durable object-storage service.

Do not depend on a deployment server's local disk. Many hosting platforms erase local
files during redeploys or restarts.

### 8. Security Configuration

- Use a strong production `JWT_SECRET` stored only in hosting environment variables.
- Restrict backend CORS to `https://saptrac.example.com`.
- Keep MongoDB credentials and service keys out of source control.
- Use HTTPS-only cookies if cookies are introduced later.
- Add rate limits and monitoring for public endpoints.
- Review which Driver fields are allowed on the public portal.
- Create regular database backups and test restoring one.

## QR Code Behavior

QR codes must contain a stable public frontend URL:

```text
https://saptrac.example.com/driver/<persistent-driver-id>
https://saptrac.example.com/unit/<persistent-unit-id>
```

Set `QR_PUBLIC_BASE_URL` before creating new records. After changing the public base
URL, regenerate existing codes:

```powershell
cd backend
node src/utils/regenerateDriverQRCodes.js
```

After the domain is stable, QR codes should not need to be regenerated when the
backend server, IP address, or hosting provider changes.

## Practical Deployment Choices

### Lowest-maintenance option

- Vite frontend on a static hosting service.
- Express backend on a managed Node.js service.
- MongoDB Atlas.
- Cloudinary or S3-compatible object storage.
- Custom domain with HTTPS.

### Most control option

- One Ubuntu VPS.
- Nginx or Caddy reverse proxy.
- Node.js backend managed by systemd or PM2.
- Built Vite files served by Nginx or Caddy.
- MongoDB Atlas instead of MongoDB exposed on the VPS.
- Object storage for uploads.

## Minimum Acceptance Checklist

- The frontend opens from mobile data.
- The backend health endpoint responds publicly.
- Login and JWT-protected API requests work over HTTPS.
- Driver and Unit public pages load from QR scans.
- A new Driver receives a QR containing the stable public domain.
- Existing QR codes still work after restarting the server.
- Uploaded files remain available after redeployment.
- MongoDB backups exist and a restore has been tested.
- CORS, secrets, and database access are restricted.
