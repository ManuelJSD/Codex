import { useState } from 'react';
import { themes } from '../themes';

export default function Sidebar({ guides, selected, onSelect, currentTheme, onThemeChange }) {
    const [search, setSearch] = useState('');

    // Filtrado insensible a mayúsculas
    const filteredGuides = guides.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <aside className="sidebar">
            {/* Título */}
            <h2>📚 Librería de Guías</h2>

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
