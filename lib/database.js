/**
 * Database Layer for AI Code Mentor - 100% Supabase
 * Using Supabase PostgreSQL for all data persistence
 * Re-arquitectura completa: Sin SQLite, solo cloud
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration in environment variables');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== SIMPLIFIED DATABASE OPERATIONS ====================
// Solo funciones básicas necesarias para la aplicación actual

/**
 * Get all modules (placeholder - migrará a Supabase gradualmente)
 */
async function getAllModules() {
  try {
    // Por ahora retornamos array vacío - se implementará con Supabase tables
    return [];
  } catch (error) {
    console.error('Error fetching modules:', error);
    return [];
  }
}

/**
 * Get progress for dashboard (placeholder)
 */
async function getOverallStats() {
  try {
    // Retornamos stats básicas por ahora
    return {
      total_modules: 0,
      total_lessons: 0,
      completed_lessons: 0,
      total_exercises: 0,
      completed_exercises: 0
    };
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    return {
      total_modules: 0,
      total_lessons: 0,
      completed_lessons: 0,
      total_exercises: 0,
      completed_exercises: 0
    };
  }
}

/**
 * Get recent entries (placeholder)
 */
async function getRecentEntries(entryType = null, limit = 10) {
  try {
    // Por ahora retornamos array vacío
    return [];
  } catch (error) {
    console.error('Error fetching recent entries:', error);
    return [];
  }
}

/**
 * Get project dashboard data (placeholder)
 */
async function getProjectDashboard() {
  try {
    return {
      lastReflection: null,
      lastReview: null,
      recentEntries: [],
      entryCounts: {},
      success: true
    };
  } catch (error) {
    console.error('Error fetching project dashboard:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test Supabase connection
 */
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

// Export Supabase client and functions
export {
  // Supabase client for direct usage
  supabase,
  
  // Simplified module operations (placeholders)
  getAllModules,
  getOverallStats,
  getRecentEntries,
  getProjectDashboard,
  
  // Connection testing
  testConnection
};

// Log successful initialization
console.log('📡 Database layer initialized - 100% Supabase');
