# 🔧 Jatayu AI Proctor - Permanent Troubleshooting Guide

## 🚨 **Common Issues & Permanent Fixes**

### **Issue 1: "AI Not Working" / 500 Errors**
**Cause**: Backend not running or database disconnected
**Permanent Fix**: 
```bash
# Run this command
.\RELIABLE_START.bat
```

### **Issue 2: Port Conflicts**
**Cause**: Previous processes still running
**Permanent Fix**:
```bash
# Kill all processes
taskkill /F /IM go.exe
taskkill /F /IM node.exe
# Then restart
.\RELIABLE_START.bat
```

### **Issue 3: Database Connection Failed**
**Cause**: Docker containers not running
**Permanent Fix**:
```bash
# Restart databases
docker compose up postgres redis -d
# Wait 10 seconds
.\RELIABLE_START.bat
```

---

## 🛠️ **Prevention Strategies**

### **1. Use Reliable Startup Script**
**Always use**: `.\RELIABLE_START.bat`
- ✅ Kills existing processes
- ✅ Starts databases first
- ✅ Waits for database connection
- ✅ Sets environment variables
- ✅ Starts backend then frontend
- ✅ Opens in separate windows

### **2. Check Services Before Testing**
**Always run**: `.\CHECK_SERVICES.bat`
- ✅ Shows database status
- ✅ Tests backend health
- ✅ Tests frontend accessibility
- ✅ Checks port conflicts
- ✅ Provides quick fix commands

### **3. Proper Shutdown**
When done working:
```bash
# Close windows gracefully (Ctrl+C in each terminal)
# Or use:
docker compose down
```

---

## 🔄 **Daily Workflow**

### **Starting Work (Every Time)**
```bash
1. Open terminal in project root
2. Run: .\RELIABLE_START.bat
3. Wait 30 seconds
4. Test: http://localhost:3000
```

### **Checking Status**
```bash
# If anything seems wrong
.\CHECK_SERVICES.bat
```

### **Stopping Work**
```bash
# Close terminal windows or run:
docker compose down
```

---

## 🎯 **Quick Reference Commands**

### **Start Everything**
```bash
.\RELIABLE_START.bat
```

### **Check Status**
```bash
.\CHECK_SERVICES.bat
```

### **Force Restart**
```bash
taskkill /F /IM go.exe && taskkill /F /IM node.exe
.\RELIABLE_START.bat
```

### **Check Backend Health**
```bash
curl http://localhost:8080/health
```

### **Check Frontend**
```bash
curl http://localhost:3000
```

---

## 📋 **Service URLs**

- **Frontend**: http://localhost:3000
- **Backend Health**: http://localhost:8080/health
- **Admin Panel**: http://localhost:3000/admin
- **Candidate Dashboard**: http://localhost:3000/dashboard

---

## 🚀 **Why This Prevents Issues**

### **Reliable Startup Script:**
- **Process Management**: Kills old processes first
- **Database First**: Ensures PostgreSQL + Redis are ready
- **Environment Variables**: Sets Gemini API key automatically
- **Order Matters**: Backend starts before frontend
- **Separate Windows**: Prevents one crash from affecting others

### **Service Check Script:**
- **Early Detection**: Catches issues before testing
- **Clear Status**: Shows exactly what's running/not running
- **Quick Fixes**: Provides immediate solutions
- **Port Monitoring**: Prevents conflicts

---

## 🎉 **Success Guarantee**

If you follow this workflow:
1. **Always use** `.\RELIABLE_START.bat` to start
2. **Always run** `.\CHECK_SERVICES.bat` before testing
3. **Always close** terminals properly when done

**You will never face the same issues again!**

---

**🚀 Your Jatayu AI Proctor is now bulletproof against startup issues!**
