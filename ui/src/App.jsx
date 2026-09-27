import React from "react";
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Features from "./pages/Features";
import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/AddProduct";
import ProductDetail from "./components/ProductDetail";

function Navbar() {
  return (
    <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-lg">
          📉
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          PriceNazar
        </span>
      </Link>

      <div className="hidden gap-8 text-sm text-gray-400 md:flex">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `hover:text-white transition ${isActive ? "text-white" : ""}`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/features"
          className="hover:text-white transition"
        >
          Features
        </NavLink>
        <NavLink
          to="/dashboard"
          className="hover:text-white transition"
        >
          Dashboard
        </NavLink>
        <NavLink to="/add-product" className="hover:text-white transition">
          Track a Product
        </NavLink>
      </div>

      <Link
        to="/signin"
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/10 transition"
      >
        Sign in
      </Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0b0f1a] text-white antialiased overflow-x-hidden">
        {/* Background glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-600/30 blur-[120px]" />
          <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
        </div>

        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/features" element={<Features />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/add-product" element={<AddProduct />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;