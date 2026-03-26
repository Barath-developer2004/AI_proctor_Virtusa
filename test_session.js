const http = require('http');

async function test() {
    // 1. Register a fresh user so we know the password works
    const email = `testuser_${Date.now()}@test.com`;
    const regRes = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: 'password123', name: 'Test Candidate' })
    });
    
    // 2. Login
    const loginRes = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: 'password123' })
    });
    const d = await loginRes.json();
    console.log("Logged in:", !!d.token);

    // 3. fetch exam list
    const examsRes = await fetch('http://localhost:8080/api/exams', {
        headers: { 'Authorization': 'Bearer ' + d.token }
    });
    const exams = await examsRes.json();
    if (!exams.length) return console.log("No exams found");
    const examId = exams[0].id;

    // 4. Start session
    console.log("Starting session for exam:", examId);
    const startRes = await fetch('http://localhost:8080/api/sessions/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + d.token
        },
        body: JSON.stringify({ exam_id: examId }) 
    });
    
    console.log("Start Session Status:", startRes.status);
    const text = await startRes.text();
    console.log("Start Session Body:", text);
}

test().catch(console.error);
