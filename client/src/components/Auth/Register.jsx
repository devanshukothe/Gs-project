import React, { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import {
  setDoc,
  doc,
  getDocs,
  getDoc,
  collection,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [clubDetails, setClubDetails] = useState({
    name: "",
    email: "",
    password: "",
    faculty: "",
    coordinator: "",
  });
  const [otherDetails, setOtherDetails] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [role, setRole] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const navigate = useNavigate();

  const checkRoleExist = async (role, email = "") => {
    try {
      const collectionName =
        role === "IC" || role === "DC"
          ? "Club"
          : role === "Faculty" || role === "Dean"
          ? role
          : "Secratory";

      const docRef = doc(db, collectionName, email);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const email =
        role === "IC" || role === "DC"
          ? clubDetails.email
          : otherDetails.email;
      const password =
        role === "IC" || role === "DC"
          ? clubDetails.password
          : otherDetails.password;

      const exists = await checkRoleExist(role, email);
      if (exists) {
        alert("Role already exists!");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const collectionName =
        role === "IC" || role === "DC"
          ? "Club"
          : role === "Faculty" || role === "Dean"
          ? role
          : "Secratory";

      const data =
        role === "IC" || role === "DC"
          ? { ...clubDetails, role }
          : { ...otherDetails, role };

      await setDoc(doc(db, collectionName, user.email), data);
      navigate("/login");
    } catch (error) {
      console.error("Error registering:", error);
    }
  };

  const handleChange = (e) => {
    if (role === "IC" || role === "DC") {
      setClubDetails({ ...clubDetails, [e.target.name]: e.target.value });
    } else {
      setOtherDetails({ ...otherDetails, [e.target.name]: e.target.value });
    }
  };

  useEffect(() => {
    async function getFaculty() {
      const fC = await getDocs(collection(db, "Faculty"));
      const facultyData = fC.docs.map((doc) => doc.data());
      setFacultyList(facultyData);
    }
    getFaculty();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <h2 className="text-3xl font-bold text-center mb-6">SGGSIE&T Permissions System</h2>

      {!role && (
        <div className="mb-6">
          <select
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded shadow focus:outline-none focus:ring-2 focus:ring-black"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Select Role</option>
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
      )}

      {role && (
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold text-center mb-6">Register as {role}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(role === "IC" || role === "DC") ? (
              <>
                <InputField
                  label="Email"
                  type="email"
                  name="email"
                  value={clubDetails.email}
                  onChange={handleChange}
                />
                <InputField
                  label="Password"
                  type="password"
                  name="password"
                  value={clubDetails.password}
                  onChange={handleChange}
                />
                <InputField
                  label="Club Name"
                  type="text"
                  name="name"
                  value={clubDetails.name}
                  onChange={handleChange}
                />
                <InputField
                  label="Club Coordinator"
                  type="text"
                  name="coordinator"
                  value={clubDetails.coordinator}
                  onChange={handleChange}
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Faculty</label>
                  <select
                    name="faculty"
                    value={clubDetails.faculty}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select</option>
                    {facultyList.map((faculty, index) => (
                      <option key={index} value={faculty.name}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <InputField
                  label="Email"
                  type="email"
                  name="email"
                  value={otherDetails.email}
                  onChange={handleChange}
                />
                <InputField
                  label="Password"
                  type="password"
                  name="password"
                  value={otherDetails.password}
                  onChange={handleChange}
                />
                <InputField
                  label="Name"
                  type="text"
                  name="name"
                  value={otherDetails.name}
                  onChange={handleChange}
                />
              </>
            )}
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
            >
              Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      {...props}
      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
      required
    />
  </div>
);

export default Register;
