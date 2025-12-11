# ⚠️ DIRECTORIO DEPRECADO - REDIRIGIDO

**Estado:** ❌ DEPRECATED  
**Fecha de Deprecación:** 2025-10-06  
**Misión:** 210.0 - Realineación del Dashboard IRP  

---

## 🔄 NUEVA UBICACIÓN

Los componentes de gráficos han sido **consolidados** en una fuente única de verdad:

```
📁 components/common/charts/
├── TrendChart.jsx
├── QualityGauge.jsx
├── ComparisonBar.jsx
├── TimelineChart.jsx
├── index.js
└── README.md ⭐ (DOCUMENTACIÓN COMPLETA)
```

---

## 📖 DOCUMENTACIÓN ACTUALIZADA

Para información completa sobre el uso de los componentes de gráficos, consulta:

**👉 [components/common/charts/README.md](../../common/charts/README.md)**

La documentación incluye:
- ✅ Props de cada componente
- ✅ Ejemplos de uso
- ✅ Guía de instalación
- ✅ Patrones de importación correctos
- ✅ Características y personalización
- ✅ Troubleshooting

---

## 🚫 NO USAR ARCHIVOS DE ESTE DIRECTORIO

Todos los archivos `.js` en este directorio han sido renombrados con el prefijo `_DEPRECATED_` para prevenir su uso accidental.

**Archivos deprecados:**
- `_DEPRECATED_TrendChart.js`
- `_DEPRECATED_QualityGauge.js`
- `_DEPRECATED_ComparisonBar.js`
- `_DEPRECATED_TimelineChart.js`
- `_DEPRECATED_index.js`

---

## ✅ IMPORTACIÓN CORRECTA

### Antes (DEPRECADO)
```javascript
❌ import { TrendChart } from './components/dashboard/charts';
```

### Ahora (CORRECTO)
```javascript
✅ import { TrendChart } from './components/common/charts';
```

---

## 📚 RAZÓN DE LA CONSOLIDACIÓN

Se detectó **duplicación de código** entre:
- `components/dashboard/charts/` (archivos .js)
- `components/irp/Dashboard/` (archivos .jsx)

Ambos directorios contenían implementaciones idénticas de componentes Chart.js, violando el principio **DRY (Don't Repeat Yourself)**.

La consolidación en `components/common/charts/` proporciona:
- ✅ Fuente única de verdad
- ✅ Más fácil mantenimiento
- ✅ Consistencia garantizada
- ✅ Bundle más pequeño
- ✅ Sin divergencia de funcionalidad

---

## 🗑️ FUTURO DE ESTE DIRECTORIO

Los archivos `_DEPRECATED_*` pueden ser eliminados en futuras versiones una vez confirmada la estabilidad de la migración.

**Por ahora se mantienen como respaldo de seguridad.**

---

## 🔗 ENLACES ÚTILES

- 📄 [Documentación Completa](../../common/charts/README.md)
- 📄 [ARQUITECTURA_VIVA v13.2](../../../ARQUITECTURA_VIVA/ARQUITECTURA_VIVA_v13.2.md)
- 📄 [README_DEPRECATED.md](./README_DEPRECATED.md) (Información detallada de deprecación)

---

**Este directorio ha sido DEPRECADO. Usa `components/common/charts/` en su lugar.**
