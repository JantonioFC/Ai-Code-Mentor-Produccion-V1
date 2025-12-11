/**
 * Database Layer for AI Code Mentor - JSON TEMPORARY VERSION
 * Using JSON files for local persistence while we resolve better-sqlite3 compilation
 * This is a temporary solution to maintain development momentum
 */

const fs = require('fs');
const path = require('path');

// Ensure db directory exists
const dataDir = path.join(process.cwd(), 'db');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database files
const dbFiles = {
  modules: path.join(dataDir, 'modules.json'),
  lessons: path.join(dataDir, 'lessons.json'),
  exercises: path.join(dataDir, 'exercises.json'),
  progress: path.join(dataDir, 'progress.json'),
  project_entries: path.join(dataDir, 'project_entries.json'),
  competency_log: path.join(dataDir, 'competency_log.json')
};

// Initialize JSON files if they don't exist
function initializeDatabase() {
  Object.entries(dbFiles).forEach(([key, filepath]) => {
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify([], null, 2));
      console.log(`✅ Initialized ${key}.json`);
    }
  });
}

// Utility functions for JSON operations
function readData(filepath) {
  try {
    if (!fs.existsSync(filepath)) {
      return [];
    }
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filepath}:`, error);
    return [];
  }
}

function writeData(filepath, data) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filepath}:`, error);
    return false;
  }
}

// ==================== PROJECT TRACKING OPERATIONS ====================

/**
 * Create a project entry (daily reflection, weekly review, etc.)
 */
function createProjectEntry(entryData) {
  try {
    const entries = readData(dbFiles.project_entries);
    const entryId = `entry_${entryData.entry_type}_${Date.now()}`;
    
    // Validate entry type
    const validTypes = [
      'daily_reflection', 'weekly_review', 'dde_entry', 'competency_update', 
      'project_completion', 'weekly_action_plan', 'quality_checklist_precommit',
      'quality_checklist_project', 'quality_checklist_weekly', 'project_documentation',
      'technical_documentation', 'unified_tracking_log', 'peer_review'
    ];
    
    if (!validTypes.includes(entryData.entry_type)) {
      return { success: false, error: `Invalid entry type: ${entryData.entry_type}` };
    }
    
    const newEntry = {
      id: entryId,
      entry_type: entryData.entry_type,
      date: new Date().toISOString(),
      content: entryData.content,
      template_used: entryData.template_used || null,
      module_reference: entryData.module_reference || null,
      metadata: entryData.metadata ? JSON.stringify(entryData.metadata) : null,
      created_at: new Date().toISOString()
    };
    
    entries.push(newEntry);
    
    if (writeData(dbFiles.project_entries, entries)) {
      return { success: true, id: entryId, changes: 1 };
    } else {
      return { success: false, error: 'Failed to write project entry' };
    }
  } catch (error) {
    console.error('Error creating project entry:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get recent project entries by type
 */
function getRecentEntries(entryType = null, limit = 10) {
  try {
    let entries = readData(dbFiles.project_entries);
    
    if (entryType) {
      entries = entries.filter(e => e.entry_type === entryType);
    }
    
    // Sort by date descending
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add mock module titles for compatibility
    entries = entries.map(entry => ({
      ...entry,
      module_title: entry.module_reference ? `Module ${entry.module_reference}` : null
    }));
    
    return entries.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent entries:', error);
    return [];
  }
}

/**
 * Get the last entry of a specific type
 */
function getLastEntry(entryType) {
  try {
    const entries = getRecentEntries(entryType, 1);
    return entries.length > 0 ? entries[0] : null;
  } catch (error) {
    console.error('Error fetching last entry:', error);
    return null;
  }
}

/**
 * Get project tracking dashboard data
 */
function getProjectDashboard() {
  try {
    const lastReflection = getLastEntry('daily_reflection');
    const lastReview = getLastEntry('weekly_review');
    const recentEntries = getRecentEntries(null, 5);
    
    // Get entry counts by type
    const entries = readData(dbFiles.project_entries);
    const entryCounts = {};
    
    entries.forEach(entry => {
      entryCounts[entry.entry_type] = (entryCounts[entry.entry_type] || 0) + 1;
    });
    
    return {
      lastReflection,
      lastReview,
      recentEntries,
      entryCounts,
      success: true
    };
  } catch (error) {
    console.error('Error fetching project dashboard:', error);
    return { success: false, error: error.message };
  }
}

// ==================== COMPETENCY TRACKING OPERATIONS ====================

/**
 * Log a competency achievement
 */
function logCompetency(competencyData) {
  try {
    const competencies = readData(dbFiles.competency_log);
    const competencyId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newCompetency = {
      id: competencyId,
      competency_name: competencyData.competency_name,
      competency_category: competencyData.competency_category || 'General',
      level_achieved: competencyData.level_achieved || 1,
      evidence_description: competencyData.evidence_description,
      evidence_module_id: competencyData.evidence_module_id || null,
      evidence_project_entry_id: competencyData.evidence_project_entry_id || null,
      achieved_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    competencies.push(newCompetency);
    
    if (writeData(dbFiles.competency_log, competencies)) {
      return { success: true, id: competencyId, changes: 1 };
    } else {
      return { success: false, error: 'Failed to write competency data' };
    }
  } catch (error) {
    console.error('Error logging competency:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get competencies by category
 */
function getCompetencies(category = null) {
  try {
    let competencies = readData(dbFiles.competency_log);
    
    if (category) {
      competencies = competencies.filter(c => c.competency_category === category);
    }
    
    // Add mock evidence details for compatibility
    competencies = competencies.map(comp => ({
      ...comp,
      evidence_module_title: comp.evidence_module_id ? `Module ${comp.evidence_module_id}` : null,
      evidence_entry_type: comp.evidence_project_entry_id ? 'project_entry' : null
    }));
    
    // Sort by date descending
    competencies.sort((a, b) => new Date(b.achieved_date) - new Date(a.achieved_date));
    
    return competencies;
  } catch (error) {
    console.error('Error fetching competencies:', error);
    return [];
  }
}

/**
 * Get competency statistics
 */
function getCompetencyStats() {
  try {
    const competencies = readData(dbFiles.competency_log);
    
    if (competencies.length === 0) {
      return {
        categoryStats: [],
        overall: { total: 0, overall_avg: 0 },
        success: true
      };
    }
    
    // Group by category
    const categoryGroups = {};
    competencies.forEach(comp => {
      const cat = comp.competency_category;
      if (!categoryGroups[cat]) {
        categoryGroups[cat] = [];
      }
      categoryGroups[cat].push(comp);
    });
    
    // Calculate stats by category
    const categoryStats = Object.entries(categoryGroups).map(([category, comps]) => ({
      competency_category: category,
      total_competencies: comps.length,
      avg_level: comps.reduce((sum, c) => sum + c.level_achieved, 0) / comps.length,
      max_level: Math.max(...comps.map(c => c.level_achieved))
    }));
    
    // Overall stats
    const overall = {
      total: competencies.length,
      overall_avg: competencies.reduce((sum, c) => sum + c.level_achieved, 0) / competencies.length
    };
    
    return {
      categoryStats,
      overall,
      success: true
    };
  } catch (error) {
    console.error('Error fetching competency stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get recent competency achievements
 */
function getRecentCompetencies(limit = 5) {
  try {
    const competencies = getCompetencies();
    return competencies.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent competencies:', error);
    return [];
  }
}

// Initialize database on module load
initializeDatabase();

// Export all functions (same interface as SQLite version)
module.exports = {
  // Project tracking operations
  createProjectEntry,
  getRecentEntries,
  getLastEntry,
  getProjectDashboard,
  
  // Competency tracking operations
  logCompetency,
  getCompetencies,
  getCompetencyStats,
  getRecentCompetencies,
  
  // Utility
  initializeDatabase
};
