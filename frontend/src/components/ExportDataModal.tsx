import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNotifications } from "../context/NotificationContext";
import api from "../services/api";

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  measures: any[];
}

export default function ExportDataModal({
  isOpen,
  onClose,
  measures,
}: ExportDataModalProps) {
  const notify = useNotifications();
  const [committees, setCommittees] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [legislatures, setLegislatures] = useState<
    { id: number; term_label: string }[]
  >([]);
  const [selectedCommittee, setSelectedCommittee] = useState("ALL");
  const [selectedLegislature, setSelectedLegislature] = useState("ALL");
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf">("excel");

  useEffect(() => {
    if (isOpen) {
      Promise.all([api.get("/committees"), api.get("/legislatures/all")])
        .then(([commRes, legRes]) => {
          setCommittees(commRes.data);
          setLegislatures(legRes.data);
        })
        .catch(() => notify("Could not load filter registries.", "error"));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = () => {
    // 1. Filter records based on committee selection
    const dataToExport = measures.filter((m) => {
      const matchesLegislature =
        selectedLegislature === "ALL" ||
        m.legislature_id?.toString() === selectedLegislature;
      const matchesCommittee =
        selectedCommittee === "ALL" ||
        m["CR NO."]?.toLowerCase().includes(selectedCommittee.toLowerCase());
      return matchesLegislature && matchesCommittee;
    });

    if (dataToExport.length === 0) {
      notify("No legislative records match the selected filters.", "warning");
      return;
    }

    const activeLegObj = legislatures.find(
      (l) => l.id.toString() === selectedLegislature,
    );
    const legLabel =
      selectedLegislature === "ALL"
        ? "All Terms"
        : activeLegObj?.term_label || "Filtered Term";

    // 2. Map clean export columns
    const formattedRows = dataToExport.map((m) => ({
      "Tracking No.": m["Tracking No."],
      Subject: m.Subject,
      "CR No. / Committee": m["CR NO."],
      "Hearing Date": new Date(m["Committee Hearing Date"]).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      ),
      "Ordinance / Res. No.":
        m["Ordinance/Resolution No."] || "Pending Enactment",
      Remarks: m.Remarks || "",
    }));

    const fileNamePrefix =
      selectedCommittee === "ALL"
        ? "eLTS_All_Measures"
        : `eLTS_${selectedCommittee.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const dateStamp = new Date().toISOString().split("T")[0];

    // 3. Generate Excel File (.xlsx)
    if (exportFormat === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(formattedRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Legislative Measures");
      XLSX.writeFile(workbook, `${fileNamePrefix}_${dateStamp}.xlsx`);
      notify("Excel spreadsheet downloaded successfully.", "success");
    }
    // 4. Generate Landscape PDF Report (.pdf)
    else {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text("eLegislative Tracking System (eLTS) — Master Report", 14, 15);
      doc.text(legLabel, 14, 20);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        `Filter: ${selectedCommittee === "ALL" ? "All Committees" : selectedCommittee} | Generated: ${dateStamp}`,
        14,
        25,
      );

      autoTable(doc, {
        startY: 26,
        head: [
          [
            "Tracking No.",
            "Subject",
            "CR No. / Committee",
            "Hearing Date",
            "Ord / Res No.",
            "Remarks",
          ],
        ],
        body: formattedRows.map((row) => Object.values(row)),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [37, 99, 235] }, // Corporate Blue-600
        columnStyles: {
          1: { cellWidth: 85 }, // Give Subject column breathing room
          5: { cellWidth: 50 },
        },
      });

      doc.save(`${fileNamePrefix}_${dateStamp}.pdf`);
      notify("PDF report downloaded successfully.", "success");
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900">
            Export Legislative Records
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filter Scope Selector */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              1. Filter by Legislature Term
            </label>
            <select
              value={selectedLegislature}
              onChange={(e) => setSelectedLegislature(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Select All Legislatures (All Years)</option>
              {legislatures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.term_label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              1. Filter by Committee
            </label>
            <select
              value={selectedCommittee}
              onChange={(e) => setSelectedCommittee(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Select All Committees (Full Registry)</option>
              {committees.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* File Format Radio Cards */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              2. Select Export File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat("excel")}
                className={`p-3 rounded-xl border text-left transition flex items-center space-x-2.5 ${
                  exportFormat === "excel"
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-800 ring-1 ring-emerald-600"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className="text-lg">📊</span>
                <div>
                  <p className="text-xs font-bold">Excel (.xlsx)</p>
                  <p className="text-[10px] text-gray-500 font-light">
                    Spreadsheet data
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat("pdf")}
                className={`p-3 rounded-xl border text-left transition flex items-center space-x-2.5 ${
                  exportFormat === "pdf"
                    ? "border-red-600 bg-red-50/50 text-red-800 ring-1 ring-red-600"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className="text-lg">📄</span>
                <div>
                  <p className="text-xs font-bold">PDF Document</p>
                  <p className="text-[10px] text-gray-500 font-light">
                    Printable table
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-xs font-semibold text-gray-500 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            Download {exportFormat === "excel" ? "Excel" : "PDF"} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
