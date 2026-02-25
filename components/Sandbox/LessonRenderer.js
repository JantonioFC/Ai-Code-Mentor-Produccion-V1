/**
 * LessonRenderer - Renderizado estilo Notion/GitHub de lecciones markdown
 * Convierte texto markdown en bloques visuales con tipografía refinada
 */

// Procesar formato inline (negrita, cursiva, código inline)
const InlineText = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i} className="italic text-gray-600">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded text-[13px] font-mono border border-violet-200/60">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

// Parsear markdown en bloques estructurados
function parseMarkdownBlocks(text) {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split('\n');
  const blocks = [];
  let currentParagraph = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';
  let listItems = [];
  let listType = null;

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

  lines.forEach((line) => {
    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({ type: 'code', lang: codeBlockLang, content: codeBlockContent.join('\n') });
        codeBlockContent = [];
        codeBlockLang = '';
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        codeBlockLang = line.trim().replace('```', '').trim();
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Horizontal rule
    if (line.trim().match(/^(-{3,}|\*{3,}|_{3,})$/)) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'hr' });
      return;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: `h${headingMatch[1].length}`, content: headingMatch[2] });
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'blockquote', content: line.replace(/^>\s*/, '') });
      return;
    }

    // Unordered list
    const ulMatch = line.match(/^\s*[-*+]\s+(.*)/);
    if (ulMatch) {
      flushParagraph();
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      return;
    }

    // Ordered list
    const olMatch = line.match(/^\s*\d+\.\s+(.*)/);
    if (olMatch) {
      flushParagraph();
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
      return;
    }

    // Empty line
    if (line.trim() === '') {
      flushParagraph();
      flushList();
      return;
    }

    // Regular text
    flushList();
    currentParagraph.push(line);
  });

  flushParagraph();
  flushList();

  return blocks;
}

// Renderizar un bloque individual
function BlockRenderer({ block, index }) {
  switch (block.type) {
    case 'h1':
      return (
        <div className="mt-8 mb-5 first:mt-0">
          <h1 className="text-[1.7rem] font-bold text-gray-900 tracking-tight leading-tight">
            <InlineText text={block.content} />
          </h1>
          <div className="mt-2 h-[3px] w-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
        </div>
      );

    case 'h2':
      return (
        <div className="mt-8 mb-4 first:mt-0">
          <h2 className="text-[1.35rem] font-bold text-gray-800 tracking-tight leading-snug flex items-start gap-2.5">
            <span className="mt-1.5 w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
            <InlineText text={block.content} />
          </h2>
        </div>
      );

    case 'h3':
      return (
        <div className="mt-6 mb-3">
          <h3 className="text-[1.1rem] font-semibold text-gray-700 leading-snug pl-3 border-l-[3px] border-blue-400">
            <InlineText text={block.content} />
          </h3>
        </div>
      );

    case 'h4':
      return (
        <div className="mt-5 mb-2">
          <h4 className="text-[1rem] font-semibold text-gray-600 uppercase tracking-wide text-sm">
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
        <div className="my-5 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-[#1e1e2e]">
          {block.lang && (
            <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                </div>
                <span className="text-[11px] text-gray-400 font-mono uppercase tracking-wider ml-2">{block.lang}</span>
              </div>
            </div>
          )}
          <pre className="p-4 text-[13px] font-mono leading-relaxed overflow-x-auto text-green-300">
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
        <Tag className={`my-4 space-y-2 pl-1 ${block.listType === 'ol' ? 'list-none counter-reset-item' : 'list-none'}`}>
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[15px] text-gray-600 leading-relaxed">
              {block.listType === 'ol' ? (
                <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              ) : (
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2.5 rounded-full bg-gray-400" />
              )}
              <span><InlineText text={item} /></span>
            </li>
          ))}
        </Tag>
      );
    }

    case 'hr':
      return <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />;

    default:
      return null;
  }
}

// Agrupar bloques en secciones (separadas por h2)
function groupIntoSections(blocks) {
  const sections = [];
  let currentSection = { heading: null, blocks: [] };

  blocks.forEach((block) => {
    if (block.type === 'h2' && currentSection.blocks.length > 0) {
      sections.push(currentSection);
      currentSection = { heading: block, blocks: [] };
    } else if (block.type === 'h2') {
      currentSection.heading = block;
    } else {
      currentSection.blocks.push(block);
    }
  });

  if (currentSection.blocks.length > 0 || currentSection.heading) {
    sections.push(currentSection);
  }

  return sections;
}

export default function LessonRenderer({ content }) {
  if (!content || typeof content !== 'string') {
    return <p className="text-gray-400 italic">Sin contenido para mostrar.</p>;
  }

  const blocks = parseMarkdownBlocks(content);
  const sections = groupIntoSections(blocks);

  // Si no hay secciones h2, renderizar todo como bloques planos
  if (sections.length <= 1 && !sections[0]?.heading) {
    return (
      <article className="space-y-0">
        {blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} index={i} />
        ))}
      </article>
    );
  }

  // Renderizar con secciones como cards
  return (
    <article className="space-y-6">
      {sections.map((section, sIdx) => (
        <div key={sIdx}>
          {section.heading && (
            <BlockRenderer block={section.heading} index={`sh-${sIdx}`} />
          )}
          {section.blocks.length > 0 && (
            <div className="bg-gray-50/60 rounded-xl border border-gray-100 px-6 py-5">
              {section.blocks.map((block, bIdx) => (
                <BlockRenderer key={bIdx} block={block} index={`${sIdx}-${bIdx}`} />
              ))}
            </div>
          )}
        </div>
      ))}
    </article>
  );
}
