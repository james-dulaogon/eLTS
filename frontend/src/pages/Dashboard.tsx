import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useAuthStore } from "../context/useAuthStore";
import { useNotifications } from "../context/NotificationContext";
import { useConfirmation } from "../context/ConfirmationContext";
import AccountSettingsModal from "../components/AccountSettingsModal";
import AdminSettingsModal from "../components/AdminSettingsModal";
import UploadAttachmentModal from "../components/UploadAttachmentModal";
import Settings from "./Settings";
import api from "../services/api";

interface LegislativeMeasure {
  id: number;
  "Tracking No.": string;
  Subject: string;
  "CR NO.": string;
  "Committee Hearing Date": string;
  "Ordinance/Resolution No.": string | null;
  Remarks: string;
  doc_received_url: string | null;
  committee_report_url: string;
  scanned_measure_url: string | null;
}

interface Legislature {
  id: number;
  term_label: string;
  is_active: boolean;
}

interface DashboardMetrics {
  total_received: number;
  pending_enactment: number;
  total_enacted: number;
}

type AttachmentField = "doc_received" | "committee_report" | "scanned_measure";

export default function Dashboard() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const notify = useNotifications();
  const confirm = useConfirmation();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_received: 0,
    pending_enactment: 0,
    total_enacted: 0,
  });
  const [measures, setMeasures] = useState<LegislativeMeasure[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  {
    /* Upload Attachment Modal State Management */
  }
  const [uploadModalState, setUploadModalState] = useState<{
    isOpen: boolean;
    measureId: number | null;
    fieldName: "doc_received" | "committee_report" | "scanned_measure" | null;
    fieldLabel: string;
  }>({ isOpen: false, measureId: null, fieldName: null, fieldLabel: "" });

  {
    /* Dropdown menu */
  }
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{
    top: number;
    right: number;
    buttonTop: number;
    buttonBottom: number;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (activeDropdownId === null || !dropdownCoords || !dropdownRef.current) {
      return;
    }

    const dropdownHeight = dropdownRef.current.getBoundingClientRect().height;
    const belowTop = dropdownCoords.buttonBottom + 6;
    const top =
      belowTop + dropdownHeight > window.innerHeight - 8
        ? Math.max(8, dropdownCoords.buttonTop - dropdownHeight - 6)
        : belowTop;

    setDropdownCoords((current) =>
      current && current.top !== top ? { ...current, top } : current,
    );
  }, [activeDropdownId, dropdownCoords]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // FIX: Decoupled and dropped the legislature endpoints completely from the dashboard loop
      const [metricsRes, matrixRes] = await Promise.all([
        api.get("/measures/metrics"),
        api.get("/measures/matrix"),
      ]);

      setMeasures(matrixRes.data);
      setMetrics(metricsRes.data);
    } catch (err) {
      console.error("Failed to grab matrix records", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDirectFileUpload = async (
    measureId: number,
    fieldName: AttachmentField,
    file: File,
  ) => {
    if (file.type !== "application/pdf") {
      notify("Only PDF documents can be uploaded.", "error");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      notify("The file cannot exceed 20MB.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("id", String(measureId));
    formData.append(fieldName, file);

    try {
      await api.put("/measures/upload-single-attachment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      notify("Attachment uploaded successfully.", "success");
      await fetchDashboardData();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      notify(`Attachment upload failed: ${message}`, "error");
    }
  };

  // Safe file viewing click dispatch pipeline
  const viewDocument = (urlPath: string | null) => {
    if (!urlPath) {
      notify(
        "No scanned copy has been uploaded for this workflow state yet.",
        "info",
      );
      return;
    }
    // Resolves dynamically to the Synology backend static download upload mounts
    const fullUrl = urlPath.startsWith("http")
      ? urlPath
      : `http://localhost:5000${urlPath}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  // Filter computation layer based on search box input matching Track No. or Subject strings
  const filteredMeasures = measures.filter(
    (m) =>
      m["Tracking No."].toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.Subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m["CR NO."].toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. TOP GLOBAL RESPONSIVE NAVBAR ACCENT CHIPS */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 sm:px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg font-bold tracking-wider text-sm">
            eLTS
          </div>
          <h1 className="text-lg font-bold text-gray-900 hidden sm:block">
            eLegislative Tracking System
          </h1>
        </div>
        {/* 2. SYSTEM SETTINGS CONTROLS */}
        <div className="flex items-center space-x-4">
          {user?.role === "Admin" && (
            <button
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-gray-100 bg-white transition-all duration-200 shadow-sm"
              title="Open System Settings"
            >
              <a href="/dashboard/settings">
                <svg
                  xmlns="http://w3.org"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-5 h-5 animate-hover-spin"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.767a1.123 1.123 0 0 0-.417 1.03c.004.074.006.148.006.222 0 .074-.002.148-.006.222a1.123 1.123 0 0 0 .417 1.03l1.003.767a1.125 1.125 0 0 1 .26 1.43l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.216-.456a1.125 1.125 0 0 0-1.075.124a2.08 2.08 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281a2.08 2.08 0 0 1-.644-.87a2.08 2.08 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.767a1.122 1.122 0 0 0 .416-1.03c-.004-.074-.006-.148-.006-.222 0-.074.002-.148.006-.222a1.122 1.122 0 0 0-.416-1.03l-1.004-.767a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.49l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128c.332-.183.582-.495.644-.869l.214-1.28Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              </a>
            </button>
          )}

          <div className="hidden md:block">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm focus:outline-none transition-all duration-200 text-left group"
              title="Manage personal account settings"
            >
              {/* Dynamic Avatar Ring Element */}
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shadow-inner">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()
                  : "US"}
              </div>

              {/* Profile Text Metadata Layer */}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-800 group-hover:text-blue-600 transition-colors tracking-tight leading-none">
                  {user?.name}
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase mt-0.5 leading-none">
                  {user?.role?.replace("_", " ")}
                </span>
              </div>

              <svg
                xmlns="http://w3.org"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors ml-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
          </div>
          {/* Logout Button */}
          <button
            onClick={logout}
            className="text-sm font-medium text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER GRID LAYOUT */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:border-blue-600 hover:shadow-md group">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-blue-500 transition-colors">
              Total Documents Received
            </p>
            <p className="text-3xl font-black text-gray-900 mt-2">
              {metrics.total_received}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:border-blue-600 hover:shadow-md group">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-blue-500 transition-colors">
              Needs Enactment (Pending)
            </p>
            <p className="text-3xl font-black text-amber-600 mt-2">
              {metrics.pending_enactment}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:border-blue-600 hover:shadow-md group">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-blue-500 transition-colors">
              Total Enacted Measures
            </p>
            <p className="text-3xl font-black text-emerald-600 mt-2">
              {metrics.total_enacted}
            </p>
          </div>
        </div>

        {/* 3. MATRIX CONTROLS BAR: SEARCH CHANNELS & ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-full sm:max-w-md relative">
            <input
              type="text"
              placeholder="Search by Tracking No., Subject summary, or CR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
            />
            <svg
              xmlns="http://w3.org"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 text-gray-400 absolute left-3 top-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z"
              />
            </svg>
          </div>

          {(user?.role === "Admin" || user?.role === "Document_Clerk") && (
            <a
              href="/dashboard/intake"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm text-center transition"
            >
              + Add New Measure
            </a>
          )}
        </div>

        {/* 4. CORE DATA TABLE MATRIX */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="md:overflow-x-auto">
            <table className="block w-full min-w-0 text-left border-collapse md:table md:min-w-[1000px]">
              <thead className="hidden md:table-header-group">
                <tr className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <th className="py-3 px-4 w-[110px] text-center">
                    Tracking No.
                  </th>
                  <th className="py-3 px-6 w-[320px] text-center">Subject</th>
                  <th className="py-3 px-4 w-[180px] text-center">
                    CR No. / Committee
                  </th>
                  <th className="py-3 px-4 w-[140px] text-center">
                    Hearing Date
                  </th>
                  <th className="py-3 px-4 w-[160px] text-center">
                    Ordinance/Res No.
                  </th>
                  <th className="py-3 px-4 text-center">Remarks</th>
                  <th className="py-3.5 px-4 text-center w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="block space-y-3 p-3 text-sm text-gray-900 md:table-row-group md:space-y-0 md:divide-y md:divide-gray-200 md:p-0">
                {isLoading ? (
                  <tr className="block md:table-row">
                    <td
                      colSpan={7}
                      className="block text-center py-12 text-gray-500 font-medium md:table-cell"
                    >
                      Streaming records safely from Server...
                    </td>
                  </tr>
                ) : filteredMeasures.length === 0 ? (
                  <tr className="block md:table-row">
                    <td
                      colSpan={7}
                      className="block text-center py-12 text-gray-500 font-light md:table-cell"
                    >
                      No records found matching the keyword you type.
                    </td>
                  </tr>
                ) : (
                  filteredMeasures.map((measure) => (
                    <tr
                      key={measure.id}
                      className="block rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-colors md:table-row md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:hover:bg-slate-50/70"
                    >
                      {/* Tracking No. */}
                      <td className="block break-words py-2 px-1 font-semibold text-blue-700 md:table-cell md:py-4 md:px-4">
                        {measure["Tracking No."]}
                      </td>
                      {/* Subject */}
                      <td className="block break-words py-2 px-1 md:table-cell md:py-4 md:px-6">
                        {measure.Subject}
                      </td>
                      {/* CR No. / Committee */}
                      <td className="block break-words py-2 px-1 md:table-cell md:py-4 md:px-4">
                        {measure["CR NO."]}
                      </td>
                      {/* Committee Hearing Date */}
                      <td className="block py-2 px-1 md:table-cell md:py-4 md:px-4">
                        {measure["Committee Hearing Date"]
                          ? new Date(
                              measure["Committee Hearing Date"],
                            ).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                      {/* Ordinance/Resolution No. */}
                      <td className="block break-words py-2 px-1 md:table-cell md:py-4 md:px-4">
                        {measure["Ordinance/Resolution No."] || "—"}
                      </td>
                      {/* Remarks */}
                      <td className="block break-words py-2 px-1 md:table-cell md:py-4 md:px-4">
                        <p>{measure.Remarks || "—"}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              viewDocument(measure.doc_received_url)
                            }
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Received document
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              viewDocument(measure.committee_report_url)
                            }
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Committee report
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              viewDocument(measure.scanned_measure_url)
                            }
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Scanned measure
                          </button>
                        </div>
                      </td>
                      {/* Dropdown Menu Options */}
                      <td className="relative block py-2 px-1 text-right md:table-cell md:py-4 md:px-4 md:text-center">
                        <div className="inline-block text-left">
                          <button
                            onClick={(e) => {
                              if (activeDropdownId === measure.id) {
                                setActiveDropdownId(null);
                                setDropdownCoords(null);
                              } else {
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                setDropdownCoords({
                                  top: rect.bottom + 6,
                                  right: window.innerWidth - rect.right,
                                  buttonTop: rect.top,
                                  buttonBottom: rect.bottom,
                                });
                                setActiveDropdownId(measure.id);
                              }
                            }}
                            className="inline-flex justify-center w-full rounded-lg border border-gray-200 shadow-sm px-3 py-1.5 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                          >
                            Options
                            <svg
                              className="ml-1.5 -mr-0.5 h-3.5 w-3.5 text-gray-400"
                              xmlns="http://w3.org"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                              />
                            </svg>
                          </button>

                          {activeDropdownId === measure.id &&
                            dropdownCoords && (
                              <React.Fragment>
                                {/* Transparent backdrop layer overlay hook to easily close dropdown when clicking anywhere outside */}
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    setDropdownCoords(null);
                                  }}
                                />
                                <div
                                  ref={dropdownRef}
                                  className="fixed w-48 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 divide-y divide-gray-100 focus:outline-none border border-gray-100 animate-fade-in text-left"
                                  style={{
                                    top: `${dropdownCoords.top}px`,
                                    right: `${dropdownCoords.right}px`,
                                    maxHeight: "calc(100vh - 16px)",
                                    overflowY: "auto",
                                  }}
                                >
                                  {/* PRIMARY ROUTE: EDIT DATA */}
                                  {(user?.role === "Admin" ||
                                    user?.role === "Document_Clerk") && (
                                    <div className="py-1">
                                      <button
                                        onClick={() => {
                                          setActiveDropdownId(null);
                                          window.location.href = `/dashboard/edit/${measure.id}`;
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 hover:text-blue-600 font-medium transition"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  )}

                                  {/* STREAM SECTION: SECURE CLOUD DISPATCH CHANNELS */}
                                  <div className="py-1">
                                    <label className="w-full flex items-center px-4 py-2 text-xs text-gray-700 font-medium transition">
                                      Upload Attachments
                                    </label>
                                    <label className="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 hover:text-blue-600 font-medium cursor-pointer transition">
                                      ➜] Document Rec.
                                      <input
                                        accept=".pdf"
                                        className="hidden"
                                        onClick={() => {
                                          setUploadModalState({
                                            isOpen: true,
                                            measureId: measure.id,
                                            fieldName: "doc_received",
                                            fieldLabel: "Documents Received",
                                          });
                                          setActiveDropdownId(null);
                                          setDropdownCoords(null);
                                        }}
                                      />
                                    </label>

                                    <label className="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 hover:text-blue-600 font-medium cursor-pointer transition">
                                      ➜] Committee Rep.
                                      <input
                                        accept=".pdf"
                                        className="hidden"
                                        onClick={() => {
                                          setUploadModalState({
                                            isOpen: true,
                                            measureId: measure.id,
                                            fieldName: "committee_report",
                                            fieldLabel: "Committee Report",
                                          });
                                          setActiveDropdownId(null);
                                          setDropdownCoords(null);
                                        }}
                                      />
                                    </label>

                                    <label className="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 hover:text-emerald-600 font-medium cursor-pointer transition">
                                      ➜] Enacted Measure
                                      <input
                                        accept=".pdf"
                                        className="hidden"
                                        onClick={() => {
                                          setUploadModalState({
                                            isOpen: true,
                                            measureId: measure.id,
                                            fieldName: "scanned_measure",
                                            fieldLabel: "Enacted Measure",
                                          });
                                          setActiveDropdownId(null);
                                          setDropdownCoords(null);
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                              </React.Fragment>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
      />
      <UploadAttachmentModal
        isOpen={uploadModalState.isOpen}
        measureId={uploadModalState.measureId}
        fieldName={uploadModalState.fieldName}
        fieldLabel={uploadModalState.fieldLabel}
        onClose={() =>
          setUploadModalState({
            isOpen: false,
            measureId: null,
            fieldName: null,
            fieldLabel: "",
          })
        }
        onUploadSuccess={fetchDashboardData} // Automatically triggers data re-fetch on success
      />
    </div>
  );
}
