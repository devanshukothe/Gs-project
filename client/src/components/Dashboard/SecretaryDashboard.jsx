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
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";

const SecretaryDashboard = () => {
  const [requests, setRequests] = useState({
    pending: { req: [], pdf: [] },
    forwarded: { req: [], pdf: [] },
    rejected: { req: [], pdf: [] },
  });
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [logData, setLogData] = useState(null);
  const [loadingIds, setLoadingIds] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const secDoc = await getDoc(doc(db, "Secratory", user.email));
          if (secDoc.exists()) {
            setLogData(secDoc.data());
          } else {
            console.log("Secretary data not found.");
          }
        } catch (err) {
          console.error("Error getting secretary data:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const showPdf = (pdfUrl) => {
    window.open(pdfUrl, "_blank", "noreferrer");
  };

  const fetchUploadedFiles = async (names) => {
    try {
      const validNames = names.filter(Boolean); // Filter out null/undefined/empty
      if (!validNames.length) return [];

      const result = await fetch(`https://gs-project-1.onrender.com/get-files`, {
        method: "POST",
        body: JSON.stringify({ names: validNames }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await result.json();
      if (response.status === "ok") {
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
      return [];
    } catch (err) {
      console.error("Error fetching files:", err);
      return [];
    }
  };

  useEffect(() => {
    if (!logData?.role) return;

    const fetchRequests = async () => {
      try {
        const pendingQuery = query(
          collection(db, "Requests"),
          where("currentApprover", "==", logData.role)
        );

        const unsubscribe = onSnapshot(pendingQuery, async (snapshot) => {
          const pendingReqs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const pdfs = await fetchUploadedFiles(pendingReqs.map((r) => r.file || ""));
          const pending = { req: pendingReqs, pdf: pdfs };

          const [forwardedSnapshot, rejectedSnapshot] = await Promise.all([
            getDocs(collection(db, "Secratory", logData.email, "approveRequests")),
            getDocs(collection(db, "Secratory", logData.email, "rejectRequests")),
          ]);

          const [forwardedRequests, rejectedRequests] = await Promise.all([
            Promise.all(
              forwardedSnapshot.docs.map(async (d) => {
                const data = await getDoc(doc(db, "Requests", d.data().requestId));
                return data.data();
              })
            ),
            Promise.all(
              rejectedSnapshot.docs.map(async (d) => {
                const data = await getDoc(doc(db, "Requests", d.data().requestId));
                return data.data();
              })
            ),
          ]);

          const [fPdfs, rPdfs] = await Promise.all([
            fetchUploadedFiles(forwardedRequests.map((r) => r?.file || "")),
            fetchUploadedFiles(rejectedRequests.map((r) => r?.file || "")),
          ]);

          setRequests({
            pending,
            forwarded: { req: forwardedRequests, pdf: fPdfs },
            rejected: { req: rejectedRequests, pdf: rPdfs },
          });
        });

        return unsubscribe;
      } catch (err) {
        console.error("Failed fetching requests:", err);
      }
    };

    fetchRequests();
  }, [logData]);

  const handleRequest = async (requestId, action) => {
    setLoadingIds((prev) => [...prev, requestId]);
    try {
      const requestRef = doc(db, "Requests", requestId);
      const request = requests.pending.req.find((r) => r.id === requestId);
      if (!request) throw new Error("Request not found");

      const next =
        logData.role === "General Secretary" ? request.dean : "General Secretary";
      const status =
        action === "approve"
          ? `Approved by ${logData.role}`
          : `Rejected by ${logData.role}`;
      const responseMessage =
        action === "approve"
          ? `Your request has been approved by ${logData.role} and forwarded to ${next}`
          : `Your request has been rejected by ${logData.role}`;

      await updateDoc(requestRef, {
        status,
        currentApprover: action === "approve" ? next : logData.role,
        responseMessage,
        feedback: feedback[requestId] || "",
        updatedAt: Timestamp.now(),
      });

      await addDoc(
        collection(db, "Secratory", logData.email, `${action}Requests`),
        { requestId, Date: Timestamp.now() }
      );

      setFeedback((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });

      alert(`Request ${action === "approve" ? "approved" : "rejected"}.`);
    } catch (err) {
      console.error("Error handling request:", err);
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== requestId));
    }
  };

  const RequestCard = ({ r, pdfFile, type }) => {
    if (!r) return null;

    return (
      <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition">
        <p className="font-bold mb-1">Subject: {r.title || "N/A"}</p>
        <p className="mb-1">Author: {r.Author || "N/A"}</p>
        <p className="mb-2">Status: {r.status || "N/A"}</p>

        {pdfFile ? (
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            onClick={() => showPdf(pdfFile.fileUrl)}
          >
            View PDF
          </button>
        ) : (
          <p className="text-sm text-gray-500">PDF unavailable</p>
        )}

        {type === "pending" && (
          <>
            <textarea
              className="w-full mt-3 p-2 border rounded"
              placeholder="Provide feedback..."
              value={feedback[r.id] || ""}
              onChange={(e) =>
                setFeedback((prev) => ({ ...prev, [r.id]: e.target.value }))
              }
            />
            <div className="flex gap-2 mt-3">
              <button
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                onClick={() => handleRequest(r.id, "approve")}
                disabled={loadingIds.includes(r.id)}
              >
                Approve
              </button>
              <button
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                onClick={() => handleRequest(r.id, "reject")}
                disabled={loadingIds.includes(r.id)}
              >
                Reject
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderRequests = (data, type) =>
    data.req.length === 0 ? (
      <p className="text-gray-600 italic">No {type} requests.</p>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.req.map((r, i) => {
          if (!r || !r.file) return null; // Avoid undefined errors
          const pdfFile = data.pdf.find((p) => p?.filename === r.file);
          return <RequestCard key={i} r={r} pdfFile={pdfFile} type={type} />;
        })}
      </div>
    );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-700">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-10 text-center">
          {logData?.role || "Secretary"} Dashboard
        </h2>

        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Pending Requests</h3>
          {renderRequests(requests.pending, "pending")}
        </section>

        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Forwarded Requests</h3>
          {renderRequests(requests.forwarded, "forwarded")}
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4">Rejected Requests</h3>
          {renderRequests(requests.rejected, "rejected")}
        </section>
      </div>
    </div>
  );
};

export default SecretaryDashboard;
