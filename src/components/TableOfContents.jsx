import { useMemo, useState, useEffect } from 'react';

/**
 * Genera un slug a partir de un texto de encabezado.
 * Se usa para construir los IDs que MarkdownViewer asigna al DOM.
 */
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-áéíóúüñ]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

/**
 * Extrae los encabezados H1, H2 y H3 del texto Markdown.
 * Devuelve un array de { level, text, slug }.
 */
function extractHeadings(markdown) {
    const lines = markdown.split('\n');
    const headings = [];
    for (const line of lines) {
        const match = line.match(/^(#{1,3})\s+(.+)/);
        if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            headings.push({ level, text, slug: slugify(text) });
        }
    }
    return headings;
}

/**
 * Panel de tabla de contenidos sticky.
 * @param {string} content - Contenido Markdown de la guía actual.
 * @param {string} activeSlug - Slug del encabezado activo actualmente visible.
 */
export default function TableOfContents({ content, activeSlug }) {
    const headings = useMemo(() => extractHeadings(content), [content]);
    const [open, setOpen] = useState(window.innerWidth > 768);

    if (!headings.length) return null;

    const handleClick = (slug) => {
        const el = document.getElementById(`heading-${slug}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <nav className={`toc-panel ${open ? 'open' : 'collapsed'}`}>
            {/* Cabecera del TOC */}
            <button className="toc-toggle" onClick={() => setOpen(o => !o)}>
                <span>📑 Índice</span>
                <span className="toc-toggle-icon">{open ? '▲' : '▼'}</span>
            </button>

            {/* Lista de encabezados */}
            {open && (
                <ul className="toc-list">
                    {headings.map((h, i) => (
                        <li key={i} className={`toc-item toc-level-${h.level} ${activeSlug === h.slug ? 'active' : ''}`}>
                            <button
                                className="toc-link"
                                onClick={() => handleClick(h.slug)}
                                title={h.text}
                            >
                                {h.text}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </nav>
    );
}

/** Función helper exportada para que MarkdownViewer la use al asignar IDs */
export { slugify };
