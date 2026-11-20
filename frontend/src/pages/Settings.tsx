import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useNotifications } from "../context/NotificationContext"; // Assuming useNotifications context hook pattern

// 1. PLACE TYPES OUTSIDE THE MAIN COMPONENT BODY
type SettingsTab = "default" | "committees" | "legislatures" | "users";

export default function Settings() {
  // 2. PLACE ALL STATE AND ROUTING HOOKS AT THE VERY TOP OF THE COMPONENT FUNCTION
  const navigate = useNavigate();
  const notify = useNotifications(); // Execute notifications trigger context hook if using standard wrapper custom methods
  const [activeTab, setActiveTab] = useState<SettingsTab>("default");

  // Committee Active Module State Vectors
  const [committeeName, setCommitteeName] = useState("");
  const [committeesList, setCommitteesList] = useState<any[]>([]);
  const [isSavingCommittee, setIsSavingCommittee] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [editingCommitteeId, setEditingCommitteeId] = useState<number | null>(
    null,
  );
  const [editingCommitteeName, setEditingCommitteeName] = useState("");
  const [isUpdatingCommittee, setIsUpdatingCommittee] = useState(false);
  // Legislatures Module State Vectors
  const [legislatureLabel, setLegislatureLabel] = useState("");
  const [legislaturesList, setLegislaturesList] = useState<any[]>([]);
  const [isSavingLeg, setIsSavingLeg] = useState(false);
  const [isLegTableLoading, setIsLegTableLoading] = useState(false);
  const [editingLegId, setEditingLegId] = useState<number | null>(null);
  const [editingLegLabel, setEditingLegLabel] = useState("");
  const [isUpdatingLeg, setIsUpdatingLeg] = useState(false);
  // User Management Module State Vectors
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("Document_Clerk");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isUserTableLoading, setIsUserTableLoading] = useState(false);

  // 3. DEFINE COMPONENT BUSINESS LOGER PIPELINES HERE
  const fetchCommittees = async () => {
    setIsTableLoading(true);
    try {
      const res = await api.get("/committees");
      setCommitteesList(res.data);
    } catch (err) {
      notify("Failed to sync committee records from database.", "error");
    } finally {
      setIsTableLoading(false);
    }
  };
  const handleUpdateCommittee = async (id: number) => {
    if (!editingCommitteeName.trim()) {
      notify("Committee name cannot be empty.", "warning");
      return;
    }

    setIsUpdatingCommittee(true);
    try {
      await api.put(`/committees/${id}`, { name: editingCommitteeName });
      notify("Committee name updated successfully.", "success");
      setEditingCommitteeId(null);
      setEditingCommitteeName("");
      fetchCommittees();
    } catch (err: any) {
      notify(
        err.response?.data?.error || "Failed to update committee.",
        "error",
      );
    } finally {
      setIsUpdatingCommittee(false);
    }
  };
  // 4. PLACE LIFECYCLE REACTION ENGINE CHECKPOINTS HERE
  useEffect(() => {
    if (activeTab === "committees") {
      fetchCommittees();
    }
  }, [activeTab]);

  // Method to fetch rows from your backend legislatures endpoint
  const fetchLegislatures = async () => {
    setIsLegTableLoading(true);
    try {
      const res = await api.get("/legislatures/all");
      setLegislaturesList(res.data);
    } catch (err) {
      notify("Failed to sync legislative records from database.", "error");
    } finally {
      setIsLegTableLoading(false);
    }
  };

  const handleUpdateLegislature = async (id: number) => {
    if (!editingLegLabel.trim()) {
      notify("Legislature term label cannot be empty.", "warning");
      return;
    }

    setIsUpdatingLeg(true);
    try {
      await api.put(`/legislatures/${id}`, { term_label: editingLegLabel });
      notify("Legislative term updated successfully.", "success");
      setEditingLegId(null);
      setEditingLegLabel("");
      fetchLegislatures();
    } catch (err: any) {
      notify(
        err.response?.data?.error || "Failed to update legislative term.",
        "error",
      );
    } finally {
      setIsUpdatingLeg(false);
    }
  };

  // Trigger fetch when user toggles into the legislature tab
  useEffect(() => {
    if (activeTab === "legislatures") {
      fetchLegislatures();
    }
  }, [activeTab]);

  // Method to fetch system users from your raw PostgreSQL endpoint
  const fetchUsers = async () => {
    setIsUserTableLoading(true);
    try {
      const res = await api.get("/users");
      setUsersList(res.data);
    } catch (err) {
      notify("Failed to sync system user profiles from database.", "error");
    } finally {
      setIsUserTableLoading(false);
    }
  };

  // Trigger fetch when user toggles into the user accounts tab
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center font-sans">
      {/* Centralized Card Layout Frame matching the Measure Form Page */}
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-10 space-y-8 flex flex-col min-h-[600px]">
        {/* ==========================================
            1. WORKSPACE PAGE HEADER BLOCK
           ========================================== */}
        <div className="border-b border-gray-100 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-6 bg-blue-600 rounded-sm inline-block" />
              System Settings
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Configure system repositories and manage core platform properties.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition py-1.5 px-3 border border-gray-200 rounded-lg max-w-fit shadow-sm bg-white"
          >
            &larr; Back to Dashboard
          </button>
        </div>

        {/* ==========================================
            2. INTERACTIVE MODULE SELECTION TABS BAR
           ========================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab("committees")}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              activeTab === "committees"
                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <span>Committees</span>
          </button>

          <button
            onClick={() => setActiveTab("legislatures")}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              activeTab === "legislatures"
                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <span>Legislatures</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              activeTab === "users"
                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <span>User Accounts</span>
          </button>
        </div>

        {/* ==========================================
            3. DYNAMIC WORKING PLATFORM BODY PANEL
           ========================================== */}
        <div className="flex-1 border border-gray-100 rounded-xl bg-slate-50/50 p-6 flex flex-col justify-center min-h-[300px]">
          {/* DEFAULT WORKSPACE VIEW LANDING PAGE */}
          {activeTab === "default" && (
            <div className="text-center max-w-sm mx-auto space-y-3 animate-fade-in">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                System Settings
              </h2>
              <p className="text-xs font-light text-gray-500 leading-relaxed">
                Select a tab above to manage committee creation, legislative
                term creation and new user account creation.
              </p>
            </div>
          )}

          {/* COMMITTEES VIEW MOUNTED INSIDE THE CORE BODY CONTAINER */}
          {activeTab === "committees" && (
            <div className="space-y-6 w-full animate-fade-in text-left">
              {/* A. SEED ENTRY INPUT BLOCK */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Register New Working Body
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!committeeName.trim()) return;
                    setIsSavingCommittee(true);
                    try {
                      await api.post("/committees", { name: committeeName });
                      notify(
                        "Committee name registered successfully.",
                        "success",
                      );
                      setCommitteeName("");
                      fetchCommittees();
                    } catch (err: any) {
                      notify(
                        err.response?.data?.error ||
                          "Failed to save committee.",
                        "error",
                      );
                    } finally {
                      setIsSavingCommittee(false);
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="text"
                    placeholder="e.g., Committee on Rules / Committee on Laws"
                    value={committeeName}
                    onChange={(e) => setCommitteeName(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSavingCommittee}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
                  >
                    {isSavingCommittee
                      ? "Saving Committee..."
                      : "Save Committee"}
                  </button>
                </form>
              </div>

              {/* B. REGISTRY MONITORING DATA TABLE */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <th className="py-2.5 px-4 w-[80px]">ID</th>
                        <th className="py-2.5 px-4">
                          Official Registered Committee Title
                        </th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                      {isTableLoading ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center py-6 text-gray-400"
                          >
                            Fetching registered committees...
                          </td>
                        </tr>
                      ) : committeesList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center py-6 text-gray-400 font-light italic"
                          >
                            No registered committees yet.
                          </td>
                        </tr>
                      ) : (
                        committeesList.map((committee, index) => {
                          const isEditing = editingCommitteeId === committee.id;

                          return (
                            <tr
                              key={committee.id}
                              className="hover:bg-slate-50/40 transition"
                            >
                              <td className="py-3 px-4 font-mono font-bold text-gray-400">
                                {index + 1}
                              </td>
                              <td className="py-3 px-4 font-medium text-gray-900">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingCommitteeName}
                                    onChange={(e) =>
                                      setEditingCommitteeName(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleUpdateCommittee(committee.id);
                                      if (e.key === "Escape") {
                                        setEditingCommitteeId(null);
                                        setEditingCommitteeName("");
                                      }
                                    }}
                                    autoFocus
                                    className="w-full px-3 py-1.5 rounded-lg border border-blue-400 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  />
                                ) : (
                                  <span>{committee.name}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                {isEditing ? (
                                  <div className="inline-flex items-center space-x-1.5">
                                    <button
                                      type="button"
                                      disabled={isUpdatingCommittee}
                                      onClick={() =>
                                        handleUpdateCommittee(committee.id)
                                      }
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-[11px] font-semibold rounded-md transition"
                                    >
                                      {isUpdatingCommittee
                                        ? "Saving..."
                                        : "Save"}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isUpdatingCommittee}
                                      onClick={() => {
                                        setEditingCommitteeId(null);
                                        setEditingCommitteeName("");
                                      }}
                                      className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[11px] font-semibold rounded-md transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommitteeId(committee.id);
                                      setEditingCommitteeName(committee.name);
                                    }}
                                    className="px-3 py-1 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 text-[11px] font-semibold rounded-md shadow-2xs transition"
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LEGISLATURES MANAGEMENT MODULE PANEL */}
          {activeTab === "legislatures" && (
            <div className="space-y-6 w-full animate-fade-in text-left">
              {/* A. SEED ENTRY INPUT BLOCK */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Register New Legislative Term
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!legislatureLabel.trim()) return;
                    setIsSavingLeg(true);
                    try {
                      await api.post("/legislatures", {
                        term_label: legislatureLabel,
                      });
                      notify(
                        "Legislative term registered successfully.",
                        "success",
                      );
                      setLegislatureLabel("");
                      fetchLegislatures(); // Refresh data table instantly
                    } catch (err: any) {
                      notify(
                        err.response?.data?.error ||
                          "Failed to save legislative term.",
                        "error",
                      );
                    } finally {
                      setIsSavingLeg(false);
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="text"
                    placeholder="e.g., 22ND SANGGUNIANG BAYAN (2025-2028)"
                    value={legislatureLabel}
                    onChange={(e) => setLegislatureLabel(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSavingLeg}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
                  >
                    {isSavingLeg ? "Saving Legislature..." : "Save Legislature"}
                  </button>
                </form>
              </div>

              {/* B. REGISTRY MONITORING DATA TABLE */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <th className="py-2.5 px-4 w-[80px]">ID</th>
                        <th className="py-2.5 px-4">
                          Official Registered Legislative Term
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                      {isLegTableLoading ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center py-6 text-gray-400"
                          >
                            Fetching registered legislative terms...
                          </td>
                        </tr>
                      ) : legislaturesList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center py-6 text-gray-400 font-light italic"
                          >
                            No registered legislative terms yet.
                          </td>
                        </tr>
                      ) : (
                          legislaturesList.map((leg, index) => {
                            const isEditing = editingLegId === leg.id;

                            return (
                              <tr key={leg.id} className="hover:bg-slate-50/40 transition">
                                <td className="py-3 px-4 font-mono font-bold text-gray-400">
                                  {index + 1}
                                </td>

                                {/* INLINE EDIT INPUT OR STATIC LABEL */}
                                <td className="py-3 px-4 font-medium text-gray-900">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editingLegLabel}
                                      onChange={(e) => setEditingLegLabel(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUpdateLegislature(leg.id);
                                        if (e.key === 'Escape') setEditingLegId(null);
                                      }}
                                      autoFocus
                                      className="w-full px-3 py-1.5 rounded-lg border border-blue-400 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    />
                                  ) : (
                                    <span>{leg.term_label}</span>
                                  )}
                                </td>

                                {/* ACTION BUTTONS */}
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  {isEditing ? (
                                    <div className="inline-flex items-center space-x-1.5">
                                      <button
                                        type="button"
                                        disabled={isUpdatingLeg}
                                        onClick={() => handleUpdateLegislature(leg.id)}
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-[11px] font-semibold rounded-md transition"
                                      >
                                        {isUpdatingLeg ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isUpdatingLeg}
                                        onClick={() => {
                                          setEditingLegId(null);
                                          setEditingLegLabel('');
                                        }}
                                        className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[11px] font-semibold rounded-md transition"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingLegId(leg.id);
                                        setEditingLegLabel(leg.term_label);
                                      }}
                                      className="px-3 py-1 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 text-[11px] font-semibold rounded-md shadow-2xs transition"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USER ACCOUNTS MANAGEMENT MODULE PANEL */}
          {activeTab === "users" && (
            <div className="space-y-6 w-full animate-fade-in text-left">
              {/* A. ACCOUNT ENTRY CREATION COMPONENT CARD */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Provision New System Account
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSavingUser(true);
                    try {
                      await api.post("/users", {
                        name: newUserName,
                        email: newUserEmail,
                        username: newUserUsername,
                        password: newUserPassword,
                        role: newUserRole,
                      });
                      notify("New user account saved successfully.", "success");

                      // Clear form states completely
                      setNewUserName("");
                      setNewUserEmail("");
                      setNewUserUsername("");
                      setNewUserPassword("");
                      setNewUserRole("Document_Clerk");

                      fetchUsers(); // Refresh data table entries instantly
                    } catch (err: any) {
                      notify(
                        err.response?.data?.error ||
                          "Failed to create user account.",
                        "error",
                      );
                    } finally {
                      setIsSavingUser(false);
                    }
                  }}
                  className="space-y-4"
                >
                  {/* Grid Row 1: Primary Profile Attributes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Juan Dela Cruz"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g., clerk@sangguniangbayan.gov.ph"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Grid Row 2: Security & Authentication Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Portal Username
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., juandelacruz"
                        value={newUserUsername}
                        onChange={(e) => setNewUserUsername(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Role Assignment
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="Document_Clerk">Document Clerk</option>
                        <option value="Official">Government Official</option>
                        <option value="Admin">System Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSavingUser}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      {isSavingUser
                        ? "Saving user account..."
                        : "Save New User Account"}
                    </button>
                  </div>
                </form>
              </div>

              {/* B. REGISTRY MONITORING DATA TABLE */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <th className="py-2.5 px-4 w-[60px]">Seq</th>
                        <th className="py-2.5 px-4">Full Name</th>
                        <th className="py-2.5 px-4">Username</th>
                        <th className="py-2.5 px-4">Email</th>
                        <th className="py-2.5 px-4">System Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                      {isUserTableLoading ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-6 text-gray-400"
                          >
                            Fetching user accounts...
                          </td>
                        </tr>
                      ) : usersList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-6 text-gray-400 font-light italic"
                          >
                            No user accounts have been created yet.
                          </td>
                        </tr>
                      ) : (
                        usersList.map((usr, index) => (
                          <tr
                            key={usr.id}
                            className="hover:bg-slate-50/40 transition"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-gray-400">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4 font-bold text-gray-900">
                              {usr.name}
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-600">
                              {usr.username}
                            </td>
                            <td className="py-3 px-4 text-gray-500">
                              {usr.email}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  usr.role === "Admin"
                                    ? "bg-red-50 text-red-700 border-red-100"
                                    : usr.role === "Document_Clerk"
                                      ? "bg-blue-50 text-blue-700 border-blue-100"
                                      : "bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                {usr.role.replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LEGISLATURES AND USERS PLACEHOLDERS */}
          {activeTab === "legislatures" && (
            <div className="text-center text-xs text-gray-400 font-light">
              Legislature terms table
            </div>
          )}
          {activeTab === "users" && (
            <div className="text-center text-xs text-gray-400 font-light">
              User accounts table
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
