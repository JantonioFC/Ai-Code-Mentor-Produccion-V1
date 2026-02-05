/**
 * LoadingScreen - Indicador de Carga Global de Sesión con Logo Animado
 * 
 * @description Componente que se muestra mientras el sistema está verificando
 *              la sesión de autenticación con Supabase. Muestra el logo animado
 *              de la aplicación para una experiencia visual profesional.
 * 
 * @author Mentor Coder
 * @version 2.0.0
 * @created 2025-10-14
 * @updated 2025-12-05
 * @mission 221 - Eliminación de Race Condition en Autenticación
 * @mission VISUAL - Splash Screen con Logo Animado
 * 
 * ARQUITECTURA:
 * - Se muestra cuando authState === 'loading'
 * - Bloquea toda interacción hasta que la sesión esté resuelta
 * - Muestra video de logo animado con fallback a spinner
 * - Crítico para prevenir race conditions en tests E2E
 */

import React, { useState } from 'react';

export default function LoadingScreen({ message = 'Verificando sesión...' }) {
  const [videoError, setVideoError] = useState(false);

  return (
    <div
      className="loading-screen"
      role="status"
      aria-live="polite"
      aria-label="Cargando aplicación"
    >
      <div className="loading-content">
        {/* Logo Animado - Video con fallback a spinner */}
        {!videoError ? (
          <div className="logo-container" aria-hidden="true">
            <video
              src="/logo-animation.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="logo-video"
              onError={() => setVideoError(true)}
            />
          </div>
        ) : (
          /* Fallback: Spinner animado (si el video falla) */
          <div className="spinner" aria-hidden="true">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
        )}

        {/* Mensaje de carga */}
        <p className="loading-message">{message}</p>

        {/* Indicador visual adicional */}
        <div className="loading-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>

      <style jsx>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          z-index: 9999;
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        /* Logo animado container - FULLSCREEN */
        .logo-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .logo-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: transparent;
        }

        /* Spinner principal (fallback) */
        .spinner {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-top-color: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
        }

        .spinner-ring:nth-child(2) {
          border-top-color: rgba(255, 255, 255, 0.5);
          animation-delay: -0.3s;
          width: 90%;
          height: 90%;
          top: 5%;
          left: 5%;
        }

        .spinner-ring:nth-child(3) {
          border-top-color: rgba(255, 255, 255, 0.3);
          animation-delay: -0.6s;
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Mensaje de carga */
        .loading-message {
          font-family: var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
          font-size: 18px;
          font-weight: 500;
          color: white;
          text-align: center;
          margin: 0;
          letter-spacing: 0.5px;
        }

        /* Dots animados */
        .loading-dots {
          display: flex;
          gap: 8px;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: bounce 1.4s ease-in-out infinite;
        }

        .dot:nth-child(1) {
          animation-delay: -0.32s;
        }

        .dot:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .loading-message {
            font-size: 16px;
            padding: 0 20px;
          }

          .logo-container {
            width: 150px;
            height: 150px;
          }

          .spinner {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>
    </div>
  );
}
