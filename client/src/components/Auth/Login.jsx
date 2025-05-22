import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, UserCircle2, LogIn } from "lucide-react";
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
      await signInWithEmailAndPassword(auth, email, password);

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
   <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
  <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 flex items-center gap-2">
    <UserCircle2 className="w-8 h-8 text-gray-700" />
    SGGSIE&T Permissions System
  </h2>

  <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
    <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900 flex items-center justify-center gap-2">
      <LogIn className="w-6 h-6 text-gray-800" />
      Login
    </h2>

    {error && (
      <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm border border-red-300">
        {error}
      </div>
    )}

    {role === "" ? (
      <div className="mb-6">
        <label className="block mb-2 font-medium text-gray-700">Select Role:</label>
        <select
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
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
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1 font-medium text-gray-700">
            Email:
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-black">
            <Mail className="text-gray-500 mr-2 w-5 h-5" />
            <input
              type="email"
              id="email"
              className="w-full outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block mb-1 font-medium text-gray-700">
            Password:
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-black">
            <Lock className="text-gray-500 mr-2 w-5 h-5" />
            <input
              type="password"
              id="password"
              className="w-full outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition duration-200 flex items-center justify-center gap-2"
          disabled={loading}
        >
          <LogIn className="w-4 h-4" />
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    )}
  </div>
</div>
  );
};

export default Login;
