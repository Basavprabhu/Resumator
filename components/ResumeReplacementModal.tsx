import React, { useState } from 'react';
import { SavedResume } from '../types/resume';

interface ResumeReplacementModalProps {
  isOpen: boolean;
  userResumes: SavedResume[];
  onReplace: (resumeId: string) => void;
  onCancel: () => void;
  isReplacing?: boolean;
}

const ResumeReplacementModal: React.FC<ResumeReplacementModalProps> = ({
  isOpen,
  userResumes,
  onReplace,
  onCancel,
  isReplacing = false
}) => {
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  if (!isOpen) return null;

  const handleReplace = () => {
    if (selectedResumeId) {
      onReplace(selectedResumeId);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Resume Box Full</h3>
              <p className="text-sm text-gray-600">You can save a maximum of 2 resumes</p>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Your resume box is full! To save this new resume, please select an existing resume to replace:
            </p>

            {/* Resume Selection */}
            <div className="space-y-3">
              {userResumes.map((resume) => (
                <label
                  key={resume.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedResumeId === resume.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="resumeToReplace"
                    value={resume.id}
                    checked={selectedResumeId === resume.id}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{resume.name}</h4>
                      <span className="text-xs text-gray-500">
                        {formatDate(resume.updatedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{resume.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {resume.templateId.replace('template-', '').replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isReplacing}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReplace}
              disabled={!selectedResumeId || isReplacing}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isReplacing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Replacing...
                </>
              ) : (
                'Replace & Save'
              )}
            </button>
          </div>

          {/* Warning */}
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-xs text-red-700">
                <strong>Warning:</strong> The selected resume will be permanently deleted and cannot be recovered.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeReplacementModal; 