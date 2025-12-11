# ⚠️ DIRECTORIO DEPRECADO - MISIÓN 210.0

**Fecha de Deprecación:** 2025-10-06  
**Misión:** 210.0 - Realineación del Dashboard IRP  
**Estado:** ❌ DEPRECATED

---

## 📍 NUEVA UBICACIÓN

Los componentes de gráficos han sido consolidados en una **fuente única de verdad**:

```
components/common/charts/
├── TrendChart.jsx
├── QualityGauge.jsx
├── ComparisonBar.jsx
├── TimelineChart.jsx
└── index.js
```

---

## 🔄 MIGRACIÓN

**Antes (DEPRECATED):**
```javascript
import { TrendChart } from './components/dashboard/charts';
```

**Ahora (CORRECTO):**
```javascript
import { TrendChart } from './components/common/charts';
```

---

## 📋 RAZÓN DE LA CONSOLIDACIÓN

Se encontró duplicación de código entre:
- `components/dashboard/charts/` (obsoleto)
- `components/irp/Dashboard/` (obsoleto)

Ambos directorios contenían componentes Chart.js idénticos, violando el principio DRY (Don't Repeat Yourself).

---

## ✅ COMPONENTES ACTUALIZADOS

Los siguientes componentes ya utilizan la nueva ubicación:
- ✅ `EnhancedProgressDashboard.js`
- ✅ `ReviewerMetrics.jsx`  (vía re-exportación)
- ✅ `AuthorMetrics.jsx` (vía re-exportación)

---

## 🗑️ ARCHIVOS ELIMINADOS

- `TrendChart.js`
- `QualityGauge.js`
- `ComparisonBar.js`
- `TimelineChart.js`
- `index.js`

---

## 📚 DOCUMENTACIÓN

Para más información sobre el uso de los componentes consolidados, consulta:

```
components/common/charts/README.md
```

---

**Este directorio puede ser eliminado en futuras versiones.**
