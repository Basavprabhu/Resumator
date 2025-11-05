// pages/index.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import TopBar from "../components/topbar";
import HomeContent from "../components/HomeContent";
import MyResumesModal from "../components/MyResumesModal";
import { useAuth } from "../lib/authContext";
import { ResumeService } from "../lib/resumeService";
import { logInfo, logError } from "../lib/logger";

export default function HomePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [btnLoading, setBtnLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMyResumesOpen, setIsMyResumesOpen] = useState(false);
  const [resumeCount, setResumeCount] = useState(0);

  useEffect(() => {
    // Redirect non-authenticated users to /login
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load resume count when user is available
  useEffect(() => {
    if (user?.uid) {
      loadResumeCount();
    }
  }, [user?.uid]); // loadResumeCount is stable, no need to include

  const loadResumeCount = async () => {
    if (!user?.uid) return;
    
    try {
      const resumes = await ResumeService.getUserResumes(user.uid);
      setResumeCount(resumes.length);
    } catch (error) {
      logError('Failed to load resume count', error);
      // Don't show error to user for this, just log it
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthError(null);
      setBtnLoading(true);
      await logout();
      logInfo("User signed out");
      router.push("/login");
    } catch (err: any) {
      logError("Sign out failed", err);
      setAuthError(err?.message ?? "Failed to sign out");
    } finally {
      setBtnLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <TopBar 
        user={user} 
        onSignOut={handleSignOut} 
        btnLoading={btnLoading} 
        authError={authError}
        onOpenMyResumes={() => setIsMyResumesOpen(true)}
        resumeCount={resumeCount}
      />
      <HomeContent />
      
      {/* My Resumes Modal */}
      {user?.uid && (
        <MyResumesModal
          isOpen={isMyResumesOpen}
          onClose={() => {
            setIsMyResumesOpen(false);
            loadResumeCount(); // Refresh count when modal closes
          }}
          userId={user.uid}
        />
            )}
      </div>
    );
  }




// // pages/index.tsx
// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import TemplatePreview from "./components/templatepreview";
// import TemplatesIndex from "./components/templateindex";
// import { logInfo, logError } from "./lib/logger";
// import ProfessionalTemplate from "./components/templates/minimal";
// import ProfessionalTemplate2 from "./components/templates/modern";
// import { ResumeData } from "../pages/types/resume";
// import { useAuth } from "./lib/authContext";
// import CreativeTemplate from "./components/templates/creative";
// import { preprocessResume } from "./lib/resumePreprocess";

// /** Minimal spinner */
// function Spinner() {
//   return (
//     <div className="flex items-center justify-center py-2">
//       <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
//       </svg>
//     </div>
//   );
// }

// /** Main app content (requires authenticated user) */
// function HomeContent() {
//   const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
//   const [rawData, setRawData] = useState("");
//   const [targetRole, setTargetRole] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   const [resumeData, setResumeData] = useState<ResumeData | null>(null);

//   const handleTemplateSelect = (id: string) => {
//     try {
//       logInfo("Template selected", { id });
//       setSelectedTemplate(id);
//       setResumeData(null); // reset any previous generated resume
//       setErrorMsg(null);
//     } catch (err) {
//       logError("Failed to select template", err);
//     }
//   };

// const handleSubmit = async () => {
//   setErrorMsg(null);

//   if (!selectedTemplate) {
//     setErrorMsg("Please select a template.");
//     return;
//   }
//   if (!rawData.trim()) {
//     setErrorMsg("Please paste your career details in the text box.");
//     return;
//   }
//   if (!targetRole.trim()) {
//     setErrorMsg("Please add the target job role.");
//     return;
//   }

//   setLoading(true);

//   // use AbortController to avoid hanging requests (30s timeout)
//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), 30_000);

//   try {
//     const resp = await fetch("/api/generateResume", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ rawText: rawData, targetRole, templateId: selectedTemplate }),
//       signal: controller.signal,
//     });

//     // try to parse JSON safely
//     let payload: any = null;
//     try {
//       payload = await resp.json();
//     } catch (parseErr) {
//       logError("Failed to parse JSON from /api/generateResume", parseErr);
//       setErrorMsg("Unexpected response from server.");
//       return;
//     }

//     if (!resp.ok) {
//       logError("API returned non-OK", { status: resp.status, payload });
//       setErrorMsg(payload?.error ?? `Server returned ${resp.status}`);
//       return;
//     }

//     const data = payload?.data as ResumeData | undefined;
//     if (!data || !data.name) {
//       logError("Invalid or empty resume data from API", { payload });
//       setErrorMsg("Model returned invalid resume data.");
//       return;
//     }

//     logInfo("Received structured resume", { name: data.name });

//     // preprocess layout (safe wrapped)
//     try {
//       const processed = preprocessResume(data);
//       setResumeData(processed as any); // has _layout hints
//       logInfo("Resume preprocessed for layout", { name: processed.name, layout: processed._layout });
//     } catch (preErr) {
//       logError("Preprocessing failed, falling back to raw data", preErr);
//       setResumeData(data);
//     }
//   } catch (err: any) {
//     if (err?.name === "AbortError") {
//       logError("Resume generation request aborted (timeout)", err);
//       setErrorMsg("Request timed out. Please try again.");
//     } else {
//       logError("Generation failed", err);
//       setErrorMsg(err?.message ?? "Unknown error");
//     }
//   } finally {
//     clearTimeout(timeoutId);
//     setLoading(false);
//   }
// };


//   /** Render final template */
//   const renderFinalTemplate = () => {
//     if (!resumeData) return null;
//     switch (selectedTemplate) {
//       case "template-professional":
//         return <ProfessionalTemplate data={resumeData} />;
//       case "template-modern":
//         return <ProfessionalTemplate2 data={resumeData} />;
//       case "template-creative":
//         return <CreativeTemplate data={resumeData} />;  
//       default:
//         return <ProfessionalTemplate data={resumeData} />;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <header className="text-center py-6">
//         <h1 className="text-3xl font-bold text-blue-700">AI Resume Builder</h1>
//         <p className="text-gray-800 mt-2">
//           Choose a template, paste your raw career text, specify target role — AI will structure it into a resume.
//         </p>
//       </header>

//       <section className="max-w-6xl mx-auto py-6">
//         <h2 className="text-2xl font-semibold mb-4 text-gray-900">Choose a Template</h2>
//         <TemplatesIndex selectedTemplate={selectedTemplate} onSelect={handleTemplateSelect} />
//       </section>

//       <section className="max-w-3xl mx-auto py-6">
//         <h2 className="text-xl font-semibold mb-3 text-gray-900">Add Your Details</h2>

//         <textarea
//           className="w-full border rounded-lg p-3 mb-4 text-gray-900"
//           rows={8}
//           placeholder="Paste your career details (education, experience, skills, etc.)"
//           value={rawData}
//           onChange={(e) => setRawData(e.target.value)}
//         />

//         <input
//           className="w-full border rounded-lg p-3 mb-4 text-gray-900"
//           type="text"
//           placeholder="Target Job Role (e.g. Frontend Developer)"
//           value={targetRole}
//           onChange={(e) => setTargetRole(e.target.value)}
//         />

//         {errorMsg && <div className="mb-4 text-red-600 font-medium">{errorMsg}</div>}

//         <div className="flex gap-3">
//           <button
//             onClick={handleSubmit}
//             disabled={loading}
//             className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-60"
//           >
//             {loading ? <Spinner /> : null}
//             Generate Resume
//           </button>

//           <button
//             onClick={() => {
//               setRawData("");
//               setTargetRole("");
//               setResumeData(null);
//               setErrorMsg(null);
//               setLoading(false);
//             }}
//             className="px-4 py-2 border rounded-md"
//           >
//             Reset
//           </button>
//         </div>
//       </section>

//       {/* Show generated resume */}
//       <section className="max-w-4xl mx-auto py-8">
//         {loading && (
//           <div className="flex items-center justify-center py-6">
//             <Spinner />
//             <span className="ml-3 text-gray-700">Generating resume — this may take a few seconds...</span>
//           </div>
//         )}

//         {resumeData && (
//           <>
//             <h2 className="text-2xl font-semibold mb-4 text-gray-900">Generated Resume</h2>
//             <div className="bg-white p-6 rounded-lg shadow">
//               {renderFinalTemplate()}
//             </div>
//           </>
//         )}
//       </section>
//     </div>
//   );
// }

// /** Page wrapper that enforces authentication and shows sign out button */
// export default function HomePage() {
//   const { user, loading: authLoading, logout } = useAuth();
//   const router = useRouter();
//   const [btnLoading, setBtnLoading] = useState(false);
//   const [authError, setAuthError] = useState<string | null>(null);

//   useEffect(() => {
//     // Redirect non-authenticated users to /login
//     if (!authLoading && !user) {
//       router.push("/login");
//     }
//   }, [user, authLoading, router]);

//   const handleSignOut = async () => {
//     try {
//       setAuthError(null);
//       setBtnLoading(true);
//       await logout();
//       logInfo("User signed out");
//       // logout() in your AuthProvider should redirect to /login, but ensure router state
//       router.push("/login");
//     } catch (err: any) {
//       logError("Sign out failed", err);
//       setAuthError(err?.message ?? "Failed to sign out");
//     } finally {
//       setBtnLoading(false);
//     }
//   };

//   if (authLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Spinner />
//       </div>
//     );
//   }

//   // If user is not present, show nothing here (redirect triggers in useEffect).
//   if (!user) {
//     return null;
//   }

//   return (
//     <div>
//       {/* Top bar with user info + sign out */}
//       <div className="bg-white border-b shadow-sm">
//         <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <h2 className="text-lg font-semibold text-gray-800">Welcome, {user.displayName ?? user.email}</h2>
//             <span className="text-sm text-gray-500">Explore AI Resume features</span>
//           </div>
//           <div className="flex items-center gap-3">
//             {authError && <div className="text-sm text-red-600 mr-2">{authError}</div>}
//             <button
//               onClick={handleSignOut}
//               disabled={btnLoading}
//               className="px-3 py-1 rounded-md border text-red-600 bg-white hover:bg-gray-900 hover:text-white disabled:opacity-60"
//             >
//               {btnLoading ? "Signing out..." : "Sign out"}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main content */}
//       <HomeContent />
//     </div>
//   );
// }
