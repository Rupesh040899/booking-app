import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Admin from './pages/Admin';
import Shows from './pages/Shows';
import Booking from './pages/Booking';

export default function App(){
  return (
    <BrowserRouter>
      <nav style={{padding:10}}>
        <Link to="/">Shows</Link> | <Link to="/admin">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Shows/>}/>
        <Route path="/admin" element={<Admin/>}/>
        <Route path="/booking/:id" element={<Booking/>}/>
      </Routes>
    </BrowserRouter>
  );
}
