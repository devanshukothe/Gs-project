import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Logout from "../components/Auth/Logout";
import { Mail, User, ShieldCheck, GraduationCap, Edit2, Save } from "lucide-react";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    coordinator: "",
    faculty: "",
  });

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
            setFormData({
              name: found.name || "",
              email: found.email || "",
              role: found.role || "",
              coordinator: found.coordinator || "",
              faculty: found.faculty || "",
            });
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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!userData?.email) return;

    try {
      const collectionName = role === "Club" ? "Club" : role === "Faculty" ? "Faculty" : role === "Dean" ? "Dean" : "Secratory";

      await setDoc(doc(db, collectionName, userData.email), formData);
      setUserData(formData);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;
  if (!userData) return <div className="p-6 text-center">No user found. Please log in again.</div>;

  return (
    <div
      className="max-w-md mx-auto mt-10 p-6 rounded-xl border border-gray-300
      bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300
      shadow-md hover:shadow-xl hover:border-gray-400 transition-all duration-300"
    >
      <h2 className="text-3xl font-serif font-bold text-center text-gray-800 mb-6">
        Welcome, {isEditing ? (
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border border-gray-400 rounded px-2 py-1 text-lg font-semibold w-full"
          />
        ) : (
          userData.name
        )}
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
              <span className="font-medium">Coordinator:</span>{" "}
              {isEditing ? (
                <input
                  type="text"
                  name="coordinator"
                  value={formData.coordinator}
                  onChange={handleChange}
                  className="border border-gray-400 rounded px-2 py-1 w-full"
                />
              ) : (
                userData.coordinator
              )}
            </p>
            <p className="border-b border-gray-300 pb-2 flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Faculty:</span>{" "}
              {isEditing ? (
                <input
                  type="text"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  className="border border-gray-400 rounded px-2 py-1 w-full"
                />
              ) : (
                userData.faculty
              )}
            </p>
          </>
        )}

        <div className="pt-4 flex justify-center gap-4 items-center">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-gray-700 hover:text-gray-900 font-semibold"
              title="Edit Profile"
              type="button"
            >
              <Edit2 className="w-5 h-5" />
              Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 text-green-700 hover:text-green-900 font-semibold"
              title="Save Profile"
              type="button"
            >
              <Save className="w-5 h-5" />
              Save
            </button>
          )}

          <Logout />
        </div>
      </div>
    </div>
  );
};

export default Profile;
