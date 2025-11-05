// pages/components/GeneratedResume.tsx
"use client";

import React, { useRef, useState } from "react";
import ProfessionalTemplate from "./templates/minimal";
import ModernTemplate from "./templates/modern";
import CreativeTemplate from "./templates/creative";
import { ResumeData } from "../types/resume";
import { exportResumeToPDFClient, printResume} from "../lib/clientPdfExport";

type Props = {
  resumeData: ResumeData;
  selectedTemplate: string;
};

export default function GeneratedResume({ resumeData, selectedTemplate }: Props) {
  const resumeRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const renderFinalTemplate = () => {
    switch (selectedTemplate) {
      case "template-professional":
        return <ProfessionalTemplate data={resumeData} />;
      case "template-modern":
        return <ModernTemplate data={resumeData} />;
      case "template-creative":
        return <CreativeTemplate data={resumeData} />;
      default:
        return <ProfessionalTemplate data={resumeData} />;
    }
  };

  // Client-side PDF export with oklch fix
  const handleClientSideExport = async () => {
    setIsExporting(true);
    try {
      const filename = resumeData.name || "resume";
      await exportResumeToPDFClient("resume-container", filename);
    } catch (err) {
      console.error("Client-side export failed:", err);
      alert("Export failed. Please try the browser print option.");
    } finally {
      setIsExporting(false);
    }
  };

  // Browser print to PDF (most reliable)
  const handlePrintToPDF = () => {
    window.print();
  };

  // Server-side export (if available)
  const handleServerSideExport = async () => {
    setIsExporting(true);
    try {
      const resp = await fetch("/api/exportResume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedTemplate,
          resumeData,
        }),
      });

      if (!resp.ok) {
        throw new Error("Server export failed");
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(resumeData.name || "resume").replace(/\s+/g, "_")}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Server-side export failed", err);
      alert("Server export failed. Please try the browser print option.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Primary recommendation */}
        <button 
          onClick={handlePrintToPDF}
          disabled={isExporting}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          📄 Print to PDF (Recommended)
        </button>
        
        {/* Alternative methods */}
        <button 
          onClick={handleClientSideExport}
          disabled={isExporting}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isExporting ? "Generating..." : "📱 Client Export"}
        </button>
        
        <button 
          onClick={handleServerSideExport}
          disabled={isExporting}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {isExporting ? "Generating..." : "🖥️ Server Export"}
        </button>

        {/* Dev helper */}
        <button
          onClick={() => {
            navigator.clipboard?.writeText(JSON.stringify(resumeData, null, 2));
            alert("Resume JSON copied to clipboard");
          }}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          📋 Copy JSON
        </button>
      </div>

      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
        <p><strong>💡 For best results:</strong></p>
        <ul className="list-disc ml-5 mt-1 space-y-1">
          <li><strong>"Print to PDF"</strong> - Uses browser's built-in PDF generation (most reliable)</li>
          <li><strong>"Client Export"</strong> - Generates PDF in browser (good for Firebase hosting)</li>
          <li><strong>"Server Export"</strong> - Uses server-side rendering (requires backend)</li>
        </ul>
        <p className="mt-2 text-xs">If "Print to PDF" opens print dialog, select "Save as PDF" as destination.</p>
      </div>

      {/* Resume Preview */}
      <div id="resume-container" ref={resumeRef} className="relative">
        {renderFinalTemplate()}
      </div>
    </div>
  );
}