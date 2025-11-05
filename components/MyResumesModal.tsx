import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SavedResume } from '../types/resume';
import { ResumeService } from '../lib/resumeService';
import { showSuccess, showError } from '../lib/notifications';
import { logInfo, logError } from '../lib/logger';

interface MyResumesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const MyResumesModal: React.FC<MyResumesModalProps> = ({ isOpen, onClose, userId }) => {
  const router = useRouter();
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadResumes();
    }
  }, [isOpen, userId]); // loadResumes is stable, no need to include

  const loadResumes = async () => {
    try {
      setLoading(true);
      const userResumes = await ResumeService.getUserResumes(userId);
      setResumes(userResumes);
      logInfo('Loaded user resumes in modal', { count: userResumes.length });
    } catch (error) {
      logError('Failed to load resumes in modal', error);
      showError('Failed to load resumes', 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = (resume: SavedResume) => {
    // Note: We pass raw data here since resumePreview.tsx now handles preprocessing
    // This ensures consistent preprocessing regardless of data source
    const queryParams = new URLSearchParams({
      template: resume.templateId,
      data: JSON.stringify(resume.resumeData),
      id: resume.id
    });
    
    router.push(`/resumePreview?${queryParams.toString()}`);
    onClose();
  };

  const handleDeleteResume = async (resumeId: string, resumeName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${resumeName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setDeleting(resumeId);
      await ResumeService.deleteResume(userId, resumeId);
      
      // Remove from local state
      setResumes(prev => prev.filter(r => r.id !== resumeId));
      
      showSuccess('Resume deleted', `"${resumeName}" has been deleted successfully`);
      logInfo('Resume deleted from modal', { resumeId, resumeName });
    } catch (error) {
      logError('Failed to delete resume', error);
      showError('Failed to delete resume', 'Please try again later');
    } finally {
      setDeleting(null);
    }
  };



  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">My Resumes</h2>
            <p className="text-blue-100 mt-1">
              {resumes.length} resume{resumes.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No resumes yet</h3>
              <p className="text-gray-600 mb-6">Create your first resume to get started!</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Resume
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Resume Info */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {resume.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{resume.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {resume.templateId}
                      </span>
                      <span className="text-xs text-gray-500">
                        Updated {formatDate(resume.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewResume(resume)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      View & Edit
                    </button>
                    
                    <button
                      onClick={() => handleDeleteResume(resume.id, resume.name)}
                      disabled={deleting === resume.id}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === resume.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyResumesModal; 