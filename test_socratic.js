fetch('http://localhost:8080/api/sessions/123/socratic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (localStorage.getItem('token') || 'test')
  },
  body: JSON.stringify({message: 'test'})
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(e => console.error('Error:', e));
