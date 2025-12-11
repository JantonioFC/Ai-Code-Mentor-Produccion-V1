/**
 * API endpoint for logging project entries (daily reflections, weekly reviews, DDE entries)
 * POST /api/log-entry
 */

import { createProjectEntry } from '../../lib/database-json';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const {
      entry_type,
      content,
      template_used,
      module_reference,
      metadata
    } = req.body;

    // Validate required fields
    if (!entry_type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: entry_type and content are required.'
      });
    }

    // Validate entry_type
    const validTypes = [
      'daily_reflection', 
      'weekly_review', 
      'dde_entry', 
      'competency_update', 
      'project_completion',
      'weekly_action_plan',
      'quality_checklist_precommit',
      'quality_checklist_project', 
      'quality_checklist_weekly',
      'project_documentation',
      'technical_documentation',
      'unified_tracking_log',
      'peer_review'  // ← AGREGADO: Informe de Revisión por Pares (IRP)
    ];
    
    if (!validTypes.includes(entry_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid entry_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Create the project entry
    const result = await createProjectEntry({
      entry_type,
      content,
      template_used,
      module_reference,
      metadata
    });

    if (result.success) {
      return res.status(201).json({
        success: true,
        message: 'Project entry created successfully',
        entry_id: result.id,
        entry_type
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in /api/log-entry:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while creating project entry'
    });
  }
}
