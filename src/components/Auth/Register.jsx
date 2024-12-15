import React, { useEffect, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { setDoc, doc, getDocs,getDoc, collection } from "firebase/firestore";
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
  const [faculty, setFaculty] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const navigate = useNavigate();
  const checkRoleExist = async(role,email="")=>{
    if (role === "IC" || role === "DC"){
      try {
        const docRef = doc(db,"Club",email);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          return true; // Role already exists
        } else {
          return false; // Role does not exist
        }
      } catch (error) {
        console.error(error)
      }
    }else if (role==="Faculty"){
      const docRef = doc(db,role,email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return true; // Role already exists
      } else {
        return false; // Role does not exist
      }
    }
    else if(role==="Dean"){
      const docRef = doc(db,role,email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return true; // Role already exists
      } else {
        return false; // Role does not exist
      }
    }
    else {
      const docRef = doc(db,"Secratory",email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return true; // Role already exists
      } else {
        return false; // Role does not exist
      }
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === "IC" || role === "DC") {
      try {
        const result = await checkRoleExist(role,clubDetails.email);
        if(!result){
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            clubDetails.email,
            clubDetails.password
          );
          const user = userCredential.user;
  
          // Save user role in Firestore
          await setDoc(doc(db, "Club", user.email), {
            name: clubDetails.name,
            email: clubDetails.email,
            password: clubDetails.password,
            faculty: clubDetails.faculty,
            coordinator: clubDetails.coordinator,
            role,
          });
  
          navigate("/club/login");
        }
      } catch (error) {
        console.error("Error registering:", error);
      }
    } else if (role === "Faculty") {
      try {
        const result = await checkRoleExist(role,otherDetails.email);
        if(!result){
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            otherDetails.email,
            otherDetails.password
          );
          const user = userCredential.user;
  
          // Save user role in Firestore
          await setDoc(doc(db, "Faculty", user.email), {
            name: otherDetails.name,
            email: otherDetails.email,
            password: otherDetails.password,
            role,
          });
        }

        // navigate("/");
      } catch (error) {
        console.error("Error registering:", error);
      }
    } else if (role === "Dean") {
      try {
        const result =await checkRoleExist(role,otherDetails.email);
        if(!result){
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            otherDetails.email,
            otherDetails.password
          );
          const user = userCredential.user;
  
          // Save user role in Firestore
          await setDoc(doc(db, "Dean", user.email), {
            name: otherDetails.name,
            email: otherDetails.email,
            password: otherDetails.password,
            role,
          });
  
        }
        // navigate("/");
      } catch (error) {
        console.error("Error registering:", error);
      }
    } else {
      try {
        const result = await checkRoleExist(role,otherDetails.email);
        if(!result){
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            otherDetails.email,
            otherDetails.password
          );
          const user = userCredential.user;
  
          // Save user role in Firestore
          await setDoc(doc(db, "Secratory", user.email), {
            name: otherDetails.name,
            email: otherDetails.email,
            password: otherDetails.password,
            role,
          });
        }

        // navigate("/");
      } catch (error) {
        console.error("Error registering:", error);
      }
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
      const facultyData = fC.docs.map((doc) => doc.data()); // Extracting the data
      setFacultyList(facultyData); // Update state with the list of faculty
      
    }
    getFaculty();
  }, []);

  return (
    <>
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
        ""
      )}

      {role !== "" ? (
        role === "IC" || role === "DC" ? (
          <form onSubmit={handleSubmit} id="reg-form">
            <input
              type="email"
              value={clubDetails.email}
              onChange={handleChange}
              placeholder="Email"
              name="email"
              required
            />
            <input
              type="password"
              value={clubDetails.password}
              onChange={handleChange}
              placeholder="abc@sggs.ac.in"
              name="password"
              required
            />
            <input
              type="text"
              value={clubDetails.name}
              onChange={handleChange}
              placeholder="Club Name"
              name="name"
              required
            />
            <input
              type="text"
              value={clubDetails.coordinator}
              onChange={handleChange}
              placeholder="Coordinator"
              name="coordinator"
              required
            />
            <select
              value={clubDetails.faculty}
              onChange={handleChange}
              name="faculty"
            >
              <option value="">Select</option>
              {facultyList.map((faculty, index) => (
                <option key={index} value={faculty.Name}>
                  {faculty.Name}
                </option>
              ))}
            </select>
            <button type="submit">Submit</button>
          </form>
        ) : (
          // Other roles can be handled here, if needed.
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={otherDetails.email}
              onChange={handleChange}
              placeholder="abc@sggs.ac.in"
              name="email"
              required
            />
            <input
              type="password"
              value={otherDetails.password}
              onChange={handleChange}
              placeholder="Password"
              name="password"
              required
            />
            <input
              type="text"
              value={otherDetails.name}
              onChange={handleChange}
              placeholder="Name"
              name="name"
              required
            />
            <button type="submit">Submit</button>
          </form>
        )
      ) : (
        ""
      )}
    </>
  );
};

export default Register;
