# System Architecture Diagram

This diagram is based on the React frontend under `frontend/src` and the Express backend under `backend/src`.

```mermaid
flowchart TB
  user[System Users<br/>Super Admin, Administrator, Cashier,<br/>Fuel Pump Attendant, Operational Manager, Mechanic]

  subgraph frontend["Frontend - React + Vite"]
    browser[Browser]
    router[React Router<br/>PublicRoute + ProtectedRoute]
    auth[AuthProvider<br/>JWT + user in localStorage]
    pages[Admin Pages<br/>Dashboard, Users, Drivers, Units,<br/>Schedules, Fuel, Remittances, Maintenance]
    apiClient[Axios API Client<br/>baseURL http://localhost:3000/api<br/>Authorization Bearer token interceptor]
    socketClient[Socket.IO Client<br/>http://localhost:3000]
    uiLibs[UI Libraries<br/>Tailwind, DaisyUI, Recharts,<br/>React Big Calendar, Lucide]
  end

  subgraph backend["Backend - Node.js + Express"]
    httpServer[HTTP Server<br/>backend/src/server.js]
    expressApp[Express App<br/>CORS + JSON parsing]
    rateLimit[Rate Limiter Middleware<br/>Upstash sliding window]
    authRoutes[Auth Routes<br/>/api/auth/register, login, me, logout]
    mountedRoutes[Currently Mounted Routes<br/>/api/auth, /api/notes, /api/revenue]
    resourceRoutes[Defined Resource Route Modules<br/>users, drivers, units, schedules,<br/>fuel, remittances, maintenance, analytics]
    security[Security Middleware<br/>verifyToken + authorizeRoles]
    upload[Upload Middleware<br/>driver and maintenance files]
    controllers[Controllers<br/>auth, users, drivers, units,<br/>schedules, fuel, remittances,<br/>maintenance, analytics]
    services[Services<br/>business logic, analytics,<br/>notifications, audit histories]
    utilities[Utilities<br/>QR generation, QR scanning,<br/>receipt generation, super admin seed]
    socketServer[Socket.IO Server<br/>real-time schedule events]
  end

  subgraph data["Data and External Services"]
    mongo[(MongoDB<br/>Mongoose Models)]
    redis[(Upstash Redis<br/>rate limit state + analytics)]
  end

  user --> browser
  browser --> router
  router --> auth
  router --> pages
  pages --> apiClient
  pages --> socketClient
  pages --> uiLibs
  auth --> apiClient

  apiClient -- REST JSON --> httpServer
  socketClient -- WebSocket --> socketServer

  httpServer --> expressApp
  httpServer --> socketServer
  expressApp --> rateLimit
  rateLimit --> mountedRoutes
  mountedRoutes --> authRoutes
  mountedRoutes -. add route mounting in server.js .-> resourceRoutes
  resourceRoutes --> security
  resourceRoutes --> upload
  authRoutes --> controllers
  security --> controllers
  upload --> controllers
  controllers --> services
  services --> utilities
  services --> mongo
  controllers --> mongo
  rateLimit --> redis
  socketServer --> pages
  services --> socketServer

  mongo --- models[Collections<br/>Users, Drivers, Units, Schedules,<br/>Fuel Transactions, Remittances,<br/>Maintenance, Notifications,<br/>Schedule History, Remittance History,<br/>Repair History, Notes]
```

## Notes

- The frontend API modules call routes such as `/users`, `/drivers`, `/units`, `/schedules`, `/fuel`, `/remittances`, `/maintenance`, and `/analytics`.
- `backend/src/server.js` currently mounts `/api/auth`, `/api/notes`, and `/api/revenue`. The other resource route modules exist in `backend/src/routes` and are shown as defined modules that should be mounted to become reachable.
- MongoDB persistence is handled through Mongoose models. Upstash Redis is used by the global rate limiter.

