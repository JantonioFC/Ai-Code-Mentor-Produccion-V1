// components/dashboard/AchievementsWidget.js
// MISIÓN 160 FASE 3 - WIDGET DE VISUALIZACIÓN DE LOGROS
// Objetivo: Mostrar logros obtenidos de forma visualmente atractiva

import { useState, useEffect } from 'react';

export default function AchievementsWidget() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [checking, setChecking] = useState(false);

  // Hook para cargar logros del usuario
  useEffect(() => {
    fetchUserAchievements();
  }, []);

  /**
   * Obtener logros ya obtenidos por el usuario
   */
  const fetchUserAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[ACHIEVEMENTS-WIDGET] Cargando logros del usuario...');

      const response = await fetch('/api/achievements', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[ACHIEVEMENTS-WIDGET] Logros obtenidos:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Error obteniendo logros');
      }

      setAchievements(result.achievements || []);
      setMetadata(result.metadata || null);
    } catch (err) {
      console.error('[ACHIEVEMENTS-WIDGET] Error cargando logros:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ejecutar motor de logros para verificar nuevos achievements
   */
  const checkForNewAchievements = async () => {
    try {
      setChecking(true);
      console.log('[ACHIEVEMENTS-WIDGET] Verificando nuevos logros...');

      const response = await fetch('/api/achievements/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[ACHIEVEMENTS-WIDGET] Resultado verificación:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Error verificando logros');
      }

      // Si hay nuevos logros, recargar la lista
      if (result.summary.hasNewAchievements) {
        console.log(`[ACHIEVEMENTS-WIDGET] 🎉 ${result.summary.newlyUnlocked} nuevos logros!`);
        await fetchUserAchievements(); // Recargar lista actualizada
        
        // Mostrar notificación de éxito (opcional)
        // TODO: Implementar toast notification system
      }

      return result;
    } catch (err) {
      console.error('[ACHIEVEMENTS-WIDGET] Error verificando logros:', err);
      setError(`Error verificando nuevos logros: ${err.message}`);
    } finally {
      setChecking(false);
    }
  };

  // Estado de carga con skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-40"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          
          {/* Achievement cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center text-red-600 mb-4">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-medium">Error cargando logros</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="flex gap-2">
          <button
            onClick={fetchUserAchievements}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={checkForNewAchievements}
            disabled={checking}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {checking ? 'Verificando...' : 'Verificar nuevos logros'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          🏆 Logros Obtenidos
          {achievements.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {achievements.length}
            </span>
          )}
        </h3>
        <button
          onClick={checkForNewAchievements}
          disabled={checking}
          className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm flex items-center"
        >
          {checking ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verificando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Verificar
            </>
          )}
        </button>
      </div>

      {/* Estadísticas de progreso */}
      {metadata && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">
              Progreso de logros: {metadata.completionPercentage}%
            </span>
            <span className="text-blue-600">
              {achievements.length} de {metadata.totalAchievementsAvailable} disponibles
            </span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metadata.completionPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Lista de logros */}
      {achievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id} 
              className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start">
                <div className="text-2xl mr-3 mt-0.5">
                  {achievement.icon || '🏆'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">
                    {achievement.name}
                  </h4>
                  <p className="text-gray-600 text-xs mb-2 leading-relaxed">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </span>
                    <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
                      Desbloqueado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Estado vacío - sin logros
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎯</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">
            ¡Comienza tu viaje de logros!
          </h4>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Completa semanas, fases y alcanza hitos en tu progreso para desbloquear logros únicos.
          </p>
          <button
            onClick={checkForNewAchievements}
            disabled={checking}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {checking ? 'Verificando logros...' : 'Verificar logros disponibles'}
          </button>
        </div>
      )}

      {/* Footer informativo */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
        Los logros se evalúan automáticamente según tu progreso en el Ecosistema 360
      </div>
    </div>
  );
}
