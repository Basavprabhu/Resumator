// pages/components/TopBar.tsx
import React, { useState, useRef, useEffect } from "react";

type Props = {
  user: any;
  onSignOut: () => Promise<void> | void;
  btnLoading?: boolean;
  authError?: string | null;
  onOpenMyResumes?: () => void;
  resumeCount?: number;
};

export default function TopBar({ user, onSignOut, btnLoading, authError, onOpenMyResumes, resumeCount = 0 }: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    const name = user.displayName || user.email;
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Resumaaaator</h2>
          <span className="text-sm text-gray-500">AI-Powered Resume Builder</span>
        </div>
        
        <div className="flex items-center gap-3">
          {authError && <div className="text-sm text-red-600 mr-2">{authError}</div>}
          
          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getInitials()}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user.displayName || 'Profile'}
              </span>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{user.displayName || 'User'}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpenMyResumes?.();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg">📄</span>
                    <span className="flex-1">My Resumes</span>
                    <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                      {resumeCount}
                    </span>
                  </button>
                  
                  <hr className="my-1 border-gray-100" />
                  
                  <button
                    onClick={() => {
                      onSignOut();
                      setIsDropdownOpen(false);
                    }}
                    disabled={btnLoading}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-red-600 flex items-center gap-3 disabled:opacity-50"
                  >
                    <span className="text-lg">🚪</span>
                    <span>{btnLoading ? "Signing out..." : "Sign Out"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
