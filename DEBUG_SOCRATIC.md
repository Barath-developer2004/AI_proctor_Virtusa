# 🔍 Debugging Socratic AI Issue

## ✅ API Key Status: VALID
The Gemini API key is working correctly - we can see the full list of models.

## 🔍 Next Debug Steps

### **1. Test Socratic Endpoint Directly**
```bash
# First, start an exam and get to Socratic phase
# Then test the Socratic endpoint with that session ID
curl -X POST http://localhost:8080/api/sessions/[SESSION_ID]/socratic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -d '{"message":"test message"}'
```

### **2. Check Backend Logs for Errors**
Look for these specific messages in backend logs:
- `SOCRATIC AI ERROR:` - This means Gemini API call failed
- `POST /api/sessions/:id/socratic - 200` - This means endpoint was reached
- Any `500` status codes

### **3. Check Frontend Network Tab**
In browser DevTools (F12):
1. Go to **Network** tab
2. Clear the log
3. Send a message in Socratic phase
4. Look for the `/socratic` request
5. Check if it shows:
   - Status: 200 (good)
   - Status: 500 (error)
   - Any error messages in response

### **4. Verify Frontend Token**
Check if the frontend is sending the auth token correctly:
```javascript
// In browser console
localStorage.getItem('token')
```

## 🎯 Most Likely Issues

### **Issue A: Session Phase Wrong**
- Candidate might not actually be in SOCRATIC phase
- Check session phase in backend logs

### **Issue B: Authentication Missing**
- Frontend not sending Authorization header
- Backend rejecting with 401/403

### **Issue C: Request Format Wrong**
- Frontend sending wrong JSON format
- Backend not parsing request body

### **Issue D: CORS Issues**
- Pre-flight OPTIONS requests working
- Actual POST requests failing

## 🧪 Testing Plan

1. **Complete exam → MCQ → Coding** 
2. **Reach Socratic phase**
3. **Send test message**
4. **Check both frontend and backend logs**
5. **Identify exact failure point**

---

**The API key is valid, so the issue is in the request flow or session management.**
