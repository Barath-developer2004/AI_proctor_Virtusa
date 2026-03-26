# 🚀 Jatayu AI Proctor - Startup Order Guide

## ⚠️ IMPORTANT: Startup Order Matters!

### **CORRECT STARTUP SEQUENCE**

## 1. **Database Services (Start First)**
```bash
# From project root
docker compose up postgres redis -d
```
**Why first?** Backend needs PostgreSQL and Redis to be ready before starting.

## 2. **Backend Server (Start Second)**
```bash
# From project root
cd backend
go run ./cmd/server
```
**What it does:**
- Auto-migrates database tables
- Starts API server on port 8080
- Connects to PostgreSQL + Redis

## 3. **Frontend Server (Start Third)**
```bash
# From project root (NEW terminal)
cd frontend
npm run dev
```
**What it does:**
- Starts Next.js dev server on port 3000
- Connects to backend API at localhost:8080

## 4. **Chrome Extension (Optional - Load Once)**
```bash
# In Chrome browser
1. Go to chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the "extension/" folder
```

---

## 🛠️ Quick Start Commands

### **Option 1: Automated (Windows)**
```bash
# Run the startup script I created
.\STARTUP.bat
```

### **Option 2: Manual (All Platforms)**
```bash
# Terminal 1: Start databases
docker compose up postgres redis -d

# Terminal 2: Start backend
cd backend
go run ./cmd/server

# Terminal 3: Start frontend  
cd frontend
npm run dev
```

### **Option 3: Docker Everything**
```bash
# From project root (easiest)
docker compose up --build
```

---

## 🔍 Troubleshooting Port Conflicts

### **If you get "bind: address already in use":**

**Windows:**
```bash
# Kill process on port 8080
netstat -ano | findstr :8080
taskkill /F /PID [PID_from_above]

# Or use the script
.\STARTUP.bat
```

**Mac/Linux:**
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Or use different port
export PORT=8081
go run ./cmd/server
```

---

## ✅ Verification Steps

After startup, verify each service:

### **1. Check Databases**
```bash
docker compose ps
# Should show postgres and redis as "running"
```

### **2. Check Backend**
```bash
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

### **3. Check Frontend**
```bash
# Open browser
http://localhost:3000
# Should show Jatayu Proctor login page
```

---

## 🎯 Access URLs

Once everything is running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health
- **Admin Panel**: http://localhost:3000/admin
- **Candidate Dashboard**: http://localhost:3000/dashboard

---

## 📝 Environment Setup

### **Required Environment Variables**

**Backend (.env):**
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/jatayu_proctor?sslmode=disable
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 🚨 Common Startup Mistakes

### **❌ Wrong Order**
- Starting backend before databases → Connection refused
- Starting frontend before backend → API errors

### **❌ Missing Environment**
- No GEMINI_API_KEY → AI features won't work
- Wrong DATABASE_URL → Database connection errors

### **❌ Port Conflicts**
- Port 8080 already in use → Backend fails to start
- Port 3000 already in use → Frontend fails to start

### **✅ Right Way**
1. Start databases first
2. Start backend second  
3. Start frontend third
4. Load extension once

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Docker shows postgres and redis as "running"
2. ✅ Backend logs: "Jatayu Proctor API starting on :8080"
3. ✅ Frontend loads at http://localhost:3000
4. ✅ Health check returns: {"status":"ok"}
5. ✅ Can register admin and candidate accounts
6. ✅ Extension shows as "Enabled" in chrome://extensions

---

**🚀 Ready to run your complete MCQ & Multi-Language assessment platform!**
