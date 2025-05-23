import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";  // import your firestore db

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        // Fetch role from Firestore collections
        const collections = ["Club", "Faculty", "Dean", "Secratory"];
        let foundRole = null;
        for (const col of collections) {
          const docRef = doc(db, col, currentUser.email);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundRole = col;
            break;
          }
        }
        setRole(foundRole);
      } else {
        setRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Determine dashboard route based on role
  const getDashboardRoute = () => {
    if (role === "Club") return "/student";      // IC or DC club routes
    if (role === "Faculty") return "/faculty";
    if (role === "Dean") return "/dean";
    if (role === "Secratory") return "/secretary";
    return "/unauthorized";
  };

  return (
    <nav className="bg-white border-b shadow-sm text-black px-3 py-2 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        <Link to="/" className="text-2xl font-bold">SGGS-PermitFlow</Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex space-x-8 text-sm font-medium list-none">
          <NavItem to="/" label="Home" />
          {user && role ? (
            <NavItem to={getDashboardRoute()} label="Requests" />
          ) : (
            <NavItem to="/login" label="Requests" />
          )}
          <NavItem to="/profile" label="Profile" />
        </ul>

        {/* Logout Button or Login */}
        <div className="hidden md:block">
          {user ? (
            <button
              onClick={() => navigate(getDashboardRoute())}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
              title={`Go to ${role} Dashboard`}
            >
              Welcome, {user.email}
            </button>
          ) : (
            <NavItem to="/login" label="Login" />
          )}
        </div>

        {/* Hamburger for mobile */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <ul className="md:hidden mt-4 space-y-4 text-center list-none">
          <NavItem to="/" label="Home" onClick={() => setMenuOpen(false)} />
          {user && role ? (
            <NavItem to={getDashboardRoute()} label="Requests" onClick={() => setMenuOpen(false)} />
          ) : (
            <NavItem to="/login" label="Requests" onClick={() => setMenuOpen(false)} />
          )}
          <NavItem to="/profile" label="Profile" onClick={() => setMenuOpen(false)} />
          <li>
            {user ? (
              <button
                onClick={() => {
                  navigate(getDashboardRoute());
                  setMenuOpen(false);
                }}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 w-full max-w-xs mx-auto"
                title={`Go to ${role} Dashboard`}
              >
                Welcome, {user.email}
              </button>
            ) : (
              <NavItem to="/login" label="Login" onClick={() => setMenuOpen(false)} />
            )}
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
