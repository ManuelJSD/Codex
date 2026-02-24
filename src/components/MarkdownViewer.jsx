import { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import TableOfContents, { slugify } from './TableOfContents';

/** Colores disponibles para resaltar texto */
const HIGHLIGHT_COLORS = [
    { id: 'yellow', label: '🟡', bg: 'rgba(255, 220, 50, 0.45)', border: '#facc15' },
    { id: 'green', label: '🟢', bg: 'rgba(74, 222, 128, 0.40)', border: '#4ade80' },
    { id: 'blue', label: '🔵', bg: 'rgba(96, 165, 250, 0.40)', border: '#60a5fa' },
    { id: 'pink', label: '🩷', bg: 'rgba(248, 113, 113, 0.40)', border: '#f87171' },
    { id: 'orange', label: '🟠', bg: 'rgba(251, 146, 60, 0.45)', border: '#fb923c' },
];

/** Lee las anotaciones de localStorage para una guía dada */
function loadAnnotations(guideKey) {
    try {
        return JSON.parse(localStorage.getItem(`annotations:${guideKey}`)) ?? [];
    } catch {
        return [];
    }
}

/** Guarda las anotaciones en localStorage */
function saveAnnotations(guideKey, annotations) {
    localStorage.setItem(`annotations:${guideKey}`, JSON.stringify(annotations));
}

/**
 * Aplica highlights al contenedor DOM buscando los textos anotados y
 * envolviéndolos en un <mark> con un tooltip de la nota.
 * Limpia los marks anteriores antes de re-aplicar.
 */
function applyHighlights(container, annotations) {
    if (!container) return;

    // Primero deshacer los highlights anteriores
    container.querySelectorAll('mark[data-annotation]').forEach(mark => {
        const parent = mark.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
    });

    if (!annotations.length) return;

    // Función recursiva que recorre nodos de texto
    function walkNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            for (const ann of annotations) {
                const idx = text.indexOf(ann.selectedText);
                if (idx === -1) continue;

                const colorDef = HIGHLIGHT_COLORS.find(c => c.id === ann.color) ?? HIGHLIGHT_COLORS[0];
                const mark = document.createElement('mark');
                mark.setAttribute('data-annotation', ann.id);
                mark.style.background = colorDef.bg;
                mark.style.borderBottom = `2px solid ${colorDef.border}`;
                mark.style.borderRadius = '3px';
                mark.style.cursor = 'pointer';
                mark.style.color = 'inherit';
                mark.textContent = ann.selectedText;

                const before = document.createTextNode(text.slice(0, idx));
                const after = document.createTextNode(text.slice(idx + ann.selectedText.length));

                const parent = node.parentNode;
                parent.insertBefore(before, node);
                parent.insertBefore(mark, node);
                parent.insertBefore(after, node);
                parent.removeChild(node);
                return; // Solo un highlight por nodo de texto por iteración
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'MARK') {
            Array.from(node.childNodes).forEach(walkNode);
        }
    }

    walkNode(container);
}

/**
 * Componente MarkdownViewer con soporte de anotaciones y resaltado de texto.
 */
export default function MarkdownViewer({ content, guideKey }) {
    const containerRef = useRef(null);
    const [annotations, setAnnotations] = useState(() => loadAnnotations(guideKey));

    // Toolbar flotante al seleccionar texto
    const [toolbar, setToolbar] = useState(null);
    const [noteForm, setNoteForm] = useState(null);
    // Popover al hacer clic en un highlight
    const [activePopover, setActivePopover] = useState(null);
    // Heading activo para la tabla de contenidos
    const [activeSlug, setActiveSlug] = useState('');

    // Al cambiar de guía, cargar sus anotaciones
    useEffect(() => {
        const loaded = loadAnnotations(guideKey);
        setAnnotations(loaded);
        setToolbar(null);
        setNoteForm(null);
        setActivePopover(null);
    }, [guideKey]);

    // Aplicar highlights e inyectar pines/IDs a headings tras cada render
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Recuperar bookmarks actuales para saber la clase inicial del botón
        const initialBookmarks = JSON.parse(localStorage.getItem(`codex-bookmarks:${guideKey}`) || '[]');

        // Procesar h1-h6 y p para asignar IDs e inyectar botones de Pin
        container.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((el, index) => {
            // Asignar ID
            if (el.tagName.startsWith('H')) {
                const slug = slugify(el.textContent);
                el.id = `heading-${slug}`;
            } else {
                if (!el.id) el.id = `para-${index}`;
            }

            // Evitar duplicar botones si el componente se re-ejecuta
            if (!el.querySelector('.pin-action-btn')) {
                el.classList.add('pinnable-element');

                const pinBtn = document.createElement('button');
                const isPinned = initialBookmarks.some(b => b.id === el.id);

                pinBtn.className = `pin-action-btn ${isPinned ? 'pinned' : ''}`;
                pinBtn.innerHTML = '📌';
                pinBtn.title = isPinned ? 'Quitar marcador' : 'Fijar marcador';

                pinBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const cleanText = el.textContent.replace('📌', '').trim();
                    const text = cleanText.length > 35 ? cleanText.slice(0, 35) + '...' : cleanText;

                    window.dispatchEvent(new CustomEvent('toggle-bookmark', {
                        detail: {
                            id: el.id,
                            text: text || 'Elemento sin texto'
                        }
                    }));
                };

                el.prepend(pinBtn);
            }
        });

        applyHighlights(container, annotations);
    }, [annotations, content, guideKey]);

    // Escuchar cambios en los bookmarks desde el Sidebar para actualizar visualmente los botones
    useEffect(() => {
        const handleBookmarksUpdated = (e) => {
            const currentBookmarks = e.detail;
            const container = containerRef.current;
            if (!container) return;

            container.querySelectorAll('.pin-action-btn').forEach(btn => {
                const parentId = btn.parentElement.id;
                const isPinned = currentBookmarks.some(b => b.id === parentId);

                if (isPinned) {
                    btn.classList.add('pinned');
                    btn.title = 'Quitar marcador';
                } else {
                    btn.classList.remove('pinned');
                    btn.title = 'Fijar marcador';
                }
            });
        };

        window.addEventListener('bookmarks-changed', handleBookmarksUpdated);
        return () => window.removeEventListener('bookmarks-changed', handleBookmarksUpdated);
    }, []);

    // IntersectionObserver para resaltar el heading activo en la ToC
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const headings = container.querySelectorAll('h1, h2, h3');
        if (!headings.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const slug = entry.target.id.replace('heading-', '');
                        setActiveSlug(slug);
                        break;
                    }
                }
            },
            { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
        );

        headings.forEach(h => observer.observe(h));
        return () => observer.disconnect();
    }, [content]);

    // Detectar clic en un mark resaltado para mostrar el popover
    const handleContainerClick = useCallback((e) => {
        const mark = e.target.closest('mark[data-annotation]');
        if (mark) {
            const annId = mark.getAttribute('data-annotation');
            const ann = annotations.find(a => a.id === annId);
            if (!ann) return;
            const rect = mark.getBoundingClientRect();
            setActivePopover({
                x: rect.left + rect.width / 2,
                y: rect.top - 10,
                annotation: ann,
            });
            setToolbar(null);
            return;
        }
        // Clic fuera de un mark: cerrar popover
        setActivePopover(null);
    }, [annotations]);

    // Detectar selección de texto
    const handleMouseUp = useCallback((e) => {
        // Si el clic fue en un mark, no abrir toolbar de nuevo texto
        if (e.target.closest('mark[data-annotation]')) return;
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (!text || text.length < 3) {
            setToolbar(null);
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setToolbar({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            selectedText: text,
        });
    }, []);

    // Guardar una nueva anotación
    const handleSaveAnnotation = () => {
        if (!noteForm) return;
        const newAnnotation = {
            id: `ann-${Date.now()}`,
            selectedText: noteForm.selectedText,
            note: noteForm.note,
            color: noteForm.color,
            createdAt: new Date().toISOString(),
        };
        const updated = [...annotations, newAnnotation];
        setAnnotations(updated);
        saveAnnotations(guideKey, updated);
        setNoteForm(null);
        setToolbar(null);
        window.getSelection()?.removeAllRanges();
    };

    // Eliminar una anotación por ID
    const handleDeleteAnnotation = (id) => {
        const updated = annotations.filter(a => a.id !== id);
        setAnnotations(updated);
        saveAnnotations(guideKey, updated);
        setActivePopover(null);
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Toolbar flotante al seleccionar texto */}
            {toolbar && !noteForm && (
                <div
                    className="annotation-toolbar"
                    style={{ left: toolbar.x, top: toolbar.y + window.scrollY }}
                >
                    <button
                        className="annotation-toolbar-btn"
                        onMouseDown={e => {
                            e.preventDefault();
                            setNoteForm({ selectedText: toolbar.selectedText, note: '', color: 'yellow' });
                        }}
                    >
                        🖊 Anotar
                    </button>
                    <button
                        className="annotation-toolbar-btn secondary"
                        onMouseDown={e => { e.preventDefault(); setToolbar(null); }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Formulario de nota */}
            {noteForm && (
                <div className="annotation-form-overlay" onClick={() => setNoteForm(null)}>
                    <div className="annotation-form" onClick={e => e.stopPropagation()}>
                        <p className="annotation-form-preview">
                            <em>"{noteForm.selectedText.slice(0, 60)}{noteForm.selectedText.length > 60 ? '…' : ''}"</em>
                        </p>
                        <div className="annotation-color-row">
                            {HIGHLIGHT_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    className={`annotation-color-btn ${noteForm.color === c.id ? 'selected' : ''}`}
                                    style={{ background: c.bg, borderColor: c.border }}
                                    onClick={() => setNoteForm(f => ({ ...f, color: c.id }))}
                                    title={c.id}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                        <textarea
                            className="annotation-note-input"
                            placeholder="Escribe tu nota (opcional)..."
                            value={noteForm.note}
                            onChange={e => setNoteForm(f => ({ ...f, note: e.target.value }))}
                            rows={3}
                            autoFocus
                        />
                        <div className="annotation-form-actions">
                            <button className="annotation-save-btn" onClick={handleSaveAnnotation}>💾 Guardar</button>
                            <button className="annotation-cancel-btn" onClick={() => setNoteForm(null)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popover al hacer clic en un highlight */}
            {activePopover && (
                <div
                    className="annotation-popover"
                    style={{ left: activePopover.x, top: activePopover.y }}
                    onClick={e => e.stopPropagation()}
                >
                    {activePopover.annotation.note
                        ? <p className="annotation-popover-note">📝 {activePopover.annotation.note}</p>
                        : <p className="annotation-popover-note muted">Sin nota</p>
                    }
                    <button
                        className="annotation-popover-delete"
                        onClick={() => handleDeleteAnnotation(activePopover.annotation.id)}
                    >
                        🗑 Eliminar anotación
                    </button>
                </div>
            )}

            {/* Contenido Markdown + ToC en layout de dos columnas */}
            <div className="viewer-layout">
                {/* Columna principal */}
                <div className="viewer-main">
                    <div
                        ref={containerRef}
                        className="markdown-container"
                        onMouseUp={handleMouseUp}
                        onClick={handleContainerClick}
                    >
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>

                    {/* Panel de anotaciones guardadas */}
                    {annotations.length > 0 && (
                        <div className="annotations-panel">
                            <h4 className="annotations-panel-title">📌 Mis anotaciones ({annotations.length})</h4>
                            {annotations.map(ann => {
                                const colorDef = HIGHLIGHT_COLORS.find(c => c.id === ann.color) ?? HIGHLIGHT_COLORS[0];
                                return (
                                    <div
                                        key={ann.id}
                                        className="annotation-item"
                                        style={{ borderLeft: `3px solid ${colorDef.border}` }}
                                    >
                                        <p className="annotation-item-text">"{ann.selectedText.slice(0, 80)}{ann.selectedText.length > 80 ? '…' : ''}"</p>
                                        {ann.note && <p className="annotation-item-note">📝 {ann.note}</p>}
                                        <button
                                            className="annotation-item-delete"
                                            onClick={() => handleDeleteAnnotation(ann.id)}
                                            title="Eliminar anotación"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Tabla de contenidos sticky */}
                <TableOfContents content={content} activeSlug={activeSlug} />
            </div>
        </div>
    );
}
