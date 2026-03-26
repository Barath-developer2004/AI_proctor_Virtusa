# 🤖 AI Features Test Guide

## ✅ Current Status
- **Backend**: Running with Gemini API Key set
- **Frontend**: Running on localhost:3000
- **Database**: Connected and ready

## 🧪 Testing the Socratic AI

### **Step 1: Complete Initial Phases**
1. **Register/Login** as candidate
2. **Start an exam** (any exam)
3. **Complete MCQ phase** (answer all questions)
4. **Submit code** in the coding phase

### **Step 2: Test Socratic AI**
1. You should now be in **SOCRATIC** phase
2. Type a message like: "I have submitted my code. Ready for questions."
3. **Expected**: AI should respond with a technical question
4. **Actual**: If you see "[Error communicating with AI. Try again.]" - there's still an issue

### **Step 3: Check Backend Logs**
The backend should show:
```
POST /api/sessions/:id/socratic - 200 OK
```

If it shows AI-related errors, the Gemini API key still isn't working properly.

## 🔧 If AI Still Not Working

### **Option 1: Manual Environment Variable**
```bash
# In PowerShell terminal
cd backend
$env:GEMINI_API_KEY="AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs"
go run ./cmd/server
```

### **Option 2: Test API Key Directly**
Check if your API key is valid:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs"
```

### **Option 3: Create New API Key**
If the key is invalid/expired:
1. Go to: https://makersuite.google.com/app/apikey
2. Create new API key
3. Replace the key in all startup scripts

## 🎯 Success Indicators

✅ **AI Working When:**
- Socratic AI responds with relevant technical questions
- No "[Error communicating with AI]" messages
- Backend logs show successful Gemini API calls
- Chat flows naturally for 5 rounds

✅ **Complete System Working When:**
- MCQ creation and scoring works
- Multi-language editor switches properly
- Socratic AI asks relevant questions
- All phases transition smoothly
- Final scores include all components

---

**🚀 Test your Socratic AI now and let me know if the AI responds properly!**
