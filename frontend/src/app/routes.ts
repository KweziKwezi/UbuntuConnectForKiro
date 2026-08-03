import { createElement } from "react";
import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import Landing from "./components/Landing";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import NPODashboard from "./components/NPODashboard";
import IndividualDashboard from "./components/IndividualDashboard";
import BusinessDashboard from "./components/BusinessDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "register", Component: Register },
      { path: "login", Component: Login },
      // Generic placeholder dashboard (unused by the login/register redirect
      // logic below, but left routable — no backend concept of a "generic"
      // user maps to it, so it stays static).
      { path: "dashboard", Component: Dashboard },
      {
        path: "npo-dashboard",
        element: createElement(ProtectedRoute, { role: "NPO", children: createElement(NPODashboard) }),
      },
      {
        path: "individual-dashboard",
        element: createElement(ProtectedRoute, { role: "Individual", children: createElement(IndividualDashboard) }),
      },
      {
        path: "business-dashboard",
        element: createElement(ProtectedRoute, { role: "Business", children: createElement(BusinessDashboard) }),
      },
      {
        path: "admin-dashboard",
        element: createElement(ProtectedRoute, { role: "Admin", children: createElement(AdminDashboard) }),
      },
    ],
  },
]);
