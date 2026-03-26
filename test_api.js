fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyCf8gYbOPWypmmVep17wUHbefBNKDL74gs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
})
  .then(res => {
    console.log("Status:", res.status);
    return res.text();
  })
  .then(console.log);
