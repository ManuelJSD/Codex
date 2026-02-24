import { useState, useRef, useEffect } from 'react';

/** URL de la API local de LM Studio */
const LM_STUDIO_URL = 'http://localhost:1234/v1/chat/completions';

/**
 * Panel de chat con IA conectado a LM Studio.
 * Recibe el contenido de la guía activa como contexto del sistema.
 */
export default function ChatPanel({ guideContent, guideName }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const abortRef = useRef(null);

    // Hacer scroll al último mensaje automáticamente
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Limpiar el chat al cambiar de guía
    useEffect(() => {
        setMessages([]);
        setInput('');
    }, [guideName]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        // Añadir mensaje del usuario al historial
        const userMsg = { role: 'user', content: text };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        // Placeholder del asistente para mostrar el streaming
        setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

        // Preparar contexto del sistema con el contenido de la guía
        const systemPrompt = guideContent
            ? `Eres un asistente experto en videojuegos. El usuario está leyendo la siguiente guía llamada "${guideName}". Responde SOLO sobre el contenido de esta guía, usando la información que contiene. Sé conciso y preciso.\n\n--- INICIO DE LA GUÍA ---\n${guideContent.slice(0, 12000)}\n--- FIN DE LA GUÍA ---`
            : 'Eres un asistente experto en videojuegos. Sé conciso y preciso.';

        const body = {
            model: 'local-model',
            messages: [
                { role: 'system', content: systemPrompt },
                ...updatedMessages
            ],
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

            // Marcar mensaje como completado (quitar indicador de streaming)
            setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: assistantText };
                return next;
            });

        } catch (err) {
            if (err.name !== 'AbortError') {
                setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1] = {
                        role: 'assistant',
                        content: `⚠️ No se pudo conectar con LM Studio. Asegúrate de que esté ejecutándose en http://localhost:1234.\n\n_Error: ${err.message}_`,
                        isError: true
                    };
                    return next;
                });
            }
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
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
        <aside className="chat-panel">
            {/* Cabecera del chat */}
            <div className="chat-header">
                <span className="chat-title">🤖 Asistente IA</span>
                {guideName && (
                    <span className="chat-guide-name" title={guideName}>
                        {guideName.length > 20 ? guideName.slice(0, 20) + '…' : guideName}
                    </span>
                )}
            </div>

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
                            {msg.content || (msg.streaming ? <span className="chat-cursor" /> : '')}
                            {msg.streaming && msg.content && <span className="chat-cursor" />}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Área de entrada */}
            <div className="chat-input-area">
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
        </aside>
    );
}
