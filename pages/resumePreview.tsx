"use client";

import { useRouter } from "next/router";
import { ResumeData } from "../types/resume";
import { renderTemplate } from "../lib/templateRegistry";
import { useState, useEffect } from "react";
import { logInfo, logError } from "../lib/logger";
import ResumeFormEditor from "../components/ResumeFormEditor";
import { ResumeService } from "../lib/resumeService";
import { showSuccess, showError } from "../lib/notifications";
import { useAuth } from "../lib/authContext";
import { preprocessResume, ProcessedResume } from "../lib/resumePreprocess";
import ResumeReplacementModal from "../components/ResumeReplacementModal";
import { SavedResume } from "../types/resume";

export default function ResumePreview() {
  const router = useRouter();
  const { user } = useAuth();
  const { template, data, id } = router.query; // Added 'id' for saved resumes
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [processedResumeData, setProcessedResumeData] = useState<ProcessedResume | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalResumeData, setOriginalResumeData] = useState<ResumeData | null>(null);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [userResumes, setUserResumes] = useState<SavedResume[]>([]);
  const [isReplacing, setIsReplacing] = useState(false);

  // Initialize data and tracking
  useEffect(() => {
    if (id && typeof id === 'string') {
      setResumeId(id);
    }
    
    if (data) {
      try {
        const parsed = JSON.parse(data as string);
        setResumeData(parsed);
        setOriginalResumeData(parsed);
        
        // Preprocess the resume data for consistent layout
        try {
          const processed = preprocessResume(parsed);
          setProcessedResumeData(processed);
          logInfo('Resume data loaded and preprocessed', { hasId: !!id, template, compactMode: processed._layout?.compactMode });
        } catch (preprocessError) {
          logError("Failed to preprocess resume data", preprocessError);
          // Fallback to raw data if preprocessing fails
          setProcessedResumeData(parsed as ProcessedResume);
          logInfo('Resume data loaded with fallback', { hasId: !!id, template });
        }
      } catch (error) {
        logError("Failed to parse resume data", error);
        showError('Invalid resume data', 'Please try generating the resume again');
      }
    }
  }, [data, id, template]);

  // Track unsaved changes
  useEffect(() => {
    if (originalResumeData && resumeData) {
      const hasChanges = JSON.stringify(originalResumeData) !== JSON.stringify(resumeData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [originalResumeData, resumeData]);

  // Early returns after hooks
  if (!data || !template) {
    logError("Missing template or data parameters", { template, hasData: !!data });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Loading Resume...</h1>
          <p className="text-gray-600 mt-2">Please wait while we prepare your resume for viewing.</p>
          <button 
            onClick={() => router.push('/')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Resume</h1>
          <p className="text-gray-600 mt-2">Invalid resume data. Please try generating again.</p>
          <button 
            onClick={() => router.push('/')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    setIsExporting(true);
    
    // Create a temporary full-size resume for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-resume-container';
    printContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 210mm;
      min-height: 297mm;
      background: white;
      padding: 8mm 5mm;
      box-sizing: border-box;
    `;
    
    // Clone the resume content
    const resumeContent = document.querySelector('#resume-container-mobile, #resume-container');
    if (resumeContent) {
      const clonedContent = resumeContent.cloneNode(true) as HTMLElement;
      clonedContent.style.transform = 'none'; // Remove any scaling
      clonedContent.style.margin = '0';
      clonedContent.style.padding = '0';
      printContainer.appendChild(clonedContent);
    }
    
    document.body.appendChild(printContainer);
    
    setTimeout(() => {
      window.print();
      document.body.removeChild(printContainer);
      setIsExporting(false);
    }, 100);
  };

  const handleEditSave = async (updatedData: ResumeData) => {
    setIsSaving(true);
    try {
      // Update localStorage only
      const savedState = localStorage.getItem('resumeBuilder_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        parsed.resumeData = updatedData;
        localStorage.setItem('resumeBuilder_state', JSON.stringify(parsed));
      }
      
      // Update local state and reprocess
      setResumeData(updatedData);
      
      // Reprocess the updated data for consistent layout
      try {
        const processed = preprocessResume(updatedData);
        setProcessedResumeData(processed);
        logInfo("Resume updated and reprocessed", { compactMode: processed._layout?.compactMode });
      } catch (preprocessError) {
        logError("Failed to reprocess updated resume data", preprocessError);
        // Fallback to raw data if preprocessing fails
        setProcessedResumeData(updatedData as ProcessedResume);
      }
      
      setEditMode(false);
      
      showSuccess('Changes saved locally', 'Click "Save Resume" to save to cloud');
      logInfo("Resume updated locally");
    } catch (error) {
      logError("Failed to save changes locally", error);
      showError('Save failed', 'Unable to save your changes locally.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToFirebase = async (replaceResumeId?: string) => {
    if (!resumeData || !user?.uid) return;
    
    setIsSaving(true);
    try {
      if (resumeId) {
        // Update existing resume
        await ResumeService.updateResume(user.uid, resumeId, resumeData, template as string);
        showSuccess('Resume saved', 'Your resume has been saved successfully');
      } else {
        // Save as new resume
        const newResumeId = await ResumeService.saveResume(user.uid, resumeData, template as string, replaceResumeId);
        setResumeId(newResumeId);
        showSuccess('Resume saved', replaceResumeId ? 'Resume replaced successfully' : 'Your resume has been saved successfully');
        
        // Update URL to include the new ID
        const queryParams = new URLSearchParams({
          template: template as string,
          data: JSON.stringify(resumeData),
          id: newResumeId
        });
        router.replace(`/resumePreview?${queryParams.toString()}`, undefined, { shallow: true });
      }
      
      // Reset unsaved changes indicator
      setOriginalResumeData(resumeData);
      
      logInfo("Resume saved successfully", { resumeId, isNew: !resumeId, replaced: !!replaceResumeId });
    } catch (error) {
      logError("Failed to save resume to Firebase", error);
      
      // Handle resume limit exceeded
      if (error instanceof Error && error.message === 'RESUME_LIMIT_EXCEEDED') {
        const userResumesData = (error as any).userResumes as SavedResume[];
        setUserResumes(userResumesData);
        setShowReplacementModal(true);
        return;
      }
      
      showError('Save failed', 'Unable to save your resume to Firebase. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplaceResume = async (replaceResumeId: string) => {
    setIsReplacing(true);
    try {
      await handleSaveToFirebase(replaceResumeId);
      setShowReplacementModal(false);
    } catch (error) {
      logError("Failed to replace resume", error);
      showError('Replace failed', 'Unable to replace the resume. Please try again.');
    } finally {
      setIsReplacing(false);
    }
  };

  const handleCancelReplacement = () => {
    setShowReplacementModal(false);
    setUserResumes([]);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    logInfo("Edit mode cancelled");
  };





  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Controls - Hidden during print */}
      <div className="bg-white border-b shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2 truncate">
                <span className="truncate">{editMode ? 'Edit Resume' : 'Resume Preview'}</span>
                {hasUnsavedChanges && !editMode && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 whitespace-nowrap">
                    Unsaved changes
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {resumeData.name} - {template} 
                {resumeId && <span className="text-gray-400 hidden sm:inline"> • Saved resume</span>}
              </p>
            </div>
            
            {/* Desktop Button Layout */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
              >
                ← Back to Editor
              </button>

              {!editMode && (
                <button
                  onClick={() => handleSaveToFirebase()}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    hasUnsavedChanges 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'border border-blue-300 text-blue-600 hover:bg-blue-50'
                  } disabled:opacity-50`}
                >
                  {isSaving ? 'Saving...' : '💾 Save Resume'}
                </button>
              )}

              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 border rounded-md font-medium text-sm ${
                  editMode 
                    ? 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600' 
                    : 'border-orange-300 text-orange-600 hover:bg-orange-50'
                }`}
              >
                {editMode ? "📄 Cancel Edit" : "✏️ Edit Resume"}
              </button>

              <button
                onClick={() => {
                  const confirmed = window.confirm(
                    "⚠️ Generate New Resume\n\nThis will discard your current resume and clear all saved data. Are you sure you want to continue?"
                  );
                  if (confirmed) {
                    localStorage.removeItem('resumeBuilder_state');
                    router.push('/');
                  }
                }}
                className="px-4 py-2 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 text-sm"
              >
                🆕 Generate New Resume
              </button>
              
              <button
                onClick={handlePrint}
                disabled={isExporting || editMode}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
              >
                {isExporting ? "Preparing..." : "🖨️ Print to PDF"}
              </button>
            </div>

            {/* Mobile/Tablet Button Layout */}
            <div className="lg:hidden">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                >
                  ← Back
                </button>

                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`flex-1 sm:flex-none px-3 py-2 border rounded-md font-medium text-sm ${
                    editMode 
                      ? 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600' 
                      : 'border-orange-300 text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  {editMode ? "📄 Cancel" : "✏️ Edit"}
                </button>

                <button
                  onClick={handlePrint}
                  disabled={isExporting || editMode}
                  className="flex-1 sm:flex-none px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
                >
                  {isExporting ? "..." : "🖨️ Print"}
                </button>
              </div>

              {/* Second row for less common actions */}
              <div className="flex gap-2 mt-2">
                {!editMode && (
                  <button
                    onClick={() => handleSaveToFirebase()}
                    disabled={isSaving}
                    className={`flex-1 px-3 py-2 rounded-md font-medium text-sm ${
                      hasUnsavedChanges 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'border border-blue-300 text-blue-600 hover:bg-blue-50'
                    } disabled:opacity-50`}
                  >
                    {isSaving ? 'Saving...' : '💾 Save Resume'}
                  </button>
                )}

                <button
                  onClick={() => {
                    const confirmed = window.confirm(
                      "⚠️ Generate New Resume\n\nThis will discard your current resume and clear all saved data. Are you sure you want to continue?"
                    );
                    if (confirmed) {
                      localStorage.removeItem('resumeBuilder_state');
                      router.push('/');
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 text-sm"
                >
                  🆕 New Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* Editor or Resume Content */}
      {editMode ? (
        <div className="py-4 sm:py-6 lg:py-8">
          <ResumeFormEditor
            initialData={resumeData!}
            onSave={handleEditSave}
            onCancel={handleCancelEdit}
            isSaving={isSaving}
          />
        </div>
      ) : (
        <div className="py-4 sm:py-6 lg:py-8">
                     {/* Mobile/Tablet: Scaled down resume that fits viewport */}
           <div className="block lg:hidden px-4">
             <div className="w-full flex justify-center" style={{ height: '520px', overflow: 'hidden' }}>
               <div 
                 className="bg-white shadow-lg border border-gray-200"
                 style={{
                   width: '210mm',
                   minHeight: '297mm',
                   transform: 'scale(0.45)',
                   transformOrigin: 'top center',
                   marginTop: '0'
                 }}
               >
                 <div
                   id="resume-container-mobile"
                   className="p-8"
                 >
                   {processedResumeData && renderTemplate(template as string, processedResumeData)}
                 </div>
               </div>
             </div>

             
           </div>

          {/* Desktop: A4 proportions maintained */}
          <div className="hidden lg:block px-4">
    <div
      id="resume-container"
              className="bg-white mx-auto shadow-lg border border-gray-200 print:shadow-none print:border-0"
              style={{
                width: '210mm',
                minHeight: '297mm',
                maxWidth: '100%',
                margin: '0 auto'
              }}
            >
              <div className="p-8 print:p-6">
                {processedResumeData && renderTemplate(template as string, processedResumeData)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Instructions - Hidden during print
      <div className="bg-blue-50 border-t no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="text-blue-600 text-lg sm:text-xl flex-shrink-0">💡</div>
            <div className="text-xs sm:text-sm text-blue-800 min-w-0">
              <p className="font-medium">For best print results:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li className="hidden sm:list-item">Click "Print to PDF" button above</li>
                <li className="sm:hidden">Tap "Print" button above</li>
                <li>In print dialog: Set margins to "Minimum"</li>
                <li className="hidden sm:list-item">Enable "Background graphics" option</li>
                <li className="sm:hidden">Enable "Background graphics"</li>
                <li>Select "Save as PDF" and click Save</li>
              </ul>
            </div>
          </div>
        </div>
      </div> */}

      {/* Resume Replacement Modal */}
      <ResumeReplacementModal
        isOpen={showReplacementModal}
        userResumes={userResumes}
        onReplace={handleReplaceResume}
        onCancel={handleCancelReplacement}
        isReplacing={isReplacing}
      />
    </div>
  );
}
