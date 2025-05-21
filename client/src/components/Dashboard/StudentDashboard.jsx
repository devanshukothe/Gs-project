import React, { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  Timestamp,
  where,
  getDocs,
  query,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import axios from "axios";
import FileViewer from "../FileViewer"; // Import the FileViewer component
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const StudentDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [metaData, setMetadata] = useState([]);
  const [sequence, setSequence] = useState({
    faculty: "",
    secratory: "",
    GS: "generalsecretary@sggs.ac.in",
    dean: "",
  });
  const [facultyList, setFacultyList] = useState([]);
  const [secratoryList, setSecratoryList] = useState([]);
  const [deanList, setDeanList] = useState([]);
  const formRef = useRef();

  // Manage visibility of FileViewer for each PDF
  const [showFileViewer, setShowFileViewer] = useState({});

  const handleRequest = async (e) => {
    e.preventDefault();
    if (
      sequence.faculty !== "" ||
      sequence.secratory !== "" ||
      sequence.dean !== ""
    ) {
      try {
        setLoading(true);

        // Upload file
        const formData = new FormData();
        formData.append("title", title);
        formData.append("file", file);

        const uploadResponse = await axios.post(
          "http://localhost:5000/upload-files",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        console.log("File uploaded:", uploadResponse.data);

        // Add request details to Firestore
        await addDoc(collection(db, "Requests"), {
          title: title,
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

        setSequence({
          faculty: "",
          secratory: "",
          GS: "generalsecretary@sggs.ac.in",
          dean: "",
        });
        setTitle("");
        alert("Request submitted successfully!");
        formRef.current.reset();

        // Refresh the uploaded files list
        fetchUploadedFiles();
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

  const fetchUploadedFiles = async () => {
    try {
      const result = await axios.post("http://localhost:5000/get-files");
      if (result.data?.files) {
        const files = result.data.files.map((file) => ({
          ...file,
          fileUrl: URL.createObjectURL(
            new Blob(
              [Uint8Array.from(atob(file.fileContent), (c) => c.charCodeAt(0))],
              {
                type: file.contentType,
              }
            )
          ),
        }));
        // setUploadedFiles(files);
        const fileNames = files.map((file) => file.filename);
        const metaData = await getRequestInfo(fileNames);
        setMetadata((prev) => metaData);
        setUploadedFiles((prev) => files);
        // console.log(metaData, files);
      }
    } catch (error) {
      console.error("Error fetching uploaded PDFs:", error);
    }
  };
  const getRequestInfo = async (filenames) => {
    try {
      let metaData = [];

      for (let index = 0; index < filenames.length; index++) {
        const filename = filenames[index];
        const q = query(
          collection(db, "Requests"),
          where("file", "==", filename)
        );
        const dataSnapshot = await getDocs(q);

        if (!dataSnapshot.empty) {
          const docsData = dataSnapshot.docs.map((doc) => doc.data());
          metaData = metaData.concat(docsData);
        } else {
          console.log(`No matching documents found for: ${filename}`);
        }
      }

      return metaData;
    } catch (error) {
      console.error(error);
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
    fetchUploadedFiles();
  }, []);

  const toggleFileViewer = (pdfId) => {
    setShowFileViewer((prev) => ({
      ...prev,
      [pdfId]: !prev[pdfId],
    }));
  };
  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login"); // Redirect if not logged in
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out from Firebase
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout Failed:", error.message);
    }
  };

  return (
    <div className="w-full px-4 py-5 pt-6">
  <h2 className="text-3xl font-bold text-center mb-6 text-shadow-amber-50">Club Dashboard</h2>

  {show ? (
  <div className="bg-black text-white shadow-2xl rounded-xl p-8 max-w-3xl mx-auto border border-gray-700">
    <form onSubmit={handleRequest} ref={formRef} className="space-y-6">
      <h4 className="text-2xl font-bold">Upload PDF</h4>
      <hr className="border-t border-gray-600" />

      {/* Title */}
      <input
        type="text"
        className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      {/* File Upload */}
      <input
        type="file"
        className="w-full bg-black text-white border border-gray-600 rounded-lg px-4 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-black hover:file:bg-gray-300 transition"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
        required
      />

      {/* Sequence Info */}
      <div>
        <h3 className="font-semibold text-lg">Select Sequence (Priority Wise)</h3>
        <p className="text-sm text-gray-400">Leave empty if not applicable</p>
      </div>

      {/* Faculty */}
      <div>
        <label className="block mb-1 font-medium text-gray-300">1. Faculty</label>
        <select
          className="w-full bg-black border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
          value={sequence.faculty}
          name="faculty"
          onChange={(e) =>
            setSequence({ ...sequence, faculty: e.target.value })
          }
        >
          <option value="">Select Faculty</option>
          {facultyList.map((faculty, index) => (
            <option key={index} value={faculty.name}>
              {faculty.name}
            </option>
          ))}
        </select>
      </div>

      {/* Secretary */}
      <div>
        <label className="block mb-1 font-medium text-gray-300">2. Secretary</label>
        <select
          className="w-full bg-black border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
          value={sequence.secratory}
          name="secratory"
          onChange={(e) =>
            setSequence({ ...sequence, secratory: e.target.value })
          }
        >
          <option value="">Select Secretary</option>
          {secratoryList.map((secratory, index) =>
            secratory.role !== "Genral" ? (
              <option key={index} value={secratory.role}>
                {secratory.role}
              </option>
            ) : null
          )}
        </select>
      </div>

      {/* Dean */}
      <div>
        <label className="block mb-1 font-medium text-gray-300">3. Dean</label>
        <select
          className="w-full bg-black border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
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

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-white text-black font-semibold py-2 rounded-lg hover:bg-gray-300 transition duration-200"
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
      className="bg-white text-black font-semibold px-6 py-2 rounded-lg hover:bg-gray-300 transition duration-200"
      onClick={() => setShow(true)}
    >
      New Request
    </button>
  </div>
)}


  {/* Uploaded PDFs */}
  <div className="mt-10">
  <h4 className="text-2xl font-bold mb-6 text-white">Uploaded PDFs</h4>

  <div className="flex flex-col space-y-6">
    {uploadedFiles?.length === 0 ? (
      <p className="text-dark-300">No files uploaded.</p>
    ) : (
      uploadedFiles.map((data, i) => {
        const req = metaData.find((doc) => doc.file === data.filename);
        return (
          <div
            key={i}
            className="bg-black border border-gray-700 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-2xl"
          >
            <h6 className="text-white font-mono text-lg mb-2">
              Title: <span className="text-gray-300">{data.title}</span>
            </h6>

            <h6 className="text-gray-400 mb-1">
              Author: <span className="text-gray-200">{req?.Author || "Error"}</span>
            </h6>

            <h6 className="text-gray-400 mb-1">
              Status:{" "}
              <span className="text-white">
                {req ? (req.responseMessage || req.status) : "Error"}
              </span>
            </h6>

            <h6 className="text-gray-400 mb-1">
              Updated At:{" "}
              <span className="text-gray-200">
                {req?.updatedAt
                  ? new Date(req.updatedAt.seconds * 1000).toLocaleString()
                  : "Null"}
              </span>
            </h6>

            <h6 className="text-gray-400 mb-1">
              Created At:{" "}
              <span className="text-gray-200">
                {req?.createdAt
                  ? new Date(req.createdAt.seconds * 1000).toLocaleString()
                  : "Null"}
              </span>
            </h6>

            {req?.feedback && (
              <>
                <h6 className="text-gray-400 mb-1">
                  Feedback: <span className="text-gray-200">{req.feedback}</span>
                </h6>
                <h6 className="text-gray-400 mb-2">
                  Given by: <span className="text-gray-200">{req.currentApprover}</span>
                </h6>
              </>
            )}

            <button
              className="w-full mt-3 bg-white text-black font-semibold py-2 rounded-md hover:bg-gray-300 transition duration-200"
              onClick={() => toggleFileViewer(data.id)}
            >
              {showFileViewer[data.id] ? "Hide PDF" : "Show PDF"}
            </button>

            {showFileViewer[data.id] && (
              <div className="mt-4">
                <FileViewer file={data} />
              </div>
            )}
          </div>
        );
      })
    )}
  </div>
</div>

</div>

  );
};

export default StudentDashboard;
