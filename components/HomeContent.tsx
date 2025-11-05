// pages/components/HomeContent.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

import TemplatesIndex from "./templateindex";
import { logInfo, logError } from "../lib/logger";

import { ResumeData } from "../types/resume";
import { preprocessResume } from "../lib/resumePreprocess";
import ProfileDataExtractor, { SocialProfileData } from "../lib/profileDataExtractor";
import { showSuccess, showError, showInfo } from "../lib/notifications";
import ResumeFormEditor from "./ResumeFormEditor";

// Reusable form input component from ResumeFormEditor
interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  type?: 'text' | 'email' | 'tel';
  error?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 1000,
  required = false,
  type = 'text',
  error
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm sm:text-base font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        className={`w-full p-2 sm:p-3 text-sm sm:text-base border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        maxLength={maxLength}
      />
      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
      {maxLength && (
        <div className="text-right">
          <span className={`text-xs sm:text-sm ${value.length > maxLength * 0.8 ? 'text-orange-500' : 'text-gray-400'}`}>
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
};

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  rows?: number;
  error?: string;
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 5000,
  required = false,
  rows = 4,
  error
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm sm:text-base font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={rows}
        className={`w-full p-2 sm:p-3 text-sm sm:text-base border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        maxLength={maxLength}
      />
      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
      {maxLength && (
        <div className="text-right">
          <span className={`text-xs sm:text-sm ${value.length > maxLength * 0.8 ? 'text-orange-500' : 'text-gray-400'}`}>
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
};

/** Progress Loading Modal */
interface LoadingModalProps {
  progress: number;
  subtitle: string;
}

function LoadingModal({ progress, subtitle }: LoadingModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-sm sm:max-w-md shadow-2xl">
        <div className="text-center">
          <div className="mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Generating Resume</h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">{subtitle}</p>
          </div>
          
          <div className="mb-3 sm:mb-4">
            <div className="flex justify-between text-sm sm:text-base text-gray-600 mb-2">
              <span>Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
              <div 
                className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-500">Please wait while we process your information...</p>
        </div>
      </div>
    </div>
  );
}

export default function HomeContent() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [rawData, setRawData] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [fullName, setFullName] = useState(""); // New mandatory name field
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingSubtitle, setLoadingSubtitle] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [inputMode, setInputMode] = useState<'textarea' | 'form'>('textarea'); // New toggle for input mode
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formResumeData, setFormResumeData] = useState<ResumeData | null>(null);
  
  // New social profile fields
  const [profileImage, setProfileImage] = useState<string>("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [extractingGithubData, setExtractingGithubData] = useState(false);
  const [socialProfileData, setSocialProfileData] = useState<SocialProfileData>({});

  // Load state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('resumeBuilder_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setSelectedTemplate(parsed.selectedTemplate || null);
        setRawData(parsed.rawData || "");
        setTargetRole(parsed.targetRole || "");
        setFullName(parsed.fullName || ""); // Load saved name
        setResumeData(parsed.resumeData || null);
        setProfileImage(parsed.profileImage || "");
        setGithubUrl(parsed.githubUrl || "");
        setLinkedinUrl(parsed.linkedinUrl || "");
        setSocialProfileData(parsed.socialProfileData || {});
        setInputMode(parsed.inputMode || 'textarea'); // Load saved input mode
        setFormResumeData(parsed.formResumeData || null); // Load saved form data
      } catch (err) {
        logError("Failed to load saved state", err);
      }
    }
  }, []);

  // Save state to localStorage whenever key values change
  useEffect(() => {
    const stateToSave = {
      selectedTemplate,
      rawData,
      targetRole,
      fullName, // Save name
      resumeData,
      profileImage,
      githubUrl,
      linkedinUrl,
      socialProfileData,
      inputMode, // Save input mode
      formResumeData // Save form data
    };
    localStorage.setItem('resumeBuilder_state', JSON.stringify(stateToSave));
  }, [selectedTemplate, rawData, targetRole, fullName, resumeData, profileImage, githubUrl, linkedinUrl, socialProfileData, inputMode, formResumeData]);

  const handleTemplateSelect = (id: string) => {
    try {
      logInfo("Template selected", { id });
      setSelectedTemplate(id);
      setResumeData(null); // reset any previous generated resume
      setErrorMsg(null);
    } catch (err) {
      logError("Failed to select template", err);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Always try to compress the image, regardless of initial size
      showInfo('Processing image', 'Compressing image to optimize size...');

      const dataUrl = await ProfileDataExtractor.convertImageToDataUrl(file);
      setProfileImage(dataUrl);
      showSuccess('Image uploaded', 'Profile image has been compressed and added successfully');
      logInfo('Profile image uploaded and compressed', { 
        originalSize: file.size, 
        fileType: file.type
      });
    } catch (error: any) {
      logError('Failed to upload and compress image', error);
      if (error?.message?.includes('cannot be compressed below 100KB')) {
        showError('Image too large', 'This image is too large and cannot be compressed below 100KB. Please use a smaller image or crop it first.');
      } else {
        showError('Upload failed', 'Unable to process the image. Please try a different image.');
      }
    }
  };

  const handleGithubExtraction = async () => {
    if (!githubUrl.trim()) return;

    setExtractingGithubData(true);
    try {
      showInfo('Extracting GitHub data', 'Please wait while we fetch your profile information...');
      
      const githubData = await ProfileDataExtractor.extractGitHubData(githubUrl);
      
      if (githubData) {
        setSocialProfileData(prev => ({ ...prev, github: githubData }));
        showSuccess('GitHub data extracted', `Found ${githubData.languages.length} languages and ${githubData.topRepositories.length} top repositories`);
        logInfo('GitHub data extracted successfully', { username: githubData.name });
      } else {
        showError('GitHub extraction failed', 'Unable to extract data. Please check the URL and try again.');
      }
    } catch (error) {
      logError('GitHub extraction failed', error);
      showError('GitHub extraction failed', 'Unable to extract data. Please check the URL and try again.');
    } finally {
      setExtractingGithubData(false);
    }
  };

  const handleLinkedInProcess = () => {
    if (!linkedinUrl.trim()) return;

    const linkedinData = ProfileDataExtractor.processLinkedInUrl(linkedinUrl);
    if (linkedinData) {
      setSocialProfileData(prev => ({ ...prev, linkedin: linkedinData }));
      showSuccess('LinkedIn URL saved', 'LinkedIn profile URL has been added to your resume data');
      logInfo('LinkedIn URL processed', { url: linkedinData.profileUrl });
    } else {
      showError('Invalid LinkedIn URL', 'Please enter a valid LinkedIn profile URL');
    }
  };

  // Initialize form data for form-based input
  const initializeFormData = (): ResumeData => {
    if (formResumeData) {
      return formResumeData;
    }

    return {
      name: fullName,
      title: targetRole,
      photoUrl: profileImage,
      contact: {
        email: '',
        phone: '',
        address: '',
        linkedin: linkedinUrl
      },
      summary: '',
      experience: [{
        role: '',
        company: '',
        duration: '',
        description: ['']
      }],
      education: [{
        degree: '',
        school: '',
        year: ''
      }],
      certifications: [],
      achivements: [],
      volunteer: [],
      skills: [],
      softSkills: [],
      languages: [],
      interests: []
    };
  };

  const handleFormDataSave = async (updatedFormData: ResumeData) => {
    try {
      setFormResumeData(updatedFormData);
      
      // Convert form data to raw text for AI processing
      const formToText = convertFormDataToText(updatedFormData);
      setRawData(formToText);
      
      showSuccess('Form data saved', 'Your structured data has been saved and converted to text format');
      logInfo('Form data saved and converted to text', { name: updatedFormData.name });
    } catch (error) {
      logError('Failed to save form data', error);
      throw error;
    }
  };

  const convertFormDataToText = (data: ResumeData): string => {
    let text = '';
    
    if (data.name) text += `Name: ${data.name}\n`;
    if (data.title) text += `Title: ${data.title}\n`;
    if (data.summary) text += `\nSummary:\n${data.summary}\n`;
    
    if (data.contact?.email) text += `\nContact:\nEmail: ${data.contact.email}\n`;
    if (data.contact?.phone) text += `Phone: ${data.contact.phone}\n`;
    if (data.contact?.address) text += `Address: ${data.contact.address}\n`;
    
    if (data.experience?.length > 0) {
      text += '\nWork Experience:\n';
      data.experience.forEach((exp, i) => {
        text += `${i + 1}. ${exp.role} at ${exp.company} (${exp.duration})\n`;
        exp.description.forEach(desc => {
          if (desc.trim()) text += `   - ${desc}\n`;
        });
      });
    }
    
    if (data.education?.length > 0) {
      text += '\nEducation:\n';
      data.education.forEach((edu, i) => {
        text += `${i + 1}. ${edu.degree} from ${edu.school} (${edu.year})\n`;
      });
    }
    
    if (data.skills && data.skills.length > 0) {
      text += `\nTechnical Skills: ${data.skills.join(', ')}\n`;
    }
    
    if (data.softSkills && data.softSkills.length > 0) {
      text += `Soft Skills: ${data.softSkills.join(', ')}\n`;
    }
    
    if (data.languages && data.languages.length > 0) {
      text += `Languages: ${data.languages.join(', ')}\n`;
    }
    
    if (data.certifications && data.certifications.length > 0) {
      text += '\nCertifications:\n';
      data.certifications.forEach(cert => {
        text += `- ${cert.name} ${cert.year ? `(${cert.year})` : ''}\n`;
      });
    }
    
    if (data.achivements && data.achivements.length > 0) {
      text += '\nAchievements:\n';
      data.achivements.forEach((achievement: string) => {
        text += `- ${achievement}\n`;
      });
    }
    
    return text;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!selectedTemplate) {
      errors.template = 'Please select a template';
    }
    
    if (inputMode === 'textarea' && !rawData.trim()) {
      errors.rawData = 'Please provide your career details';
    }
    
    if (inputMode === 'form' && !formResumeData) {
      errors.formData = 'Please fill in the form with your details';
    }
    
    if (!targetRole.trim()) {
      errors.targetRole = 'Please specify the target job role';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setFormErrors({});

    // Validate form
    if (!validateForm()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setLoadingSubtitle("Preparing your data...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    // Progress simulation
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev < 90) {
          const increment = Math.floor(Math.random() * 10) + 5; // Integer increment between 5-14
          const newProgress = Math.min(prev + increment, 90);
          
          // Update subtitle based on progress
          if (newProgress < 30) {
            setLoadingSubtitle("Analyzing your career information...");
          } else if (newProgress < 60) {
            setLoadingSubtitle("Processing with AI model...");
          } else if (newProgress < 90) {
            setLoadingSubtitle("Structuring your resume...");
          }
          
          return newProgress;
        }
        return prev;
      });
    }, 400);

    try {
      // Enhance prompt with social profile data and name
      const socialPromptEnhancement = ProfileDataExtractor.generatePromptEnhancement(socialProfileData);
      const namePromptEnhancement = `\n\nFull Name: ${fullName}\n`;
      const enhancedRawData = rawData + socialPromptEnhancement + namePromptEnhancement;

      const resp = await fetch("/api/generateResume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawText: enhancedRawData, 
          targetRole, 
          templateId: selectedTemplate,
          profileImage 
        }),
        signal: controller.signal,
      });

      let payload: any = null;
      try {
        payload = await resp.json();
      } catch (parseErr) {
        logError("Failed to parse JSON from /api/generateResume", parseErr);
        setErrorMsg("Unexpected response from server.");
        return;
      }

      if (!resp.ok) {
        logError("API returned non-OK", { status: resp.status, payload });
        setErrorMsg(payload?.error ?? `Server returned ${resp.status}`);
        return;
      }

      const data = payload?.data as ResumeData | undefined;
      if (!data || !data.name) {
        logError("Invalid or empty resume data from API", { payload });
        setErrorMsg("Model returned invalid resume data.");
        return;
      }

      logInfo("Received structured resume", { name: data.name });

      try {
        const processed = preprocessResume(data);
        setResumeData(processed as any); // has _layout hints
        logInfo("Resume preprocessed for layout", { name: processed.name, layout: processed._layout });
        
        // Complete progress and navigate
        clearInterval(progressInterval);
        setLoadingProgress(100);
        setLoadingSubtitle("Resume generated successfully!");
        
        // Brief delay to show completion, then navigate
        setTimeout(() => {
        const resumeDataString = encodeURIComponent(JSON.stringify(processed));
        const url = `/resumePreview?template=${selectedTemplate}&data=${resumeDataString}`;
        router.push(url);
        }, 800);
      } catch (preErr) {
        logError("Preprocessing failed, falling back to raw data", preErr);
        setResumeData(data);
        
        // Complete progress and navigate
        clearInterval(progressInterval);
        setLoadingProgress(100);
        setLoadingSubtitle("Resume generated successfully!");
        
        // Brief delay to show completion, then navigate
        setTimeout(() => {
        const resumeDataString = encodeURIComponent(JSON.stringify(data));
        const url = `/resumePreview?template=${selectedTemplate}&data=${resumeDataString}`;
        router.push(url);
        }, 800);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      if (err?.name === "AbortError") {
        logError("Resume generation request aborted (timeout)", err);
        setErrorMsg("Request timed out. Please try again.");
      } else {
        logError("Generation failed", err);
        setErrorMsg(err?.message ?? "Unknown error");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-center py-6 sm:py-8 px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700">AI Resume Builder</h1>
        <p className="text-gray-800 mt-2 text-sm sm:text-base max-w-2xl mx-auto">
          Choose a template, paste your raw career text, specify target role — AI will structure it into a resume.
        </p>
      </header>

      {/* Template Selection Section */}
      <section className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">Choose a Template</h2>
          <p className="text-gray-600 text-sm sm:text-base">Select a professional template that best fits your career style</p>
          {formErrors.template && <p className="text-red-500 text-sm mt-2">{formErrors.template}</p>}
        </div>
    <TemplatesIndex selectedTemplate={selectedTemplate} onSelect={handleTemplateSelect} />
</section>

      {/* Details Input Section */}
      <section className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">Add Your Details</h2>
          <p className="text-gray-600 text-sm sm:text-base">Fill in your information to generate your personalized resume</p>
        </div>

        {/* Name Input - Mandatory */}
        <div className="mb-6">
          <FormInput
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="Enter your full name"
            maxLength={50}
            required
            error={formErrors.fullName}
          />
        </div>

        {/* Input Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Career Details Input Method</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setInputMode('textarea')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'textarea'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📝 Text Box
              </button>
              <button
                onClick={() => setInputMode('form')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'form'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📋 Form Fields
              </button>
            </div>
          </div>

          {inputMode === 'textarea' ? (
            <FormTextarea
              label="Career Details"
              value={rawData}
              onChange={setRawData}
              placeholder="Enter your career information here. Include work experience, education, skills, certifications, and achievements.

Example:
Software Engineer at Tech Corp (2020-2023)
- Developed web applications using React and Node.js
- Led team of 5 developers on major project

Bachelor of Computer Science, University XYZ (2020)
Skills: JavaScript, Python, React, AWS
Certifications: AWS Solutions Architect (2022)"
              maxLength={5000}
          rows={8}
              required
              error={formErrors.rawData}
            />
          ) : (
            <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <p className="text-sm text-blue-800">
                  💡 <strong>Form-based input:</strong> Fill in your details using structured form fields. 
                  Data will be automatically converted to text format for AI processing.
                </p>
              </div>
              
              <ResumeFormEditor
                initialData={initializeFormData()}
                onSave={handleFormDataSave}
                onCancel={() => {}} // No cancel needed in this context
                isSaving={false}
                title="Add Resume Details"
                subtitle="Fill in your information using structured form fields"
              />
            </div>
          )}
        </div>

        {/* Target Role */}
        <div className="mb-6">
          <FormInput
            label="Target Job Role"
          value={targetRole}
            onChange={setTargetRole}
            placeholder="e.g. Frontend Developer, Data Scientist, Marketing Manager"
            maxLength={100}
            required
            error={formErrors.targetRole}
        />
        </div>

        {/* Profile Photo Upload */}
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📸 Profile Photo (Optional)</h3>
          <div className="flex items-center gap-4">
            {profileImage && (
              <img 
                src={profileImage} 
                alt="Profile preview" 
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
              />
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">Upload JPEG, PNG, or WebP. Image size should be less than 100KB.</p>
            </div>
            {profileImage && (
              <button
                onClick={() => setProfileImage("")}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Social Profile Links */}
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">🔗 Social Profile Links (Optional)</h3>
          
          {/* GitHub URL */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">GitHub Profile</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://github.com/username or just username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="flex-1 border rounded-md p-2 text-sm"
              />
              <button
                onClick={handleGithubExtraction}
                disabled={!githubUrl.trim() || extractingGithubData}
                className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extractingGithubData ? '...' : 'Extract Data'}
              </button>
            </div>
            {socialProfileData.github && (
              <div className="mt-2 text-xs text-green-600">
                ✅ Data extracted: {socialProfileData.github.languages.length} languages, {socialProfileData.github.topRepositories.length} repos
              </div>
            )}
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn Profile</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="flex-1 border rounded-md p-2 text-sm"
              />
              <button
                onClick={handleLinkedInProcess}
                disabled={!linkedinUrl.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save URL
              </button>
            </div>
            {socialProfileData.linkedin && (
              <div className="mt-2 text-xs text-blue-600">
                ✅ LinkedIn URL saved: {socialProfileData.linkedin.profileUrl}
              </div>
            )}
          </div>
        </div>

        {errorMsg && <div className="mb-4 text-red-600 font-medium">{errorMsg}</div>}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-60"
          >

            Generate Resume
          </button>

          <button
            onClick={() => {
              setRawData("");
              setTargetRole("");
              setFullName("");
              setResumeData(null);
              setProfileImage("");
              setGithubUrl("");
              setLinkedinUrl("");
              setSocialProfileData({});
              setErrorMsg(null);
              setFormErrors({});
              setLoading(false);
              setSelectedTemplate(null);
              setInputMode('textarea');
              localStorage.removeItem('resumeBuilder_state');
            }}
            className="px-4 py-2 border rounded-md"
          >
            Reset
          </button>
        </div>
      </section>

      {/* Loading Modal */}
      {loading && (
        <LoadingModal progress={loadingProgress} subtitle={loadingSubtitle} />
      )}

      {/* Show resume actions when resume exists */}
      {resumeData && !loading && (
        <section className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900">Resume Ready!</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">Your resume has been generated successfully.</p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => {
                    // Pass the raw resumeData - resumePreview.tsx will handle preprocessing
                    const resumeDataString = encodeURIComponent(JSON.stringify(resumeData));
                    const url = `/resumePreview?template=${selectedTemplate}&data=${resumeDataString}`;
                    router.push(url);
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base"
                >
                  📄 View & Print Resume
                </button>
                
                <button
                  onClick={() => {
                    setResumeData(null);
                    setErrorMsg(null);
                  }}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                >
                  ✏️ Edit Details
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
