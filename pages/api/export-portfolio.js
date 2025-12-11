/**
 * API endpoint for portfolio export
 * POST /api/export-portfolio
 * Handles PDF, HTML, and GitHub export generation
 */

import { getProjectDashboard, getRecentEntries, getAllModules } from '../../lib/database';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { format, config } = req.body;

    // Step 1: Collect portfolio data
    const portfolioData = await collectPortfolioData();
    
    // Step 2: Compile evidence
    const evidenceCompilation = await compileEvidence(portfolioData);
    
    // Step 3: Generate document
    const document = await generatePortfolioDocument(evidenceCompilation, config);
    
    // Step 4: Process export based on format
    let result;
    switch (format) {
      case 'pdf':
        result = await generatePDFExport(document);
        break;
      case 'html':
        result = await generateHTMLExport(document);
        break;
      case 'github':
        result = await generateGitHubPagesExport(document);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return res.status(200).json({
      success: true,
      format,
      downloadUrl: result.downloadUrl,
      metadata: result.metadata,
      message: `Portfolio exported successfully as ${format.toUpperCase()}`
    });

  } catch (error) {
    console.error('Portfolio export error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during portfolio export'
    });
  }
}

// Real data collection function
async function collectPortfolioData() {
  try {
    // Get dashboard data
    const dashboardResult = await getProjectDashboard();
    
    // Get all template entries
    const templatesResult = await getRecentEntries(null, 100); // Get all entries
    
    // Get all modules
    const modules = await getAllModules();
    
    return {
      dashboard: dashboardResult.success ? dashboardResult : { entryCounts: {}, recentEntries: [] },
      templates: templatesResult || [],
      modules: modules || [],
      timestamp: new Date().toISOString(),
      totalEntries: templatesResult?.length || 0
    };
  } catch (error) {
    console.error('Error collecting portfolio data:', error);
    throw new Error('Failed to collect portfolio data');
  }
}

// Real evidence compilation function
async function compileEvidence(data) {
  try {
    const evidenceByType = {};
    const competencyMapping = {};
    
    // Process template entries as evidence
    data.templates.forEach(entry => {
      const category = getTemplateCategory(entry.entry_type);
      const competencies = getCompetencyContribution(entry.entry_type);
      
      if (!evidenceByType[category]) {
        evidenceByType[category] = [];
      }
      
      evidenceByType[category].push({
        id: entry.id,
        type: entry.entry_type,
        date: entry.date,
        content: entry.content.substring(0, 200) + '...', // Summary
        evidenceType: getEvidenceType(entry.entry_type),
        competencies: competencies
      });
      
      // Map to competencies
      competencies.forEach(comp => {
        if (!competencyMapping[comp]) {
          competencyMapping[comp] = [];
        }
        competencyMapping[comp].push(entry.id);
      });
    });
    
    // Calculate competency level
    const totalEntries = data.templates.length;
    const competencyLevel = calculateCompetencyLevel(totalEntries);
    
    // Calculate phase progress
    const phaseProgress = calculatePhaseProgress(data.modules, totalEntries);
    
    return {
      ...data,
      evidenceCompilation: evidenceByType,
      competencyMapping: competencyMapping,
      competencyLevel: competencyLevel,
      phaseProgress: phaseProgress,
      totalEvidences: totalEntries,
      competencyCategories: Object.keys(evidenceByType).length,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error compiling evidence:', error);
    throw new Error('Failed to compile evidence');
  }
}

// Real document generation function
async function generatePortfolioDocument(data, config = {}) {
  const portfolioStructure = {
    metadata: {
      title: 'Portfolio de Competencias - Ecosistema 360',
      subtitle: 'Evidencias Documentadas • Simbiosis Crítica Humano-IA',
      student: config.studentName || 'AI Code Mentor User',
      generatedAt: new Date().toLocaleDateString('es-ES'),
      methodology: '24 meses • 6 fases • Andamiaje Decreciente',
      version: '1.0'
    },
    summary: {
      totalEvidences: data.totalEvidences,
      competencyLevel: data.competencyLevel,
      phaseProgress: data.phaseProgress,
      categories: data.competencyCategories,
      methodology: 'Ecosistema 360'
    },
    sections: [
      {
        id: 'executive_summary',
        title: 'Resumen Ejecutivo',
        content: generateExecutiveSummary(data)
      },
      {
        id: 'competency_framework',
        title: 'Marco de Competencias (HRC)',
        content: generateCompetencyFramework(data)
      },
      {
        id: 'evidence_documentation',
        title: 'Documentación de Evidencias',
        content: generateEvidenceDocumentation(data)
      },
      {
        id: 'learning_modules',
        title: 'Módulos de Aprendizaje',
        content: generateModulesSection(data)
      },
      {
        id: 'analytics_insights',
        title: 'Métricas y Análisis',
        content: generateAnalyticsSection(data)
      },
      {
        id: 'future_development',
        title: 'Plan de Desarrollo Futuro',
        content: generateFuturePlan(data)
      }
    ]
  };
  
  return portfolioStructure;
}

// PDF Export Implementation
async function generatePDFExport(document) {
  try {
    const pdf = new jsPDF();
    
    // Add title page
    pdf.setFontSize(20);
    pdf.text(document.metadata.title, 20, 30);
    pdf.setFontSize(14);
    pdf.text(document.metadata.subtitle, 20, 45);
    pdf.setFontSize(12);
    pdf.text(`Generado: ${document.metadata.generatedAt}`, 20, 60);
    
    // Add summary
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Resumen del Portfolio', 20, 30);
    pdf.setFontSize(12);
    pdf.text(`Total de Evidencias: ${document.summary.totalEvidences}`, 20, 50);
    pdf.text(`Nivel de Competencia: ${document.summary.competencyLevel.name}`, 20, 65);
    pdf.text(`Progreso de Fase: Fase ${document.summary.phaseProgress.currentPhase}`, 20, 80);
    
    // Add sections
    document.sections.forEach((section, index) => {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text(section.title, 20, 30);
      
      pdf.setFontSize(10);
      const splitText = pdf.splitTextToSize(section.content, 170);
      pdf.text(splitText, 20, 50);
    });
    
    // Generate blob URL for download
    const pdfBlob = pdf.output('blob');
    const downloadUrl = URL.createObjectURL(pdfBlob);
    
    return {
      downloadUrl,
      metadata: {
        format: 'pdf',
        size: pdfBlob.size,
        pages: pdf.getNumberOfPages()
      }
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF export');
  }
}

// HTML Export Implementation
async function generateHTMLExport(document) {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.metadata.title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
        .summary { background: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section-title { color: #1F2937; font-size: 1.5em; margin-bottom: 15px; border-left: 4px solid #3B82F6; padding-left: 15px; }
        .evidence-item { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px; padding: 15px; margin-bottom: 10px; }
        .competency-badge { display: inline-block; background: #EBF8FF; color: #1E40AF; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin: 2px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${document.metadata.title}</h1>
        <h2>${document.metadata.subtitle}</h2>
        <p><strong>Estudiante:</strong> ${document.metadata.student}</p>
        <p><strong>Generado:</strong> ${document.metadata.generatedAt}</p>
        <p><strong>Metodología:</strong> ${document.metadata.methodology}</p>
    </div>
    
    <div class="summary">
        <h3>Resumen del Portfolio</h3>
        <ul>
            <li><strong>Total de Evidencias:</strong> ${document.summary.totalEvidences}</li>
            <li><strong>Nivel de Competencia:</strong> ${document.summary.competencyLevel.name} (Nivel ${document.summary.competencyLevel.level})</li>
            <li><strong>Fase Actual:</strong> Fase ${document.summary.phaseProgress.currentPhase} - ${document.summary.phaseProgress.phaseName}</li>
            <li><strong>Categorías de Evidencia:</strong> ${document.summary.categories}</li>
        </ul>
    </div>
    
    ${document.sections.map(section => `
        <div class="section">
            <h3 class="section-title">${section.title}</h3>
            <div>${section.content}</div>
        </div>
    `).join('')}
    
    <footer style="text-align: center; margin-top: 50px; color: #6B7280; font-size: 0.9em;">
        <p>Generado por AI Code Mentor - Ecosistema 360</p>
        <p>Portfolio de Competencias Basado en Evidencias</p>
    </footer>
</body>
</html>`;

    // Create blob for download
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const downloadUrl = URL.createObjectURL(htmlBlob);
    
    return {
      downloadUrl,
      metadata: {
        format: 'html',
        size: htmlBlob.size,
        sections: document.sections.length
      }
    };
  } catch (error) {
    console.error('HTML generation error:', error);
    throw new Error('Failed to generate HTML export');
  }
}

// GitHub Pages Export Implementation
async function generateGitHubPagesExport(document) {
  try {
    const zip = new JSZip();
    
    // Create index.html
    const htmlContent = await generateHTMLExport(document);
    
    // Add files to ZIP
    zip.file("index.html", htmlContent);
    zip.file("README.md", generateReadmeContent(document));
    zip.file("_config.yml", `title: ${document.metadata.title}\ndescription: ${document.metadata.subtitle}`);
    
    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const downloadUrl = URL.createObjectURL(zipBlob);
    
    return {
      downloadUrl,
      metadata: {
        format: 'github-pages',
        size: zipBlob.size,
        files: ['index.html', 'README.md', '_config.yml']
      }
    };
  } catch (error) {
    console.error('GitHub Pages generation error:', error);
    throw new Error('Failed to generate GitHub Pages export');
  }
}

// Helper functions
function getTemplateCategory(entryType) {
  const categories = {
    'dde_entry': 'Decisiones de Ingeniería',
    'weekly_action_plan': 'Planificación Semanal',
    'unified_tracking_log': 'Seguimiento de Competencias',
    'peer_review': 'Revisión por Pares',
    'daily_reflection': 'Reflexión Personal',
    'weekly_review': 'Evaluación Semanal'
  };
  return categories[entryType] || 'Documentación General';
}

function getEvidenceType(entryType) {
  const types = {
    'dde_entry': 'Reflexión Técnica',
    'weekly_action_plan': 'Planificación Estratégica',
    'unified_tracking_log': 'Progresión de Competencias',
    'peer_review': 'Evaluación Colaborativa'
  };
  return types[entryType] || 'Evidencia Documentada';
}

function getCompetencyContribution(entryType) {
  const contributions = {
    'dde_entry': ['Pensamiento Crítico', 'Toma de Decisiones', 'Documentación Técnica'],
    'weekly_action_plan': ['Planificación', 'Gestión del Tiempo', 'Establecimiento de Objetivos'],
    'unified_tracking_log': ['Autoevaluación', 'Seguimiento de Progreso', 'Desarrollo de Competencias'],
    'peer_review': ['Comunicación', 'Feedback Constructivo', 'Colaboración']
  };
  return contributions[entryType] || ['Competencia General'];
}

function calculateCompetencyLevel(totalEntries) {
  if (totalEntries >= 15) return { level: 4, name: 'Avanzado', icon: '🏆' };
  if (totalEntries >= 10) return { level: 3, name: 'Intermedio', icon: '🌳' };
  if (totalEntries >= 5) return { level: 2, name: 'Básico', icon: '🌿' };
  return { level: 1, name: 'Principiante', icon: '🌱' };
}

function calculatePhaseProgress(modules, totalEntries) {
  return {
    currentPhase: Math.min(Math.floor(totalEntries / 5) + 1, 6),
    phaseName: ['Fundamentos', 'Frontend', 'Backend', 'DevOps', 'IA/Data', 'Integration'][Math.min(Math.floor(totalEntries / 5), 5)],
    progress: Math.min((totalEntries / 30) * 100, 100)
  };
}

function generateExecutiveSummary(data) {
  return `Este portfolio documenta ${data.totalEvidences} evidencias de competencias desarrolladas siguiendo la metodología Ecosistema 360. 
  El estudiante ha alcanzado el nivel ${data.competencyLevel.name} (Nivel ${data.competencyLevel.level}) y se encuentra en la 
  Fase ${data.phaseProgress.currentPhase}: ${data.phaseProgress.phaseName} del curriculum de 24 meses.`;
}

function generateCompetencyFramework(data) {
  const competencies = Object.keys(data.competencyMapping);
  return `Marco de competencias desarrollado: ${competencies.join(', ')}. 
  Total de evidencias mapeadas: ${data.totalEvidences} distribuidas en ${data.competencyCategories} categorías.`;
}

function generateEvidenceDocumentation(data) {
  let content = '<div class="evidence-list">';
  Object.entries(data.evidenceCompilation).forEach(([category, evidences]) => {
    content += `<h4>${category}</h4>`;
    evidences.forEach(evidence => {
      content += `<div class="evidence-item">
        <strong>Tipo:</strong> ${evidence.evidenceType}<br>
        <strong>Fecha:</strong> ${new Date(evidence.date).toLocaleDateString('es-ES')}<br>
        <strong>Competencias:</strong> ${evidence.competencies.map(c => `<span class="competency-badge">${c}</span>`).join('')}<br>
        <strong>Contenido:</strong> ${evidence.content}
      </div>`;
    });
  });
  content += '</div>';
  return content;
}

function generateModulesSection(data) {
  return `Módulos procesados: ${data.modules.length}. Sistema de aprendizaje basado en carga de archivos .md 
  con generación automática de lecciones mediante IA siguiendo principios de Simbiosis Crítica Humano-IA.`;
}

function generateAnalyticsSection(data) {
  return `Análisis de progreso: ${data.totalEvidences} evidencias documentadas, progreso de ${data.phaseProgress.progress.toFixed(1)}% 
  en el curriculum de 24 meses, distribución en ${data.competencyCategories} categorías de evidencia.`;
}

function generateFuturePlan(data) {
  const nextPhase = Math.min(data.phaseProgress.currentPhase + 1, 6);
  return `Plan de desarrollo: Continuar hacia Fase ${nextPhase}, incrementar evidencias en categorías menos desarrolladas, 
  mantener progresión siguiendo principios de Andamiaje Decreciente.`;
}

function generateReadmeContent(document) {
  return `# ${document.metadata.title}

${document.metadata.subtitle}

## Resumen del Portfolio

- **Total de Evidencias:** ${document.summary.totalEvidences}
- **Nivel de Competencia:** ${document.summary.competencyLevel.name}
- **Fase Actual:** Fase ${document.summary.phaseProgress.currentPhase}
- **Metodología:** ${document.metadata.methodology}

## Estructura

Este portfolio está organizado siguiendo la metodología Ecosistema 360 con evidencias documentadas de competencias desarrolladas a través de templates educativos estructurados.

## Generado por

AI Code Mentor - Plataforma de Aprendizaje Completa con metodología Ecosistema 360.
`;
}