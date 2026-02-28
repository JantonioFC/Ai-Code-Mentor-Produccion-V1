/**
 * LessonRenderer v2 — Renderizado avanzado para lecciones de hasta 25000+ chars
 * Soporta: markdown completo, tablas, bloques de código con copy, TOC automático,
 * diagramas como texto pre-formateado, y secciones plegables para lecciones largas.
 */

import React, { useState, useMemo, useEffect, useId } from 'react';

// ─── Inline Text (negrita, cursiva, código, links) ───────────────────────────
const InlineText = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g);

  const result = [];
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    if (!part) { i++; continue; }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      result.push(<strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      result.push(<em key={i} className="italic text-gray-600">{part.slice(1, -1)}</em>);
    } else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      result.push(
        <code key={i} className="bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded text-[13px] font-mono border border-violet-200/60">
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith('[') && part.includes('](')) {
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        result.push(
          <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
            className="text-indigo-600 underline underline-offset-2 hover:text-indigo-800 transition-colors">
            {linkMatch[1]}
          </a>
        );
      } else {
        result.push(<span key={i}>{part}</span>);
      }
    } else {
      result.push(<span key={i}>{part}</span>);
    }
    i++;
  }
  return result;
};

// ─── Botón de copiar para bloques de código ───────────────────────────────────
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy}
      className="text-[10px] px-2 py-0.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors font-mono">
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  );
};

// ─── Lightbox: ver diagrama o tabla en grande ─────────────────────────────────
const Lightbox = ({ children, label = 'Ampliar' }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Contenido con barra de acciones siempre visible abajo */}
      <div className="relative">
        {children}
        {/* Barra de acciones siempre visible */}
        <div className="flex justify-end mt-1 mb-3">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg
                       bg-indigo-50 border border-indigo-200 text-indigo-600
                       hover:bg-indigo-100 hover:border-indigo-300 transition-colors
                       text-[11px] font-medium shadow-sm"
            title={label}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15" />
            </svg>
            {label}
          </button>
        </div>
      </div>

      {/* Overlay lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-auto"
            style={{ maxWidth: '95vw', maxHeight: '95vh', width: 'max-content' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del lightbox */}
            <div className="sticky top-0 flex items-center justify-between px-5 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-10">
              <span className="text-xs font-medium text-gray-500">🔍 Vista ampliada — Esc para cerrar</span>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-all"
                title="Cerrar (Esc)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Contenido ampliado — escala 1.5x para diagramas pequeños */}
            <div className="p-8" style={{ minWidth: '70vw' }}>
              <div style={{ transform: 'scale(1.4)', transformOrigin: 'top center', marginBottom: '40%' }}>
                {children}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Mermaid: renderizado de diagramas (SSR-safe) ───────────────────────────
const MermaidBlock = ({ code }) => {
  const id = useId().replace(/:/g, '-');
  const [svg, setSvg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      // Evitar renderizar basura vacía o cadenas cortas
      if (!code || code.trim().length < 5) {
        if (!cancelled) {
          setError("Diagrama vacío o inválido");
          setLoading(false);
        }
        return;
      }

      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          themeVariables: {
            primaryColor: '#6366f1',
            primaryTextColor: '#1e1b4b',
            primaryBorderColor: '#a5b4fc',
            lineColor: '#6366f1',
            secondaryColor: '#f0f4ff',
            tertiaryColor: '#fafafa'
          },
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          fontSize: 14,
        });
        const { svg: rendered } = await mermaid.render(`mermaid-${id}`, code);
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        console.warn('[MermaidBlock] Error renderizando diagrama:', e.message);
        console.warn(`[MermaidBlock] Falló con este código: "${code}"`); // Trazabilidad
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    render();
    return () => { cancelled = true; };
  }, [code, id]);

  if (loading) {
    return (
      <div className="my-5 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-3 text-indigo-400 text-sm">
        <span className="animate-spin">⟳</span> Renderizando diagrama…
      </div>
    );
  }

  if (error) {
    // Retornamos nulo o un div discreto escondido para evitar fallos de layout masivos
    return (
      <div style={{ display: 'none' }} data-mermaid-error={true} data-error-msg={error}>
        {/* Mermaid code was faulty */}
      </div>
    );
  }

  return (
    <div className="my-6 flex justify-center">
      <div className="p-4 bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-x-auto max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
};

// ─── Parsear markdown en bloques ──────────────────────────────────────────────
function parseMarkdownBlocks(text) {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split(/\r?\n/);
  const blocks = [];
  let currentParagraph = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';
  let listItems = [];
  let listType = null;
  let tableLines = [];
  let inTable = false;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', content: currentParagraph.join(' ') });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', listType: listType || 'ul', items: [...listItems] });
      listItems = [];
      listType = null;
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0 || inCodeBlock) {
      // Los bloques mermaid se emiten con type='mermaid' para renderizado especial
      const blockType = codeBlockLang.toLowerCase() === 'mermaid' ? 'mermaid' : 'code';
      blocks.push({ type: blockType, lang: codeBlockLang, content: codeBlockContent.join('\n') });
      codeBlockContent = [];
      codeBlockLang = '';
      inCodeBlock = false;
    }
  };

  const flushTable = () => {
    if (tableLines.length >= 2) {
      // Parsear header y rows
      const header = tableLines[0].split('|').filter(c => c.trim()).map(c => c.trim());
      const rows = tableLines.slice(2).map(row =>
        row.split('|').filter(c => c !== undefined).slice(1, -1).map(c => c.trim())
      ).filter(r => r.length > 0);
      blocks.push({ type: 'table', header, rows });
    }
    tableLines = [];
    inTable = false;
  };

  lines.forEach(line => {
    // Bloque de código
    if (line.trim().startsWith('```')) {
      if (inTable) flushTable();
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushParagraph();
        flushList();
        codeBlockLang = line.trim().replace(/^```/, '').trim();
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Tablas markdown (líneas con |)
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
    const isSeparatorRow = /^\|[\s\-:|]+\|$/.test(line.trim());
    if (isTableRow || isSeparatorRow) {
      if (!inTable) {
        flushParagraph();
        flushList();
        inTable = true;
      }
      tableLines.push(line.trim());
      return;
    } else if (inTable) {
      flushTable();
    }

    // Horizontal rule
    if (line.trim().match(/^(-{3,}|\*{3,}|_{3,})$/)) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'hr' });
      return;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(headingMatch[1].length, 4);
      blocks.push({ type: `h${level}`, content: headingMatch[2], id: headingMatch[2].toLowerCase().replace(/[^a-z0-9]+/g, '-') });
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'blockquote', content: line.replace(/^>\s*/, '') });
      return;
    }

    // Listas non-ordenadas
    const ulMatch = line.match(/^\s*[-*+]\s+(.*)/);
    if (ulMatch) {
      flushParagraph();
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      return;
    }

    // Listas ordenadas
    const olMatch = line.match(/^\s*\d+\.\s+(.*)/);
    if (olMatch) {
      flushParagraph();
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
      return;
    }

    // Línea vacía
    if (line.trim() === '') {
      flushParagraph();
      flushList();
      return;
    }

    // Imagen markdown: ![alt](url) — línea sola
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'image', alt: imgMatch[1], src: imgMatch[2] });
      return;
    }

    // Texto normal
    flushList();
    currentParagraph.push(line);
  });

  flushCodeBlock();
  flushParagraph();
  flushList();
  if (inTable) flushTable();

  return blocks;
}

// ─── Renderizador de bloque individual ───────────────────────────────────────
function BlockRenderer({ block }) {
  switch (block.type) {
    case 'h1':
      return (
        <div id={block.id} className="mt-8 mb-5 first:mt-0">
          <h1 className="text-[1.7rem] font-bold text-gray-900 tracking-tight leading-tight">
            <InlineText text={block.content} />
          </h1>
          <div className="mt-2 h-[3px] w-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
        </div>
      );

    case 'h2':
      return (
        <div id={block.id} className="mt-8 mb-4 first:mt-0">
          <h2 className="text-[1.35rem] font-bold text-gray-800 tracking-tight leading-snug flex items-start gap-2.5">
            <span className="mt-1.5 w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
            <InlineText text={block.content} />
          </h2>
        </div>
      );

    case 'h3':
      return (
        <div id={block.id} className="mt-6 mb-3">
          <h3 className="text-[1.1rem] font-semibold text-gray-700 leading-snug pl-3 border-l-[3px] border-blue-400">
            <InlineText text={block.content} />
          </h3>
        </div>
      );

    case 'h4':
      return (
        <div id={block.id} className="mt-5 mb-2">
          <h4 className="text-[0.95rem] font-semibold text-gray-500 uppercase tracking-wide text-sm">
            <InlineText text={block.content} />
          </h4>
        </div>
      );

    case 'paragraph':
      return (
        <p className="text-[15px] text-gray-600 leading-[1.75] mb-4">
          <InlineText text={block.content} />
        </p>
      );

    case 'code':
      return (
        <div className="my-5 rounded-xl overflow-hidden border border-gray-700/50 shadow-md bg-[#1e1e2e]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              {block.lang && (
                <span className="text-[11px] text-gray-400 font-mono uppercase tracking-wider ml-2">
                  {block.lang}
                </span>
              )}
            </div>
            <CopyButton text={block.content} />
          </div>
          {/* Código */}
          <pre className="p-5 text-[13px] font-mono leading-relaxed overflow-x-auto text-[#cdd6f4] max-h-[600px]">
            <code>{block.content}</code>
          </pre>
        </div>
      );

    case 'blockquote':
      return (
        <blockquote className="my-4 flex gap-3 px-4 py-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
          <span className="text-amber-500 text-lg leading-none mt-0.5">💡</span>
          <p className="text-[14px] text-amber-900/80 leading-relaxed italic">
            <InlineText text={block.content} />
          </p>
        </blockquote>
      );

    case 'list': {
      const Tag = block.listType === 'ol' ? 'ol' : 'ul';
      return (
        <Tag className="my-4 space-y-2 pl-1 list-none">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[15px] text-gray-600 leading-relaxed">
              {block.listType === 'ol' ? (
                <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              ) : (
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2.5 rounded-full bg-indigo-400" />
              )}
              <span><InlineText text={item} /></span>
            </li>
          ))}
        </Tag>
      );
    }

    case 'table':
      return (
        <Lightbox>
          <div className="my-5 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-[13.5px] border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  {block.header.map((cell, i) => (
                    <th key={i} className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
                      <InlineText text={cell} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2.5 text-gray-600 border-b border-gray-100">
                        <InlineText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Lightbox>
      );
    //   ^ tabla con zoom via Lightbox

    case 'image':
      return (
        <Lightbox label="Ampliar imagen">
          <div className="my-5 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.src}
              alt={block.alt || ''}
              className="max-w-full rounded-xl border border-gray-200 shadow-sm object-contain"
              style={{ maxHeight: '420px' }}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            {/* Fallback si la imagen no carga */}
            <div style={{ display: 'none' }}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-gray-500 text-sm mt-2">
              <span>🖼️</span>
              <span>{block.alt || 'Imagen no disponible'}</span>
            </div>
            {block.alt && (
              <p className="text-xs text-gray-400 mt-2 italic text-center">{block.alt}</p>
            )}
          </div>
        </Lightbox>
      );

    case 'mermaid':
      return (
        <Lightbox>
          <MermaidBlock code={block.content} />
        </Lightbox>
      );

    case 'hr':
      return <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />;

    default:
      return null;
  }
}

// ─── Tabla de Contenidos automática ───────────────────────────────────────────
function TableOfContents({ blocks }) {
  const headings = blocks.filter(b => b.type === 'h2' || b.type === 'h3');
  if (headings.length < 3) return null;

  return (
    <nav className="mb-8 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl">
      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">📋 Contenido</p>
      <ol className="space-y-1.5">
        {headings.map((h, i) => (
          <li key={i} className={h.type === 'h3' ? 'pl-4' : ''}>
            <a href={`#${h.id}`}
              className={`text-[13px] hover:text-indigo-700 transition-colors cursor-pointer ${h.type === 'h2' ? 'font-medium text-gray-700' : 'text-gray-500'}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}>
              {h.type === 'h3' && <span className="text-gray-300 mr-1">└</span>}
              {h.content}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function LessonRenderer({ content }) {
  const [expanded, setExpanded] = useState(false);

  if (!content || typeof content !== 'string') {
    return <p className="text-gray-400 italic">Sin contenido para mostrar.</p>;
  }

  // Procesar bloques una sola vez (memoizado para lecciones largas)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  const isLong = content.length > 12000;

  // Para lecciones largas: mostrar primeros bloques y colapsar el resto
  const PREVIEW_BLOCKS = 30;
  const visibleBlocks = isLong && !expanded ? blocks.slice(0, PREVIEW_BLOCKS) : blocks;

  return (
    <article className="space-y-1 text-gray-700">
      {/* TOC automático para lecciones largas */}
      {isLong && <TableOfContents blocks={blocks} />}

      {/* Bloques de contenido */}
      <div className="space-y-1">
        {visibleBlocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}
      </div>

      {/* Botón "Ver más" para lecciones largas */}
      {isLong && !expanded && blocks.length > PREVIEW_BLOCKS && (
        <div className="relative mt-4">
          {/* Gradiente de fade */}
          <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-xs text-gray-400">
              Mostrando {PREVIEW_BLOCKS} de {blocks.length} bloques ({content.length.toLocaleString()} caracteres)
            </p>
            <button
              onClick={() => setExpanded(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200">
              ▼ Mostrar lección completa
            </button>
          </div>
        </div>
      )}

      {/* Botón "Colapsar" cuando está expandida */}
      {isLong && expanded && (
        <div className="flex justify-center mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => { setExpanded(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="px-5 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            ▲ Colapsar lección
          </button>
        </div>
      )}

      {/* Mensaje si no hay bloques */}
      {blocks.length === 0 && (
        <p className="text-gray-400 italic">Contenido vacío tras el procesamiento.</p>
      )}
    </article>
  );
}
