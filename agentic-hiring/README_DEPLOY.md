# 🚀 HR Portal - Deployment Ready!

## ✅ Deployment Status

- ✅ Frontend built successfully (`frontend/dist/`)
- ✅ Backend configured and ready
- ✅ Deployment scripts created
- ✅ Render.com configuration ready (`render.yaml`)

## 🎯 Quick Start

### Local Development

**Option 1: Use provided scripts**
```bash
# Terminal 1 - Backend
./start-backend.sh

# Terminal 2 - Frontend  
./start-frontend.sh
```

**Option 2: Manual start**
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn api:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access: `http://localhost:5174` (or port shown by Vite)

### Production Build (Local)

```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
source venv/bin/activate
uvicorn api:app --host 0.0.0.0 --port 8000

# Serve frontend (in another terminal)
cd frontend
npm run preview
```

## ☁️ Deploy to Render.com

### Automatic (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy HR Portal"
   git push origin main
   ```

2. **Connect to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml` and create services

3. **Set Environment Variables:**
   - In Render Dashboard → Your Backend Service → Environment
   - Add `LITELLM_API_KEY` (your API key)
   - Add `LITELLM_MODEL` (optional, defaults to gemini)

4. **Frontend Environment:**
   - In Render Dashboard → Your Frontend Service → Environment
   - Add `VITE_API_URL` = `https://your-backend-service.onrender.com`

### Manual Deployment

See `DEPLOY.md` for detailed manual deployment steps.

## 📋 Pre-Deployment Checklist

- [x] Frontend built (`npm run build`)
- [x] Backend dependencies installed
- [x] Environment variables documented
- [x] CORS configured
- [x] Health check endpoint working (`/`)
- [ ] Backend tested locally
- [ ] Frontend connects to backend
- [ ] All features working

## 🔧 Environment Variables

### Backend (Render/Production)
```bash
LITELLM_API_KEY=your_api_key_here
LITELLM_MODEL=hackathon-gemini-2.5-flash  # Optional
PORT=8000  # Auto-set by Render
```

### Frontend (Build-time)
```bash
VITE_API_URL=https://agentic-hiring-api.onrender.com
```

## 📁 Project Structure

```
agentic-hiring/
├── backend/
│   ├── api.py              # FastAPI server
│   ├── utils.py            # Business logic
│   ├── requirements.txt    # Python dependencies
│   └── venv/               # Virtual environment
├── frontend/
│   ├── src/                # React source
│   ├── dist/               # Production build
│   └── package.json        # Node dependencies
├── deploy.sh               # Deployment script
├── start-backend.sh        # Quick backend start
├── start-frontend.sh       # Quick frontend start
└── DEPLOY.md               # Detailed deployment guide
```

## 🐛 Troubleshooting

### Backend won't start
- Check if venv is activated: `source backend/venv/bin/activate`
- Install dependencies: `pip install -r backend/requirements.txt`
- Check port 8000 is available

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check backend is running on correct port
- Check CORS settings in `backend/api.py`

### Render deployment fails
- Check build logs in Render dashboard
- Verify `render.yaml` syntax
- Ensure environment variables are set
- Check Python version compatibility

## 📞 Support

For issues, check:
1. `DEPLOY.md` - Detailed deployment guide
2. Render logs - Dashboard → Your Service → Logs
3. Backend logs - Terminal output
4. Browser console - Frontend errors

---

**Ready to deploy!** 🎉
