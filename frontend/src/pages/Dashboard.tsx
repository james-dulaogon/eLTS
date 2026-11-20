import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useAuthStore } from "../context/useAuthStore";
import { useNotifications } from "../context/NotificationContext";
import { useConfirmation } from "../context/ConfirmationContext";
import AccountSettingsModal from "../components/AccountSettingsModal";
import AdminSettingsModal from "../components/AdminSettingsModal";
import UploadAttachmentModal from "../components/UploadAttachmentModal";
import api from "../services/api";
import ExportDataModal from "../components/ExportDataModal";
import MeasureDetailsModal from "../components/MeasureDetailsModal";

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

interface DashboardMetrics {
  total_received: number;
  total_ordinances: number;
  total_resolutions: number;
  total_returned: number;
  total_enacted: number;
  total_committee_hearings: number;
}

type AttachmentField = "doc_received" | "committee_report" | "scanned_measure";

export default function Dashboard() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  // const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const notify = useNotifications();
  const confirm = useConfirmation();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_received: 0,
    total_ordinances: 0,
    total_resolutions: 0,
    total_enacted: 0,
    total_returned: 0,
    total_committee_hearings: 0,
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [measures, setMeasures] = useState<LegislativeMeasure[]>([]);
  const [selectedCommitteeFilter, setSelectedCommitteeFilter] = useState("ALL");
  const [selectedLegislatureFilter, setSelectedLegislatureFilter] =
    useState("ALL");
  const [committeesList, setCommitteesList] = useState<
    { id: number; name: string }[]
  >([]);
  const [legislaturesList, setLegislaturesList] = useState<
    { id: number; term_label: string }[]
  >([]);
  const [viewDetailsId, setViewDetailsId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      const [metricsRes, matrixRes, commRes, legRes] = await Promise.all([
        api.get("/measures/metrics"),
        api.get("/measures/matrix"),
        api.get("/committees"),
        api.get("/legislatures/all"),
      ]);
      setMeasures(matrixRes.data);
      setMetrics(metricsRes.data);
      setCommitteesList(commRes.data);
      setLegislaturesList(legRes.data);
    } catch (err) {
      console.error("Failed to grab records", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCommitteeFilter, selectedLegislatureFilter]);

  // Safe file viewing click dispatch pipeline
  const viewDocument = (urlPath: string | null) => {
    if (!urlPath) {
      notify("No scanned copy has been uploaded for this measure yet.", "info");
      return;
    }
    // Resolves dynamically to the Synology backend static download upload mounts
    const fullUrl = urlPath.startsWith("http")
      ? urlPath
      : `http://localhost:5001${urlPath}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  // Filter computation layer based on search box input matching Track No. or Subject strings
  const filteredMeasures = measures.filter((m) => {
    const matchesSearch =
      m["Tracking No."].toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.Subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m["CR NO."].toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCommittee =
      selectedCommitteeFilter === "ALL" ||
      m["CR NO."]
        ?.toLowerCase()
        .includes(selectedCommitteeFilter.toLowerCase());

    const matchesLegislature =
      selectedLegislatureFilter === "ALL" ||
      (m as any).legislature_id?.toString() === selectedLegislatureFilter;

    return matchesSearch && matchesCommittee && matchesLegislature;
  });

  const totalPages = Math.ceil(filteredMeasures.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMeasures = filteredMeasures.slice(
    indexOfFirstItem,
    indexOfLastItem,
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
          <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm transition-all duration-200 hover:border-blue-600 group-hover:text-yellow-300 hover:shadow-md group">
            <p className="inline-flex items-center capitalize leading-none text-xs border rounded-full py-1 px-3 bg-blue-600 border-blue-600 text-white font-bold">
              Total Documents Received
            </p>
            <p className="text-3xl font-black text-blue-600 mt-2 text-center">
              {metrics.total_received}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm transition-all duration-200 hover:border-orange-400 hover:shadow-md group">
            <p className="inline-flex items-center capitalize leading-none text-xs border rounded-full py-1 px-3 bg-orange-600 border-orange-600 text-white font-bold">
              Total Committee Hearings Conducted
            </p>
            <p className="text-3xl font-black text-orange-600 mt-2 text-center">
              {metrics.total_committee_hearings}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm transition-all duration-200 hover:border-red-600 hover:shadow-md group">
            <p className="inline-flex items-center capitalize leading-none text-xs border rounded-full py-1 px-3 bg-red-600 border-red-600 text-white font-bold">
              Returned for Enhancement (Pending)
            </p>
            <p className="text-3xl font-black text-red-600 mt-2 text-center">
              {metrics.total_returned}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-yellow-200 shadow-sm transition-all duration-200 hover:border-yellow-300 hover:shadow-md group">
            <p className="inline-flex items-center capitalize leading-none text-xs border rounded-full py-1 px-3 bg-yellow-500 border-yellow-500 text-white font-bold">
              Total Ordinances Enacted
            </p>
            <p className="text-3xl font-black text-yellow-500 mt-2 text-center">
              {metrics.total_ordinances}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-sm transition-all duration-200 hover:border-purple-600 hover:shadow-md group">
            <p className="inline-flex items-center capitalize leading-none text-xs border rounded-full py-1 px-3 bg-purple-600 border-purple-600 text-white font-bold">
              Total Resolutions Enacted
            </p>
            <p className="text-3xl font-black text-purple-600 mt-2 text-center">
              {metrics.total_resolutions}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm transition-all duration-200 hover:border-emerald-600 hover:shadow-md group">
            <p className="inline-flex items-center capitalize leading-none text-xs border rounded-full py-1 px-3 bg-emerald-600 border-emerald-600 text-white font-bold">
              Total Enacted Measures
            </p>
            <p className="text-3xl font-black text-emerald-600 mt-2 text-center">
              {metrics.total_resolutions + metrics.total_ordinances}
            </p>
          </div>
        </div>

        {/* 3. SEARCH */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_minmax(150px,0.65fr)_minmax(170px,0.7fr)_auto] items-center gap-2 w-full lg:flex-1">
            <div className="relative min-w-0">
              <input
                type="text"
                placeholder="Search Tracking No. or Subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
              />
              <svg
                xmlns="http://w3.org"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z"
                />
              </svg>
            </div>

            <select
              value={selectedCommitteeFilter}
              onChange={(e) => setSelectedCommitteeFilter(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Committees</option>
              {committeesList.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedLegislatureFilter}
              onChange={(e) => setSelectedLegislatureFilter(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Legislatures</option>
              {legislaturesList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.term_label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="w-full lg:w-auto h-10 px-3 sm:px-4 py-2 bg-white hover:bg-slate-50 text-gray-700 border border-gray-300 font-semibold text-sm rounded-lg shadow-2xs transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <svg
                className="w-4 h-4 text-blue-600 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Export Data</span>
            </button>
          </div>

          {(user?.role === "Admin" || user?.role === "Document_Clerk") && (
            <a
              href="/dashboard/intake"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm text-center transition"
            >
              + Add Document Received
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
                  {user?.role === "Admin" || user?.role === "Document_Clerk" ? (
                    <th className="py-3.5 px-4 text-center w-[120px]">
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="block space-y-3 p-3 text-sm text-gray-900 md:table-row-group md:space-y-0 md:divide-y md:divide-gray-200 md:p-0">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      Loading tracking documents...
                    </td>
                  </tr>
                ) : currentMeasures.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      No matching legislative records found.
                    </td>
                  </tr>
                ) : (
                  currentMeasures.map((measure) => (
                    <tr
                      key={measure.id}
                      className="block rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-colors md:table-row md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:hover:bg-slate-50/70 text-xs text-justify"
                    >
                      {/* Tracking No. */}
                      <td className="block break-words py-2 px-1 font-semibold md:table-cell md:py-4 md:px-4">
                        {measure["Tracking No."]}
                      </td>
                      {/* Subject */}
                      <td className="block break-words py-2 px-1 md:table-cell md:py-4 md:px-6">
                        <button
                          type="button"
                          onClick={() => viewDocument(measure.doc_received_url)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {measure.Subject}
                        </button>
                      </td>
                      {/* CR No. / Committee */}
                      <td className="block break-words py-2 px-1 md:table-cell md:py-4 md:px-4">
                        <button
                          type="button"
                          onClick={() =>
                            viewDocument(measure.committee_report_url)
                          }
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {measure["CR NO."]}
                        </button>
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
                        <button
                          type="button"
                          onClick={() =>
                            viewDocument(measure.scanned_measure_url)
                          }
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {measure["Ordinance/Resolution No."] || "—"}
                        </button>
                      </td>
                      {/* Remarks */}
                      <td className="block break-words py-2 px-1 md:table-cell md:py-4 md:px-4 text-center">
                        <p>{measure.Remarks || "—"}</p>
                      </td>
                      {/* Dropdown Menu Options */}
                      <td className="relative block py-2 px-1 text-right md:table-cell md:py-4 md:px-4 md:text-center">
                        {user?.role === "Admin" ||
                        user?.role === "Document_Clerk" ? (
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
                                    <div>
                                        <button
                                          onClick={() => {
                                            setViewDetailsId(measure.id); setActiveDropdownId(null); setDropdownCoords(null);
                                          }}
                                          className="w-full gap-2 flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 hover:text-blue-600 font-medium cursor-pointer transition"
                                        >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="16"
                                              height="16"
                                              fill="currentColor"
                                              className="bi bi-eye-fill"
                                              viewBox="0 0 16 16"
                                            >
                                              <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                                              <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                                            </svg>
                                            View Details
                                        </button>
                                      </div>

                                    {/* PRIMARY ROUTE: EDIT DATA */}
                                    {(user?.role === "Admin" ||
                                      user?.role === "Document_Clerk") && (
                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(null);
                                            window.location.href = `/dashboard/edit/${measure.id}`;
                                          }}
                                          className="w-full gap-2 flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 hover:text-blue-600 font-medium cursor-pointer transition"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            className="bi bi-pencil-square"
                                            viewBox="0 0 16 16"
                                          >
                                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                                            <path
                                              fill="evenodd"
                                              d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
                                            />
                                          </svg>
                                          Edit
                                        </button>
                                      </div>
                                    )}

                                    {/* STREAM SECTION: SECURE CLOUD DISPATCH CHANNELS */}
                                    <div className="py-1">
                                      <label className="w-full flex items-center px-4 py-2 text-xs text-gray-700 font-medium transition">
                                        Upload Attachments
                                      </label>
                                      <label className="w-full gap-2 flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 hover:text-blue-600 font-medium cursor-pointer transition">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          fill="currentColor"
                                          className="bi bi-upload"
                                          viewBox="0 0 16 16"
                                        >
                                          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                                          <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
                                        </svg>
                                        <span>Document Rec.</span>
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

                                      <label className="w-full gap-2 flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 hover:text-blue-600 font-medium cursor-pointer transition">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          fill="currentColor"
                                          className="bi bi-upload"
                                          viewBox="0 0 16 16"
                                        >
                                          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                                          <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
                                        </svg>
                                        <span>Committee Report</span>
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

                                      <label className="w-full gap-2 flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 hover:text-emerald-600 font-medium cursor-pointer transition">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          fill="currentColor"
                                          className="bi bi-upload"
                                          viewBox="0 0 16 16"
                                        >
                                          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                                          <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
                                        </svg>
                                        <span>Enacted Measure</span>
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
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* PAGINATION CONTROLS FOOTER */}
          {!isLoading && filteredMeasures.length > 0 && (
            <div className="bg-slate-50/70 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-bold text-gray-800">
                  {indexOfFirstItem + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-gray-800">
                  {Math.min(indexOfLastItem, filteredMeasures.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-800">
                  {filteredMeasures.length}
                </span>{" "}
                entries
              </p>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  &larr; Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                        currentPage === page
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
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
        onUploadSuccess={fetchDashboardData}
      />
      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        measures={measures}
      />
      <MeasureDetailsModal isOpen={viewDetailsId !== null} measureId={viewDetailsId} onClose={() => setViewDetailsId(null)} />
    </div>
  );
}
