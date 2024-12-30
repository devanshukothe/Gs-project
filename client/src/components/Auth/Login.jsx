import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sign in with Firebase Authentication
      await signInWithEmailAndPassword(auth, email, password);

      // Redirect based on role
      if (role === "IC" || role === "DC") {
        navigate("/student");
      } else if (role === "Faculty") {
        navigate("/faculty");
      } else if (role === "Dean") {
        navigate("/dean");
      } else if (["GS", "TS", "CS", "SS"].includes(role)) {
        navigate("/secretary");
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
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="card shadow p-4" style={{ maxWidth: "500px", width: "100%" }}>
        <h2 className="text-center mb-4">Login</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {role === "" ? (
          <div className="mb-4">
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
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
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email:
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password:
              </label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
