import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Portfolio from "./pages/Portfolio";
import Trade from "./pages/Trade";
import Invest from "./pages/Invest";
import Error404 from "./pages/Error404";
import * as Bootstrap from 'bootstrap';
import "bootstrap-icons/font/bootstrap-icons.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Portfolio />} />
          <Route path="trade" element={<Trade />} />
          <Route path="invest" element={<Invest />} />
          <Route path="*" element={<Error404 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('Bootstrap JS', Bootstrap);