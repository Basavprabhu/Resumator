import React, { useState, useCallback, useEffect } from 'react';
import { ResumeData } from '../types/resume';
import { logInfo, logError } from '../lib/logger';

interface ResumeFormEditorProps {
  initialData: ResumeData;
  onSave: (data: ResumeData) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
  title?: string;
  subtitle?: string;
}

// Field limits based on resume best practices
const LIMITS = {
  name: 50,
  title: 100,
  email: 100,
  phone: 20,
  address: 150,
  linkedin: 100,
  summary: 500,
  role: 80,
  company: 80,
  duration: 30,
  description: 150, // per bullet point
  degree: 100,
  school: 100,
  year: 10,
  certification: 100,
  certificationYear: 10,
  achievement: 120,
  volunteerRole: 80,
  volunteerOrg: 80,
  volunteerDuration: 30,
  skill: 30,
  softSkill: 30,
  language: 30,
  interest: 30,
  maxExperience: 10,
  maxEducation: 5,
  maxCertifications: 10,
  maxAchievements: 8,
  maxVolunteer: 5,
  maxDescriptionItems: 5,
  maxSkills: 20,
  maxSoftSkills: 15,
  maxLanguages: 10,
  maxInterests: 10
};

interface CharacterCountProps {
  current: number;
  max: number;
  className?: string;
}

const CharacterCount: React.FC<CharacterCountProps> = ({ current, max, className = '' }) => {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage > 80;
  const isOverLimit = current > max;

  return (
    <div className={`text-xs text-right ${className}`}>
      <span className={`${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-orange-500' : 'text-gray-400'}`}>
        {current}/{max}
      </span>
    </div>
  );
};

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength: number;
  required?: boolean;
  type?: 'text' | 'email' | 'tel';
  error?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
        {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}
        <div className="sm:ml-auto">
        <CharacterCount current={value.length} max={maxLength} />
        </div>
      </div>
    </div>
  );
};

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength: number;
  required?: boolean;
  rows?: number;
  error?: string;
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
        {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}
        <div className="sm:ml-auto">
        <CharacterCount current={value.length} max={maxLength} />
        </div>
      </div>
    </div>
  );
};

const ResumeFormEditor: React.FC<ResumeFormEditorProps> = ({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
  title = "Edit Resume",
  subtitle = "Update your resume information"
}) => {
  const [formData, setFormData] = useState<ResumeData>(initialData);
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'additional' | 'skills'>('personal');
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track changes
  useEffect(() => {
    const hasChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(hasChanged);
    
    if (hasChanged) {
      logInfo('Resume form data changed', { section: activeTab });
    }
  }, [formData, initialData, activeTab]);

  const updateField = useCallback((field: string, value: string) => {
    try {
      setFormData(prev => {
        const newData = { ...prev } as any;
        
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          newData[parent] = { ...newData[parent], [child]: value };
        } else {
          newData[field] = value;
        }
        
        return newData;
      });
      
      // Clear error for this field
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    } catch (error) {
      logError(`Failed to update field ${field}`, error);
    }
  }, [errors]);

  const updateExperience = useCallback((index: number, field: string, value: string | string[]) => {
    try {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.map((exp, i) => 
          i === index ? { ...exp, [field]: value } : exp
        )
      }));
    } catch (error) {
      logError(`Failed to update experience ${index}.${field}`, error);
    }
  }, []);

  const updateExperienceDescription = useCallback((expIndex: number, descIndex: number, value: string) => {
    try {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.map((exp, i) => 
          i === expIndex ? {
            ...exp,
            description: exp.description.map((desc, j) => j === descIndex ? value : desc)
          } : exp
        )
      }));
    } catch (error) {
      logError(`Failed to update experience description ${expIndex}.${descIndex}`, error);
    }
  }, []);

  const addExperience = useCallback(() => {
    if (formData.experience.length >= LIMITS.maxExperience) {
      alert(`Maximum ${LIMITS.maxExperience} work experiences allowed`);
      return;
    }

    try {
      setFormData(prev => ({
        ...prev,
        experience: [...prev.experience, {
          role: '',
          company: '',
          duration: '',
          description: ['']
        }]
      }));
      logInfo('Added new experience entry');
    } catch (error) {
      logError('Failed to add experience', error);
    }
  }, [formData.experience.length]);

  const removeExperience = useCallback((index: number) => {
    try {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== index)
      }));
      logInfo('Removed experience entry', { index });
    } catch (error) {
      logError(`Failed to remove experience ${index}`, error);
    }
  }, []);

  const addExperienceDescription = useCallback((expIndex: number) => {
    const exp = formData.experience[expIndex];
    if (exp.description.length >= LIMITS.maxDescriptionItems) {
      alert(`Maximum ${LIMITS.maxDescriptionItems} bullet points per job`);
      return;
    }

    try {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.map((exp, i) => 
          i === expIndex ? {
            ...exp,
            description: [...exp.description, '']
          } : exp
        )
      }));
    } catch (error) {
      logError(`Failed to add description to experience ${expIndex}`, error);
    }
  }, [formData.experience]);

  const removeExperienceDescription = useCallback((expIndex: number, descIndex: number) => {
    try {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.map((exp, i) => 
          i === expIndex ? {
            ...exp,
            description: exp.description.filter((_, j) => j !== descIndex)
          } : exp
        )
      }));
    } catch (error) {
      logError(`Failed to remove description from experience ${expIndex}`, error);
    }
  }, []);

  const updateEducation = useCallback((index: number, field: string, value: string) => {
    try {
      setFormData(prev => ({
        ...prev,
        education: prev.education.map((edu, i) => 
          i === index ? { ...edu, [field]: value } : edu
        )
      }));
    } catch (error) {
      logError(`Failed to update education ${index}.${field}`, error);
    }
  }, []);

  const addEducation = useCallback(() => {
    if (formData.education.length >= LIMITS.maxEducation) {
      alert(`Maximum ${LIMITS.maxEducation} education entries allowed`);
      return;
    }

    try {
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, { degree: '', school: '', year: '' }]
      }));
      logInfo('Added new education entry');
    } catch (error) {
      logError('Failed to add education', error);
    }
  }, [formData.education.length]);

  const removeEducation = useCallback((index: number) => {
    try {
      setFormData(prev => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index)
      }));
      logInfo('Removed education entry', { index });
    } catch (error) {
      logError(`Failed to remove education ${index}`, error);
    }
  }, []);

  // Certifications functions
  const updateCertification = useCallback((index: number, field: string, value: string) => {
    try {
      setFormData(prev => ({
        ...prev,
        certifications: (prev.certifications || []).map((cert, i) => 
          i === index ? { ...cert, [field]: value } : cert
        )
      }));
    } catch (error) {
      logError(`Failed to update certification ${index}.${field}`, error);
    }
  }, []);

  const addCertification = useCallback(() => {
    const certCount = formData.certifications?.length || 0;
    if (certCount >= LIMITS.maxCertifications) {
      alert(`Maximum ${LIMITS.maxCertifications} certifications allowed`);
      return;
    }

    try {
      setFormData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), { name: '', year: '' }]
      }));
      logInfo('Added new certification entry');
    } catch (error) {
      logError('Failed to add certification', error);
    }
  }, [formData.certifications]);

  const removeCertification = useCallback((index: number) => {
    try {
      setFormData(prev => ({
        ...prev,
        certifications: (prev.certifications || []).filter((_, i) => i !== index)
      }));
      logInfo('Removed certification entry', { index });
    } catch (error) {
      logError(`Failed to remove certification ${index}`, error);
    }
  }, []);

  // Achievements functions
  const updateAchievement = useCallback((index: number, value: string) => {
    try {
      setFormData(prev => ({
        ...prev,
        achivements: (prev.achivements || []).map((achievement, i) => 
          i === index ? value : achievement
        )
      }));
    } catch (error) {
      logError(`Failed to update achievement ${index}`, error);
    }
  }, []);

  const addAchievement = useCallback(() => {
    const achievementCount = formData.achivements?.length || 0;
    if (achievementCount >= LIMITS.maxAchievements) {
      alert(`Maximum ${LIMITS.maxAchievements} achievements allowed`);
      return;
    }

    try {
      setFormData(prev => ({
        ...prev,
        achivements: [...(prev.achivements || []), '']
      }));
      logInfo('Added new achievement entry');
    } catch (error) {
      logError('Failed to add achievement', error);
    }
  }, [formData.achivements]);

  const removeAchievement = useCallback((index: number) => {
    try {
      setFormData(prev => ({
        ...prev,
        achivements: (prev.achivements || []).filter((_, i) => i !== index)
      }));
      logInfo('Removed achievement entry', { index });
    } catch (error) {
      logError(`Failed to remove achievement ${index}`, error);
    }
  }, []);

  // Volunteer functions
  const updateVolunteer = useCallback((index: number, field: string, value: string | string[]) => {
    try {
      setFormData(prev => ({
        ...prev,
        volunteer: (prev.volunteer || []).map((vol, i) => 
          i === index ? { ...vol, [field]: value } : vol
        )
      }));
    } catch (error) {
      logError(`Failed to update volunteer ${index}.${field}`, error);
    }
  }, []);

  const addVolunteer = useCallback(() => {
    const volunteerCount = formData.volunteer?.length || 0;
    if (volunteerCount >= LIMITS.maxVolunteer) {
      alert(`Maximum ${LIMITS.maxVolunteer} volunteer experiences allowed`);
      return;
    }

    try {
      setFormData(prev => ({
        ...prev,
        volunteer: [...(prev.volunteer || []), {
          role: '',
          org: '',
          duration: '',
          description: ['']
        }]
      }));
      logInfo('Added new volunteer entry');
    } catch (error) {
      logError('Failed to add volunteer', error);
    }
  }, [formData.volunteer]);

  const removeVolunteer = useCallback((index: number) => {
    try {
      setFormData(prev => ({
        ...prev,
        volunteer: (prev.volunteer || []).filter((_, i) => i !== index)
      }));
      logInfo('Removed volunteer entry', { index });
    } catch (error) {
      logError(`Failed to remove volunteer ${index}`, error);
    }
  }, []);

  // Skills functions
  const updateSkillsList = useCallback((field: 'skills' | 'softSkills' | 'languages' | 'interests', index: number, value: string) => {
    try {
      setFormData(prev => ({
        ...prev,
        [field]: (prev[field] || []).map((item, i) => 
          i === index ? value : item
        )
      }));
    } catch (error) {
      logError(`Failed to update ${field} ${index}`, error);
    }
  }, []);

  const addSkillItem = useCallback((field: 'skills' | 'softSkills' | 'languages' | 'interests') => {
    const maxLimits = {
      skills: LIMITS.maxSkills,
      softSkills: LIMITS.maxSoftSkills,
      languages: LIMITS.maxLanguages,
      interests: LIMITS.maxInterests
    };

    const currentCount = formData[field]?.length || 0;
    if (currentCount >= maxLimits[field]) {
      alert(`Maximum ${maxLimits[field]} ${field} allowed`);
      return;
    }

    try {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), '']
      }));
      logInfo(`Added new ${field} entry`);
    } catch (error) {
      logError(`Failed to add ${field}`, error);
    }
  }, [formData]);

  const removeSkillItem = useCallback((field: 'skills' | 'softSkills' | 'languages' | 'interests', index: number) => {
    try {
      setFormData(prev => ({
        ...prev,
        [field]: (prev[field] || []).filter((_, i) => i !== index)
      }));
      logInfo(`Removed ${field} entry`, { index });
    } catch (error) {
      logError(`Failed to remove ${field} ${index}`, error);
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.contact?.email?.trim()) {
      newErrors['contact.email'] = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
      newErrors['contact.email'] = 'Please enter a valid email address';
    }

    if (!formData.summary?.trim()) {
      newErrors.summary = 'Professional summary is required';
    }

    // Validate experience
    formData.experience.forEach((exp, index) => {
      if (!exp.role?.trim()) {
        newErrors[`experience.${index}.role`] = 'Job title is required';
      }
      if (!exp.company?.trim()) {
        newErrors[`experience.${index}.company`] = 'Company name is required';
      }
    });

    // Validate education
    formData.education.forEach((edu, index) => {
      if (!edu.degree?.trim()) {
        newErrors[`education.${index}.degree`] = 'Degree is required';
      }
      if (!edu.school?.trim()) {
        newErrors[`education.${index}.school`] = 'School is required';
      }
    });

    setErrors(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      logError('Form validation failed', { errors: newErrors });
    }
    
    return isValid;
  }, [formData]);

  const handleSave = useCallback(async () => {
    try {
      if (!validateForm()) {
        // Switch to the tab with errors
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
          const firstErrorField = errorKeys[0];
          if (firstErrorField && firstErrorField.includes('experience')) {
          setActiveTab('experience');
          } else if (firstErrorField && firstErrorField.includes('education')) {
          setActiveTab('education');
          } else if (firstErrorField && (firstErrorField.includes('certification') || firstErrorField.includes('achievement') || firstErrorField.includes('volunteer'))) {
          setActiveTab('additional');
          } else if (firstErrorField && (firstErrorField.includes('skill') || firstErrorField.includes('language') || firstErrorField.includes('interest'))) {
          setActiveTab('skills');
        } else {
          setActiveTab('personal');
          }
        }
        return;
      }

      logInfo('Saving resume form data', { hasChanges });
      await onSave(formData);
      setHasChanges(false);
    } catch (error) {
      logError('Failed to save resume', error);
      alert('Failed to save resume. Please try again.');
    }
  }, [formData, validateForm, onSave, hasChanges, errors]);

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'additional', label: 'Additional', icon: '🏆' },
    { id: 'skills', label: 'Skills', icon: '⚡' }
  ] as const;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-blue-100 mt-1">{subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto px-4 sm:px-6 scrollbar-hide">
          <div className="flex space-x-2 sm:space-x-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
                <span className="sm:hidden">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
                <span className="sm:hidden block text-xs mt-1">{tab.label}</span>
            </button>
          ))}
          </div>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {activeTab === 'personal' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <FormInput
                label="Full Name"
                value={formData.name || ''}
                onChange={(value) => updateField('name', value)}
                placeholder="Enter your full name"
                maxLength={LIMITS.name}
                required
                error={errors.name}
              />

              <FormInput
                label="Professional Title"
                value={formData.title || ''}
                onChange={(value) => updateField('title', value)}
                placeholder="e.g. Senior Software Engineer"
                maxLength={LIMITS.title}
              />

              <FormInput
                label="Email Address"
                value={formData.contact?.email || ''}
                onChange={(value) => updateField('contact.email', value)}
                placeholder="your.email@example.com"
                maxLength={LIMITS.email}
                type="email"
                required
                error={errors['contact.email']}
              />

              <FormInput
                label="Phone Number"
                value={formData.contact?.phone || ''}
                onChange={(value) => updateField('contact.phone', value)}
                placeholder="+1 (555) 123-4567"
                maxLength={LIMITS.phone}
                type="tel"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <FormInput
                label="Address"
                value={formData.contact?.address || ''}
                onChange={(value) => updateField('contact.address', value)}
                placeholder="City, State, Country"
                maxLength={LIMITS.address}
              />

              <FormInput
                label="LinkedIn Profile"
                value={formData.contact?.linkedin || ''}
                onChange={(value) => updateField('contact.linkedin', value)}
                placeholder="https://linkedin.com/in/yourprofile"
                maxLength={LIMITS.linkedin}
              />
            </div>

            <FormTextarea
              label="Professional Summary"
              value={formData.summary || ''}
              onChange={(value) => updateField('summary', value)}
              placeholder="Write a compelling summary of your professional background, key skills, and career objectives..."
              maxLength={LIMITS.summary}
              rows={5}
              required
              error={errors.summary}
            />
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Work Experience ({formData.experience.length}/{LIMITS.maxExperience})
              </h3>
              <button
                onClick={addExperience}
                disabled={formData.experience.length >= LIMITS.maxExperience}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Experience
              </button>
            </div>

            {formData.experience?.map((exp, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-md font-medium text-gray-800">Experience #{index + 1}</h4>
                  {formData.experience.length > 1 && (
                    <button
                      onClick={() => removeExperience(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Job Title"
                    value={exp.role || ''}
                    onChange={(value) => updateExperience(index, 'role', value)}
                    placeholder="Software Engineer"
                    maxLength={LIMITS.role}
                    required
                    error={errors[`experience.${index}.role`]}
                  />

                  <FormInput
                    label="Company Name"
                    value={exp.company || ''}
                    onChange={(value) => updateExperience(index, 'company', value)}
                    placeholder="Company Inc."
                    maxLength={LIMITS.company}
                    required
                    error={errors[`experience.${index}.company`]}
                  />
                </div>

                <FormInput
                  label="Duration"
                  value={exp.duration || ''}
                  onChange={(value) => updateExperience(index, 'duration', value)}
                  placeholder="Jan 2020 - Present"
                  maxLength={LIMITS.duration}
                />

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Key Achievements & Responsibilities ({exp.description.length}/{LIMITS.maxDescriptionItems})
                    </label>
                    <button
                      onClick={() => addExperienceDescription(index)}
                      disabled={exp.description.length >= LIMITS.maxDescriptionItems}
                      className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      + Add Point
                    </button>
                  </div>

                  {exp.description.map((desc, descIndex) => (
                    <div key={descIndex} className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 mt-3 text-sm">•</span>
                          <div className="flex-1">
                            <textarea
                              value={desc}
                              onChange={(e) => updateExperienceDescription(index, descIndex, e.target.value.slice(0, LIMITS.description))}
                              placeholder="Describe your achievement or responsibility..."
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                              rows={2}
                              maxLength={LIMITS.description}
                            />
                            <CharacterCount current={desc.length} max={LIMITS.description} />
                          </div>
                        </div>
                      </div>
                      {exp.description.length > 1 && (
                        <button
                          onClick={() => removeExperienceDescription(index, descIndex)}
                          className="text-red-600 hover:text-red-800 text-sm mt-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Education ({formData.education.length}/{LIMITS.maxEducation})
              </h3>
              <button
                onClick={addEducation}
                disabled={formData.education.length >= LIMITS.maxEducation}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Education
              </button>
            </div>

            {formData.education?.map((edu, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-md font-medium text-gray-800">Education #{index + 1}</h4>
                  {formData.education.length > 1 && (
                    <button
                      onClick={() => removeEducation(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Degree"
                    value={edu.degree || ''}
                    onChange={(value) => updateEducation(index, 'degree', value)}
                    placeholder="Bachelor of Computer Science"
                    maxLength={LIMITS.degree}
                    required
                    error={errors[`education.${index}.degree`]}
                  />

                  <FormInput
                    label="School/University"
                    value={edu.school || ''}
                    onChange={(value) => updateEducation(index, 'school', value)}
                    placeholder="University of Technology"
                    maxLength={LIMITS.school}
                    required
                    error={errors[`education.${index}.school`]}
                  />
                </div>

                <FormInput
                  label="Graduation Year"
                  value={edu.year || ''}
                  onChange={(value) => updateEducation(index, 'year', value)}
                  placeholder="2020"
                  maxLength={LIMITS.year}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'additional' && (
          <div className="space-y-8">
            {/* Certifications */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Certifications ({formData.certifications?.length || 0}/{LIMITS.maxCertifications})
                </h3>
                <button
                  onClick={addCertification}
                  disabled={(formData.certifications?.length || 0) >= LIMITS.maxCertifications}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Certification
                </button>
              </div>

              {formData.certifications && formData.certifications.length > 0 ? (
                formData.certifications.map((cert, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="text-md font-medium text-gray-800">Certification #{index + 1}</h4>
                      <button
                        onClick={() => removeCertification(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <FormInput
                          label="Certification Name"
                          value={cert.name || ''}
                          onChange={(value) => updateCertification(index, 'name', value)}
                          placeholder="AWS Certified Solutions Architect"
                          maxLength={LIMITS.certification}
                        />
                      </div>
                      <FormInput
                        label="Year"
                        value={cert.year || ''}
                        onChange={(value) => updateCertification(index, 'year', value)}
                        placeholder="2023"
                        maxLength={LIMITS.certificationYear}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No certifications added yet. Click "Add Certification" to get started.
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Achievements ({formData.achivements?.length || 0}/{LIMITS.maxAchievements})
                </h3>
                <button
                  onClick={addAchievement}
                  disabled={(formData.achivements?.length || 0) >= LIMITS.maxAchievements}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Achievement
                </button>
              </div>

              {formData.achivements && formData.achivements.length > 0 ? (
                formData.achivements.map((achievement, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-gray-400 mt-3 text-sm">•</span>
                    <div className="flex-1">
                      <textarea
                        value={achievement}
                        onChange={(e) => updateAchievement(index, e.target.value.slice(0, LIMITS.achievement))}
                        placeholder="Describe your achievement..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={2}
                        maxLength={LIMITS.achievement}
                      />
                      <CharacterCount current={achievement.length} max={LIMITS.achievement} />
                    </div>
                    <button
                      onClick={() => removeAchievement(index)}
                      className="text-red-600 hover:text-red-800 text-sm mt-2"
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No achievements added yet. Click "Add Achievement" to get started.
                </div>
              )}
            </div>

            {/* Volunteer Work */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Volunteer Work ({formData.volunteer?.length || 0}/{LIMITS.maxVolunteer})
                </h3>
                <button
                  onClick={addVolunteer}
                  disabled={(formData.volunteer?.length || 0) >= LIMITS.maxVolunteer}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Volunteer Work
                </button>
              </div>

              {formData.volunteer && formData.volunteer.length > 0 ? (
                formData.volunteer.map((vol, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="text-md font-medium text-gray-800">Volunteer #{index + 1}</h4>
                      <button
                        onClick={() => removeVolunteer(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Role/Position"
                        value={vol.role || ''}
                        onChange={(value) => updateVolunteer(index, 'role', value)}
                        placeholder="Volunteer Coordinator"
                        maxLength={LIMITS.volunteerRole}
                      />
                      <FormInput
                        label="Organization"
                        value={vol.org || ''}
                        onChange={(value) => updateVolunteer(index, 'org', value)}
                        placeholder="Local Community Center"
                        maxLength={LIMITS.volunteerOrg}
                      />
                    </div>

                    <FormInput
                      label="Duration"
                      value={vol.duration || ''}
                      onChange={(value) => updateVolunteer(index, 'duration', value)}
                      placeholder="2019 - 2021"
                      maxLength={LIMITS.volunteerDuration}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No volunteer work added yet. Click "Add Volunteer Work" to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-8">
            {/* Technical Skills */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Technical Skills ({formData.skills?.length || 0}/{LIMITS.maxSkills})
                </h3>
                <button
                  onClick={() => addSkillItem('skills')}
                  disabled={(formData.skills?.length || 0) >= LIMITS.maxSkills}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Skill
                </button>
              </div>

              {formData.skills && formData.skills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => updateSkillsList('skills', index, e.target.value.slice(0, LIMITS.skill))}
                        placeholder="e.g. JavaScript, Python"
                        className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={LIMITS.skill}
                      />
                      <button
                        onClick={() => removeSkillItem('skills', index)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No technical skills added yet. Click "Add Skill" to get started.
                </div>
              )}
            </div>

            {/* Soft Skills */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Soft Skills ({formData.softSkills?.length || 0}/{LIMITS.maxSoftSkills})
                </h3>
                <button
                  onClick={() => addSkillItem('softSkills')}
                  disabled={(formData.softSkills?.length || 0) >= LIMITS.maxSoftSkills}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Soft Skill
                </button>
              </div>

              {formData.softSkills && formData.softSkills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formData.softSkills.map((skill, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => updateSkillsList('softSkills', index, e.target.value.slice(0, LIMITS.softSkill))}
                        placeholder="e.g. Leadership, Communication"
                        className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={LIMITS.softSkill}
                      />
                      <button
                        onClick={() => removeSkillItem('softSkills', index)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No soft skills added yet. Click "Add Soft Skill" to get started.
                </div>
              )}
            </div>

            {/* Languages */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Languages ({formData.languages?.length || 0}/{LIMITS.maxLanguages})
                </h3>
                <button
                  onClick={() => addSkillItem('languages')}
                  disabled={(formData.languages?.length || 0) >= LIMITS.maxLanguages}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Language
                </button>
              </div>

              {formData.languages && formData.languages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formData.languages.map((language, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={language}
                        onChange={(e) => updateSkillsList('languages', index, e.target.value.slice(0, LIMITS.language))}
                        placeholder="e.g. English, Spanish"
                        className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={LIMITS.language}
                      />
                      <button
                        onClick={() => removeSkillItem('languages', index)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No languages added yet. Click "Add Language" to get started.
                </div>
              )}
            </div>

            {/* Interests */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Interests ({formData.interests?.length || 0}/{LIMITS.maxInterests})
                </h3>
                <button
                  onClick={() => addSkillItem('interests')}
                  disabled={(formData.interests?.length || 0) >= LIMITS.maxInterests}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Interest
                </button>
              </div>

              {formData.interests && formData.interests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formData.interests.map((interest, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={interest}
                        onChange={(e) => updateSkillsList('interests', index, e.target.value.slice(0, LIMITS.interest))}
                        placeholder="e.g. Photography, Hiking"
                        className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={LIMITS.interest}
                      />
                      <button
                        onClick={() => removeSkillItem('interests', index)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No interests added yet. Click "Add Interest" to get started.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm">
          {hasChanges && (
              <span className="text-orange-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Unsaved changes
            </span>
          )}
          {Object.keys(errors).length > 0 && (
              <span className="text-red-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''}
            </span>
          )}
        </div>

          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={onCancel}
            disabled={isSaving}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium text-sm sm:text-base"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeFormEditor; 