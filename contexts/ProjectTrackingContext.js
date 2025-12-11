// contexts/ProjectTrackingContext.js
// MVP Context for Project Tracking - Created to resolve compilation errors
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the Project Tracking context
const ProjectTrackingContext = createContext();

/**
 * Project Tracking Provider - MVP Version
 * Provides basic project tracking functionality to resolve compilation issues
 * This is a minimal viable version that can be expanded later
 */
export function ProjectTrackingProvider({ children }) {
  // Basic state management
  const [dashboardData, setDashboardData] = useState(null);
  const [entryCounts, setEntryCounts] = useState({});
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock data for development
  const mockDashboardData = {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalHours: 0
  };

  const mockEntryCounts = {
    dde_entry: 0,
    weekly_action_plan: 0,
    unified_tracking_log: 0,
    peer_review: 0,
    project_reflection: 0
  };

  const mockRecentEntries = [];

  // Initialize with mock data
  useEffect(() => {
    setDashboardData(mockDashboardData);
    setEntryCounts(mockEntryCounts);
    setRecentEntries(mockRecentEntries);
  }, []);

  // Load dashboard data function - MVP implementation
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make API calls
      // For now, we just set the mock data
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate loading

      setDashboardData(mockDashboardData);
      setEntryCounts(mockEntryCounts);
      setRecentEntries(mockRecentEntries);
      
      console.log('📊 [PROJECT_TRACKING] Dashboard data loaded (MVP mode)');
    } catch (err) {
      console.error('❌ [PROJECT_TRACKING] Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add new entry function - MVP implementation
  const addEntry = async (entryType, entryData) => {
    setLoading(true);
    try {
      // In a real implementation, this would save to database
      console.log(`➕ [PROJECT_TRACKING] Adding entry: ${entryType}`, entryData);
      
      // Update entry counts
      setEntryCounts(prev => ({
        ...prev,
        [entryType]: (prev[entryType] || 0) + 1
      }));
      
      // Add to recent entries
      const newEntry = {
        id: Date.now(),
        entry_type: entryType,
        date: new Date().toISOString(),
        ...entryData
      };
      
      setRecentEntries(prev => [newEntry, ...prev.slice(0, 4)]); // Keep only 5 recent
      
      return { success: true, entry: newEntry };
    } catch (err) {
      console.error('❌ [PROJECT_TRACKING] Error adding entry:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update entry function - MVP implementation
  const updateEntry = async (entryId, updateData) => {
    setLoading(true);
    try {
      console.log(`📝 [PROJECT_TRACKING] Updating entry: ${entryId}`, updateData);
      
      // Update recent entries
      setRecentEntries(prev => 
        prev.map(entry => 
          entry.id === entryId ? { ...entry, ...updateData } : entry
        )
      );
      
      return { success: true };
    } catch (err) {
      console.error('❌ [PROJECT_TRACKING] Error updating entry:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete entry function - MVP implementation
  const deleteEntry = async (entryId, entryType) => {
    setLoading(true);
    try {
      console.log(`🗑️ [PROJECT_TRACKING] Deleting entry: ${entryId}`);
      
      // Update entry counts
      setEntryCounts(prev => ({
        ...prev,
        [entryType]: Math.max((prev[entryType] || 0) - 1, 0)
      }));
      
      // Remove from recent entries
      setRecentEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      return { success: true };
    } catch (err) {
      console.error('❌ [PROJECT_TRACKING] Error deleting entry:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Export to portfolio function - MVP implementation
  const exportToPortfolio = async () => {
    console.log('📁 [PROJECT_TRACKING] Exporting to portfolio (MVP mode)');
    return { 
      success: true, 
      message: 'Portfolio export functionality will be implemented in future versions' 
    };
  };

  // Reset all data function - MVP implementation
  const resetAllData = async () => {
    setLoading(true);
    try {
      console.log('🔄 [PROJECT_TRACKING] Resetting all data (MVP mode)');
      
      setDashboardData(mockDashboardData);
      setEntryCounts(mockEntryCounts);
      setRecentEntries(mockRecentEntries);
      setError(null);
      
      return { success: true };
    } catch (err) {
      console.error('❌ [PROJECT_TRACKING] Error resetting data:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Select template function - Route to functional pages for ALL templates
  const selectTemplate = (templateType) => {
    try {
      console.log(`📋 [PROJECT_TRACKING] Template selected: ${templateType}`);
      
      // Route to specific page for IRP (has special AI generation functionality)
      if (templateType === 'peer_review') {
        console.log('✅ [PROJECT_TRACKING] Routing to specialized IRP page...');
        window.location.href = '/irp';
        return { success: true, templateType, action: 'routed_specialized' };
      }
      
      // Route to universal template creator for all other templates
      console.log(`✅ [PROJECT_TRACKING] Routing to template creator for: ${templateType}`);
      window.location.href = `/crear-template?type=${templateType}`;
      
      return { success: true, templateType, action: 'routed_universal' };
    } catch (err) {
      console.error('❌ [PROJECT_TRACKING] Error selecting template:', err);
      return { success: false, error: err.message };
    }
  };

  // Context value with all required functions and state
  const value = {
    // State
    dashboardData,
    entryCounts,
    recentEntries,
    loading,
    error,
    
    // Functions
    loadDashboardData,
    addEntry,
    updateEntry,
    deleteEntry,
    exportToPortfolio,
    resetAllData,
    selectTemplate,
    
    // Utilities
    isLoading: loading,
    hasError: !!error,
    totalEntries: Object.values(entryCounts).reduce((sum, count) => sum + count, 0)
  };

  return (
    <ProjectTrackingContext.Provider value={value}>
      {children}
    </ProjectTrackingContext.Provider>
  );
}

/**
 * Custom hook to use the Project Tracking context
 * Must be used within a ProjectTrackingProvider
 */
export function useProjectTracking() {
  const context = useContext(ProjectTrackingContext);
  
  if (context === undefined) {
    throw new Error('useProjectTracking must be used within a ProjectTrackingProvider');
  }
  
  return context;
}

export default useProjectTracking;
