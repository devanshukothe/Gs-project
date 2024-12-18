import React, { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";

const StudentDashboard = () => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [show, setShow] = useState(false);
  const [sequence, setSequence] = useState({
    faculty: "",
    secratory: "",
    GS: "genralsecretary@sggs.ac.in",
    dean: "",
  });
  const [facultyList, setFacultyList] = useState([]);
  const [secratoryList, setSecratoryList] = useState([]);
  const [deanList, setDeanList] = useState([]);
  const formRef = useRef();
  // Fetch requests made by the logged-in student
  // useEffect(() => {
  //   const q = query(
  //     collection(db, "requests"),
  //     where("studentId", "==", auth.currentUser.uid)
  //   );
  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     const fetchedRequests = snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));
  //     setRequests(fetchedRequests);
  //   });
  //   return () => unsubscribe();
  // }, []);

  const handleRequest = async (e) => {
    e.preventDefault(); 
    try {
      setLoading(true);
      await addDoc(collection(db, "Requests"), {
        Author: auth.currentUser.email,
        reason,
        dean:sequence.dean !== ""? sequence.dean:"Not Applied",
        faculty:sequence.faculty !==""?sequence.faculty:"Not Applied",
        secretary:sequence.secratory !==""?sequence.secratory:"Not Applied",
        status: "Pending",
        currentApprover: sequence.faculty!==""? sequence.faculty:sequence.secratory!==""?sequence.secratory:sequence.GS,
        createdAt: Timestamp.now()
      });
      setReason("");
      setSequence({ faculty: "", secratory: "", GS: "genralsecretary@sggs.ac.in", dean: "" });
      alert("Request submitted successfully!");
      formRef.current.reset();
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit the request.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    async function getFaculty() {
      const fC = await getDocs(collection(db, "Faculty"));
      const facultyData = fC.docs.map((doc) => doc.data()); // Extracting the data
      setFacultyList(facultyData);
    }
    async function getSecratory() {
      const sec = await getDocs(collection(db, "Secratory"));
      const secratoryData = sec.docs.map((doc) => doc.data()); // Extracting the data
      setSecratoryList(secratoryData);
    }
    async function getDeans() {
      const dean = await getDocs(collection(db, "Dean"));
      const deanData = dean.docs.map((doc) => doc.data()); // Extracting the data
      setDeanList(deanData);
    }
    getFaculty();
    getSecratory();
    getDeans();
  }, []);
  return (
    <div>
      <h2>Student Dashboard</h2>

      {/* Form to submit a new request */}
      {show ? (
        <>
          <form onSubmit={handleRequest} ref={formRef}>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for permission"
              disabled={loading}
              rows="4"
              cols="50"
            />
            <br />
            <h3>Select Sequence (Priority Wise)</h3>
            <h5>Leave epmpty if not applicable</h5>
            <label>
              1
              <select
                value={sequence.faculty}
                name="faculty"
                onChange={(e) =>
                  setSequence({ ...sequence, faculty: e.target.value })
                }
              >
                <option value="">Select Faculty</option>
                {facultyList.map((faculty, index) => (
                  <option key={index} value={faculty.Name}>
                    {faculty.Name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              2
              <select
                value={sequence.secratory}
                name="secratory"
                onChange={(e) =>
                  setSequence({ ...sequence, secratory: e.target.value })
                }
              >
                <option value="">Select Secretary</option>
                {secratoryList.map((secratory, index) => {
                  if (secratory.role !== "Genral") {
                    return (
                      <option key={index} value={secratory.role}>
                        {secratory.role}
                      </option>
                    );
                  }
                })}
              </select>
            </label>
            <label>
              3
              <select
                value={sequence.dean}
                name="dean"
                onChange={(e) =>
                  setSequence({ ...sequence, dean: e.target.value })
                }
              >
                <option value="">Select Dean</option>
                {deanList.map((dean, index) => (
                  <option key={index} value={dean.role}>
                    {dean.role}
                  </option>
                ))}
              </select>
            </label>
            <br />
            <button
              type="submit"
              disabled={loading || !reason.trim()}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </>
      ) : (
        <button type="click" onClick={() => setShow((prev) => true)}>
          New Request
        </button>
      )}
      {/* List of submitted requests */}
      <h3>Your Requests</h3>
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.id} style={{ marginBottom: "10px" }}>
              <p>
                <strong>Reason:</strong> {request.reason}
              </p>
              <p>
                <strong>Status:</strong> {request.status}
              </p>
              <p>
                <strong>Response:</strong>{" "}
                {request.responseMessage || "No response yet."}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentDashboard;
