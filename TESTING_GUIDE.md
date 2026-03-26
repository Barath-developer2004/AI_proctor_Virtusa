# 🧪 Jatayu AI Proctor - Feature Testing Guide

## ✅ Application Status: RUNNING

- **Backend**: ✅ http://localhost:8080 (Health OK)
- **Frontend**: ✅ http://localhost:3000 (Ready)
- **Database**: ✅ PostgreSQL + Redis running
- **Extension**: ⚠️ Load manually (see below)

---

## 🎯 Testing Your New Features

### **1. MCQ System Testing**

#### **Admin: Create Exam with MCQs**
```bash
1. Open: http://localhost:3000/register
2. Create admin account (role: admin)
3. Login: http://localhost:3000/login
4. Go to: http://localhost:3000/admin
5. Click "Create Exam" tab
6. Fill exam details:
   - Title: "Test MCQ Exam"
   - Language: Python
   - Time Limit: 1800
7. Add MCQs:
   - Click "+ Add MCQ" button
   - Question: "What is 2+2?"
   - Options: "3", "4", "5", "6"
   - Select correct answer: "4"
   - Add 2-3 more MCQs
8. Write coding prompt:
   - "Write a function that adds two numbers"
9. Click "Create Exam"
```

#### **Candidate: Take MCQ Test**
```bash
1. Open new browser window (incognito recommended)
2. Register candidate: http://localhost:3000/register
3. Login: http://localhost:3000/login
4. Go to: http://localhost:3000/dashboard
5. Click "Start Exam" for your test
6. MCQ Phase:
   - Answer all multiple choice questions
   - Click "Submit Answers & Start Coding"
7. Coding Phase:
   - Write solution in Python (or switch languages)
   - Click "Submit Code"
8. Complete remaining phases (Socratic, Saboteur)
9. View final results with MCQ score!
```

### **2. Multi-Language Editor Testing**

#### **Language Switching**
```bash
1. During coding phase
2. Look at editor toolbar (top left)
3. Click language dropdown
4. Switch between: Python, JavaScript, Java, C++, Go
5. Notice syntax highlighting changes
6. Write code in any language
7. Submit - language is saved with submission
```

#### **Test Different Languages**
```python
# Python Test
def add_numbers(a, b):
    return a + b

print(add_numbers(2, 3))
```

```javascript
// JavaScript Test
function addNumbers(a, b) {
    return a + b;
}

console.log(addNumbers(2, 3));
```

```java
// Java Test
public class Main {
    public static int addNumbers(int a, int b) {
        return a + b;
    }
    
    public static void main(String[] args) {
        System.out.println(addNumbers(2, 3));
    }
}
```

### **3. Admin Dashboard Testing**

#### **Monitor Sessions**
```bash
1. Login as admin: http://localhost:3000/admin
2. Click "Live Monitor" tab
3. Look for "MCQ" column in sessions table
4. Verify MCQ scores appear after candidates complete
5. Click "Report" to download PDF with MCQ scores
```

#### **PDF Report Testing**
```bash
1. Complete an exam as candidate
2. As admin, find completed session
3. Click "Report" button
4. Verify PDF includes:
   - MCQ score section
   - All other assessment components
   - Final integrity score
```

---

## 🔧 Chrome Extension Testing

### **Load Extension**
```bash
1. Open Chrome
2. Go to: chrome://extensions
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select: d:\Jatayu_AI_proctor\extension\ folder
6. Verify extension appears and is enabled
```

### **Test Proctoring Features**
```bash
1. Start exam as candidate
2. During coding phase, test violations:
   - Switch to another tab → should increment violation
   - Press Ctrl+Shift+I (DevTools) → should increment violation
   - Copy text (Ctrl+C) → should increment violation
   - Type normally → should stream keystrokes
3. Check admin dashboard for violation counts
```

---

## 🎯 Expected Results

### **MCQ System**
- ✅ Admin can add unlimited MCQs to exams
- ✅ Candidates see MCQ phase before coding
- ✅ MCQ scores calculated (correct/total * 100)
- ✅ MCQ scores appear in admin dashboard
- ✅ MCQ scores included in PDF reports

### **Multi-Language Editor**
- ✅ Language dropdown appears in editor toolbar
- ✅ Syntax highlighting changes with language
- ✅ Language selection persists during session
- ✅ Backend receives language parameter
- ✅ All 5 languages work correctly

### **Assessment Pipeline**
- ✅ Complete flow: MCQ → Coding → Socratic → Saboteur → Complete
- ✅ Phase transitions work smoothly
- ✅ All scores integrated properly
- ✅ Final integrity score calculated

---

## 🚨 Common Testing Issues & Solutions

### **MCQ Issues**
```bash
Problem: MCQs not appearing
Solution: Check exam creation - ensure MCQs are added before submitting

Problem: MCQ score showing 0
Solution: Verify correct answers are selected in admin panel
```

### **Language Issues**
```bash
Problem: Language dropdown not showing
Solution: Ensure you're in CODING phase with editor loaded

Problem: Syntax highlighting wrong
Solution: Refresh page and reselect language
```

### **Extension Issues**
```bash
Problem: Extension not loading
Solution: Check chrome://extensions for errors, reload extension

Problem: Violations not counting
Solution: Ensure extension is enabled and on localhost:3000
```

---

## 📊 Test Data Suggestions

### **Sample MCQ Questions**
```bash
1. "What is the time complexity of binary search?"
   Options: "O(n)", "O(log n)", "O(n²)", "O(1)"
   Answer: "O(log n)"

2. "Which keyword is used to define a constant in Python?"
   Options: "const", "final", "constant", "None"
   Answer: "None"

3. "What does HTML stand for?"
   Options: "Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"
   Answer: "Hyper Text Markup Language"
```

### **Sample Coding Prompts**
```bash
1. "Write a function that finds the factorial of a number."
2. "Create a function that reverses a string."
3. "Implement a function that checks if a number is prime."
```

---

## 🎉 Success Checklist

After testing, verify these work:

- [ ] Admin creates exam with MCQs
- [ ] Candidate completes MCQ phase
- [ ] MCQ scores appear in dashboard
- [ ] Language switching works in editor
- [ ] All 5 languages have syntax highlighting
- [ ] Extension detects violations
- [ ] PDF reports include MCQ scores
- [ ] Complete assessment pipeline works
- [ ] Final integrity score calculated correctly

---

**🚀 Your Jatayu AI Proctor with MCQ & Multi-Language support is ready for testing!**

Open http://localhost:3000 now and start testing!
