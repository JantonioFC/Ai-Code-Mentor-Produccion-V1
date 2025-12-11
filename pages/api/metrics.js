/**
 * ENDPOINT DE MÉTRICAS RAG - /api/metrics
 * 
 * Endpoint para exponer métricas del Motor RAG en formato Prometheus
 * Compatible con Grafana y sistemas de monitoreo estándar
 * 
 * @author Mentor Coder
 * @version v1.0
 * @fecha 2025-09-16
 */

import { getRagMetrics } from '../../monitoring/rag-metrics.js';

export default async function handler(req, res) {
  try {
    const metrics = getRagMetrics();
    
    // Determinar formato de respuesta
    const format = req.query.format || 'prometheus';
    
    switch (format) {
      case 'prometheus':
        // Formato Prometheus para integración con Grafana
        const prometheusMetrics = await metrics.exportPrometheusMetrics();
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(prometheusMetrics);
        break;
        
      case 'json':
        // Formato JSON para debugging y APIs
        const jsonMetrics = metrics.metrics;
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(jsonMetrics);
        break;
        
      case 'summary':
        // Resumen ejecutivo para dashboards simples
        const summary = metrics.getSummaryStats();
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(summary);
        break;
        
      default:
        res.status(400).json({ 
          error: 'Formato no soportado',
          supported_formats: ['prometheus', 'json', 'summary'],
          examples: [
            '/api/metrics?format=prometheus',
            '/api/metrics?format=json', 
            '/api/metrics?format=summary'
          ]
        });
    }
    
  } catch (error) {
    console.error('Error en endpoint de métricas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
}
