# Componentes de Gráficos Comunes - Chart.js

**Ubicación:** `components/common/charts/`  
**Versión:** 1.0.0  
**Creado:** 2025-10-06  
**Misión:** 210.0 - Realineación del Dashboard IRP

---

## 🎯 Propósito

Este directorio contiene la **fuente única de verdad** para todos los componentes de visualización basados en Chart.js del Ecosistema 360.

### Principio DRY (Don't Repeat Yourself)

Estos componentes fueron consolidados desde múltiples ubicaciones duplicadas para:
- ✅ Eliminar código duplicado
- ✅ Facilitar mantenimiento
- ✅ Garantizar consistencia
- ✅ Reducir tamaño del bundle
- ✅ Prevenir divergencia de funcionalidad

---

## 📦 Componentes Disponibles

### 1. TrendChart.jsx
**Propósito:** Gráfico de líneas para tendencias temporales

**Props:**
- `data` (Array): Datos en formato `[{period: string, value: number}]`
- `metric` (string): Tipo de métrica (`quality_score` | `reviews_completed` | `avg_rating`)
- `loading` (boolean): Estado de carga

**Uso:**
```jsx
import { TrendChart } from '@/components/common/charts';

<TrendChart
  data={trendData}
  metric="quality_score"
  loading={false}
/>
```

### 2. QualityGauge.jsx
**Propósito:** Gauge semicircular para puntuaciones de calidad

**Props:**
- `score` (number): Puntuación (0-5)
- `maxScore` (number): Puntuación máxima (default: 5.0)
- `title` (string): Título del gauge
- `loading` (boolean): Estado de carga

**Uso:**
```jsx
import { QualityGauge } from '@/components/common/charts';

<QualityGauge
  score={4.2}
  maxScore={5.0}
  title="Quality Score Actual"
  loading={false}
/>
```

### 3. ComparisonBar.jsx
**Propósito:** Gráfico de barras comparativo (usuario vs promedio)

**Props:**
- `userValue` (number): Valor del usuario
- `averageValue` (number): Valor promedio de referencia
- `title` (string): Título del gráfico
- `metric` (string): Nombre de la métrica
- `unit` (string): Unidad de medida
- `maxValue` (number): Valor máximo del eje Y
- `loading` (boolean): Estado de carga

**Uso:**
```jsx
import { ComparisonBar } from '@/components/common/charts';

<ComparisonBar
  userValue={85}
  averageValue={70}
  title="Tu Progreso vs Promedio"
  metric="Progreso"
  unit="%"
  maxValue={100}
  loading={false}
/>
```

### 4. TimelineChart.jsx
**Propósito:** Timeline de actividad con barras horizontales

**Props:**
- `data` (Array): Datos en formato `[{period: string, count: number, label: string}]`
- `title` (string): Título del gráfico
- `color` (string): Color de las barras (hex)
- `loading` (boolean): Estado de carga

**Uso:**
```jsx
import { TimelineChart } from '@/components/common/charts';

<TimelineChart
  data={timelineData}
  title="Timeline de Revisiones"
  color="#8b5cf6"
  loading={false}
/>
```

---

## 🚀 Instalación y Dependencias

### Dependencias Requeridas

```json
{
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0"
}
```

### Instalación

```bash
npm install chart.js@^4.4.0 react-chartjs-2@^5.2.0
```

---

## 📖 Patrones de Uso

### Importación Centralizada

```javascript
// ✅ CORRECTO - Importar desde common/charts
import { TrendChart, QualityGauge, ComparisonBar, TimelineChart } from '@/components/common/charts';
```

```javascript
// ❌ INCORRECTO - No importar desde ubicaciones deprecadas
import { TrendChart } from '@/components/dashboard/charts'; // DEPRECATED
import { TrendChart } from '@/components/irp/Dashboard'; // DEPRECATED
```

### Uso en Dashboards

#### Dashboard IRP

Los componentes del Dashboard IRP re-exportan desde `common/charts`:

```javascript
// components/irp/Dashboard/ReviewerMetrics.jsx
import { TrendChart, QualityGauge } from './index';
// Internamente, index.js importa desde common/charts
```

#### Dashboard de Progreso

```javascript
// components/dashboard/EnhancedProgressDashboard.js
import { TrendChart, QualityGauge, ComparisonBar, TimelineChart } from '../common/charts';
```

---

## 🎨 Características Comunes

### Estados de Carga
Todos los componentes manejan un estado `loading`:
- Muestra spinner animado
- Mensaje contextual de carga

### Estados Vacíos
Componentes muestran UI apropiada cuando no hay datos:
- Mensaje informativo
- Iconos descriptivos
- Call-to-action cuando aplica

### Responsive Design
- Completamente responsive
- Optimizado para mobile, tablet y desktop
- `maintainAspectRatio: false` para control preciso

### Tooltips Personalizados
- Información contextual rica
- Formato automático según tipo de métrica
- Estilo consistente

---

## 🔧 Configuración Técnica

### Chart.js Registration

Los componentes registran automáticamente los elementos necesarios:

```javascript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  // ... otros elementos
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  // ... registrar elementos
);
```

### Colores Predeterminados

- **TrendChart:** `#3b82f6` (blue-500)
- **QualityGauge:** Dinámico según puntuación
- **ComparisonBar:** `#10b981` (green-500) o `#3b82f6` (blue-500)
- **TimelineChart:** `#8b5cf6` (purple-500)

---

## ⚠️ Restricción CRÍTICA

**NUNCA usar `localStorage` o `sessionStorage`**

Chart.js no requiere almacenamiento del navegador. Todas las configuraciones y datos se mantienen en memoria durante la sesión.

---

## 🧪 Testing

Para validar que los componentes funcionan correctamente:

```bash
# 1. Iniciar servidor de desarrollo
npm run dev

# 2. Navegar a dashboards
# - Dashboard IRP: http://localhost:3000/dashboard-irp
# - Dashboard Progreso: http://localhost:3000/panel-de-control

# 3. Verificar que gráficos se renderizan correctamente
```

---

## 📚 Referencias

- [Chart.js v4 Documentation](https://www.chartjs.org/docs/latest/)
- [react-chartjs-2 Documentation](https://react-chartjs-2.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [REFACTORING_MANIFESTO.md](../../../REFACTORING_MANIFESTO.md)
- [ARQUITECTURA_VIVA](../../../ARQUITECTURA_VIVA/)

---

## 📝 Changelog

### [1.0.0] - 2025-10-06 - MISIÓN 210.0

**Consolidación de Componentes**
- ✅ Creado directorio `common/charts/` como fuente única
- ✅ Migrado TrendChart.jsx desde `irp/Dashboard/`
- ✅ Migrado QualityGauge.jsx desde `irp/Dashboard/`
- ✅ Migrado ComparisonBar.jsx desde `irp/Dashboard/`
- ✅ Migrado TimelineChart.jsx desde `irp/Dashboard/`
- ✅ Deprecado `dashboard/charts/` (archivos .js)
- ✅ Deprecado componentes en `irp/Dashboard/` (archivos .jsx originales)
- ✅ Actualizado imports en `EnhancedProgressDashboard.js`
- ✅ Actualizado re-exportaciones en `irp/Dashboard/index.js`

**Archivos Deprecados:**
- `components/dashboard/charts/*.js` → Renombrados a `_DEPRECATED_*.js`
- `components/irp/Dashboard/TrendChart.jsx` → `_DEPRECATED_TrendChart.jsx`
- `components/irp/Dashboard/QualityGauge.jsx` → `_DEPRECATED_QualityGauge.jsx`
- `components/irp/Dashboard/ComparisonBar.jsx` → `_DEPRECATED_ComparisonBar.jsx`
- `components/irp/Dashboard/TimelineChart.jsx` → `_DEPRECATED_TimelineChart.jsx`

---

## 👥 Contribución

Para modificar o agregar componentes de gráficos:

1. Editar archivos en `components/common/charts/`
2. Mantener compatibilidad con props existentes
3. Actualizar este README si se agregan nuevos componentes
4. Ejecutar pruebas en ambos dashboards (IRP y Progreso)
5. Actualizar CHANGELOG

---

## 🏆 Autor

**Mentor Coder**  
**Misión:** 210.0 - Realineación del Dashboard IRP  
**Fecha:** 2025-10-06  
**Arquitectura:** VIVA v13.2
