import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebaseClient';
import { ResumeData, SavedResume } from '../types/resume';
import { logInfo, logError } from './logger';

export class ResumeService {
  private static readonly COLLECTION_NAME = 'resumes';

  // Create a new resume
  static async saveResume(
    userId: string, 
    resumeData: ResumeData, 
    templateId: string,
    replaceResumeId?: string
  ): Promise<string> {
    try {
      logInfo('Saving new resume', { userId, templateId, resumeName: resumeData.name, replaceResumeId });

      // Check resume limit (max 2 per user) unless replacing
      if (!replaceResumeId) {
        const userResumes = await this.getUserResumes(userId);
        if (userResumes.length >= 2) {
          logError('Resume limit exceeded', { userId, currentCount: userResumes.length });
          const error = new Error('RESUME_LIMIT_EXCEEDED');
          (error as any).userResumes = userResumes;
          throw error;
        }
      }

      // If replacing, delete the old resume first
      if (replaceResumeId) {
        await this.deleteResume(userId, replaceResumeId);
        logInfo('Replaced existing resume', { userId, replacedResumeId: replaceResumeId });
      }

      const resumeDoc = {
        name: resumeData.name || 'Untitled Resume',
        title: resumeData.title || resumeData.name || 'Untitled Resume',
        templateId,
        resumeData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), resumeDoc);
      
      logInfo('Resume saved successfully', { resumeId: docRef.id, userId });
      return docRef.id;
    } catch (error) {
      logError('Failed to save resume', error);
      
      // Handle specific resume limit error
      if (error instanceof Error && error.message === 'RESUME_LIMIT_EXCEEDED') {
        throw error; // Pass the error with userResumes data
      }
      
      throw new Error(this.getErrorMessage(error, 'Failed to save resume'));
    }
  }

  // Update existing resume
  static async updateResume(
    userId: string, 
    resumeId: string, 
    resumeData: ResumeData, 
    templateId?: string
  ): Promise<void> {
    try {
      logInfo('Updating resume', { userId, resumeId, resumeName: resumeData.name });

      const resumeRef = doc(db, this.COLLECTION_NAME, resumeId);
      
      // Verify ownership
      const resumeDoc = await getDoc(resumeRef);
      if (!resumeDoc.exists()) {
        throw new Error('Resume not found');
      }

      const existingResume = resumeDoc.data();
      if (existingResume.userId !== userId) {
        throw new Error('Unauthorized: You can only update your own resumes');
      }

      const updateData: any = {
        name: resumeData.name || 'Untitled Resume',
        title: resumeData.title || resumeData.name || 'Untitled Resume',
        resumeData,
        updatedAt: serverTimestamp()
      };

      if (templateId) {
        updateData.templateId = templateId;
      }

      await updateDoc(resumeRef, updateData);
      
      logInfo('Resume updated successfully', { resumeId, userId });
    } catch (error) {
      logError('Failed to update resume', error);
      throw new Error(this.getErrorMessage(error, 'Failed to update resume'));
    }
  }

  // Get all resumes for a user
  static async getUserResumes(userId: string): Promise<SavedResume[]> {
    try {
      logInfo('Fetching user resumes', { userId });

      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
        // orderBy('updatedAt', 'desc') // Temporarily disabled - requires composite index
      );

      const querySnapshot = await getDocs(q);
      const resumes: SavedResume[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        resumes.push({
          id: doc.id,
          name: data.name,
          title: data.title,
          templateId: data.templateId,
          resumeData: data.resumeData,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          userId: data.userId
        });
      });

      // Sort by updatedAt descending (newest first) - temporary client-side sorting
      resumes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      logInfo('User resumes fetched successfully', { userId, count: resumes.length });
      return resumes;
    } catch (error) {
      logError('Failed to fetch user resumes', error);
      throw new Error(this.getErrorMessage(error, 'Failed to load your resumes'));
    }
  }

  // Get a specific resume
  static async getResume(userId: string, resumeId: string): Promise<SavedResume | null> {
    try {
      logInfo('Fetching resume', { userId, resumeId });

      const resumeRef = doc(db, this.COLLECTION_NAME, resumeId);
      const resumeDoc = await getDoc(resumeRef);

      if (!resumeDoc.exists()) {
        logInfo('Resume not found', { resumeId });
        return null;
      }

      const data = resumeDoc.data();
      
      // Verify ownership
      if (data.userId !== userId) {
        throw new Error('Unauthorized: You can only access your own resumes');
      }

      const resume: SavedResume = {
        id: resumeDoc.id,
        name: data.name,
        title: data.title,
        templateId: data.templateId,
        resumeData: data.resumeData,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        userId: data.userId
      };

      logInfo('Resume fetched successfully', { resumeId, userId });
      return resume;
    } catch (error) {
      logError('Failed to fetch resume', error);
      throw new Error(this.getErrorMessage(error, 'Failed to load resume'));
    }
  }

  // Delete a resume
  static async deleteResume(userId: string, resumeId: string): Promise<void> {
    try {
      logInfo('Deleting resume', { userId, resumeId });

      const resumeRef = doc(db, this.COLLECTION_NAME, resumeId);
      
      // Verify ownership
      const resumeDoc = await getDoc(resumeRef);
      if (!resumeDoc.exists()) {
        throw new Error('Resume not found');
      }

      const existingResume = resumeDoc.data();
      if (existingResume.userId !== userId) {
        throw new Error('Unauthorized: You can only delete your own resumes');
      }

      await deleteDoc(resumeRef);
      
      logInfo('Resume deleted successfully', { resumeId, userId });
    } catch (error) {
      logError('Failed to delete resume', error);
      throw new Error(this.getErrorMessage(error, 'Failed to delete resume'));
    }
  }



  // Helper method to format error messages
  private static getErrorMessage(error: any, fallback: string): string {
    // Log detailed error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Firebase Error Details:', {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
        customData: error?.customData
      });
    }

    if (error?.code) {
      switch (error.code) {
        case 'permission-denied':
          return 'Firebase security rules are blocking this request. Please check your Firestore rules.';
        case 'not-found':
          return 'The requested resume was not found';
        case 'unavailable':
          return 'Firestore service is currently unavailable. Please check your internet connection.';
        case 'unauthenticated':
          return 'Please sign in to continue';
        case 'failed-precondition':
          return 'Firestore database may not be properly initialized. Please check your Firebase setup.';
        case 'invalid-argument':
          return 'Invalid data provided to Firestore. Please check your resume data format.';
        default:
          return `Firebase Error (${error.code}): ${error.message || 'Unknown error'}`;
      }
    }
    
    if (error?.message) {
      // Check for common Firebase setup issues
      if (error.message.includes('Expected first argument to collection()')) {
        return 'Firebase Firestore is not properly initialized. Please check your Firebase configuration.';
      }
      if (error.message.includes('PERMISSION_DENIED')) {
        return 'Firestore security rules are blocking this request. Please check your Firestore rules.';
      }
      return error.message;
    }
    
    return fallback;
  }
} 