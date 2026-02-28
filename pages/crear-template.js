import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PrivateLayout from '../components/layout/PrivateLayout';
import { getTemplate } from '../lib/templates';

export default function CreateTemplatePage() {
  const router = useRouter();
  const { type } = router.query;
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    if (type) {
      const templateData = getTemplate(type);
      if (templateData) {
        setTemplate(templateData);
        // Initialize form data with empty values for all placeholders
        const initialData = {};
        const placeholders = extractPlaceholders(templateData.template);
        placeholders.forEach(placeholder => {
          initialData[placeholder] = '';
        });

        // Add current date for date fields
        initialData.date = new Date().toISOString().split('T')[0];
        initialData.week_number = getCurrentWeek();
        initialData.start_date = getWeekStart();
        initialData.end_date = getWeekEnd();

        setFormData(initialData);
      } else {
        router.push('/plantillas');
      }
    } else {
      // Si no hay type, redirigir a plantillas después de que el router esté listo
      router.push('/plantillas');
    }
  }, [type, router.isReady, router]);

  // Sincronizar editableContent cuando se genera un resultado
  useEffect(() => {
    if (result) {
      setEditableContent(result.content);
    }
  }, [result]);

  const extractPlaceholders = (templateText) => {
    const matches = templateText.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(match => match.slice(1, -1)))];
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  };

  const getWeekStart = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    return monday.toISOString().split('T')[0];
  };

  const getWeekEnd = () => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay() + 7);
    return sunday.toISOString().split('T')[0];
  };

  const handleGenerate = () => {
    if (!template) return;

    setLoading(true);

    try {
      let content = template.template;

      // Replace all placeholders with form data
      Object.entries(formData).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        content = content.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || `[${key}]`);
      });

      // Add metadata
      const metadata = {
        generatedAt: new Date().toISOString(),
        templateType: type,
        templateName: template.name,
        placeholdersUsed: Object.keys(formData).length
      };

      setResult({
        content,
        metadata,
        filename: `${type}_${new Date().toISOString().split('T')[0]}.md`
      });

      console.log(`[TEMPLATE-CREATOR] ${template.name} generado exitosamente`);
    } catch (error) {
      console.error('[TEMPLATE-CREATOR] Error generando template:', error);
      alert('Error generando el template');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      alert('Contenido copiado al portapapeles');
    } catch (err) {
      console.error('Error copiando:', err);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([result.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFieldLabel = (fieldName) => {
    const labels = {
      date: 'Fecha',
      week_number: 'Número de Semana',
      start_date: 'Fecha de Inicio',
      end_date: 'Fecha de Fin',
      decision_number: 'Número de Decisión',
      decision_title: 'Título de la Decisión',
      project_name: 'Nombre del Proyecto',
      author_username: 'Usuario del Autor',
      reviewer_username: 'Usuario del Revisor',
      author_name: 'Nombre del Autor',
      phase: 'Fase del Proyecto',
      main_goal: 'Objetivo Principal',
      language: 'Lenguaje de Programación',
      primary_language: 'Lenguaje Principal',
      project_description: 'Descripción del Proyecto'
    };
    return labels[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFieldType = (fieldName) => {
    if (fieldName.includes('date')) return 'date';
    if (fieldName.includes('number') || fieldName.includes('week')) return 'number';
    if (fieldName.includes('description') || fieldName.includes('content')) return 'textarea';
    return 'text';
  };

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-white">Preparando editor...</p>
      </div>
    );
  }

  if (result) {
    const handleSave = async () => {
      setSaved('saving');
      try {
        const res = await fetch('/api/save-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateType: type,
            templateName: template.name,
            content: editableContent,
            metadata: result.metadata,
          }),
        });

        const data = await res.json();

        if (data.success) {
          setSaved('ok');
          setTimeout(() => setSaved(false), 2500);
        } else {
          console.error('[Guardar] Error API:', data.error);
          setSaved('error');
          setTimeout(() => setSaved(false), 3000);
        }
      } catch (err) {
        console.error('[Guardar] Error de red:', err);
        setSaved('error');
        setTimeout(() => setSaved(false), 3000);
      }
    };

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(editableContent);
        alert('Contenido copiado al portapapeles');
      } catch (err) {
        console.error('Error copiando:', err);
      }
    };

    const handleDownload = () => {
      const blob = new Blob([editableContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <ProtectedRoute>
        <PrivateLayout title={`${template.name} - Generado`}>
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {template.icon} {template.name} - Generado
                  </h1>
                  <p className="text-gray-600">{template.subtitle}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saved === 'saving'}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed ${saved === 'ok'
                        ? 'bg-emerald-500 text-white'
                        : saved === 'error'
                          ? 'bg-red-500 text-white'
                          : saved === 'saving'
                            ? 'bg-gray-400 text-white'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg'
                      }`}
                  >
                    {saved === 'saving' ? '⏳ Guardando…'
                      : saved === 'ok' ? '✓ Guardado en DB'
                        : saved === 'error' ? '✗ Error al guardar'
                          : '💾 Guardar'}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Copiar
                  </button>
                  <button
                    onClick={handleDownload}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Descargar
                  </button>
                  <button
                    onClick={() => setResult(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Editar Campos
                  </button>
                  <button
                    onClick={() => router.push('/plantillas')}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Volver a Plantillas
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Metadatos</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div><strong>Generado:</strong> {new Date(result.metadata.generatedAt).toLocaleString()}</div>
                  <div><strong>Plantilla:</strong> {result.metadata.templateName}</div>
                  <div><strong>Campos completados:</strong> {result.metadata.placeholdersUsed}</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Contenido (editable)</h3>
                  <span className="text-xs text-gray-400 italic">Puedes editar el markdown directamente aquí</span>
                </div>
                <textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-4 font-mono text-sm text-gray-900 bg-white resize-y focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ minHeight: '400px', color: '#111827', backgroundColor: '#ffffff' }}
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        </PrivateLayout>
      </ProtectedRoute>
    );
  }


  const placeholders = extractPlaceholders(template.template);

  return (
    <ProtectedRoute>
      <PrivateLayout title={`Crear ${template.name}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {template.icon} Crear {template.name}
                </h1>
                <p className="text-gray-600 mt-1">{template.subtitle}</p>
                <p className="text-gray-500 text-sm mt-2">{template.description}</p>
              </div>
              <button
                onClick={() => router.push('/plantillas')}
                className="text-gray-500 hover:text-gray-700"
              >
                Volver
              </button>
            </div>

            <div className="space-y-4">
              {placeholders.map((placeholder) => {
                const fieldType = getFieldType(placeholder);
                const label = getFieldLabel(placeholder);

                return (
                  <div key={placeholder}>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      {label}
                    </label>
                    {fieldType === 'textarea' ? (
                      <textarea
                        value={formData[placeholder] || ''}
                        onChange={(e) => setFormData({ ...formData, [placeholder]: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 text-gray-900 bg-white placeholder-gray-400"
                        placeholder={`Ingresa ${label.toLowerCase()}...`}
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                      />
                    ) : (
                      <input
                        type={fieldType}
                        value={formData[placeholder] || ''}
                        onChange={(e) => setFormData({ ...formData, [placeholder]: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white placeholder-gray-400"
                        placeholder={fieldType === 'date' ? '' : `Ingresa ${label.toLowerCase()}...`}
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                      />
                    )}
                  </div>
                );
              })}

              <div className="pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Generando...' : `Generar ${template.name}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </PrivateLayout>
    </ProtectedRoute>
  );
}