import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MarkdownViewer from './components/MarkdownViewer';
import ChatPanel from './components/ChatPanel';
import ReadingProgress from './components/ReadingProgress';
import { themes, applyTheme } from './themes';

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
    <div className="app-container">
      <Sidebar
        guides={guides}
        selected={selectedGuide}
        onSelect={handleSelectGuide}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      <main className="main-content" ref={mainContentRef}>
        {/* Barra de progreso de lectura */}
        {selectedGuide && (
          <ReadingProgress scrollRef={mainContentRef} />
        )}

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

      {/* Panel de chat: solo visible cuando hay una guía activa */}
      {selectedGuide && (
        <ChatPanel
          guideContent={selectedGuide.content}
          guideName={selectedGuide.name}
        />
      )}
    </div>
  );
}

export default App;
