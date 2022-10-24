/* eslint-disable no-unused-vars */
import React from "react";
import ReactDOM from "react-dom/client";
import {
  Route, RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Layout from "./pages/Layout";
import Portfolio from "./pages/Portfolio";
import Trade from "./pages/Trade";
import Invest from "./pages/Invest";
import Error404 from "./pages/Error404";
import * as Bootstrap from 'bootstrap';
import "bootstrap-icons/font/bootstrap-icons.css";


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Portfolio />} />
      <Route path="trade" element={<Trade />} />
      <Route path="invest" element={<Invest />} />
      <Route path="*" element={<Error404 />} />
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);