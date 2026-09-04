# SaPTraC Deployment Cost Comparison

Prices below are approximate USD estimates and can change by provider, region,
usage, taxes, and exchange rates. Always confirm the final price before
subscribing.

## Option A: Free Prototype

| Service | Recommended option | Estimated monthly cost | Limitation |
|---|---|---:|---|
| Frontend | Cloudflare Pages or Vercel free tier | $0 | Usage/build limits; suitable for demos |
| Backend | Render free web service | $0 | Can sleep after inactivity; first request may be slow |
| Database | MongoDB Atlas free tier | $0 | Small storage and shared resources |
| Domain | Provider URL (`*.pages.dev`, `*.vercel.app`, or `*.onrender.com`) | $0 | No custom branded domain |
| QR access | Permanent hosted URL | $0 | QR codes must be regenerated if the public URL changes |
| Receipt OCR | Google Cloud Vision | Usually $0 at low usage | First 1,000 OCR units/month are free; billing account still required |
| **Estimated total** |  | **$0/month** | Best for school demonstrations and testing |

The laptop is not required after deployment, but free services may sleep or
have usage limits.

## Option B: Low-Cost Full Deployment

| Service | Recommended option | Estimated monthly cost | Purpose |
|---|---|---:|---|
| Frontend | Cloudflare Pages or Vercel | $0-$20 | Hosts the built React/Vite portal |
| Backend | Render paid Web Service or Railway | About $7-$25 | Always-on Node.js/Express API and Socket.IO |
| Database | MongoDB Atlas paid tier | About $9-$25+ | Production database, backups, and more capacity |
| Domain | `.com` or similar | About $10-$25/year | Permanent public address for the portal and QR codes |
| File storage | Cloudinary or Cloudflare R2 | $0-$10+ | Driver documents, receipt images, and profile photos |
| OCR | Google Cloud Vision | $0-$1.50 per extra 1,000 images | Extracts text from receipt photos |
| Email/SMS | Provider-dependent | $0-$20+ | Optional notifications and password recovery |
| **Estimated total** |  | **About $16-$70+/month**, plus domain | More suitable for real cooperative use |

The exact backend and database price depends on traffic, storage, backups,
runtime, and provider plan. Uploaded files should not depend on the local
server filesystem because many managed services use ephemeral disk storage.

## Option C: VPS Deployment

| Service | Estimated cost |
|---|---:|
| VPS server | About $5-$20/month |
| MongoDB Atlas or managed database | About $0-$25+/month |
| Domain | About $10-$25/year |
| Object/file storage | About $0-$10+/month |
| **Estimated total** | **About $5-$55+/month**, plus domain |

A VPS can be cheaper and keep everything on one server, but the team must
manage Linux updates, HTTPS, firewalls, backups, process monitoring, and
security. It is not the easiest first deployment for a student team.

## Recommended Path

1. Prototype: Cloudflare Pages/Vercel + Render free + MongoDB Atlas free.
2. Pilot use: keep the frontend inexpensive and upgrade the backend to an
   always-on plan.
3. Full deployment: use a paid backend, production database, external file
   storage, automated backups, and a custom domain.

For SaPTraC, the best balance is **Cloudflare Pages + Render + MongoDB Atlas**.
Use the custom domain as the QR base URL:

```env
FRONTEND_URL=https://app.yourdomain.com
QR_PUBLIC_BASE_URL=https://app.yourdomain.com
FRONTEND_ORIGIN=https://app.yourdomain.com
```

After changing the permanent public URL, regenerate all existing Driver and
Unit QR codes once. No collection deletion or database migration is required.

## Pricing References

- [Render documentation](https://render.com/docs)
- [Cloudflare Pages pricing](https://pages.cloudflare.com/)
- [Vercel pricing](https://vercel.com/pricing)
- [MongoDB Atlas pricing](https://www.mongodb.com/pricing)
- [Google Cloud Vision pricing](https://cloud.google.com/vision/pricing)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
