/**
 * API endpoint for updating competency tracking (HRC - Hoja de Ruta de Competencias)
 * POST /api/update-competency
 */

import { 
  logCompetency, 
  getCompetencies, 
  getCompetencyStats,
  getRecentCompetencies 
} from '../../lib/database';

export default async function handler(req, res) {
  // Handle different HTTP methods
  if (req.method === 'POST') {
    return await handleCreateCompetency(req, res);
  } else if (req.method === 'GET') {
    return await handleGetCompetencies(req, res);
  } else {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST to create, GET to retrieve.' 
    });
  }
}

// Handle creating new competency achievement
async function handleCreateCompetency(req, res) {
  try {
    const {
      competency_name,
      competency_category,
      level_achieved,
      evidence_description,
      evidence_module_id,
      evidence_project_entry_id
    } = req.body;

    // Validate required fields
    if (!competency_name || !evidence_description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: competency_name and evidence_description are required.'
      });
    }

    // Validate level_achieved
    const level = level_achieved ? parseInt(level_achieved) : 1;
    if (level < 1 || level > 10) {
      return res.status(400).json({
        success: false,
        error: 'level_achieved must be between 1 and 10.'
      });
    }

    // Create the competency log entry
    const result = await logCompetency({
      competency_name,
      competency_category: competency_category || 'General',
      level_achieved: level,
      evidence_description,
      evidence_module_id,
      evidence_project_entry_id
    });

    if (result.success) {
      return res.status(201).json({
        success: true,
        message: 'Competency logged successfully',
        competency_id: result.id,
        competency_name,
        level_achieved: level
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error creating competency:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while logging competency'
    });
  }
}

// Handle getting competencies and stats
async function handleGetCompetencies(req, res) {
  try {
    const { 
      category, 
      stats, 
      recent, 
      limit 
    } = req.query;

    // If requesting stats
    if (stats === 'true') {
      const competencyStats = await getCompetencyStats();
      return res.status(200).json({
        success: true,
        stats: competencyStats
      });
    }

    // If requesting recent competencies only
    if (recent === 'true') {
      const recentLimit = limit ? parseInt(limit) : 5;
      const recentCompetencies = await getRecentCompetencies(recentLimit);
      
      return res.status(200).json({
        success: true,
        recent_competencies: recentCompetencies,
        count: recentCompetencies.length
      });
    }

    // Default: get all competencies (optionally filtered by category)
    const competencies = await getCompetencies(category || null);

    return res.status(200).json({
      success: true,
      competencies,
      count: competencies.length,
      filters: {
        category: category || 'all'
      }
    });

  } catch (error) {
    console.error('Error getting competencies:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching competencies'
    });
  }
}
