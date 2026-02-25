# Product Requirements Document (PRD): AI Code Mentor

**Estado:** Borrador v1.0  
**Fecha:** 15 de Febrero, 2026  
**Confidencialidad:** Documento Interno (No Commietable)

---

## 1. Visión del Producto
AI Code Mentor es un tutor de programación inteligente diseñado para ofrecer una experiencia de aprendizaje altamente personalizada. A diferencia de los cursos estáticos, el sistema adapta el contenido, los ejercicios y el ritmo de aprendizaje al nivel actual del usuario, sus intereses y sus lagunas de conocimiento detectadas mediante análisis de IA.

## 2. Público Objetivo
- **Estudiantes de Programación:** Desde principiantes hasta niveles intermedios que buscan una guía estructurada pero flexible.
- **Desarrolladores en Transición:** Profesionales que desean aprender un nuevo lenguaje o framework (ej. un desarrollador Python aprendiendo Rust).
- **Universidades y Bootcamps:** Como herramienta complementaria para refuerzo individualizado.

## 3. Características Principales (MVP)

### 3.1. Generación Dinámica de Lecciones
- **IA Adaptativa:** Uso de Gemini 2.5 para generar explicaciones y ejemplos de código en tiempo real.
- **Multimodalidad:** Integración de diagramas Mermaid para visualización de conceptos y generación de imágenes mediante IA.
- **Exportación:** Capacidad de descargar lecciones en formato PDF para estudio offline.

### 3.2. Sistema de Mentoría y Feedback
- **Clarity Gate:** Filtro de seguridad anti-alucinaciones para asegurar que los consejos técnicos sean precisos.
- **LLM-as-Judge:** Sistema de evaluación automática que califica las respuestas del usuario y proporciona retroalimentación constructiva.
- **Extensión VS Code:** Integración directa en el editor para resolver dudas sin salir del entorno de desarrollo.

### 3.3. Memoria y Persistencia
- **RAG Avanzado:** Recuperación de información relevante de una base de conocimiento técnica propia.
- **Entity Memory:** El mentor recuerda el progreso histórico del usuario, errores comunes y preferencias.

## 4. Requisitos Técnicos

### 4.1. Stack Tecnológico
- **Frontend/Backend:** Next.js 15.4 (App Router) con React 18.
- **Base de Datos:** SQLite para simplicidad local y portabilidad.
- **Estilos:** Tailwind CSS con un diseño premium y responsivo.
- **IA:** Integración con la API de Google Gemini (Flash y Pro).

### 4.2. Infraestructura y Seguridad
- **Autenticación:** Sistema robusto basado en JWT y bcryptjs.
- **Monitoreo:** Sentry para seguimiento de errores y métricas de rendimiento.
- **Circuit Breaker:** Protección contra fallos en la API de IA para garantizar la disponibilidad del servicio.

## 5. Roadmap Sugerido

### Fase 1: Estabilización (Actual)
- Refinar el sistema de RAG y reducir la latencia de respuesta.
- Completar la cobertura de tests unitarios (actualmente 130+).

### Fase 2: Social & Community
- Implementar foros de discusión y compartición de lecciones generadas por usuarios.
- Gamificación mediante insignias y niveles de habilidad.

### Fase 3: Enterprise Ready
- Integración con repositorios de GitHub privados para aprendizaje sobre código real de empresas.
- Soporte para flujos de trabajo de equipo y revisiones de código asistidas por IA.

---

> [!NOTE]
> Este documento es una representación conceptual basada en el estado actual del repositorio `ai-code-mentor-beta-test`.
