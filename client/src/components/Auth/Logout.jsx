import React from "react";
import { auth } from "../../firebase/firebase"; // Adjust path to your firebase.js
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
     className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition"

    >
      Logout
    </button>
  );
};

export default Logout;
