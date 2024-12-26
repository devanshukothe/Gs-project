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
          navigate("/login");
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
        navigate("/login");
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
        navigate("/login");
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

        navigate("/login");
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
    <h2 className="mt-2 text-center">Register</h2>
      {role === "" ? (
        <select className="dropdown btn btn-secondary  dropdown-toggle m-3 text-center" value={role} onChange={(e) => setRole(e.target.value)}>
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
        <section class="vh-100" style={{backgroundColor: "#eee"}} >
           
          <div class="container h-50">
    <div class="row d-flex justify-content-center align-items-center h-100">
      <div class="col-lg-12 col-xl-11">
        <div class="card text-black"  style={{borderRadius: "25px"}}>
          <div class="card-body p-md-5">
            <div class="row justify-content-center">
            <div class="card rounded-3 w-50 h-100">
          <img src="https://img.freepik.com/free-vector/sign-up-concept-illustration_114360-7965.jpg?semt=ais_hybrid"
            class="w-100" style={{borderTopLeftRadius: ".3rem", borderTopRightRadius: ".3rem"}}
            alt="Sample photo"/>
            </div>
              <div class="col-md-10 col-lg-6 col-xl-5 order-2 order-lg-1">
              <p class="text-center h1 fw-bold mb-5 mx-1 mx-md-4 mt-4">Sign up</p>

          <form onSubmit={handleSubmit} id="reg-form" class="mx-1 mx-md-4"> 
              <div class="d-flex flex-row align-items-center mb-4">
                    <i class="fas fa-user fa-lg me-3 fa-fw"></i>
                    <div data-mdb-input-init class="form-outline flex-fill mb-0">
                   
          
            <input
              type="email"
              value={clubDetails.email}
              onChange={handleChange}
              placeholder="Email"
              name="email"
              required
              class="form-control"
            />
             </div>
             </div>
           
             <div class="d-flex flex-row align-items-center mb-4">
                    <i class="fas fa-lock fa-lg me-3 fa-fw"></i>
                    <div data-mdb-input-init class="form-outline flex-fill mb-0">
            <input
              type="password"
              value={clubDetails.password}
              onChange={handleChange}
              placeholder="Password"
              placeholder="password"
              name="password"
              required
              class="form-control"
            />
            </div>
            </div>
            <div class="d-flex flex-row align-items-center mb-4">
                    <i class="fas fa-user fa-lg me-3 fa-fw"></i>
                    <div data-mdb-input-init class="form-outline flex-fill mb-0">
            <input
              type="text"
              value={clubDetails.name}
              onChange={handleChange}
              placeholder="Club Name"
              name="name"
              required
              class="form-control"
            />
            </div>
            </div>
            <div class="d-flex flex-row align-items-center mb-4">
                    <i class="fas fa-user fa-lg me-3 fa-fw"></i>
                    <div data-mdb-input-init class="form-outline flex-fill mb-0">
            <input
              type="text"
              value={clubDetails.coordinator}
              onChange={handleChange}
              placeholder="Club Coordinator"
              name="coordinator"
              required
               class="form-control"
            />
            </div>
            </div>
            <select
              value={clubDetails.faculty}
              onChange={handleChange}
              name="faculty" className="dropdown btn btn-secondary  dropdown-toggle m-3 text-center"
            >
              <option value="">Select</option>
              {facultyList.map((faculty, index) => (
                <option key={index} value={faculty.Name}>
                  {faculty.Name}
                </option>
              ))}
            </select>
            <div class="d-flex justify-content-center mx-4 mb-3 mb-lg-4">
            <button type="submit" data-mdb-button-init data-mdb-ripple-init class="btn btn-primary btn-lg">Submit</button>
            </div>
          </form>
          </div>
         </div>
         </div>
          </div>
   </div>
        </div>
        </div>
          </section>
        ) : (
          // Other roles can be handled here, if needed.
          <form onSubmit={handleSubmit}>
             <div class="d-flex flex-row align-items-center mb-4">
                    <i class="fas fa-user fa-lg me-3 fa-fw"></i>
                    <div data-mdb-input-init class="form-outline flex-fill mb-0">
                   
            <input
              type="email"
              value={otherDetails.email}
              onChange={handleChange}
              placeholder="abc@sggs.ac.in"
              name="email"
              required
            />
            </div>
            </div>
            <div class="d-flex flex-row align-items-center mb-4">
                    <i class="fas fa-user fa-lg me-3 fa-fw"></i>
                    <div data-mdb-input-init class="form-outline flex-fill mb-0">
            <input
              type="password"
              value={otherDetails.password}
              onChange={handleChange}
              placeholder="Password"
              name="password"
              required
            />
            </div>
            </div>

            <div class="d-flex flex-row align-items-center mb-4">
                    <i class="fas fa-user fa-lg me-3 fa-fw"></i>
                    <div data-mdb-input-init class="form-outline flex-fill mb-0">
            <input
              type="text"
              value={otherDetails.name}
              onChange={handleChange}
              placeholder="Name"
              name="name"
              required
            />
            </div>
            </div>
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
