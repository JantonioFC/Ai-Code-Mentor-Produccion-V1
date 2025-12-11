/**
 * API endpoint for getting project dashboard data
 * GET /api/get-dashboard
 */

import { getProjectDashboard } from '../../lib/database';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    const dashboardData = await getProjectDashboard();
    
    if (dashboardData.success) {
      return res.status(200).json({
        success: true,
        ...dashboardData
      });
    } else {
      return res.status(500).json({
        success: false,
        error: dashboardData.error
      });
    }

  } catch (error) {
    console.error('Error in /api/get-dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching dashboard data'
    });
  }
}
