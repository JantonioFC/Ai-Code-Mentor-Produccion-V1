/**
 * Templates library for AI Code Mentor - Ecosistema 360 Integration
 * Provides structured templates following Ecosistema 360 educational methodology
 */

export const TEMPLATES = {
  // 1. REFLEXIÓN DIARIA
  daily_reflection: {
    name: 'Reflexión Diaria',
    subtitle: 'Metacognición • Seguimiento Personal',
    description: 'Reflexión diaria sobre progreso y aprendizaje siguiendo principios de andamiaje decreciente',
    icon: '📝',
    template: `# Mi Reflexión Diaria - {date}

## ¿Qué logré hoy?
- [Logro específico 1]
- [Logro específico 2]

## ¿Qué aprendí?
- **Técnico:** [Concepto/Tecnología nueva]
- **Metodológico:** [Habilidad desarrollada]

## ¿Qué desafíos enfrenté?
- [Desafío 1] → **Solución:** [Cómo lo resolví]

## ¿Cómo me siento?
**Nivel de confianza:** [1-10]
**Motivación:** [1-10]
**Energía:** [1-10]

## Plan para mañana
- [ ] [Tarea prioritaria 1]
- [ ] [Tarea prioritaria 2]`,
    metadata_fields: {
      estado_animo: 'string',
      horas_estudiadas: 'number',
      nivel_concentracion: 'number',
      nivel_confianza: 'number'
    }
  },

  // 2. REVIEW SEMANAL
  weekly_review: {
    name: 'Revisión Semanal',
    subtitle: 'Evaluación • Progreso Curricular',
    description: 'Evaluación semanal de progreso y metas dentro del curriculum de 24 meses',
    icon: '📊',
    template: `# Revisión Semanal - Semana {week_number}
**Fechas:** {start_date} a {end_date}

## Objetivos de la Semana
- [ ] [Objetivo 1] - **Estado:** [Completado/En progreso/Pendiente]
- [ ] [Objetivo 2] - **Estado:** [Completado/En progreso/Pendiente]

## Logros Destacados
1. [Logro más significativo]
2. [Segundo logro importante]

## Métricas
- **Horas dedicadas:** [N] horas
- **Objetivos completados:** [N]/[Total]
- **Satisfacción general:** [1-10]

## ¿Qué funcionó bien?
- [Aspecto positivo 1]
- [Aspecto positivo 2]

## ¿Qué necesita mejora?
- [Área de mejora 1] → **Plan:** [Acción específica]

## Metas para próxima semana
- [ ] [Meta SMART 1]
- [ ] [Meta SMART 2]`,
    metadata_fields: {
      week_number: 'number',
      goals_completed: 'number',
      goals_total: 'number',
      satisfaction: 'number',
      hours_studied: 'number'
    }
  },

  // 3. DIARIO DE DECISIONES DE INGENIERÍA (DDE)
  dde_entry: {
    name: 'Diario de Decisiones de Ingeniería (DDE)',
    subtitle: 'Simbiosis Crítica Humano-IA • Reflexión Técnica',
    description: 'Documenta decisiones técnicas importantes siguiendo metodología de ingeniería razonada del Ecosistema 360',
    icon: '📋',
    template: `# Decisión #{decision_number}: {decision_title}
**Fecha:** {date}

## 1. Contexto del Problema
[Descripción clara del problema a resolver. Por ejemplo: "La aplicación necesita un sistema de caché en memoria para reducir llamadas a la base de datos."]

## 2. Alternativas Consideradas
### Alternativa A: {option_1}
**Pros:**
- [Ventaja 1]
- [Ventaja 2]

**Contras:**
- [Desventaja 1]
- [Desventaja 2]

### Alternativa B: {option_2}
**Pros:**
- [Ventaja 1]

**Contras:**
- [Desventaja 1]

## 3. Decisión Final y Justificación
**Elegí:** [Alternativa seleccionada]

**Justificación:** [Explica por qué elegiste esta opción basándote en los pros/contras y requisitos del problema]

## 4. Auditoría de Interacción con IA (si aplica)
[Describe si consultaste IA, qué sugirió, y si seguiste el consejo o no, y por qué]`,
    metadata_fields: {
      decision_complexity: 'string',
      alternatives_considered: 'number',
      ai_consulted: 'boolean',
      implementation_status: 'string'
    }
  },

  // 4. PLAN DE ACCIÓN SEMANAL (PAS)
  weekly_action_plan: {
    name: 'Plan de Acción Semanal (PAS)',
    subtitle: 'Planificación Estructurada • Autogestión',
    description: 'Planificación detallada semanal siguiendo estructura curricular del Ecosistema 360',
    icon: '📅',
    template: `# Plan de Acción Semanal: Semana {week_number}
**Fechas:** {start_date} a {end_date}
**Fase:** {phase}
**Meta Principal:** {main_goal}

## 1. Objetivos Principales
- [ ] [Objetivo 1 del currículo para esta semana]
- [ ] [Objetivo 2 del currículo para esta semana]
- [ ] [Objetivo 3 del currículo para esta semana]

## 2. Desglose de Tareas
### Lunes:
- [ ] [Tarea específica 1]
- [ ] [Tarea específica 2]

### Martes:
- [ ] [Tarea específica 1]

### Miércoles:
- [ ] [Tarea específica 1]

### Jueves:
- [ ] [Tarea específica 1]
- [ ] [Tarea específica 2]

### Viernes:
- [ ] [Tarea específica 1]

### Fin de Semana:
- [ ] [Tarea de consolidación o descanso]

## 3. Reflexión de Fin de Semana
**Progreso Realizado:** [Marcar checkboxes arriba]

**Desviaciones y Lecciones Aprendidas:**
> [Escribe tu reflexión sobre lo que funcionó, lo que no, y qué lecciones aprendiste para la siguiente semana]`,
    metadata_fields: {
      week_number: 'number',
      phase: 'string',
      main_objectives: 'number',
      estimated_hours: 'number'
    }
  },

  // 5. HOJA DE RUTA DE COMPETENCIAS (HRC)
  unified_tracking_log: {
    name: 'Hoja de Ruta de Competencias (HRC)',
    subtitle: 'Progresión por Evidencias • Mapeo de Competencias',
    description: 'Dashboard de progreso a largo plazo con competencias granulares y evidencia concreta del Ecosistema 360',
    icon: '🎯',
    template: `# Mi Hoja de Ruta de Competencias - Ecosistema 360

## 1. Tronco Común: Fundamentos

### Rama: Pensamiento Computacional
#### Nivel 1: Control de Flujo y Estructuras de Datos Básicas
- [x] Implementar algoritmos usando bucles, condicionales y funciones. ([Evidencia: {evidence_1}]({link_1}))
- [x] Usar arrays, listas y diccionarios para resolver problemas. ([Evidencia: {evidence_2}]({link_2}))

#### Nivel 2: Algoritmos y Complejidad  
- [ ] Implementar algoritmos de ordenamiento (ej. Bubble, Merge). ([Evidencia: ...])
- [ ] Analizar la complejidad Big O de un algoritmo simple. ([Evidencia: DDE del Proyecto X])

#### Nivel 3: Recursividad
- [x] Resolver un problema simple usando recursividad. ([Evidencia: {evidence_3}]({link_3}))

### Rama: Desarrollo Backend
#### Nivel 1: Creación de API RESTful
- [ ] Diseñar y construir endpoints básicos (GET, POST). ([Evidencia: ...])
- [ ] Manejar peticiones y respuestas HTTP. ([Evidencia: ...])

#### Nivel 2: Autenticación y Autorización
- [ ] Implementar un sistema de login basado en tokens (JWT). ([Evidencia: ...])
- [ ] Proteger endpoints específicos para usuarios autenticados. ([Evidencia: ...])

## 2. Log de Proyectos Completados

### {project_name}
* **Fase:** {curriculum_phase}
* **Fecha:** {start_date} - {end_date}
* **Horas:** {hours_dedicated} horas
* **Tecnologías:** {technologies}
* **Competencias Desarrolladas:** {competencies_developed}
* **Evidencia:** {repository_url}
* **Calificación Personal:** {personal_rating}/10

## 3. Progreso por Fases (24 meses)

### Fase 1: Fundamentos de Programación y Metodología (Meses 1-6)
**Estado:** [En progreso/Completada]
**Competencias Desbloqueadas:** {phase_1_competencies}/[Total]

### Fase 2: Desarrollo Web Frontend (Meses 7-11)  
**Estado:** [Pendiente/En progreso/Completada]
**Competencias Desbloqueadas:** {phase_2_competencies}/[Total]

[Continúa para todas las 6 fases...]`,
    metadata_fields: {
      current_phase: 'string',
      competencies_unlocked: 'number',
      evidence_links: 'array',
      phase_progress: 'object',
      total_hours: 'number'
    }
  },

  // 6. CHECKLIST PRE-COMMIT
  quality_checklist_precommit: {
    name: 'Lista de Verificación Pre-Commit',
    subtitle: 'Control de Calidad • Buenas Prácticas',
    description: 'Verificación antes de hacer commit siguiendo estándares profesionales',
    icon: '✅',
    template: `# Lista de Verificación Pre-Commit - {date}

## Funcionalidad
- [ ] El código funciona como se espera
- [ ] No hay \`print()\` o \`console.log()\` de depuración
- [ ] Las variables/funciones tienen nombres descriptivos
- [ ] Las funciones tienen un solo propósito

## Calidad de Código
- [ ] No hay código comentado
- [ ] Los comentarios explican el "por qué"
- [ ] Apliqué principios DRY y KISS

## Testing y Validación
- [ ] Escribí tests para la nueva funcionalidad
- [ ] Todos los tests pasan
- [ ] La cobertura de tests no disminuyó

## Documentación
- [ ] Actualicé la documentación relevante (README, DDE)
- [ ] El mensaje de commit sigue formato de Commits Semánticos
- [ ] El commit es un cambio lógico y atómico

## Seguridad y Herramientas
- [ ] No estoy incluyendo archivos sensibles
- [ ] Ejecuté el linter y el formateador

**Items completados:** {completed}/{total}
**Calificación:** {completion_rate}%`,
    metadata_fields: {
      items_checked: 'number',
      items_total: 'number',
      completion_rate: 'number',
      checklist_type: 'string'
    }
  },

  // 8. CHECKLIST PROYECTO COMPLETO
  quality_checklist_project: {
    name: 'Lista de Verificación de Proyecto Completo',
    subtitle: 'Finalización Profesional • Estándares de Calidad',
    description: 'Verificación final del proyecto siguiendo estándares profesionales del ecosistema',
    icon: '🏆',
    template: `# Lista de Verificación de Proyecto Completo - {project_name}

## Requisitos Funcionales
- [ ] Cumple todos los requisitos funcionales
- [ ] Maneja errores de forma elegante
- [ ] Tiene validación de entradas
- [ ] La arquitectura sigue los principios definidos

## Calidad y Testing
- [ ] Aplica los principios DRY y KISS
- [ ] Cobertura de tests superior al 80%
- [ ] Incluye tests unitarios, de integración y E2E (si aplica)

## Documentación
- [ ] \`README.md\` está completo y profesional
- [ ] Incluye instrucciones claras de instalación y uso
- [ ] La documentación técnica está actualizada
- [ ] Se incluye un archivo \`LICENSE\`

## Deployment y Distribución
- [ ] Funciona en un ambiente limpio (contenedor)
- [ ] \`requirements.txt\` o \`package.json\` está actualizado
- [ ] Las variables de entorno están documentadas
- [ ] \`.gitignore\` está configurado correctamente

## Finalización
- [ ] Se completó la reflexión post-proyecto
- [ ] Se actualizó el Log de Proyectos y la HRC

**Proyecto:** {project_name}
**Completado:** {completed}/{total} items ({completion_rate}%)`,
    metadata_fields: {
      project_name: 'string',
      items_checked: 'number',
      items_total: 'number',
      completion_rate: 'number'
    }
  },

  // 9. CHECKLIST REVISIÓN SEMANAL
  quality_checklist_weekly: {
    name: 'Lista de Verificación de Revisión Semanal',
    subtitle: 'Autoevaluación • Progreso Continuo',
    description: 'Autoevaluación semanal de progreso y mejora continua',
    icon: '📋',
    template: `# Lista de Verificación de Revisión Semanal - Semana {week_number}

## Cumplimiento de Objetivos
- [ ] ¿Completé los entregables planeados?
- [ ] ¿Cumplí el objetivo de horas?
- [ ] ¿Mi código mejoró respecto a la semana anterior?

## Aprendizaje y Comprensión
- [ ] ¿Puedo explicar los conceptos nuevos estudiados?
- [ ] ¿Identifiqué lagunas de conocimiento y tengo un plan?

## Documentación y Seguimiento
- [ ] ¿Mi DDE y diario de metacognición están al día?
- [ ] ¿Actualicé mi progreso en HRC?

## Bienestar y Motivación
- [ ] ¿Cómo están mis niveles de energía y motivación?
- [ ] ¿Qué ajuste necesito para la próxima semana?

## Reflexión Final
**Lo que más me enorgullece esta semana:**
[Tu respuesta]

**Principal área de mejora identificada:**
[Tu respuesta]

**Ajuste para próxima semana:**
[Acción específica]

**Completado:** {completed}/{total} items`,
    metadata_fields: {
      week_number: 'number',
      items_checked: 'number',
      items_total: 'number',
      energy_level: 'number',
      motivation_level: 'number'
    }
  },

  // 10. DOCUMENTACIÓN DE PROYECTO
  project_documentation: {
    name: 'Documentación de Proyecto',
    subtitle: 'README Profesional • Presentación',
    description: 'README profesional para proyectos siguiendo estándares de la industria',
    icon: '📖',
    template: `# {project_name}

[![{language} Version](https://img.shields.io/badge/{language}-{version}+-blue.svg)]({language_url})
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](tests/)

{project_description}

## 🚀 Demo

[GIF o screenshot del proyecto en acción]

[Link a demo en vivo si aplica]

## 📋 Características

- ✅ [Característica principal 1]
- ✅ [Característica principal 2]
- ✅ [Característica principal 3]
- 🚧 [Característica en desarrollo]

## 🛠️ Tecnologías

- **Lenguaje:** {primary_language}
- **Framework:** [Si aplica]
- **Base de Datos:** [Si aplica]
- **Testing:** [Framework de testing]
- **Otros:** [Librerías importantes]

## 📦 Instalación

\`\`\`bash
# Clonar el repositorio
git clone {repository_url}
cd {project_folder}

# Crear entorno virtual (si aplica)
{setup_commands}

# Instalar dependencias
{install_command}
\`\`\`

## 🚀 Uso

\`\`\`bash
{run_command}
\`\`\`

## 📚 Documentación

[Enlaces a documentación adicional]

## 🤝 Contribuir

[Instrucciones para contribuir]

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.`,
    metadata_fields: {
      project_name: 'string',
      sections_completed: 'array',
      documentation_quality: 'string',
      estimated_reading_time: 'string',
      badges_included: 'boolean'
    }
  },

  // 11. DOCUMENTACIÓN TÉCNICA
  technical_documentation: {
    name: 'Documentación Técnica',
    subtitle: 'Arquitectura • Especificaciones Técnicas',
    description: 'Documentación arquitectónica detallada para desarrolladores',
    icon: '🏗️',
    template: `# Documentación Técnica - {project_name}

## 1. Arquitectura

### 1.1. Visión General
[Diagrama de arquitectura de alto nivel y descripción textual de la estructura general del sistema, sus componentes principales y cómo interactúan entre sí]

### 1.2. Componentes Principales

#### 1.2.1. {component_1}
* **Responsabilidad:** [Describe su función principal]
* **Dependencias:** [Otros componentes con los que interactúa]
* **Interfaz:** [Cómo se comunica - API REST, gRPC, etc.]

#### 1.2.2. {component_2}
* **Responsabilidad:** [Función principal]
* **Dependencias:** [Componentes relacionados]
* **Interfaz:** [Método de comunicación]

### 1.3. Flujo de Datos
[Describe un flujo de datos importante del sistema]

\`\`\`mermaid
sequenceDiagram
    participant Usuario
    participant Frontend
    participant API
    participant Database

    Usuario->>Frontend: Acción
    Frontend->>API: Request
    API->>Database: Query
    Database-->>API: Response
    API-->>Frontend: Data
    Frontend-->>Usuario: Result
\`\`\`

## 2. Base de Datos

### 2.1. Esquema
[Descripción del esquema de base de datos]

### 2.2. Relaciones
[Explicación de relaciones entre tablas]

## 3. API Endpoints

### 3.1. Autenticación
[Endpoints de autenticación]

### 3.2. Recursos Principales
[Documentación de endpoints principales]

## 4. Configuración y Deployment

### 4.1. Variables de Entorno
\`\`\`
ENV_VAR_1=valor
ENV_VAR_2=valor
\`\`\`

### 4.2. Comandos de Deployment
\`\`\`bash
{deployment_commands}
\`\`\``,
    metadata_fields: {
      architecture_sections: 'array',
      detail_level: 'string',
      target_audience: 'string',
      diagrams_included: 'boolean'
    }
  }
};

export const ENTRY_TYPES = [
  'daily_reflection',
  'weekly_review',
  'dde_entry',
  'weekly_action_plan',
  'unified_tracking_log',
  'quality_checklist_precommit',
  'quality_checklist_project',
  'quality_checklist_weekly',
  'project_documentation',
  'technical_documentation'
];

export function getTemplate(entryType) {
  return TEMPLATES[entryType] || null;
}

export function getAllTemplates() {
  return TEMPLATES;
}

export function getTemplatesByCategory() {
  return {
    'Reflexión y Seguimiento': [
      'daily_reflection',
      'weekly_review',
      'weekly_action_plan'
    ],
    'Documentación Educativa': [
      'dde_entry',
      'unified_tracking_log',
      'project_documentation',
      'technical_documentation'
    ],
    'Control de Calidad': [
      'quality_checklist_precommit',
      'quality_checklist_project',
      'quality_checklist_weekly'
    ]
  };
}