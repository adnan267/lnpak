# LN PAK Website — React + Node.js (MERN-style) rebuild

Same LN PAK study-abroad consultancy site as before, rebuilt as a decoupled **React frontend** + **Node.js/Express backend**, so it can be deployed on GitHub + Vercel (frontend) instead of traditional PHP hosting.

## Stack

- **Frontend**: React 18 + Vite + React Router, Bootstrap 5 (CDN) for styling
- **Backend**: Node.js + Express + MySQL (`mysql2`)
- **Auth**: JWT stored in an httpOnly cookie (not localStorage — safer against XSS)
- **File uploads**: Multer (service images)

## Project structure

```
lnpak-mern/
├── backend/            Express API (JWT auth, MySQL, image uploads)
│   ├── config/db.js
│   ├── middleware/      auth.js (JWT + role guards), upload.js (Multer)
│   ├── routes/          auth.js, services.js, inquiries.js, users.js, admin.js
│   ├── sql/schema.sql
│   ├── uploads/services/  (uploaded images land here, served at /uploads/...)
│   ├── server.js
│   └── .env.example
└── frontend/           React app (Vite)
    ├── src/
    │   ├── api/axios.js         Axios instance (withCredentials for the cookie)
    │   ├── context/AuthContext.jsx
    │   ├── components/          Navbar, Footer, ProtectedRoute, AdminRoute, AdminLayout
    │   ├── pages/                Home, About, Services, ServiceDetail, Contact, Login, Register, Dashboard
    │   └── pages/admin/           AdminDashboard, AdminServices, AdminServiceForm, AdminInquiries, AdminUsers
    └── .env.example
```

## 1. Local setup

### Backend

```bash
cd backend
cp .env.example .env      # fill in your MySQL credentials + a random JWT_SECRET
npm install
```

Create the database — import `sql/schema.sql` into MySQL (phpMyAdmin, MySQL Workbench, or `mysql -u root -p < sql/schema.sql`). It creates `lnpak_db` with sample services already seeded.

```bash
npm start        # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev       # runs on http://localhost:5173
```

Open `http://localhost:5173`. Register an account, then promote yourself to admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Log out and back in (the role is baked into your login token, so it only refreshes after a fresh login) — you'll land in `/admin`.

## 2. Deploying — GitHub + Vercel, and where the backend goes

**GitHub**: yes, push this whole folder as a repo — no issue, it's just source control.

**Vercel**: works great for the **frontend** (Vite/React is exactly what Vercel is built for). It does **not** run a persistent Node/Express server with a MySQL connection well — Vercel is serverless, and this backend uses a connection pool, file uploads to local disk, and cookie-based sessions that expect one long-running process. So the split is:

| Piece | Where it goes |
|---|---|
| **Frontend** (`frontend/`) | Vercel — set root directory to `frontend`, build command `npm run build`, output `dist`. Add env var `VITE_API_URL` = your deployed backend URL + `/api`. |
| **Backend** (`backend/`) | Railway, Render, or a small VPS — anywhere that runs a persistent Node process. Add all the `.env` variables there (`DB_HOST`, `DB_USER`, `JWT_SECRET`, `CLIENT_ORIGIN` = your Vercel URL, etc.) |
| **MySQL database** | Railway/Render both offer a managed MySQL add-on, or use PlanetScale/any MySQL host. Point the backend's `DB_*` env vars at it. |

Once both are deployed:
1. Set the backend's `CLIENT_ORIGIN` env var to your Vercel frontend URL (e.g. `https://lnpak.vercel.app`) — this is required for CORS + cookies to work cross-origin.
2. Set the backend's `NODE_ENV=production` — this makes the auth cookie `Secure` and `SameSite=None`, which is required for it to work across two different domains (Vercel + Railway/Render).
3. Set the frontend's `VITE_API_URL` to your backend's URL + `/api` (e.g. `https://lnpak-api.up.railway.app/api`), then redeploy the frontend.
4. Point `lnpak.com`'s DNS at Vercel (for the frontend) — Vercel's custom domain docs cover the exact A/CNAME records.

## 3. Notable differences from the previous PHP version

- **Auth**: JWT in an httpOnly cookie instead of PHP sessions — same security properties (can't be read by JS), but works across the frontend/backend split.
- **CSRF**: the PHP version used per-form CSRF tokens. Here, all state-changing requests are JSON (`Content-Type: application/json`) sent via `fetch`/axios with `withCredentials`, which browsers can't trigger from a plain cross-site `<form>` — this closes the classic CSRF vector without needing an explicit token. If you later add a non-JSON form endpoint, add CSRF protection back.
- **Admin role changes**: since the role lives inside the JWT, promoting/demoting a user takes effect the next time *they* log in, not immediately.

## 4. Extending it

- Add fields to the `services` table + update `AdminServiceForm.jsx` and `services.js` routes together.
- Email notifications on new inquiries: add a mail step (e.g. Nodemailer) inside `routes/inquiries.js` after the `INSERT`.
- Everything talks to the API through `frontend/src/api/axios.js` — one place to add things like automatic token refresh or global error toasts later.
