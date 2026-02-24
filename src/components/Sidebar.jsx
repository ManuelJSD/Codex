import { useState, useEffect } from 'react';
import { themes } from '../themes';

export default function Sidebar({ guides, selected, onSelect, currentTheme, onThemeChange, onOpenSettings }) {
    const [search, setSearch] = useState('');
    const [bookmarks, setBookmarks] = useState([]);

    // Actualizar marcadores al cambiar la guía seleccionada
    useEffect(() => {
        if (!selected) {
            setBookmarks([]);
            return;
        }
        const saved = JSON.parse(localStorage.getItem(`codex-bookmarks:${selected.path}`) || '[]');
        setBookmarks(saved);
    }, [selected]);

    // Escuchar el evento personalizado desde MarkdownViewer
    useEffect(() => {
        const handleToggle = (e) => {
            if (!selected) return;
            const { id, text } = e.detail;
            setBookmarks(prev => {
                const newBookmarks = [...prev];
                const index = newBookmarks.findIndex(b => b.id === id);
                if (index > -1) {
                    newBookmarks.splice(index, 1);
                } else {
                    newBookmarks.push({ id, text });
                }
                localStorage.setItem(`codex-bookmarks:${selected.path}`, JSON.stringify(newBookmarks));
                // Avisar al viewer que se han actualizado (para sync visual de botones)
                window.dispatchEvent(new CustomEvent('bookmarks-changed', { detail: newBookmarks }));
                return newBookmarks;
            });
        };
        window.addEventListener('toggle-bookmark', handleToggle);
        return () => window.removeEventListener('toggle-bookmark', handleToggle);
    }, [selected]);

    // Filtrado insensible a mayúsculas
    const filteredGuides = guides.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <aside className="sidebar">
            {/* Cabecera con Título y Ajustes */}
            <div className="sidebar-header">
                <h2>Codex</h2>
                <div className="sidebar-header-actions">
                    <button className="settings-btn" onClick={onOpenSettings} title="Configuración">⚙️</button>
                </div>
            </div>

            {/* Buscador */}
            <div className="sidebar-search">
                <input
                    type="text"
                    className="search-input"
                    placeholder="🔍 Buscar guía..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                {search && (
                    <button className="search-clear" onClick={() => setSearch('')} title="Limpiar">
                        ✕
                    </button>
                )}
            </div>

            {/* Lista de guías filtradas */}
            <div className="guide-list">
                {filteredGuides.length === 0 && (
                    <div className="guide-item-empty">
                        {guides.length === 0
                            ? <span>No se encontraron guías en <code>src/Resources</code></span>
                            : <span>Sin resultados para <em>"{search}"</em></span>
                        }
                    </div>
                )}
                {filteredGuides.map((guide) => (
                    <button
                        key={guide.path}
                        className={`guide-item ${selected?.path === guide.path ? 'active' : ''}`}
                        onClick={() => onSelect(guide)}
                    >
                        {guide.name}
                    </button>
                ))}
            </div>

            {/* Pines Guardados */}
            {selected && bookmarks.length > 0 && (
                <div className="sidebar-bookmarks">
                    <h3 className="sidebar-bookmarks-title">📍 Pines Guardados</h3>
                    <ul className="sidebar-bookmarks-list">
                        {bookmarks.map(b => (
                            <li key={b.id}>
                                <button
                                    className="sidebar-bookmark-btn"
                                    onClick={() => document.getElementById(b.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                    title={b.text}
                                >
                                    {b.text}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Separador */}
            <hr className="sidebar-divider" />

            {/* Selector de tema */}
            <div className="theme-section">
                <h3 className="theme-title">🎨 Tema</h3>
                <div className="theme-picker">
                    {themes.map((theme) => (
                        <button
                            key={theme.id}
                            className={`theme-btn ${currentTheme?.id === theme.id ? 'theme-active' : ''}`}
                            onClick={() => onThemeChange(theme)}
                            title={theme.name}
                        >
                            <span className="theme-dot" style={{
                                background: theme.vars['--accent'],
                                boxShadow: `0 0 6px ${theme.vars['--accent']}`
                            }} />
                            <span className="theme-label">{theme.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
}
