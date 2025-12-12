import React, { useState } from 'react';

export default function Admin(){
  const [name,setName]=useState('');
  const [start,setStart]=useState('');
  const [seats,setSeats]=useState(40);
  const [msg,setMsg]=useState('');
  const create = async ()=>{
    try {
      const res = await fetch('http://localhost:4000/admin/shows',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,start_time:start,total_seats:seats})});
      const j = await res.json();
      if (res.ok) setMsg('Created show id '+j.id);
      else setMsg('Error: '+(j.error||JSON.stringify(j)));
    } catch (e:any) {
      setMsg('Network error: '+e.message);
    }
  };
  return (
    <div style={{padding:20}}>
      <h2>Admin</h2>
      <div style={{display:'grid',gap:8,maxWidth:400}}>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
        <input placeholder="Start time (ISO)" value={start} onChange={e=>setStart(e.target.value)}/>
        <input type="number" value={seats} onChange={e=>setSeats(Number(e.target.value))}/>
        <button onClick={create}>Create</button>
      </div>
      <div style={{marginTop:8,color:'#333'}}>{msg}</div>
    </div>
  )
}
