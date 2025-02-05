import React, { useEffect, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { setDoc, doc, getDocs, getDoc, collection } from "firebase/firestore";
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
      const email = role === "IC" || role === "DC" ? clubDetails.email : otherDetails.email;
      const password = role === "IC" || role === "DC" ? clubDetails.password : otherDetails.password;

      const exists = await checkRoleExist(role, email);
      if (exists) {
        console.error("Role already exists");
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
      console.log(facultyData,facultyList)
    }
    getFaculty();
  }, []);

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">SGGSIE&T Permissions System</h2>
      {!role && (
        <div className="text-center mb-4">
          <select
            className="form-select w-50 mx-auto"
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
        <div className="row justify-content-center mt-4">
          <div className="col-md-6">
            <div className="card shadow">
              <div className="card-body">
                <h5 className="card-title text-center mb-4">Sign Up</h5>
                <form onSubmit={handleSubmit}>
                  {role === "IC" || role === "DC" ? (
                    <>
                      <div className="mb-3">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={clubDetails.email}
                          onChange={handleChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label>Password</label>
                        <input
                          type="password"
                          name="password"
                          value={clubDetails.password}
                          onChange={handleChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label>Club Name</label>
                        <input
                          type="text"
                          name="name"
                          value={clubDetails.name}
                          onChange={handleChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label>Club Coordinator</label>
                        <input
                          type="text"
                          name="coordinator"
                          value={clubDetails.coordinator}
                          onChange={handleChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label>Faculty</label>
                        <select
                          name="faculty"
                          value={clubDetails.faculty}
                          onChange={handleChange}
                          className="form-select"
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
                      <div className="mb-3">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={otherDetails.email}
                          onChange={handleChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label>Password</label>
                        <input
                          type="password"
                          name="password"
                          value={otherDetails.password}
                          onChange={handleChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label>Name</label>
                        <input
                          type="text"
                          name="name"
                          value={otherDetails.name}
                          onChange={handleChange}
                          className="form-control"
                          required
                        />
                      </div>
                    </>
                  )}
                  <div className="text-center">
                    <button type="submit" className="btn btn-primary w-100">
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
