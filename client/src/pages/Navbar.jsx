import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Link } from 'react-router-dom';
import { Heading1, Menu, X } from 'lucide-react';



export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  return (
    <nav className="bg-white border-b shadow-sm text-black px-3 py-2 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
  
        <Link to="/" className="text-2xl font-bold">SGGS-PermitFlow</Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex space-x-8 text-sm font-medium list-none">
          <NavItem to="/" label="Home" />
          <NavItem to="/student" label="Requests" />
          <NavItem to="/profile" label="Profile" />
        </ul>

        {/* Logout Button */}
        <button className="hidden md:block bg-black text-white px-4 py-2 rounded hover:bg-gray-800 list-none">  {user ? (
        <p>Welcome, {user.email}</p>
      ) : (
         <NavItem  to="/login" label="login" />
      )}       
        </button>

        {/* Hamburger for mobile */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <ul className="md:hidden mt-4 space-y-4 text-center list-none">
          <NavItem to="/" label="Home" onClick={() => setMenuOpen(false)} />
          <NavItem to="/student" label="Request" onClick={() => setMenuOpen(false)} />
          <NavItem to="/profile" label="Profile" onClick={() => setMenuOpen(false)} />
          <li>
            <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 w-full max-w-xs mx-auto">
               {user ? (
        <p>Welcome, {user.email}</p>
      ) : (
         <NavItem to="/login" label="login" onClick={() => setMenuOpen(false)} />
      )}
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}

function NavItem({ to, label, onClick }) {
  return (
    <li>
      <Link
        to={to}
        onClick={onClick}
        className="hover:text-gray-600 transition block"
      >
        {label}
      </Link>
    </li>
  );
}
