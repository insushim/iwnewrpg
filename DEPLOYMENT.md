# 🚀 Deployment Guide

This guide covers deploying both the **client** (Vercel) and **server** (Railway/Heroku) for RuneWord Chronicle.

## 📋 Overview

- **Frontend**: Next.js app deployed to **Vercel**
- **Backend**: Socket.IO server deployed to **Railway** or **Heroku**
- **Database**: Optional (game works offline)

## 🖥️ Frontend Deployment (Vercel)

### 1. Auto-deployment
- Connect your GitHub repo to Vercel
- Vercel will auto-deploy on every push to `main`

### 2. Environment Variables
Set in Vercel dashboard:
```bash
NEXT_PUBLIC_SOCKET_URL=https://your-server.railway.app
```

### 3. Build Configuration
Vercel auto-detects Next.js projects. No extra config needed.

---

## 🔧 Backend Deployment

### Option 1: Railway (Recommended)

1. **Create Railway account**: https://railway.app
2. **Connect GitHub repo**
3. **Auto-detection**: Railway reads `railway.json` config
4. **Environment variables** (optional):
   ```bash
   PORT=3001
   NODE_ENV=production
   ```
5. **Deploy**: Railway auto-deploys on push

### Option 2: Heroku

1. **Create Heroku app**:
   ```bash
   heroku create your-app-name
   ```

2. **Add buildpacks**:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

3. **Environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=3001
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

### Option 3: Docker (Any provider)

1. **Build image**:
   ```bash
   docker build -t runeword-server .
   ```

2. **Run container**:
   ```bash
   docker run -p 3001:3001 -e NODE_ENV=production runeword-server
   ```

3. **Push to registry** (for cloud deployment):
   ```bash
   docker tag runeword-server your-registry/runeword-server
   docker push your-registry/runeword-server
   ```

---

## 🔗 Connect Frontend to Backend

After deploying the server, update the frontend:

1. **Get server URL** from your hosting provider
2. **Set environment variable** in Vercel:
   ```bash
   NEXT_PUBLIC_SOCKET_URL=https://your-server-url.com
   ```
3. **Redeploy frontend** (Vercel will auto-redeploy)

---

## ✅ Verification

### Test Server Health
```bash
curl https://your-server-url.com/health
# Should return: {"ok": true, "service": "runeword-chronicle-server"}
```

### Test Game Connection
1. Open your deployed frontend
2. Check the connection status in-game
3. Should show "온라인" if server is connected

---

## 🛠️ Troubleshooting

### Frontend Issues
- **Build fails**: Check Next.js version compatibility
- **Environment variables**: Ensure `NEXT_PUBLIC_*` prefix
- **Static export**: Game uses client-side routing

### Backend Issues
- **Port binding**: Ensure server uses `process.env.PORT`
- **CORS**: Socket.IO configured for cross-origin requests
- **Health check**: `/health` endpoint should return 200

### Connection Issues
- **Mixed content**: Ensure HTTPS for production
- **Socket URL**: Check `NEXT_PUBLIC_SOCKET_URL` is correct
- **Firewall**: Server port (3001) should be accessible

---

## 💡 Best Practices

1. **Monitor uptime**: Use provider's monitoring tools
2. **Environment separation**: Different URLs for dev/prod
3. **Graceful fallback**: Game works offline if server fails
4. **Logs**: Check server logs for connection issues
5. **Scaling**: Consider Redis for multiple server instances

---

## 🎯 Offline Mode

The game is designed to work **fully offline**:

- ✅ Monster spawning and AI
- ✅ Combat and damage calculation
- ✅ Quiz system and rewards
- ✅ Experience and level progression
- ✅ Inventory and shop system

Players can enjoy the complete experience even without the server!

---

## 📞 Support

If you encounter deployment issues:

1. Check the health endpoint: `/health`
2. Review server logs in your hosting dashboard
3. Test locally with `npm run dev`
4. Verify environment variables are set correctly