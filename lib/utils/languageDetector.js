/**
 * Detector Automático de Lenguaje de Programación
 * Usa heurísticas basadas en sintaxis para detectar el lenguaje
 * 
 * @module lib/utils/languageDetector
 */

/**
 * Patrones de detección por lenguaje
 */
const LANGUAGE_PATTERNS = {
    javascript: {
        patterns: [
            /\bconst\s+\w+\s*=/,
            /\blet\s+\w+\s*=/,
            /\bvar\s+\w+\s*=/,
            /=>\s*[{(]/,
            /\bfunction\s+\w+\s*\(/,
            /\bconsole\.(log|error|warn)\s*\(/,
            /\brequire\s*\(['"`]/,
            /\bmodule\.exports/,
            /\bexport\s+(default|const|function|class)/,
            /\bimport\s+.*\s+from\s+['"`]/,
            /\basync\s+function/,
            /\bawait\s+/,
            /\bnew\s+Promise\s*\(/,
            /\.then\s*\(/,
            /\.catch\s*\(/
        ],
        weight: 1
    },

    typescript: {
        patterns: [
            /:\s*(string|number|boolean|any|void|never)\b/,
            /\binterface\s+\w+\s*\{/,
            /\btype\s+\w+\s*=/,
            /<\w+(\s*,\s*\w+)*>/,
            /\bas\s+(string|number|boolean|any)/,
            /\bprivate\s+\w+:/,
            /\bpublic\s+\w+:/,
            /\breadonly\s+\w+/,
            /\benum\s+\w+\s*\{/,
            /\bimplements\s+\w+/
        ],
        weight: 1.2
    },

    python: {
        patterns: [
            /\bdef\s+\w+\s*\(/,
            /\bclass\s+\w+(\s*\(.*\))?:/,
            /\bimport\s+\w+/,
            /\bfrom\s+\w+\s+import/,
            /\bprint\s*\(/,
            /\bif\s+.*:/,
            /\bfor\s+\w+\s+in\s+/,
            /\bwhile\s+.*:/,
            /\bself\./,
            /\b__init__\s*\(/,
            /\b(True|False|None)\b/,
            /\bdef\s+\w+\(self/,
            /:\s*$/m,
            /\belif\s+/,
            /\bexcept\s+/
        ],
        weight: 1
    },

    java: {
        patterns: [
            /\bpublic\s+(static\s+)?class\s+\w+/,
            /\bpublic\s+static\s+void\s+main\s*\(/,
            /\bSystem\.out\.println\s*\(/,
            /\bprivate\s+\w+\s+\w+;/,
            /\bpublic\s+\w+\s+\w+\s*\(/,
            /\bimport\s+java\./,
            /\bextends\s+\w+/,
            /\bimplements\s+\w+/,
            /\bnew\s+\w+\s*\(/,
            /\bthrows\s+\w+/,
            /\bpackage\s+\w+/,
            /@Override/
        ],
        weight: 1
    },

    cpp: {
        patterns: [
            /#include\s*<\w+>/,
            /\bstd::/,
            /\bcout\s*<</,
            /\bcin\s*>>/,
            /\bint\s+main\s*\(/,
            /\busing\s+namespace\s+std/,
            /\bvector\s*</,
            /\btemplate\s*</,
            /\bclass\s+\w+\s*:\s*(public|private|protected)/,
            /::\w+/,
            /\bvirtual\s+/,
            /\bnullptr\b/
        ],
        weight: 1
    },

    c: {
        patterns: [
            /#include\s*<stdio\.h>/,
            /#include\s*<stdlib\.h>/,
            /\bprintf\s*\(/,
            /\bscanf\s*\(/,
            /\bint\s+main\s*\(\s*(void|int)/,
            /\bmalloc\s*\(/,
            /\bfree\s*\(/,
            /\bstruct\s+\w+\s*\{/,
            /\btypedef\s+/,
            /#define\s+\w+/,
            /\bNULL\b/
        ],
        weight: 0.9
    },

    csharp: {
        patterns: [
            /\busing\s+System/,
            /\bnamespace\s+\w+/,
            /\bpublic\s+class\s+\w+/,
            /\bConsole\.(WriteLine|ReadLine)\s*\(/,
            /\bstatic\s+void\s+Main\s*\(/,
            /\bvar\s+\w+\s*=/,
            /\basync\s+Task/,
            /\bawait\s+/,
            /\bLINQ/i,
            /\.Select\s*\(/,
            /\.Where\s*\(/,
            /\bstring\[\]/
        ],
        weight: 1
    },

    go: {
        patterns: [
            /\bpackage\s+main/,
            /\bfunc\s+\w+\s*\(/,
            /\bfmt\.(Println|Printf|Print)\s*\(/,
            /\bimport\s+\(/,
            /\bvar\s+\w+\s+\w+/,
            /:=/,
            /\bgo\s+func/,
            /\bchan\s+\w+/,
            /\bdefer\s+/,
            /\bgoroutine/i
        ],
        weight: 1.1
    },

    rust: {
        patterns: [
            /\bfn\s+\w+\s*\(/,
            /\blet\s+mut\s+\w+/,
            /\bimpl\s+\w+/,
            /\bpub\s+fn/,
            /\bstruct\s+\w+\s*\{/,
            /\benum\s+\w+\s*\{/,
            /\bResult<.*>/,
            /\bOption<.*>/,
            /\b(Some|None|Ok|Err)\b/,
            /\bprintln!\s*\(/,
            /\buse\s+std::/,
            /\bmatch\s+\w+\s*\{/
        ],
        weight: 1.1
    },

    php: {
        patterns: [
            /<\?php/,
            /\$\w+\s*=/,
            /\becho\s+/,
            /\bfunction\s+\w+\s*\(/,
            /\bclass\s+\w+/,
            /\bpublic\s+function/,
            /\bnew\s+\w+\s*\(/,
            /->\w+/,
            /\barray\s*\(/,
            /\bforeach\s*\(/
        ],
        weight: 1
    },

    ruby: {
        patterns: [
            /\bdef\s+\w+/,
            /\bclass\s+\w+/,
            /\bend\s*$/m,
            /\bputs\s+/,
            /\brequire\s+['"`]/,
            /\battr_(reader|writer|accessor)/,
            /\bdo\s*\|/,
            /\.each\s+do/,
            /\bnil\b/,
            /@\w+/
        ],
        weight: 1
    },

    sql: {
        patterns: [
            /\bSELECT\s+/i,
            /\bFROM\s+\w+/i,
            /\bWHERE\s+/i,
            /\bINSERT\s+INTO\s+/i,
            /\bUPDATE\s+\w+\s+SET/i,
            /\bDELETE\s+FROM/i,
            /\bCREATE\s+TABLE/i,
            /\bJOIN\s+/i,
            /\bGROUP\s+BY/i,
            /\bORDER\s+BY/i
        ],
        weight: 1
    },

    html: {
        patterns: [
            /<html/i,
            /<head>/i,
            /<body>/i,
            /<div/i,
            /<span/i,
            /<p>/i,
            /<a\s+href/i,
            /<img\s+src/i,
            /<!DOCTYPE\s+html>/i,
            /<\/\w+>/
        ],
        weight: 0.8
    },

    css: {
        patterns: [
            /\.\w+\s*\{/,
            /#\w+\s*\{/,
            /\w+\s*:\s*\w+;/,
            /\bcolor\s*:/i,
            /\bbackground\s*:/i,
            /\bmargin\s*:/i,
            /\bpadding\s*:/i,
            /\bdisplay\s*:/i,
            /@media\s+/,
            /\bflex\b/
        ],
        weight: 0.8
    },

    json: {
        patterns: [
            /^\s*\{[\s\S]*\}\s*$/,
            /"\w+"\s*:\s*"/,
            /"\w+"\s*:\s*\d+/,
            /"\w+"\s*:\s*\[/,
            /"\w+"\s*:\s*(true|false|null)/
        ],
        weight: 0.7
    },

    yaml: {
        patterns: [
            /^\w+:\s*$/m,
            /^\s+-\s+\w+/m,
            /^\s+\w+:\s+\w+/m,
            /^---\s*$/m
        ],
        weight: 0.7
    },

    markdown: {
        patterns: [
            /^#+\s+/m,
            /^\*\s+/m,
            /^-\s+/m,
            /\*\*\w+\*\*/,
            /\[.*\]\(.*\)/,
            /```\w*/
        ],
        weight: 0.6
    },

    shell: {
        patterns: [
            /^#!/,
            /\becho\s+/,
            /\bcd\s+/,
            /\bls\s+/,
            /\bgrep\s+/,
            /\bawk\s+/,
            /\bsed\s+/,
            /\|\s*\w+/,
            /\$\(/,
            /\bexport\s+\w+=/
        ],
        weight: 0.9
    }
};

/**
 * Nombres legibles de lenguajes
 */
const LANGUAGE_NAMES = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    csharp: 'C#',
    go: 'Go',
    rust: 'Rust',
    php: 'PHP',
    ruby: 'Ruby',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    yaml: 'YAML',
    markdown: 'Markdown',
    shell: 'Shell/Bash'
};

/**
 * Detectar el lenguaje de programación de un snippet
 * @param {string} code - Código a analizar
 * @returns {Object} - { language, confidence, displayName }
 */
export function detectLanguage(code) {
    if (!code || typeof code !== 'string') {
        return {
            language: 'javascript',
            confidence: 0,
            displayName: 'JavaScript'
        };
    }

    const scores = {};

    // Calcular puntuación para cada lenguaje
    for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
        let score = 0;
        let matches = 0;

        for (const pattern of config.patterns) {
            if (pattern.test(code)) {
                score += config.weight;
                matches++;
            }
        }

        // Normalizar por cantidad de patrones
        const normalizedScore = config.patterns.length > 0
            ? (score / config.patterns.length) * matches
            : 0;

        scores[lang] = normalizedScore;
    }

    // Encontrar el lenguaje con mayor puntuación
    const sortedLangs = Object.entries(scores)
        .sort((a, b) => b[1] - a[1]);

    const [topLang, topScore] = sortedLangs[0] || ['javascript', 0];
    const [secondLang, secondScore] = sortedLangs[1] || ['unknown', 0];

    // Calcular confianza (diferencia entre primero y segundo)
    const confidence = topScore > 0
        ? Math.min(1, (topScore - secondScore) / topScore + 0.3)
        : 0;

    return {
        language: topLang,
        confidence: Math.round(confidence * 100) / 100,
        displayName: LANGUAGE_NAMES[topLang] || topLang
    };
}

/**
 * Obtener nombre legible del lenguaje
 * @param {string} langCode - Código del lenguaje
 * @returns {string}
 */
export function getLanguageName(langCode) {
    return LANGUAGE_NAMES[langCode?.toLowerCase()] || langCode || 'Unknown';
}

/**
 * Obtener todos los lenguajes soportados
 * @returns {Array<{code: string, name: string}>}
 */
export function getSupportedLanguages() {
    return Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({
        code,
        name
    }));
}

/**
 * Validar si un lenguaje está soportado
 * @param {string} langCode - Código del lenguaje
 * @returns {boolean}
 */
export function isLanguageSupported(langCode) {
    return langCode?.toLowerCase() in LANGUAGE_PATTERNS;
}
