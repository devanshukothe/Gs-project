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
import { db, auth, storage } from "../../firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const StudentDashboard = () => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [secratoryList, setSecratoryList] = useState([]);
  const [deanList, setDeanList] = useState([]);
  const [sequence, setSequence] = useState({
    faculty: "",
    secratory: "",
    GS: "genralsecretary@sggs.ac.in",
    dean: "",
  });

  const formRef = useRef();

  // Fetch user's requests
  useEffect(() => {
    if (!auth.currentUser) {
      console.error("User not authenticated!");
      return;
    }

    const q = query(
      collection(db, "requests"),
      where("studentId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, []);

  // Fetch dropdown lists (Faculty, Secretary, Dean)
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [facultySnap, secratorySnap, deanSnap] = await Promise.all([
          getDocs(collection(db, "Faculty")),
          getDocs(collection(db, "Secratory")),
          getDocs(collection(db, "Dean")),
        ]);

        setFacultyList(facultySnap.docs.map((doc) => doc.data()));
        setSecratoryList(secratorySnap.docs.map((doc) => doc.data()));
        setDeanList(deanSnap.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching lists:", error);
      }
    };

    fetchLists();
  }, []);

  // Handle file upload
  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return null;
    }
    else{
      console("Error")
    }
  };

  // Handle request submission
  const handleRequest = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("User not authenticated! Please log in.");
      return;
    }

    try {
      setLoading(true);

      const fileUrl = await handleFileUpload();

      await addDoc(collection(db, "Requests"), {
        author: auth.currentUser.email,
        reason,
        title,
        fileUrl: fileUrl || null,
        sequence: {
          faculty: sequence.faculty || "Not Applied",
          secratory: sequence.secratory || "Not Applied",
          GS: sequence.GS,
          dean: sequence.dean || "Not Applied",
        },
        status: "Pending",
        currentApprover:
          sequence.faculty || sequence.secratory || sequence.GS,
        createdAt: Timestamp.now(),
      });

      alert("Request submitted successfully!");
      resetForm();
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit the request.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setReason("");
    setTitle("");
    setFile(null);
    setSequence({
      faculty: "",
      secratory: "",
      GS: "genralsecretary@sggs.ac.in",
      dean: "",
    });
    formRef.current.reset();
  };

  return (
    <div>
      <h2>Student Dashboard</h2>

      {show ? (
        <form onSubmit={handleRequest} ref={formRef}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for permission"
            disabled={loading}
            rows="4"
            cols="50"
            required
          />
          <h4>Upload PDF</h4>
          <hr />
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
          <h3>Select Sequence (Priority Wise)</h3>
          <label>
            1
            <select
              value={sequence.faculty}
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
              onChange={(e) =>
                setSequence({ ...sequence, secratory: e.target.value })
              }
            >
              <option value="">Select Secretary</option>
              {secratoryList.map((secratory, index) =>
                secratory.role !== "General" ? (
                  <option key={index} value={secratory.role}>
                    {secratory.role}
                  </option>
                ) : null
              )}
            </select>
          </label>
          <label>
            3
            <select
              value={sequence.dean}
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
          <button type="submit" disabled={loading || !reason.trim()}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      ) : (
        <button onClick={() => setShow(true)}>New Request</button>
      )}

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
              {request.fileUrl && (
                <p>
                  <strong>PDF:</strong>{" "}
                  <a
                    href={request.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View PDF
                  </a>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentDashboard;
