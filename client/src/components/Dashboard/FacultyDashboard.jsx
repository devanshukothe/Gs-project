import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  addDoc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import RejectedRequests from "./rejectedRequest";
import ApprovedRequests from "./ApprovedRequests";

const FacultyDashboard = () => {
  const [requests, setRequests] = useState({
    pending: { req: [], pdf: [] },
    forwarded: { req: [], pdf: [] },
    rejected: { req: [], pdf: [] },
  });
  const [logData, setLogData] = useState(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const getFacultyData = async () => {
          try {
            const facultyDoc = await getDoc(doc(db, "Faculty", user.email));
            if (facultyDoc.exists()) {
              setLogData(facultyDoc.data());
            } else {
              console.error("No faculty data found for this email.");
            }
          } catch (error) {
            console.error("Error fetching faculty data:", error);
          }
        };
        getFacultyData();
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUploadedFiles = async (names) => {
    try {
      const result = await fetch(`http://localhost:5000/get-files`, {
        method: "POST",
        body: JSON.stringify({ names }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await result.json();
      if (response.status === "ok" && response?.files) {
        return response.files.map((file) => ({
          ...file,
          fileUrl: URL.createObjectURL(
            new Blob(
              [Uint8Array.from(atob(file.fileContent), (c) => c.charCodeAt(0))],
              { type: file.contentType }
            )
          ),
        }));
      }
    } catch (error) {
      console.error("Error fetching uploaded PDFs:", error);
    }
  };

  useEffect(() => {
    if (logData?.name) {
      const fetchRequests = async () => {
        try {
          const pendingQuery = query(
            collection(db, "Requests"),
            where("currentApprover", "==", logData.name)
          );
          const unsubscribePending = onSnapshot(pendingQuery, async (snapshot) => {
            const fetchedPending = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            const names = fetchedPending.map((req) => req.file);
            const pdfs = await fetchUploadedFiles(names);
            setRequests((prev) => ({
              ...prev,
              pending: { req: fetchedPending, pdf: pdfs },
            }));
          });

          const forwardedSnapshot = await getDocs(
            collection(db, "Faculty", logData.email, "approveRequests")
          );
          const forwardedRequests = await Promise.all(
            forwardedSnapshot.docs.map(async (forwardDoc) => {
              const request = await getDoc(
                doc(db, "Requests", forwardDoc.data().requestId)
              );
              return { id: forwardDoc.id, ...request.data() };
            })
          );
          const fnames = forwardedRequests.map((req) => req.file);
          const fpdfs = await fetchUploadedFiles(fnames);
          setRequests((prev) => ({
            ...prev,
            forwarded: { req: forwardedRequests, pdf: fpdfs },
          }));

          const rejectedSnapshot = await getDocs(
            collection(db, "Faculty", logData.email, "rejectRequests")
          );
          const rejectedRequests = await Promise.all(
            rejectedSnapshot.docs.map(async (rejectDoc) => {
              const request = await getDoc(
                doc(db, "Requests", rejectDoc.data().requestId)
              );
              return { id: rejectDoc.id, ...request.data() };
            })
          );
          const rnames = rejectedRequests.map((req) => req.file);
          const rpdfs = await fetchUploadedFiles(rnames);
          setRequests((prev) => ({
            ...prev,
            rejected: { req: rejectedRequests, pdf: rpdfs },
          }));
        } catch (error) {
          console.error("Error fetching requests:", error);
        }
      };
      fetchRequests();
    }
  }, [logData]);

  const showPdf = (pdfUrl) => {
    window.open(`${pdfUrl}`, "_blank", "noreferrer");
  };

  const handleRequest = async (requestId, action) => {
    try {
      const requestRef = doc(db, "Requests", requestId);
      const nextApprover = requests.pending.req.find((req) => req.id === requestId)?.secretary;
      const status = action === "approve" ? "Approved by Faculty" : "Rejected by Faculty";
      const responseMessage =
        action === "approve"
          ? `Approved and forwarded to ${
              nextApprover === "Not Applied" ? "General Secretary" : nextApprover
            }.`
          : `Rejected by ${logData.role}`;

      await updateDoc(requestRef, {
        status,
        currentApprover:
          action === "approve"
            ? nextApprover === "Not Applied"
              ? "General Secretary"
              : nextApprover
            : logData.role,
        responseMessage,
        feedback: feedback,
        updatedAt: Timestamp.now(),
      });

      await addDoc(collection(db, "Faculty", logData.email, `${action}Requests`), {
        requestId,
        Date: Timestamp.now(),
      });

      alert(`Request ${action === "approve" ? "approved" : "rejected"}.`);
      setFeedback("");
    } catch (error) {
      console.error(`Error ${action} request:`, error);
    }
  };

  const renderRequests = (requests, type) => {
    if (!requests.req.length) return <p className="text-gray-500">No requests {type}.</p>;

    return (
      <ul className="space-y-4">
        {requests.req.map((r, i) => {
          const pdfFile = requests?.pdf?.find((p) => p.filename === r.file);
          return (
            <li
              key={i}
              className="border border-black rounded-xl p-4 shadow-sm bg-white text-black"
            >
              <p>
                <span className="font-semibold">Request Subject:</span> {r.title || "Error"}
              </p>
              <p>
                <span className="font-semibold">Request Author:</span> {r.Author || "Error"}
              </p>
              <p>
                <span className="font-semibold">File:</span>{" "}
                {pdfFile ? (
                  <button
                    className="text-white bg-black px-3 py-1 rounded hover:opacity-90"
                    onClick={() => showPdf(pdfFile.fileUrl)}
                  >
                    View PDF
                  </button>
                ) : (
                  "No file available"
                )}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {r.status || "Error"}
              </p>

              {type === "pending" && (
                <div className="mt-2">
                  <textarea
                    className="w-full p-2 border border-black rounded my-2"
                    placeholder="Enter feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(r.id, "approve")}
                      className="bg-green-700 text-white px-4 py-1 rounded hover:bg-green-800"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequest(r.id, "reject")}
                      className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="bg-white min-h-screen px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-black mb-8">Faculty Dashboard</h2>

        <section className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Pending Requests</h3>
          {renderRequests(requests.pending, "pending")}
        </section>

        <section className="mb-10">
          <ApprovedRequests />
        </section>

        <section>
          <h3 className="text-2xl font-semibold mb-4">Requests Rejected</h3>
          {renderRequests(requests.rejected, "rejected")}
        </section>
      </div>
    </div>
  );
};

export default FacultyDashboard;
