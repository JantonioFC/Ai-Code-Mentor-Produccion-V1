/**
 * API endpoint for getting recent project logs and dashboard data
 * GET /api/get-recent-log
 */

import { 
  getRecentEntries, 
  getLastEntry, 
  getProjectDashboard, 
  getRecentCompetencies 
} from '../../lib/database-json';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    const { 
      type, 
      limit, 
      dashboard, 
      last_only 
    } = req.query;

    // If requesting dashboard data
    if (dashboard === 'true') {
      const dashboardData = await getProjectDashboard();
      const recentCompetencies = await getRecentCompetencies(3);
      
      return res.status(200).json({
        success: true,
        dashboard: {
          ...dashboardData,
          recentCompetencies
        }
      });
    }

    // If requesting only the last entry of a specific type
    if (last_only === 'true' && type) {
      const lastEntry = await getLastEntry(type);
      
      return res.status(200).json({
        success: true,
        last_entry: lastEntry,
        entry_type: type
      });
    }

    // Default: get recent entries
    const entryLimit = limit ? parseInt(limit) : 10;
    const entries = await getRecentEntries(type || null, entryLimit);

    return res.status(200).json({
      success: true,
      entries,
      count: entries.length,
      filters: {
        type: type || 'all',
        limit: entryLimit
      }
    });

  } catch (error) {
    console.error('Error in /api/get-recent-log:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching project logs'
    });
  }
}
