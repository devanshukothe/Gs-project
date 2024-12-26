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
      }
      else if(role === "GS" || "TS"|| "CS" || "SS"){
        navigate("/secretary");
      } 
      else {
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
      <h2 className="mt-2 text-center">Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {role === "" ? (
        <select className="dropdown btn btn-secondary  dropdown-toggle m-3 text-center"  value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="none" class="dropdown-item">Select Role</option>
          <option value="IC" class="dropdown-item">Institute Club</option>
          <option value="DC">Departmental Club</option>
          <option value="Faculty">Faculty Coordinator</option>
          <option value="Dean">Dean of Student Activities</option>
          <option value="GS">General Secretary</option>
          <option value="TS">Technical Secretary</option>
          <option value="SS">Sports Secretary</option>
          <option value="CS">Cultural Secretary</option>
        </select>
      ) : (
        <section class="vh-25">
        <div class="container py-5 h-75">
          <div class="row d-flex align-items-center justify-content-center h-100">
             <div class="card w-25 h-25">
              <img src="https://imgs.search.brave.com/R2DR590rd1GhsX2mFiNtnQCHNK8HQ32afpIipD746wk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA0LzUzLzMyLzc2/LzM2MF9GXzQ1MzMy/NzYyMF9mbExTaFJD/VU50cW9WTUszTnlm/SmRLSTFVblEzRHhC/eS5qcGc"
                class="img-fluid" alt="Phone image"/>
            </div> 
            <div class="col-md-7 col-lg-5 col-xl-5 offset-xl-1">
        <form onSubmit={handleLogin}>
          <div data-mdb-input-init class="form-outline mb-4">
            <label class="form-label" for="form1Example13">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              class="form-control form-control-lg"
            />
          </div>
          <div data-mdb-input-init class="form-outline mb-4">
            <label class="form-label" for="form1Example23">Password:</label>
            <input
             id="form1Example23" class="form-control form-control-lg"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              
            />
          </div>
          <button type="submit" data-mdb-button-init data-mdb-ripple-init class="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
      </div>
      </div>
      </section>
      )}
    </div>
  );
};

export default Login;
