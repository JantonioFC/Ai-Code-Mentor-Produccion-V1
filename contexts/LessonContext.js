// contexts/LessonContext.js
// MVP Context for Lesson Management - Created to resolve compilation errors
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the Lesson context
const LessonContext = createContext();

/**
 * Lesson Provider - MVP Version
 * Provides basic lesson management functionality to resolve compilation issues
 * This is a minimal viable version that can be expanded later
 */
export function LessonProvider({ children }) {
  // Basic state management
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Additional states for compatibility
  const [lessonHistory, setLessonHistory] = useState([]);
  const [lastAccessedLesson, setLastAccessedLesson] = useState(null);

  // Mock lesson data for development
  const mockLesson = {
    id: 'mock-lesson-1',
    title: 'Lección de Ejemplo',
    content: 'Esta es una lección de ejemplo para desarrollo MVP.',
    path: 'javascript.basics.introduction',
    difficulty: 'beginner',
    topics: ['variables', 'functions'],
    exercises: []
  };

  // Generate lesson function - MVP implementation
  const generateLesson = async (language, category, lesson) => {
    if (!language || !category || !lesson) {
      setError('Selecciona un idioma, categoría y lección para continuar');
      return;
    }

    setError('');
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      setLoadingProgress(25);
      console.log(`🚀 [LESSON_CONTEXT] Generating lesson (MVP): ${language}/${category}/${lesson}`);
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingProgress(60);

      // In a real implementation, this would call the API
      // For now, we set mock data
      const lessonData = {
        ...mockLesson,
        path: `${language}.${category}.${lesson}`,
        title: `${lesson} - ${category} (${language})`,
        generated_at: new Date().toISOString()
      };

      setLoadingProgress(90);
      setCurrentLesson(lessonData);
      
      // Add to history
      const historyItem = {
        path: lessonData.path,
        title: lessonData.title,
        difficulty: lessonData.difficulty,
        topics: lessonData.topics,
        accessed_at: new Date().toISOString()
      };

      setLessonHistory(prev => {
        const filtered = prev.filter(item => item.path !== lessonData.path);
        return [historyItem, ...filtered].slice(0, 10);
      });

      setLastAccessedLesson(historyItem);
      setLoadingProgress(100);

      console.log('✅ [LESSON_CONTEXT] Lesson generated successfully (MVP mode)');

    } catch (err) {
      console.error('❌ [LESSON_CONTEXT] Error generating lesson:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => setLoadingProgress(0), 2000);
    }
  };

  // Clear current lesson function
  const clearCurrentLesson = () => {
    setCurrentLesson(null);
    setError('');
    setLoadingProgress(0);
    console.log('🔄 [LESSON_CONTEXT] Current lesson cleared');
  };

  // Reload current lesson function - MVP implementation
  const reloadCurrentLesson = async () => {
    if (!currentLesson || !currentLesson.path) {
      console.warn('⚠️ [LESSON_CONTEXT] No current lesson to reload');
      return;
    }

    const pathParts = currentLesson.path.split('.');
    if (pathParts.length !== 3) {
      console.error('❌ [LESSON_CONTEXT] Invalid lesson path format:', currentLesson.path);
      return;
    }

    const [language, category, lesson] = pathParts;
    await generateLesson(language, category, lesson);
  };

  // Clear all persisted state function - MVP implementation
  const clearPersistedState = () => {
    setCurrentLesson(null);
    setLessonHistory([]);
    setLastAccessedLesson(null);
    setError('');
    setLoadingProgress(0);
    console.log('🧹 [LESSON_CONTEXT] All state cleared (MVP mode)');
  };

  // Load persisted state function - MVP implementation (no-op for now)
  const loadPersistedState = () => {
    console.log('🔄 [LESSON_CONTEXT] Loading persisted state (MVP mode - no persistence)');
    // In MVP mode, we don't persist to localStorage
    // This can be implemented later when needed
  };

  // Get lesson by path function - MVP implementation
  const getLessonByPath = async (path) => {
    try {
      console.log(`📖 [LESSON_CONTEXT] Getting lesson by path: ${path}`);
      const pathParts = path.split('.');
      if (pathParts.length === 3) {
        await generateLesson(pathParts[0], pathParts[1], pathParts[2]);
      } else {
        throw new Error('Invalid path format');
      }
    } catch (err) {
      console.error('❌ [LESSON_CONTEXT] Error getting lesson by path:', err);
      setError(err.message);
    }
  };

  // Context value with all required functions and state
  const contextValue = {
    // Main states
    currentLesson,
    isLoading,
    error,
    loadingProgress,
    
    // Persistence states (for compatibility)
    lessonHistory,
    lastAccessedLesson,
    
    // Main actions
    generateLesson,
    clearCurrentLesson,
    reloadCurrentLesson,
    
    // Persistence actions (MVP implementations)
    clearPersistedState,
    loadPersistedState,
    getLessonByPath,
    
    // Raw state setters (for compatibility with existing components)
    setCurrentLesson,
    setIsLoading,
    setError,
    setLoadingProgress,
    
    // Utilities
    hasLesson: !!currentLesson,
    hasError: !!error,
    historyCount: lessonHistory.length
  };

  return (
    <LessonContext.Provider value={contextValue}>
      {children}
    </LessonContext.Provider>
  );
}

/**
 * Custom hook to use the Lesson context
 * Must be used within a LessonProvider
 * Also exported as useLessonContext for compatibility
 */
export function useLesson() {
  const context = useContext(LessonContext);
  
  if (context === undefined) {
    throw new Error('useLesson must be used within a LessonProvider');
  }
  
  return context;
}

// Alternative export name for compatibility
export const useLessonContext = useLesson;

export default LessonContext;
