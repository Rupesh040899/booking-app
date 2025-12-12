import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Shows(){
  const [shows, setShows] = useState<any[]>([]);
  useEffect(()=>{
    fetch('http://localhost:4000/shows').then(r=>r.json()).then(setShows).catch(console.error);
  },[]);
  return (
    <div style={{padding:20}}>
      <h2>Shows / Trips</h2>
      {shows.length===0 && <div>No shows</div>}
      <ul>
        {shows.map((s:any)=>(
          <li key={s.id}>
            {s.name} - {new Date(s.start_time).toLocaleString()} - seats: {s.total_seats}
            {' '}
            <Link to={`/booking/${s.id}`}>Book</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
