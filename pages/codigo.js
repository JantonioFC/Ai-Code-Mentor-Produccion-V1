import dynamic from 'next/dynamic';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PrivateLayout from '../components/layout/PrivateLayout';

/**
 * COMPONENTE OPTIMIZADO - pages/codigo.js
 * MISIÓN 213.0 - OPTIMIZACIÓN DE PERFORMANCE
 * 
 * V2.0 - Mejoras de Performance:
 * - Code splitting con dynamic import
 * - Lazy loading del componente CodeMentor
 * - Reducción de bundle inicial
 * 
 * @author Mentor Coder
 * @version v2.0 - Performance Optimized
 */

// MISIÓN 221.1: Code splitting - SandboxWidget se carga dinámicamente
const SandboxWidget = dynamic(
  () => import('../components/Sandbox/SandboxWidget'),
  {
    loading: () => (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">
            Cargando Sandbox de Código...
          </h2>
          <p className="mt-2 text-gray-500 text-sm">
            Code splitting habilitado ⚡
          </p>
        </div>
      </div>
    ),
    ssr: false // No renderizar en servidor
  }
);

export default function Codigo() {
  return (
    <ProtectedRoute>
      <PrivateLayout
        title="Análisis de Código - AI Code Mentor"
        description="Herramienta de verificación y mejora de código con IA - Ecosistema 360"
      >
        <div className="space-y-8">
          {/* Header del Análisis de Código */}
          <div className="bg-gradient-to-r from-cyan-50 via-teal-50 to-emerald-50 rounded-lg p-6 border border-cyan-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  🔍 Análisis y Mejora de Código
                </h1>
                <p className="text-gray-600">
                  Verificación con IA • Mejora automática • Análisis de calidad • Optimización de código
                </p>
              </div>
              <div className="text-4xl">🤖</div>
            </div>

            <div className="mt-4 flex items-center space-x-6 text-sm text-cyan-600">
              <span>✅ Vista Especializada</span>
              <span>🔍 Análisis IA</span>
              <span>⚡ Mejora Automática</span>
              <span>📊 Métricas de Calidad</span>
            </div>
          </div>

          {/* Descripción del Sistema de Análisis */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              🔬 Sistema de Análisis y Mejora de Código
              <span className="ml-2 text-sm font-normal text-cyan-600 bg-cyan-100 px-2 py-1 rounded-full">
                IA + Code Quality
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">🔍 Análisis Automático</h3>
                <p className="text-sm text-blue-700">
                  Revisión inteligente de código con detección de problemas y sugerencias de mejora
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">⚡ Optimización IA</h3>
                <p className="text-sm text-green-700">
                  Sugerencias automáticas para mejorar performance, legibilidad y mantenibilidad
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">📊 Métricas de Calidad</h3>
                <p className="text-sm text-purple-700">
                  Evaluación sistemática de la calidad del código con métricas cuantificables
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
              <h3 className="font-semibold text-teal-800 mb-2">🎯 Workflow de Análisis:</h3>
              <div className="text-sm text-teal-700 space-y-1">
                <p><strong>1. Carga:</strong> Introduce o pega el código para análisis</p>
                <p><strong>2. Análisis:</strong> IA evalúa estructura, sintaxis, performance y best practices</p>
                <p><strong>3. Reporte:</strong> Recibe análisis detallado con problemas identificados</p>
                <p><strong>4. Mejora:</strong> Aplica sugerencias automáticas o manuales de optimización</p>
              </div>
            </div>
          </div>

          {/* Herramienta de Análisis Principal */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                🛠️ Analizador de Código IA
                <span className="ml-2 text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  ✅ Operativo
                </span>
              </h2>

              <div className="text-sm text-gray-500">
                Herramienta independiente para verificación de código
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                🎯 Análisis Inteligente Especializado
              </h3>
              <p className="text-sm text-gray-600">
                Esta herramienta proporciona análisis profundo de código utilizando IA avanzada para
                identificar problemas, sugerir mejoras y optimizar la calidad del código desarrollado.
              </p>
            </div>

            {/* MISIÓN 221.1: Integración del SandboxWidget con code splitting */}
            <SandboxWidget />
          </div>

          {/* Características Avanzadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                🎨 Tipos de Análisis
                <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Disponible
                </span>
              </h3>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Análisis de sintaxis y estructura</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Detección de problemas de performance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Verificación de best practices</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Sugerencias de refactoring</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                🔧 Mejoras Automáticas
                <span className="ml-2 text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  IA Powered
                </span>
              </h3>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Optimización automática de código</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Corrección de problemas comunes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Mejora de legibilidad y mantenibilidad</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                  <span>Aplicación de estándares de la industria</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guía de Uso Especializada */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-cyan-800 mb-3">
              💡 Guía Especializada de Análisis de Código
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-cyan-800 mb-2">🚀 Mejores Prácticas:</h4>
                <ul className="space-y-1 text-cyan-700">
                  <li>• Analiza código en bloques manejables</li>
                  <li>• Revisa sugerencias antes de aplicar cambios</li>
                  <li>• Usa análisis iterativo para mejora continua</li>
                  <li>• Considera el contexto del proyecto al aplicar mejoras</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-cyan-800 mb-2">🎯 Optimización Efectiva:</h4>
                <ul className="space-y-1 text-cyan-700">
                  <li>• Prioriza mejoras de performance críticas</li>
                  <li>• Mantén equilibrio entre optimización y legibilidad</li>
                  <li>• Documenta cambios significativos realizados</li>
                  <li>• Valida funcionamiento después de optimizaciones</li>
                </ul>
              </div>
            </div>
          </div>


        </div>
      </PrivateLayout>
    </ProtectedRoute>
  );
}
