import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Logout from "../components/Auth/Logout";
import { Mail, User, ShieldCheck, GraduationCap } from "lucide-react"; // Lucide icons
const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const email = user.email;
          const collections = ["Club", "Faculty", "Dean", "Secratory"];
          let found = null;

          for (const col of collections) {
            const docRef = doc(db, col, email);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              found = docSnap.data();
              setRole(col);
              break;
            }
          }

          if (found) {
            setUserData(found);
          } else {
            console.warn("User data not found in any collection.");
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Not logged in
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;
  if (!userData) return <div className="p-6 text-center">No user found. Please log in again.</div>;

  return (


<div
  className="max-w-md mx-auto mt-10 p-6 rounded-xl border border-gray-300
    bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300
    shadow-md hover:shadow-xl hover:border-gray-400 transition-all duration-300"
>
  {/* Heading */}
  <h2 className="text-3xl font-serif font-bold text-center text-gray-800 mb-6">
    Welcome, {userData.name}
  </h2>

  <div className="space-y-4 text-[1.05rem] leading-relaxed text-gray-700">
    <p className="border-b border-gray-300 pb-2 flex items-center gap-3">
      <Mail className="h-5 w-5 text-gray-600" />
      <span className="font-medium">Email:</span> {userData.email}
    </p>

    <p className="border-b border-gray-300 pb-2 flex items-center gap-3">
      <User className="h-5 w-5 text-gray-600" />
      <span className="font-medium">Role:</span> {userData.role}
    </p>

    {role === "Club" && (
      <>
        <p className="border-b border-gray-300 pb-2 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-gray-600" />
          <span className="font-medium">Coordinator:</span> {userData.coordinator}
        </p>
        <p className="border-b border-gray-300 pb-2 flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-gray-600" />
          <span className="font-medium">Faculty:</span> {userData.faculty}
        </p>
      </>
    )}

    <div className="pt-4 text-center cursor-pointer transition-transform hover:scale-105 duration-200 text-gray-700 font-semibold">
      <Logout />
    </div>
  </div>
</div>



  );
};

export default Profile;
