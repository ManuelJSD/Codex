import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MarkdownViewer from './components/MarkdownViewer';
import ChatPanel from './components/ChatPanel';
import ReadingProgress from './components/ReadingProgress';
import { themes, applyTheme } from './themes';

/** URL por defecto de la API de LM Studio */
const DEFAULT_AI_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_LM_STUDIO_URL
  ? import.meta.env.VITE_LM_STUDIO_URL
  : 'http://localhost:1234/v1/chat/completions';

// Carga dinámica de todos los archivos .md en src/Resources
const guidesModules = import.meta.glob('./Resources/*.md', { query: '?raw', eager: true });

function App() {
  const [selectedGuide, setSelectedGuide] = useState(null);
  const mainContentRef = useRef(null);

  // Recupera el tema guardado en localStorage, o usa el primero por defecto
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedId = localStorage.getItem('guia-reader-theme');
    return themes.find(t => t.id === savedId) ?? themes[0];
  });

  // Estado para la URL de la IA y el modal de configuración
  const [aiUrl, setAiUrl] = useState(() => localStorage.getItem('codex-ai-url') || DEFAULT_AI_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  // Estado para controlar la visibilidad de los paneles
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('codex-sidebar-open');
    return saved !== null ? saved === 'true' : true;
  });

  const [isChatOpen, setIsChatOpen] = useState(() => {
    const saved = localStorage.getItem('codex-chat-open');
    return saved !== null ? saved === 'true' : true;
  });

  // Estado para el ancho redimensionable del chat
  const [chatWidth, setChatWidth] = useState(() => {
    const saved = localStorage.getItem('codex-chat-width');
    return saved ? parseInt(saved, 10) : 340;
  });

  const isResizing = useRef(false);

  // Manejo del redimensionado
  const handleResizeChat = useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 280 && newWidth <= 800) {
      setChatWidth(newWidth);
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    window.removeEventListener('mousemove', handleResizeChat);
    window.removeEventListener('mouseup', stopResizing);
  }, [handleResizeChat]);

  const startResizing = useCallback((e) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', handleResizeChat);
    window.addEventListener('mouseup', stopResizing);
  }, [handleResizeChat, stopResizing]);

  // Persistir estado de los paneles y el ancho
  useEffect(() => {
    localStorage.setItem('codex-sidebar-open', isSidebarOpen);
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('codex-chat-open', isChatOpen);
  }, [isChatOpen]);

  useEffect(() => {
    localStorage.setItem('codex-chat-width', chatWidth);
  }, [chatWidth]);

  // Aplica el tema guardado al montar la app
  useEffect(() => {
    applyTheme(currentTheme);
  }, []);

  // Maneja el cambio de tema y lo persiste en localStorage
  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    localStorage.setItem('guia-reader-theme', theme.id);
  };

  const openSettings = () => {
    setTempUrl(aiUrl);
    setShowSettings(true);
  };

  const saveSettings = () => {
    let normalizedUrl = tempUrl.trim();
    if (normalizedUrl && !normalizedUrl.startsWith('http')) {
      normalizedUrl = `http://${normalizedUrl}`;
    }
    setAiUrl(normalizedUrl);
    localStorage.setItem('codex-ai-url', normalizedUrl);
    setShowSettings(false);
  };

  // Al cambiar de guía, volver al inicio del scroll
  const handleSelectGuide = (guide) => {
    setSelectedGuide(guide);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  };

  // Construye la lista de guías a partir del glob
  const guides = Object.keys(guidesModules).map(path => {
    const filename = path.split('/').pop();
    const name = filename.replace('.md', '').replace(/_/g, ' ');
    return {
      path,
      name,
      content: guidesModules[path].default || guidesModules[path]
    };
  });

  return (
    <div
      className={`app-container ${!isSidebarOpen ? 'sidebar-closed' : ''} ${!isChatOpen ? 'chat-closed' : ''}`}
      style={{ '--chat-width': `${chatWidth}px` }}
    >
      <Sidebar
        guides={guides}
        selected={selectedGuide}
        onSelect={handleSelectGuide}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        onOpenSettings={openSettings}
      />

      {/* Toggle Edge Tabs para Paneles Lateral y Chat */}
      <button
        className={`edge-toggle-tab left-edge ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        title={isSidebarOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
        style={isSidebarOpen && window.innerWidth > 768 ? { left: '280px' } : {}}
      >
        <span>▶</span>
      </button>

      {selectedGuide && (
        <button
          className={`edge-toggle-tab right-edge ${isChatOpen ? 'open' : ''}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
          title={isChatOpen ? 'Ocultar Asistente IA' : 'Mostrar Asistente IA'}
          style={isChatOpen && window.innerWidth > 768 ? { right: `${chatWidth}px` } : {}}
        >
          <span>◀</span>
        </button>
      )}

      <main className="main-content" ref={mainContentRef}>
        {/* Barra de progreso de lectura */}
        <ReadingProgress containerRef={mainContentRef} />

        {selectedGuide ? (
          <MarkdownViewer
            key={selectedGuide.path}
            content={selectedGuide.content}
            guideKey={selectedGuide.path}
          />
        ) : (
          <div className="welcome-msg">
            <div className="welcome-icon">📖</div>
            <h2>Bienvenido a Codex</h2>
            <p>Selecciona una guía en el panel lateral para comenzar la lectura.</p>
          </div>
        )}
      </main>

      {/* Panel de chat: siempre renderizado; oculto vía clase chat-closed para transiciones suaves */}
      {selectedGuide && (
        <ChatPanel
          guideContent={selectedGuide.content}
          guideName={selectedGuide.name}
          aiUrl={aiUrl}
          chatWidth={chatWidth}
          onResizeStart={startResizing}
        />
      )}

      {/* Modal de Configuración */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <h3>⚙️ Configuración Codex</h3>
              <button className="settings-close" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="settings-body">
              <label className="settings-label">
                URL de Conexión IA (LM Studio):
                <input
                  type="text"
                  className="settings-input"
                  value={tempUrl}
                  onChange={e => setTempUrl(e.target.value)}
                  placeholder="http://192.168.1.X:1234/v1/chat/completions"
                />
              </label>
              <p className="settings-hint">
                Si ejecutas LM Studio en otro PC de tu red local, pon su IP aquí.
                Asegúrate de tener el <strong>CORS activado</strong> y servidor corriendo en <strong>0.0.0.0</strong> en tu LM Studio.
              </p>
            </div>
            <div className="settings-footer">
              <button className="annotation-cancel-btn" onClick={() => setShowSettings(false)}>Cancelar</button>
              <button className="annotation-save-btn" onClick={saveSettings}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
