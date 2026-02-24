import { useEffect, useState } from 'react';

/**
 * Barra de progreso de lectura.
 * Se ancla en la parte superior del área de contenido principal y
 * se actualiza conforme el usuario hace scroll en el visor.
 *
 * @param {React.RefObject} scrollRef - Ref del elemento con scroll (main-content)
 */
export default function ReadingProgress({ scrollRef }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const el = scrollRef?.current;
        if (!el) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            const scrollable = scrollHeight - clientHeight;
            const pct = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;
            setProgress(Math.min(100, Math.round(pct)));
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [scrollRef]);

    return (
        <div className="reading-progress-track">
            <div
                className="reading-progress-bar"
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
            />
            {progress > 0 && (
                <span className="reading-progress-label">{progress}%</span>
            )}
        </div>
    );
}
