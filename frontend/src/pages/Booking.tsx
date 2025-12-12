import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Booking(){
  const { id } = useParams();
  const [seats, setSeats] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  useEffect(()=>{
    if (!id) return;
    fetch(`http://localhost:4000/shows/${id}/seats`).then(r=>r.json()).then(setSeats).catch(console.error);
  },[id]);

  const toggle = (num:number)=>{
    setSelected(s=>{
      if (s.includes(num)) return s.filter(x=>x!==num);
      return [...s,num];
    })
  };

  const book = async ()=>{
    setMsg('Booking...');
    try {
      const res = await fetch(`http://localhost:4000/shows/${id}/book`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({seats:selected})});
      const j = await res.json();
      if (res.ok) setMsg('Booking PENDING: '+j.booking_id);
      else setMsg('Failed: '+(j.error||JSON.stringify(j)));
    } catch (e:any){
      setMsg('Network error: '+e.message);
    }
  };

  return (
    <div style={{padding:20}}>
      <h2>Booking for show {id}</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(8,40px)', gap:8}}>
        {seats.map(s=>(
          <div key={s.seat_number} onClick={()=>s.status==='AVAILABLE' && toggle(s.seat_number)} style={{
            width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',
            border:'1px solid #444', cursor: s.status==='AVAILABLE' ? 'pointer' : 'not-allowed',
            background: selected.includes(s.seat_number) ? '#ddd' : undefined,
            opacity: s.status==='AVAILABLE' ? 1 : 0.4
          }}>
            {s.seat_number}
          </div>
        ))}
      </div>
      <div style={{marginTop:10}}>
        <button onClick={book} disabled={selected.length===0}>Book selected ({selected.length})</button>
      </div>
      <div style={{marginTop:8}}>{msg}</div>
    </div>
  )
}
