/*
A simple concurrency test script that simulates multiple clients attempting to book seats simultaneously.
Run with: node tools/concurrency_test.js
Requires backend running at http://localhost:4000 and a show with id 1
*/
const fetch = require('node-fetch');

const SHOW_ID = process.env.SHOW_ID || '1';
const SEAT = parseInt(process.env.SEAT || '1', 10);
const CLIENTS = parseInt(process.env.CLIENTS || '20', 10);

async function attempt(i){
  try {
    const res = await fetch(`http://localhost:4000/shows/${SHOW_ID}/book`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({seats: [SEAT]})
    });
    const j = await res.json();
    console.log('client',i,'status',res.status, j);
  } catch (e){
    console.error('client',i,'error',e.message);
  }
}

(async ()=>{
  const promises = [];
  for (let i=0;i<CLIENTS;i++) promises.push(attempt(i));
  await Promise.all(promises);
  console.log('done');
})();
