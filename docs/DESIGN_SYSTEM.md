# Design System - AI Code Mentor

## 🎨 Tokens de Diseño

### Colores

#### Primarios
| Nombre | Valor | Uso |
|--------|-------|-----|
| `blue-600` | `#2563eb` | CTAs principales, enlaces |
| `purple-600` | `#9333ea` | Acentos, gradientes |
| `green-600` | `#16a34a` | Éxito, progreso |

#### Neutros
| Nombre | Valor | Uso |
|--------|-------|-----|
| `gray-50` | `#f9fafb` | Backgrounds |
| `gray-600` | `#4b5563` | Texto secundario |
| `gray-800` | `#1f2937` | Texto primario |

#### Gradientes
```css
/* Primario */
background: linear-gradient(135deg, #3b82f6, #8b5cf6);

/* Éxito */
background: linear-gradient(135deg, #22c55e, #10b981);

/* Background página */
background: linear-gradient(to bottom right, #eff6ff, #ffffff, #faf5ff);
```

---

### Tipografía

| Elemento | Font | Weight | Size |
|----------|------|--------|------|
| Heading 1 | Inter | 700 | 2.25rem (36px) |
| Heading 2 | Inter | 600 | 1.5rem (24px) |
| Body | Inter | 400 | 1rem (16px) |
| Code | Fira Code | 400 | 0.875rem (14px) |

---

### Espaciado

| Token | Valor | Uso |
|-------|-------|-----|
| `xs` | 4px | Espaciado interno mínimo |
| `sm` | 8px | Gap entre elementos |
| `md` | 16px | Padding componentes |
| `lg` | 24px | Margin secciones |
| `xl` | 32px | Padding contenedores |

---

## 🧱 Componentes

### Botones

#### Primario
```html
<button class="bg-gradient-to-r from-blue-600 to-purple-600 
               text-white py-3 px-6 rounded-md font-semibold 
               hover:from-blue-700 hover:to-purple-700 
               transition-all disabled:opacity-50">
  Acción Principal
</button>
```

#### Secundario
```html
<button class="bg-gray-100 text-gray-800 py-2 px-4 rounded-md 
               hover:bg-gray-200 transition-colors">
  Acción Secundaria
</button>
```

#### Success
```html
<button class="bg-green-600 text-white py-3 px-6 rounded-md 
               font-semibold hover:bg-green-700 transition-all">
  Confirmar
</button>
```

---

### Cards

#### Glass Card
```html
<div class="glass-card rounded-xl p-6">
  <!-- Contenido -->
</div>
```

#### Standard Card
```html
<div class="bg-white rounded-lg shadow-lg p-6">
  <!-- Contenido -->
</div>
```

---

### Form Inputs

```html
<input class="w-full px-3 py-2 border border-gray-300 rounded-md 
              focus:outline-none focus:ring-2 focus:ring-blue-500 
              focus:border-transparent" />
```

---

## ✨ Animaciones

### Clases Disponibles

| Clase | Duración | Efecto |
|-------|----------|--------|
| `.animate-fade-in` | 500ms | Aparición suave |
| `.animate-slide-up` | 300ms | Slide desde abajo |
| `.hover-lift` | 200ms | Elevación al hover |
| `.icon-pulse` | 2s loop | Pulso para íconos |
| `.stagger-1` a `.stagger-5` | 100-500ms | Entrada escalonada |

---

## ♿ Accesibilidad (WCAG 2.1 AA)

### Checklist

- [x] Contraste mínimo 4.5:1 para texto normal
- [x] Contraste mínimo 3:1 para texto grande
- [x] Focus visible en todos los interactivos
- [x] Labels en todos los inputs
- [x] Skip links para navegación
- [x] Alt text en imágenes

### Focus Styles
```css
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

---

## 📱 Breakpoints

| Nombre | Min-width | Uso |
|--------|-----------|-----|
| `sm` | 640px | Móvil landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Desktop grande |

---

## 📦 Uso con Tailwind

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
    },
  },
};
```
