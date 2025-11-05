import React, { useState } from 'react';
import { logInfo, logError } from '../lib/logger';
import { showSuccess, showError } from '../lib/notifications';

interface FeedbackData {
  rating: number;
  message: string;
  email?: string;
  timestamp: Date;
}

const Footer: React.FC = () => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    message: '',
    email: ''
  });

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      showError('Feedback Required', 'Please provide your feedback message');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Import Firebase functions dynamically to avoid SSR issues
      const { db } = await import('../lib/firebaseClient');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

      const feedbackData: Omit<FeedbackData, 'timestamp'> & { timestamp: any } = {
        rating: formData.rating,
        message: formData.message.trim(),
        email: formData.email.trim() || undefined,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'feedback'), feedbackData);
      
      logInfo('Feedback submitted successfully', { rating: formData.rating, hasEmail: !!formData.email });
      showSuccess('Thank You!', 'Your feedback has been submitted successfully');
      
      // Reset form
      setFormData({ rating: 5, message: '', email: '' });
      setShowFeedbackForm(false);
      
    } catch (error) {
      logError('Failed to submit feedback', error);
      showError('Submission Failed', 'Please try again later');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  return (
    <>
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Company Branding */}
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Resumator</span> - an AI product from{' '}
                <span className="font-medium text-blue-600">Coccon Software Technologies</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">All rights reserved</p>
            </div>
            
            {/* Feedback Button */}
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Give Feedback
            </button>
          </div>
        </div>
      </footer>

      {/* Feedback Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Share Your Feedback</h3>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How would you rate your experience?
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className={`text-2xl transition-colors ${
                          star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400`}
                        disabled={isSubmitting}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-2">
                    Your feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="feedback-message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Tell us what you think about Resumator..."
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email (optional)
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">We'll only use this to follow up if needed</p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.message.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer; 