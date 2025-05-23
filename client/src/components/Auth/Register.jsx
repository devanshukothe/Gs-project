import React, { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db, provider } from "../../firebase/firebase";
import { setDoc, doc, getDocs, getDoc, collection } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";

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
        role === "IC" || role === "DC" ? clubDetails.email : otherDetails.email;
      const password =
        role === "IC" || role === "DC"
          ? clubDetails.password
          : otherDetails.password;

      const exists = await checkRoleExist(role, email);
      if (exists) {
        alert("Role already exists!");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);
      alert(
        "Verification email sent! Please check your email inbox and verify your account before logging in."
      );

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
      localStorage.setItem(
        "userData",
        JSON.stringify({ ...data, uid: user.uid })
      );

      navigate("/login");
    } catch (error) {
      console.error("Error registering:", error);
      alert("Registration failed.");
    }
  };

  const handleGoogleSignup = async () => {
    if (!role) {
      alert("Please select a role before signing up with Google.");
      return;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const collectionName =
        role === "IC" || role === "DC"
          ? "Club"
          : role === "Faculty" || role === "Dean"
          ? role
          : "Secratory";

      const exists = await checkRoleExist(role, user.email);
      if (exists) {
        alert("User with this role already exists.");
        return;
      }

      // For Google sign-in, email is already verified by Google, but you can still send verification if you want:
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        alert(
          "Verification email sent! Please check your email inbox and verify your account before logging in."
        );
      }

      const userData =
        role === "IC" || role === "DC"
          ? {
              name: user.displayName || "",
              email: user.email,
              faculty: "",
              coordinator: "",
              role,
            }
          : {
              name: user.displayName || "",
              email: user.email,
              role,
            };

      await setDoc(doc(db, collectionName, user.email), userData);
      localStorage.setItem(
        "userData",
        JSON.stringify({ ...userData, uid: user.uid })
      );

      navigate("/login");
    } catch (error) {
      console.error("Google Sign-Up Error:", error.message);
      alert("Google Sign-Up Failed");
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 py-10">
      <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
        SGGSIE&T Permissions System
      </h2>

      {!role && (
        <div className="mb-6 w-full max-w-sm">
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800"
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
        <div className="w-full max-w-md bg-gray-200 p-8 rounded-2xl shadow-lg border border-gray-300">
          <h3 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            Register as {role}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {role === "IC" || role === "DC" ? (
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Faculty
                  </label>
                  <select
                    name="faculty"
                    value={clubDetails.faculty}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800"
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
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition duration-200"
            >
              Submit
            </button>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={!role}
              className={` w-full flex items-center justify-center bg-gray-900 text-white border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition duration-200 ${
                !role ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FcGoogle size={20} className="mx-2" />
              Register with Google
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-4 w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-blue-500 transition duration-200 flex items-center justify-center gap-2"
            >
              Already have an account? Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800"
      required
    />
  </div>
);

export default Register;
