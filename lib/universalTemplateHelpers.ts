// Universal Template Helpers for Consistent Resume Rendering
import { ResumeData } from "../types/resume";

// Universal layout constraints for PDF-safe rendering
export const PDF_CONSTRAINTS = {
  MAX_HEIGHT_MM: 297, // A4 height
  MAX_WIDTH_MM: 210,  // A4 width
  SAFE_MARGIN_MM: 8,  // Safe print margin
  MAX_CONTENT_HEIGHT: '270mm', // Max content height to prevent overflow
  PAGE_BREAK_THRESHOLD: 0.9, // When to trigger compact mode
} as const;

// Universal data validator - ensures all resume data is accessible
export function validateResumeData(data: any): ResumeData {
  return {
    name: data?.name || '',
    title: data?.title || '',
    photoUrl: data?.photoUrl || '',
    contact: {
      phone: data?.contact?.phone || '',
      email: data?.contact?.email || '',
      address: data?.contact?.address || '',
      linkedin: data?.contact?.linkedin || '',
    },
    summary: data?.summary || '',
    experience: Array.isArray(data?.experience) ? data.experience : [],
    education: Array.isArray(data?.education) ? data.education : [],
    certifications: Array.isArray(data?.certifications) ? data.certifications : [],
    achivements: Array.isArray(data?.achivements) ? data.achivements : [],
    volunteer: Array.isArray(data?.volunteer) ? data.volunteer : [],
    skills: Array.isArray(data?.skills) ? data.skills : [],
    softSkills: Array.isArray(data?.softSkills) ? data.softSkills : [],
    languages: Array.isArray(data?.languages) ? data.languages : [],
    interests: Array.isArray(data?.interests) ? data.interests : [],
  };
}

// Universal PDF-safe container
export function getPDFSafeStyles(compactMode: boolean = false) {
  return {
    container: {
      maxHeight: PDF_CONSTRAINTS.MAX_CONTENT_HEIGHT,
      overflow: 'hidden' as 'hidden',
    },
    printStyles: `
      @media print {
        body { margin: 0; padding: 0; }
        .no-print { display: none !important; }
        .print-break-inside-avoid { page-break-inside: avoid; }
        .print-break-before { page-break-before: always; }
        * { 
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .resume-container {
          max-height: ${PDF_CONSTRAINTS.MAX_CONTENT_HEIGHT} !important;
          overflow: hidden !important;
          page-break-inside: avoid !important;
        }
        .section {
          page-break-inside: avoid !important;
          margin-bottom: ${compactMode ? '8px' : '12px'} !important;
        }
      }
    `,
  };
}

// Height estimation for PDF safety
export function estimateContentHeight(data: ResumeData): number {
  let estimatedHeight = 0;
  
  // Header (name, title, contact)
  estimatedHeight += 80;
  
  // Summary
  if (data.summary) {
    estimatedHeight += Math.max(40, data.summary.length / 80 * 20);
  }
  
  // Experience
  estimatedHeight += data.experience.length * 60;
  data.experience.forEach(exp => {
    estimatedHeight += (exp.description?.length || 0) * 20;
  });
  
  // Education
  estimatedHeight += data.education.length * 40;
  
  // Other sections
  if (data.achivements?.length) estimatedHeight += Math.min(data.achivements.length * 20, 100);
  if (data.volunteer?.length) estimatedHeight += data.volunteer.length * 50;
  if (data.skills?.length) estimatedHeight += 40;
  if (data.softSkills?.length) estimatedHeight += 30;
  if (data.certifications?.length) estimatedHeight += data.certifications.length * 25;
  if (data.languages?.length) estimatedHeight += 30;
  if (data.interests?.length) estimatedHeight += 30;
  
  return estimatedHeight;
} 