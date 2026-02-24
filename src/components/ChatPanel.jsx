import { useState, useRef, useEffect, useCallback } from 'react';

/** URL de la API de LM Studio. Usa variable de entorno o localhost por defecto */
const LM_STUDIO_URL = import.meta.env.VITE_LM_STUDIO_URL || 'http://localhost:1234/v1/chat/completions';

/**
 * Panel de chat con IA conectado a LM Studio.
 * Recibe el contenido de la guía activa como contexto del sistema.
 */
export default function ChatPanel({ guideContent, guideName, chatWidth, onResizeStart }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachedImage, setAttachedImage] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Historial de sesiones
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    // Trackear si es móvil para deshabilitar ancho fijo
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const abortRef = useRef(null);

    // Cargar sesiones de la guía actual al cambiar de guía o montar
    useEffect(() => {
        if (!guideName) return;
        const key = `chat-sessions:${guideName}`;
        try {
            const loaded = JSON.parse(localStorage.getItem(key)) || [];
            setSessions(loaded);
            if (loaded.length > 0) {
                // Cargar la sesión más reciente por defecto
                setActiveSessionId(loaded[0].id);
                setMessages(loaded[0].messages);
            } else {
                startNewSession();
            }
        } catch {
            setSessions([]);
            startNewSession();
        }
        setShowHistory(false);
    }, [guideName]);

    // Hacer scroll al último mensaje automáticamente
    useEffect(() => {
        if (!showHistory) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, showHistory]);

    const saveSession = useCallback((sessionId, updatedMessages) => {
        setSessions(prevSessions => {
            const newSessions = [...prevSessions];
            const idx = newSessions.findIndex(s => s.id === sessionId);

            if (idx >= 0) {
                newSessions[idx].messages = updatedMessages;
                newSessions[idx].updatedAt = new Date().toISOString();
            } else {
                // Generar un título basado en el primer mensaje de usuario
                const userMsg = updatedMessages.find(m => m.role === 'user');
                let title = userMsg ? userMsg.content.slice(0, 30) : 'Nueva conversación';
                if (userMsg && userMsg.content.length > 30) title += '…';

                newSessions.unshift({
                    id: sessionId,
                    title,
                    messages: updatedMessages,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            }

            localStorage.setItem(`chat-sessions:${guideName}`, JSON.stringify(newSessions));
            return newSessions;
        });
    }, [guideName]);

    const startNewSession = () => {
        setActiveSessionId(null);
        setMessages([]);
        setAttachedImage(null);
        setShowHistory(false);
    };

    const loadSession = (id) => {
        const session = sessions.find(s => s.id === id);
        if (session) {
            setActiveSessionId(session.id);
            setMessages(session.messages);
            setShowHistory(false);
        }
    };

    const deleteSession = (e, id) => {
        e.stopPropagation(); // Evitar que seleccione la sesión al borrarla
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        localStorage.setItem(`chat-sessions:${guideName}`, JSON.stringify(updated));

        if (activeSessionId === id) {
            if (updated.length > 0) {
                loadSession(updated[0].id);
            } else {
                startNewSession();
            }
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limpiar el input para permitir subir la misma imagen si se borra
        e.target.value = '';

        const reader = new FileReader();
        reader.onloadend = () => {
            setAttachedImage(reader.result);
            inputRef.current?.focus();
        };
        reader.readAsDataURL(file);
    };

    const sendMessage = async () => {
        const text = input.trim();
        if ((!text && !attachedImage) || isLoading) return;

        let currentSessionId = activeSessionId;
        if (!currentSessionId) {
            currentSessionId = `session-${Date.now()}`;
            setActiveSessionId(currentSessionId);
        }

        // Añadir mensaje del usuario al historial
        const userMsg = { role: 'user', content: text, image: attachedImage };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        saveSession(currentSessionId, updatedMessages);

        setInput('');
        setAttachedImage(null);
        setIsLoading(true);

        // Placeholder del asistente para mostrar el streaming
        setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

        // Preparar contexto del sistema con el contenido de la guía
        const systemPrompt = guideContent
            ? `Eres un asistente experto en videojuegos. El usuario está leyendo la siguiente guía llamada "${guideName}". Responde SOLO sobre el contenido de esta guía, usando la información que contiene. Sé conciso y preciso.\n\n--- INICIO DE LA GUÍA ---\n${guideContent.slice(0, 12000)}\n--- FIN DE LA GUÍA ---`
            : 'Eres un asistente experto en videojuegos. Sé conciso y preciso.';

        // Formatear mensajes para la API de LM Studio (Multimodal si hay imagen)
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...updatedMessages.map(m => {
                if (m.role === 'user' && m.image) {
                    return {
                        role: 'user',
                        content: [
                            { type: "text", text: m.content || "Observa la imagen adjunta." },
                            { type: "image_url", image_url: { url: m.image } }
                        ]
                    };
                }
                return { role: m.role, content: m.content };
            })
        ];

        const body = {
            model: 'local-model',
            messages: apiMessages,
            stream: true,
            temperature: 0.7,
        };

        try {
            abortRef.current = new AbortController();
            const response = await fetch(LM_STUDIO_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: abortRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Leer el stream de Server-Sent Events
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

                for (const line of lines) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') break;
                    try {
                        const json = JSON.parse(data);
                        const delta = json.choices?.[0]?.delta?.content ?? '';
                        assistantText += delta;

                        // Actualizar el mensaje del asistente en tiempo real
                        setMessages(prev => {
                            const next = [...prev];
                            next[next.length - 1] = { role: 'assistant', content: assistantText, streaming: true };
                            return next;
                        });
                    } catch {
                        // Ignorar líneas JSON malformadas
                    }
                }
            }

            // Marcar mensaje como completado y guardar sesión definitiva
            setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: assistantText };
                saveSession(currentSessionId, next);
                return next;
            });

        } catch (err) {
            if (err.name !== 'AbortError') {
                setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1] = {
                        role: 'assistant',
                        content: `⚠️ No se pudo conectar con LM Studio. Asegúrate de que esté ejecutándose en la IP configurada.\n\n_Error: ${err.message}_`,
                        isError: true
                    };
                    saveSession(currentSessionId, next);
                    return next;
                });
            }
        } finally {
            setIsLoading(false);
            if (!showHistory) inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const stopStreaming = () => {
        abortRef.current?.abort();
        setIsLoading(false);
    };

    return (
        <aside className="chat-panel" style={isMobile ? {} : { width: `${chatWidth}px` }}>
            {/* Handle para redimensionar */}
            <div className="chat-resizer" onMouseDown={onResizeStart} title="Arrastrar para redimensionar"></div>

            {/* Cabecera del chat */}
            <div className="chat-header">
                <div className="chat-header-info">
                    <span className="chat-title">🤖 Codex AI</span>
                    {guideName && (
                        <span className="chat-guide-name" title={guideName}>
                            {guideName.length > 20 ? guideName.slice(0, 20) + '…' : guideName}
                        </span>
                    )}
                </div>
                <div className="chat-header-actions">
                    <button
                        className={`chat-action-btn ${showHistory ? 'active' : ''}`}
                        onClick={() => setShowHistory(!showHistory)}
                        title="Historial de conversaciones"
                    >
                        🗂️
                    </button>
                    <button
                        className="chat-action-btn"
                        onClick={startNewSession}
                        title="Nueva conversación"
                    >
                        ➕
                    </button>
                </div>
            </div>

            {/* View Switching: History vs Messages */}
            {
                showHistory ? (
                    <div className="chat-history-view">
                        <h4 className="chat-history-title">Conversaciones Guardadas</h4>
                        {sessions.length === 0 ? (
                            <p className="chat-empty">No hay conversaciones previas relacionadas con esta guía.</p>
                        ) : (
                            <ul className="chat-history-list">
                                {sessions.map(s => (
                                    <li key={s.id} className={`chat-history-item ${s.id === activeSessionId ? 'active' : ''}`}>
                                        <button className="chat-history-select" onClick={() => loadSession(s.id)}>
                                            <span className="chat-history-name">{s.title}</span>
                                            <span className="chat-history-date">{new Date(s.updatedAt).toLocaleDateString()}</span>
                                        </button>
                                        <button className="chat-history-delete" onClick={(e) => deleteSession(e, s.id)} title="Borrar">🗑</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Área de mensajes */}
                        <div className="chat-messages">
                            {messages.length === 0 && (
                                <div className="chat-empty">
                                    <p>💬 Hazme una pregunta sobre la guía que estás leyendo.</p>
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'} ${msg.isError ? 'error' : ''}`}
                                >
                                    <div className="chat-bubble">
                                        {msg.image && (
                                            <div className="chat-msg-image">
                                                <img src={msg.image} alt="User attachment" />
                                            </div>
                                        )}
                                        {msg.content && <span>{msg.content}</span>}
                                        {!msg.content && msg.streaming && <span className="chat-cursor" />}
                                        {msg.streaming && msg.content && <span className="chat-cursor" />}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Área de entrada */}
                        <div className={`chat-input-area ${attachedImage ? 'has-image' : ''}`}>
                            {attachedImage && (
                                <div className="chat-image-preview">
                                    <img src={attachedImage} alt="Preview" />
                                    <button className="chat-image-remove" onClick={() => setAttachedImage(null)} title="Eliminar imagen">✕</button>
                                </div>
                            )}
                            <div className="chat-input-controls">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleImageUpload}
                                />
                                <button
                                    className="chat-attach-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Adjuntar imagen"
                                    disabled={isLoading}
                                >
                                    📎
                                </button>
                                <textarea
                                    ref={inputRef}
                                    className="chat-input"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Escribe tu pregunta… (Enter para enviar)"
                                    rows={2}
                                    disabled={isLoading}
                                />
                                <button
                                    className={`chat-send-btn ${isLoading ? 'loading' : ''}`}
                                    onClick={isLoading ? stopStreaming : sendMessage}
                                    title={isLoading ? 'Detener respuesta' : 'Enviar mensaje'}
                                >
                                    {isLoading ? '⏹' : '➤'}
                                </button>
                            </div>
                        </div>
                    </>
                )
            }
        </aside >
    );
}
