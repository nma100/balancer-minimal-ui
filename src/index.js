/* eslint-disable no-unused-vars */
import React from "react";
import ReactDOM from "react-dom/client";
import {
  Route, RouterProvider,
  createRoutesFromElements,
  createHashRouter,
} from "react-router-dom";
import Layout from "./pages/Layout";
import Portfolio from "./pages/portfolio/Portfolio";
import Trade from "./pages/trade/Trade";
import Invest from "./pages/invest/Invest";
import JoinPool from "./pages/invest/JoinPool";
import ExitPool from "./pages/invest/ExitPool";
import Error404 from "./pages/error/Error404";
import "bootstrap-icons/font/bootstrap-icons.css";
import * as Bootstrap from 'bootstrap';

export const RoutePath = {
  Index: '/',
  Portfolio: 'portfolio',
  Trade: 'trade',
  JoinPool: 'join-pool',
  ExitPool: 'exit-pool',
};

const router = createHashRouter(
  createRoutesFromElements(
    <Route path={RoutePath.Index} element={<Layout />}>
      <Route index element={<Invest />} />
      <Route path={RoutePath.Trade} element={<Trade />} />
      <Route path={RoutePath.Portfolio} element={<Portfolio />} />
      <Route path={`${RoutePath.JoinPool}/:poolId`} element={<JoinPool />} />
      <Route path={`${RoutePath.ExitPool}/:poolId`} element={<ExitPool />} />
      <Route path="*" element={<Error404 />} />
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);