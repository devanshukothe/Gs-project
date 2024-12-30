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
import axios from "axios";

const StudentDashboard = () => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [allImage, setAllImage] = useState(null);
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

  const showPdf = (pdf) => {
    window.open(`http://localhost:5000/files/${pdf}`, "_blank", "noreferrer");
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (
      sequence.faculty !== "" ||
      sequence.secratory !== "" ||
      sequence.dean !== ""
    ) {
      const getPdf = async () => {
        const result = await axios.get("http://localhost:5000/get-files");
        setAllImage(result.data.data);
      };

      const formData = new FormData();
      formData.append("title", title);
      formData.append("file", file);
      const uploadResponse = await axios.post(
        "http://localhost:5000/upload-files",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("File uploaded:", uploadResponse.data);
      getPdf();
      try {
        setLoading(true);
        await addDoc(collection(db, "Requests"), {
          Author: auth.currentUser.email,
          file: file.name,
          dean: sequence.dean !== "" ? sequence.dean : "Not Applied",
          faculty: sequence.faculty !== "" ? sequence.faculty : "Not Applied",
          secretary:
            sequence.secratory !== "" ? sequence.secratory : "Not Applied",
          status: "Pending",
          currentApprover:
            sequence.faculty !== ""
              ? sequence.faculty
              : sequence.secratory !== ""
              ? sequence.secratory
              : sequence.GS,
          createdAt: Timestamp.now(),
        });
        setReason("");
        setSequence({
          faculty: "",
          secratory: "",
          GS: "genralsecretary@sggs.ac.in",
          dean: "",
        });
        setTitle("");
        alert("Request submitted successfully!");
        formRef.current.reset();
      } catch (error) {
        console.error("Error submitting request:", error);
        alert("Failed to submit the request.");
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please select at least one in sequence!");
    }
  };

  useEffect(() => {
    async function getFaculty() {
      const fC = await getDocs(collection(db, "Faculty"));
      const facultyData = fC.docs.map((doc) => doc.data());
      setFacultyList(facultyData);
    }
    async function getSecratory() {
      const sec = await getDocs(collection(db, "Secratory"));
      const secratoryData = sec.docs.map((doc) => doc.data());
      setSecratoryList(secratoryData);
    }
    async function getDeans() {
      const dean = await getDocs(collection(db, "Dean"));
      const deanData = dean.docs.map((doc) => doc.data());
      setDeanList(deanData);
    }
    getFaculty();
    getSecratory();
    getDeans();
  }, []);

  useEffect(() => {
    const fetchUploadedPdfs = async () => {
      try {
        const result = await axios.get("http://localhost:5000/get-files");
        if (result.data?.data) {
          setAllImage(result.data.data);
        }
      } catch (error) {
        console.error("Error fetching uploaded PDFs:", error);
      }
    };

    fetchUploadedPdfs();
  }, []);

  return (
    <div className="container my-4">
      <h2 className="text-center">Student Dashboard</h2>
      {show ? (
        <div className="card p-4">
          <form onSubmit={handleRequest} ref={formRef}>
            <h4>Upload PDF</h4>
            <hr />
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="file"
                className="form-control"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
            </div>
            <h3>Select Sequence (Priority Wise)</h3>
            <small className="text-muted">Leave empty if not applicable</small>
            <div className="mb-3">
              <label>1</label>
              <select
                className="form-select"
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
            </div>
            <div className="mb-3">
              <label>2</label>
              <select
                className="form-select"
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
            </div>
            <div className="mb-3">
              <label>3</label>
              <select
                className="form-select"
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
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      ) : (
        <div className="text-center">
          <button
            type="button"
            className="btn btn-success"
            onClick={() => setShow((prev) => true)}
          >
            New Request
          </button>
        </div>
      )}
      <div className="output-div mt-4">
        <h4>Uploaded PDFs</h4>
        <div className="row">
          {allImage == null
            ? "No files uploaded."
            : allImage.map((data, i) => (
                <div className="col-md-4 mb-3" key={i}>
                  <div className="card">
                    <div className="card-body">
                      <h6 className="card-title">Title: {data.title}</h6>
                      <button
                        className="btn btn-primary"
                        onClick={() => showPdf(data.pdf)}
                      >
                        Show Pdf
                      </button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
