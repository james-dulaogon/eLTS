import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import api from "../services/api";

interface Committee {
  id: number;
  name: string;
}
interface Legislature {
  id: number;
  term_label: string;
}

export default function MeasureForm() {
  const { id } = useParams<{ id: string }>(); // Captures path variables dynamically
  const isEditMode = !!id;
  const navigate = useNavigate();
  const notify = useNotifications();

  // Unified State Form Context Model Elements
  const [trackingNumber, setTrackingNumber] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [committeeId, setCommitteeId] = useState("");
  const [selectedLegislatureId, setSelectedLegislatureId] = useState("");
  const [committeeHearingDate, setCommitteeHearingDate] = useState("");
  const [ordinanceResolutionNumber, setOrdinanceResolutionNumber] =
    useState("");
  const [subjectText, setSubjectText] = useState("");
  const [remarks, setRemarks] = useState("");

  // Dropdown lists
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [legislatures, setLegislatures] = useState<Legislature[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Initial configuration setup hook
  useEffect(() => {
    const fetchDependenciesAndData = async () => {
      setIsLoading(true);
      try {
        // Fetch active workspace options
        const [committeeRes, legRes] = await Promise.all([
          api.get("/committees"),
          api.get("/legislatures/all"),
        ]);
        setCommittees(committeeRes.data);
        setLegislatures(legRes.data);

        // 2. If running under Edit Mode context, populate fields from the database
        if (isEditMode) {
          const measureRes = await api.get(`/measures/detail/${id}`);
          const data = measureRes.data;

          setTrackingNumber(data.tracking_number);
          setCrNumber(data.cr_number);
          setCommitteeId(data.committee_id.toString());
          setSelectedLegislatureId(data.legislature_id.toString());
          setCommitteeHearingDate(data.committee_hearing_date.split("T")[0]);
          setOrdinanceResolutionNumber(data.ordinance_resolution_number || "");
          setSubjectText(data.subject_text);
          setRemarks(data.remarks || "");
        }
      } catch (err) {
        notify("Failed to assemble internal entry parameters.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDependenciesAndData();
  }, [id, isEditMode]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tracking_number: trackingNumber,
      subject_text: subjectText,
      cr_number: crNumber,
      committee_id: parseInt(committeeId),
      committee_hearing_date: committeeHearingDate,
      legislature_id: parseInt(selectedLegislatureId),
      remarks,
      ordinance_resolution_number: ordinanceResolutionNumber.trim() || null,
    };

    try {
      if (isEditMode) {
        // Target explicit transactional backend update route path mapping
        await api.put(`/measures/update/${id}`, payload);
        notify("Legislative measure updated successfully.", "success");
      } else {
        await api.post("/measures/upload-measure", payload);
        notify("New legislative record created successfully.", "success");
      }
      navigate("/dashboard");
    } catch (err: any) {
      notify(
        err.response?.data?.error ||
          "Database communication error occurred.",
        "error",
      );
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        Fetching data...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-10 space-y-6">
        {/* Header Block with polymorphing titles */}
        <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span
              className={`w-2.5 h-6 rounded-sm inline-block ${isEditMode ? "bg-amber-500" : "bg-blue-600"}`}
            />
            {isEditMode
              ? `Modify Record Elements — Tracking Target [${trackingNumber}]`
              : "Document Intake — Add New Measure"}
          </h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs font-semibold text-gray-400 hover:text-gray-700"
          >
            &larr; Cancel
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Reuse the 4-column dropdown layout matrix we updated in previous segment steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                1. Tracking Number
              </label>
              <input
                type="text"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono font-bold bg-gray-50/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                2. CR Number
              </label>
              <input
                type="text"
                required
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                3. Committee
              </label>
              <select
                required
                value={committeeId}
                onChange={(e) => setCommitteeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              >
                <option value="">-- Select --</option>
                {committees.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                4. Legislature
              </label>
              <select
                required
                value={selectedLegislatureId}
                onChange={(e) => setSelectedLegislatureId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              >
                <option value="">-- Select --</option>
                {legislatures.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.term_label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                5. Hearing Date
              </label>
              <input
                type="date"
                required
                value={committeeHearingDate}
                onChange={(e) => setCommitteeHearingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                6. Ordinance / Resolution No.{" "}
                <span className="lowercase font-normal text-gray-400">
                  (nullable)
                </span>
              </label>
              <input
                type="text"
                value={ordinanceResolutionNumber}
                onChange={(e) => setOrdinanceResolutionNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                placeholder="Leave blank if pending review"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              7. Subject Content Description
            </label>
            <textarea
              required
              rows={3}
              value={subjectText}
              onChange={(e) => setSubjectText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              8. Remarks Timeline Log History
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-600 font-light"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white font-bold text-xs rounded-lg shadow-sm transition ${isEditMode ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isEditMode
                ? "Update"
                : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
