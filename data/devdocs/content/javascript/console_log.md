{
  "entity": "console.log",
  "url": "https://devdocs.io/javascript/console/log",
  "title": "console.log()",
  "path": "console/log",
  "content": "### console.log()\n\nEl método **console.log()** muestra un mensaje en la consola web (o del intérprete JavaScript).\n\n#### Sintaxis\n\n```javascript\nconsole.log(obj1 [, obj2, ..., objN]);\nconsole.log(msg [, subst1, ..., substN]);\n```\n\n#### Parámetros\n\n- **obj1, obj2, ..., objN**: Una lista de objetos JavaScript a mostrar\n- **msg**: Una cadena JavaScript que contiene cero o más cadenas de sustitución\n- **subst1, ..., substN**: Objetos JavaScript para sustituir en msg\n\n#### Ejemplos\n\n```javascript\n// Logging simple\nconsole.log('Hello, World!');\n\n// Logging múltiples valores\nconsole.log('Usuario:', 'Juan', 'Edad:', 25);\n\n// Logging objetos\nconst user = { name: 'Ana', age: 30 };\nconsole.log('User object:', user);\n\n// String formatting\nconsole.log('El usuario %s tiene %d años', 'Carlos', 28);\n```\n\n#### Notas importantes\n\n- Útil para debugging y desarrollo\n- Los objetos se muestran de forma interactiva en la consola del navegador\n- No usar en código de producción para información sensible\n\n**Fuente:** Documentación local sincronizada desde DevDocs.io",
  "syncedAt": "2025-09-27T10:00:00.000Z"
}