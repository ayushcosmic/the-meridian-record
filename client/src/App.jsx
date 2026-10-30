import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Listing from "./pages/Listing";
import Article from "./pages/Article";
import Admin from "./pages/Admin";
import Info from "./pages/Info";

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  return <><ScrollToTop /><Header /><Routes><Route path="/" element={<Home />} /><Route path="/category/:slug" element={<Listing />} /><Route path="/search" element={<Listing />} /><Route path="/story/:slug" element={<Article />} /><Route path="/admin/*" element={<Admin />} /><Route path="/:page" element={<Info />} /><Route path="*" element={<Info />} /></Routes><Footer /></>;
}
