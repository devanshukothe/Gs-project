// components/Auth/Login.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Redirect based on role
      if (role === "IC" || role === "DC") {
        navigate("/student")
      } else if (role === "Faculty") {
        navigate("/faculty");
      } else if (role === "Dean") {
        navigate("/dean");
      } else {
        navigate("/unauthorized");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {role === "" ? (
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="none">Select Role</option>
          <option value="IC">Institute Club</option>
          <option value="DC">Departmental Club</option>
          <option value="Faculty">Faculty Coordinator</option>
          <option value="Dean">Dean of Student Activities</option>
          <option value="GS">General Secretary</option>
          <option value="TS">Technical Secretary</option>
          <option value="SS">Sports Secretary</option>
          <option value="CS">Cultural Secretary</option>
        </select>
      ) : (
        <form onSubmit={handleLogin}>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Login;
