export type ResumeData = {
  name: string;
  title?: string;
  photoUrl?: string;
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  experience: { role: string; company: string; duration: string; description: string[] }[];
  education: { degree: string; school: string; year: string }[];
  certifications?: { name: string; year?: string }[];
  achivements?: string[];
  volunteer?: { role: string; org: string; duration?: string; description: string[] }[];
  skills?: string[];
  softSkills?: string[];
  languages?: string[];
  interests?: string[];
};

export type SavedResume = {
  id: string;
  name: string;
  title: string;
  templateId: string;
  resumeData: ResumeData;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};
