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

const DeanDashboard = () => {
  const [requests, setRequests] = useState({
    pending: { req: [], pdf: [] },
    approved: { req: [], pdf: [] },
    rejected: { req: [], pdf: [] },
  });

  const [feedback, setFeedback] = useState({});
  const [logData, setLogData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const deanDoc = await getDoc(doc(db, "Dean", user.email));
          if (deanDoc.exists()) {
            setLogData({ ...deanDoc.data(), email: user.email });
          } else {
            console.log("No dean data found!");
          }
        } catch (error) {
          console.error("Error fetching dean data:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUploadedFiles = async (names) => {
    try {
      const result = await fetch("https://gs-project-1.onrender.com/get-files", {
        method: "POST",
        body: JSON.stringify({ names }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await result.json();

      if (response.status === "ok" && response.files) {
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
    return [];
  };

  const fetchRequests = async () => {
    if (!logData?.role || !logData?.email) return;

    try {
      const pendingQuery = query(
        collection(db, "Requests"),
        where("currentApprover", "==", logData.role)
      );

      const unsubscribePending = onSnapshot(pendingQuery, async (snapshot) => {
        const fetchedPending = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const names = fetchedPending.map((req) => req.file).filter(Boolean);
        const pdfs = await fetchUploadedFiles(names);

        setRequests((prev) => ({
          ...prev,
          pending: { req: fetchedPending, pdf: pdfs },
        }));
      });

      const approvedSnapshot = await getDocs(
        collection(db, "Dean", logData.email, "approveRequests")
      );

      const approvedRequests = await Promise.all(
        approvedSnapshot.docs.map(async (approvedDoc) => {
          const reqDoc = await getDoc(
            doc(db, "Requests", approvedDoc.data().requestId)
          );
          return reqDoc.exists() ? { id: reqDoc.id, ...reqDoc.data() } : null;
        })
      );

      const approvedValid = approvedRequests.filter(Boolean);
      const approvedNames = approvedValid.map((req) => req.file).filter(Boolean);
      const approvedPdfs = await fetchUploadedFiles(approvedNames);

      setRequests((prev) => ({
        ...prev,
        approved: { req: approvedValid, pdf: approvedPdfs },
      }));

      const rejectedSnapshot = await getDocs(
        collection(db, "Dean", logData.email, "rejectRequests")
      );

      const rejectedRequests = await Promise.all(
        rejectedSnapshot.docs.map(async (rejectedDoc) => {
          const reqDoc = await getDoc(
            doc(db, "Requests", rejectedDoc.data().requestId)
          );
          return reqDoc.exists() ? { id: reqDoc.id, ...reqDoc.data() } : null;
        })
      );

      const rejectedValid = rejectedRequests.filter(Boolean);
      const rejectedNames = rejectedValid.map((req) => req.file).filter(Boolean);
      const rejectedPdfs = await fetchUploadedFiles(rejectedNames);

      setRequests((prev) => ({
        ...prev,
        rejected: { req: rejectedValid, pdf: rejectedPdfs },
      }));

      return () => unsubscribePending();
    } catch (error) {
      console.error("Error fetching dean requests:", error);
    }
  };

  useEffect(() => {
    if (logData) fetchRequests();
  }, [logData]);

  const handleRequest = async (requestId, action) => {
    try {
      const requestRef = doc(db, "Requests", requestId);
      const status =
        action === "approve" ? "Approved by Dean" : "Rejected by Dean";
      const responseMessage =
        action === "approve"
          ? "Your request has been approved by the Dean."
          : "Your request has been rejected by the Dean.";

      await updateDoc(requestRef, {
        status,
        currentApprover: null,
        responseMessage,
        feedback: feedback[requestId] || "",
        updatedAt: Timestamp.now(),
      });

      await addDoc(collection(db, "Dean", logData.email, `${action}Requests`), {
        requestId,
        timestamp: Timestamp.now(),
      });

      alert(`Request ${action === "approve" ? "approved" : "rejected"}.`);
      setFeedback((prev) => ({ ...prev, [requestId]: "" }));
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
    }
  };

  const renderRequests = (requests, type) => {
    if (requests.req.length === 0) {
      return <p className="text-gray-500">No {type} requests available.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.req.map((r, i) => {
          const pdfFile = requests.pdf.find((p) => p.filename === r.file);
          return (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md p-5 border border-black/10 hover:shadow-xl transition"
            >
              <h3 className="text-lg font-semibold mb-2">{r.title || "No Title"}</h3>
              <p className="text-sm text-gray-700 mb-1">
                <span className="font-medium">Author:</span> {r.Author || "Unknown"}
              </p>
              <p className="text-sm text-gray-700 mb-3">
                <span className="font-medium">Status:</span> {r.status || "Unknown"}
              </p>

              {pdfFile ? (
                <button
                  className="text-sm bg-black text-white px-3 py-1 rounded hover:bg-gray-800 mb-3"
                  onClick={() => window.open(pdfFile.fileUrl, "_blank")}
                >
                  View PDF
                </button>
              ) : (
                <p className="text-xs text-red-500">No file available</p>
              )}

              {type === "pending" && (
                <>
                  <textarea
                    className="w-full mt-2 p-2 border border-black/20 rounded resize-none text-sm"
                    rows="3"
                    placeholder="Enter feedback here..."
                    value={feedback[r.id] || ""}
                    onChange={(e) =>
                      setFeedback({ ...feedback, [r.id]: e.target.value })
                    }
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                      onClick={() => handleRequest(r.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
                      onClick={() => handleRequest(r.id, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {logData ? `Dean ${logData.role}` : "Dean"} Dashboard
      </h1>

      <div className="space-y-10">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-center">🕒 Pending Requests</h2>
          {renderRequests(requests.pending, "pending")}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-center">✅ Approved Requests</h2>
          {renderRequests(requests.approved, "approved")}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-center">❌ Rejected Requests</h2>
          {renderRequests(requests.rejected, "rejected")}
        </section>
      </div>
    </div>
  );
};

export default DeanDashboard;
