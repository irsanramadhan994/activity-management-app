---
description: How to make localhost accessible from other devices on the same network
---

# Making Localhost Accessible from Other Devices

This guide explains how to access your development servers (frontend + backend) from other devices on the same Wi-Fi/LAN network (e.g. your phone or another laptop).

---

## Step 1: Find Your Mac's Local IP Address

Run in terminal:

```bash
ipconfig getifaddr en0
```

This returns something like `192.168.1.100`. **Note this IP** — other devices will use it.

---

## Step 2: Configure the Vite Frontend

Edit `frontend/vite.config.js` to bind to all network interfaces:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',  // <-- Expose to all network interfaces
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
})
```

The key change is adding `host: '0.0.0.0'` inside the `server` block.

---

## Step 3: Configure the Express Backend

Edit `backend/server.js` — change the `app.listen` call to bind to all interfaces:

```js
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    schedulerService.start();
});
```

The key change is adding `'0.0.0.0'` as the second argument to `app.listen()`.

---

## Step 4: Update CORS to Allow Your IP

Edit `backend/server.js` — update the CORS origin to accept requests from your IP:

```js
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://192.168.x.x:5173'  // <-- Replace with your actual IP
    ],
    credentials: true
}));
```

> **Tip:** For development only, you can use `origin: true` to allow all origins:
> ```js
> app.use(cors({ origin: true, credentials: true }));
> ```

---

## Step 5: Update the Frontend API Base URL

On the other device, the frontend will make API calls. Since the proxy only works for same-origin requests from the Vite dev server, you need to set the API URL environment variable.

Create or edit `frontend/.env.local`:

```env
VITE_API_URL=http://192.168.x.x:5000/api
```

Replace `192.168.x.x` with your actual Mac IP from Step 1.

> **Note:** The `api.js` already reads this via `import.meta.env.VITE_API_URL`, so it will pick it up automatically.

---

## Step 6: Allow Connections Through macOS Firewall

1. Go to **System Settings → Network → Firewall**
2. Either turn off the firewall temporarily, or add exceptions for Node.js

---

## Step 7: Restart Both Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

After starting, Vite will show:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

---

## Step 8: Access from Other Device

On your phone or other device (connected to the **same Wi-Fi**):

- **Frontend:** Open `http://192.168.x.x:5173` in the browser
- **Backend API:** Accessible at `http://192.168.x.x:5000/api`

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Can't connect from other device | Ensure both devices are on the same Wi-Fi network |
| CORS errors in browser console | Update the CORS `origin` in `server.js` (see Step 4) |
| API calls fail from other device | Make sure `VITE_API_URL` is set to your IP (see Step 5) |
| Connection refused | Check macOS Firewall settings (see Step 6) |
| IP changed after restart | Re-run `ipconfig getifaddr en0` and update configs |

---

## Quick Summary of Changes

| File | Change |
|---|---|
| `frontend/vite.config.js` | Add `host: '0.0.0.0'` to `server` config |
| `backend/server.js` | Add `'0.0.0.0'` to `app.listen()`, update CORS |
| `frontend/.env.local` | Set `VITE_API_URL=http://<YOUR_IP>:5000/api` |
