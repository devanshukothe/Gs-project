import React, { useEffect, useState } from "react";
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
    GS: "genral@sggs.ac.in",
    dean: "",
  });
  const [facultyList, setFacultyList] = useState([]);
  const [secratoryList, setSecratoryList] = useState([]);
  const [deanList, setDeanList] = useState([]);
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

  const handleRequest = async () => {
    try {
      setLoading(true);
      await addDoc(collection(db, "requests"), {
        studentId: auth.currentUser.uid,
        reason,
        status: "Pending",
        currentApprover: "faculty",
        createdAt: Timestamp.now(),
      });
      setReason("");
      alert("Request submitted successfully!");
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
          {" "}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for permission"
            disabled={loading}
            rows="4"
            cols="50"
          />
          <br />
          <button onClick={handleRequest} disabled={loading || !reason.trim()}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
          <br />
          <h3>Select Sequence (Priority Wise)</h3>
          <label>
            1
            <select value={sequence.faculty} name="faculty"  onChange={(e) => setSequence({ ...sequence, faculty: e.target.value })}>
              <option value="">Select</option>
              {facultyList.map((faculty, index) => (
                <option key={index} value={faculty.Name}>
                  {faculty.Name}
                </option>
              ))}
            </select>
          </label>
          <label>
            2
            <select value={sequence.secratory} name="secratory"  onChange={(e) => setSequence({ ...sequence, secratory: e.target.value })}>
              <option value="">Select</option>
              {secratoryList.map((secratory, index) => (
                <option key={index} value={secratory.Name}>
                  {secratory.Name}
                </option>
              ))}
            </select>
          </label>
          <label>
            1
            <select value={sequence.dean} name="dean"  onChange={(e) => setSequence({ ...sequence, dean: e.target.value })}>
              <option value="">Select</option>
              {deanList.map((dean, index) => (
                <option key={index} value={dean.Name}>
                  {dean.Name}
                </option>
              ))}
            </select>
          </label>
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
