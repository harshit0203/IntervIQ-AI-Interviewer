"use client";
import React, { useEffect, useState } from "react";
import {
  Edit,
  Save,
  Trash2,
  X,
  Eye,
  Mic,
  Type,
  AlertTriangle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { apiService } from "../api_service";
import { logout, setUser } from "../redux/userSlice";
import Link from "next/link";
import { useRouter } from "next/navigation";

const EditableField = ({ label, name, value, isEditing, onChange }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500">{label}</label>
    {isEditing ? (
      <input
        type="text"
        value={value}
        name={name}
        onChange={onChange}
        className="w-full mt-1 p-2 rounded-md border-2 border-teal-500 bg-white text-gray-900 focus:outline-none"
      />
    ) : (
      <p className="font-medium text-gray-800 mt-1">{value}</p>
    )}
  </div>
);

export default function Page() {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.user.user);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name,
    email: user?.email,
  });
  const [userData, setUserData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasInterviews = userData?.interviews && userData.interviews.length > 0;

  useEffect(() => {
    getUserData();
  }, []);

  const saveChanges = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.post("/profile/save-changes", {
        ...formData,
        user_id: user?.id,
      });
      if (response?.status) {
        const updatedUser = {
          ...user,
          ...response.user,
        };
        dispatch(setUser({ user: updatedUser }));
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  const getUserData = async () => {
    const response = await apiService.get(`/profile/get-profile/${user?.id}`);
    if (response?.status) {
      setUserData(response?.user);
    }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    try {
      setIsDeleting(true);
      const response = await apiService.post("/profile/delete-account", {
        user_id: user?.id,
      });
      if (response?.status) {
        dispatch(logout());
        setIsDeleting(false);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Error deleting account:", err);
    } finally {
      window.location.href = "/";
    }
  };

  function getAvatar() {
    const name = user?.name || "User";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    return initials;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <Sidebar active="profile" />
      <main className="flex-1 p-8 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <h1 className="text-4xl font-extrabold text-gray-900">
              Your Profile
            </h1>
            <p className="mt-2 text-gray-500">
              Manage your personal information and view your history.
            </p>
          </header>

          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full shadow-md bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-700">
                  {getAvatar()}
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                <EditableField
                  label="Full Name"
                  name="name"
                  value={formData?.name}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
                <EditableField
                  label="Email Address"
                  name="email"
                  value={formData?.email}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveChanges}
                      className="h-11 px-6 rounded-full font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center gap-2"
                    >
                      <Save size={16} /> Save Changes
                    </button>

                    <button
                      onClick={() => setIsEditing(false)}
                      className="h-11 w-11 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                      aria-label="Cancel editing"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="h-11 px-6 rounded-full font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Interview History
              </h2>
            </div>

            <div className="overflow-x-auto">
              {hasInterviews ? (
                <table className="min-w-full text-left">
                  <thead className="border-b border-gray-200 bg-gray-50/50">
                    <tr>
                      <th className="p-4 text-sm font-semibold text-gray-500">
                        Role
                      </th>
                      <th className="p-4 text-sm font-semibold text-gray-500">
                        Date
                      </th>
                      <th className="p-4 text-sm font-semibold text-gray-500 text-center">
                        Score
                      </th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.interviews.map((item, index) => {
                      const report = item?.interview_reports?.[index]?.report
                        ? JSON.parse(item.interview_reports[index].report)
                        : {};
                      const overallScore = report.overallScore || 0;

                      return (
                        <tr
                          key={item?._id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-medium text-gray-800">
                              {item?.domain || "N/A"}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
                                {item?.interview_type || "General"}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md capitalize">
                                {item?.mode === "Voice" ? (
                                  <Mic size={12} />
                                ) : (
                                  <Type size={12} />
                                )}
                                {item?.mode || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-600 align-top">
                            {new Date(item?.created_at)?.toLocaleDateString() ||
                              "N/A"}
                          </td>
                          <td className="p-4 text-center align-top">
                            <span
                              className={`font-bold px-3 py-1 rounded-full text-sm ${
                                overallScore >= 85
                                  ? "bg-teal-50 text-teal-700"
                                  : overallScore >= 70
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {overallScore}
                            </span>
                          </td>
                          <td className="p-4 text-right align-top">
                            <Link
                              href={`/interview/report/${item?._id}`}
                              passHref
                            >
                              <p className="font-semibold text-teal-600 hover:underline flex items-center justify-end gap-1 cursor-pointer">
                                View Report <Eye size={14} />
                              </p>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16">
                  <h3 className="text-lg font-semibold text-gray-700">
                    No Interviews Found
                  </h3>
                  <p className="text-gray-500 mt-2 mb-6">
                    It looks like you haven't completed any interviews yet.
                  </p>
                  <Link href="/interview/setup" passHref>
                    <button className="px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75">
                      Start Your First Interview
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Account Management
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <div>
                <h3 className="font-semibold text-red-800">Delete Account</h3>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto h-11 px-6 rounded-full font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors flex-shrink-0"
              >
                <Trash2 size={16} className="inline mr-2" />
                Delete My Account
              </button>
            </div>
            {isModalOpen && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative transform transition-all duration-300 ease-out">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Close"
                  >
                    <X size={24} />
                  </button>

                  <div className="flex flex-col items-center text-center">
                    <div className="flex-shrink-0 w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center mb-4">
                      <AlertTriangle className="w-9 h-9 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Are you absolutely sure?
                    </h3>
                  </div>

                  <div className="text-center text-gray-600 dark:text-gray-300 my-6">
                    <p>
                      This action is irreversible. All your data, including
                      every interview, report, and detailed breakdown, will be
                      permanently erased.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full h-12 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => {
                        deleteAccount(e);
                      }}
                      className="w-full h-12 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors shadow-lg"
                    >
                      Yes, Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
