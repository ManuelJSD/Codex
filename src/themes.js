/** Definición de todos los temas disponibles en la app */
export const themes = [
    {
        id: 'dark-ocean',
        name: '🌊 Dark Ocean',
        vars: {
            '--bg-color': '#0f172a',
            '--bg-gradient': 'radial-gradient(circle at top left, #1e293b 0%, #0f172a 100%)',
            '--panel-bg': 'rgba(30, 41, 59, 0.75)',
            '--border-color': 'rgba(255, 255, 255, 0.10)',
            '--text-main': '#f8fafc',
            '--text-muted': '#94a3b8',
            '--accent': '#38bdf8',
            '--accent-hover': '#0ea5e9',
            '--code-color': '#fb7185',
            '--md-bg': 'rgba(30, 41, 59, 0.45)',
            '--font': "'Inter', sans-serif",
        }
    },
    {
        id: 'nord',
        name: '❄️ Nord',
        vars: {
            '--bg-color': '#2e3440',
            '--bg-gradient': 'linear-gradient(135deg, #2e3440 0%, #3b4252 100%)',
            '--panel-bg': 'rgba(46, 52, 64, 0.85)',
            '--border-color': 'rgba(216, 222, 233, 0.12)',
            '--text-main': '#eceff4',
            '--text-muted': '#8fbcbb',
            '--accent': '#88c0d0',
            '--accent-hover': '#81a1c1',
            '--code-color': '#bf616a',
            '--md-bg': 'rgba(59, 66, 82, 0.6)',
            '--font': "'Inter', sans-serif",
        }
    },
    {
        id: 'cyberpunk',
        name: '🤖 Cyberpunk',
        vars: {
            '--bg-color': '#0d0d0d',
            '--bg-gradient': 'radial-gradient(ellipse at bottom, #1a0030 0%, #0d0d0d 100%)',
            '--panel-bg': 'rgba(20, 0, 40, 0.80)',
            '--border-color': 'rgba(255, 0, 255, 0.18)',
            '--text-main': '#f0f0f0',
            '--text-muted': '#b800ff99',
            '--accent': '#ff00ff',
            '--accent-hover': '#cc00cc',
            '--code-color': '#00ffcc',
            '--md-bg': 'rgba(20, 0, 40, 0.55)',
            '--font': "'Inter', monospace",
        }
    },
    {
        id: 'sepia',
        name: '📜 Sepia Clásico',
        vars: {
            '--bg-color': '#f4e8d0',
            '--bg-gradient': 'linear-gradient(160deg, #f4e8d0 0%, #e0c8a0 100%)',
            '--panel-bg': 'rgba(180, 140, 80, 0.20)',
            '--border-color': 'rgba(120, 80, 20, 0.20)',
            '--text-main': '#3b2a10',
            '--text-muted': '#7a5c30',
            '--accent': '#8b4513',
            '--accent-hover': '#5c2e0a',
            '--code-color': '#8b0000',
            '--md-bg': 'rgba(255, 245, 220, 0.80)',
            '--font': "'Georgia', serif",
        }
    },
    {
        id: 'forest',
        name: '🌲 Bosque',
        vars: {
            '--bg-color': '#0e1a0f',
            '--bg-gradient': 'radial-gradient(circle at bottom right, #1a3320 0%, #0e1a0f 100%)',
            '--panel-bg': 'rgba(20, 50, 25, 0.75)',
            '--border-color': 'rgba(100, 200, 80, 0.15)',
            '--text-main': '#d4edde',
            '--text-muted': '#7ab38a',
            '--accent': '#4caf50',
            '--accent-hover': '#388e3c',
            '--code-color': '#ffd54f',
            '--md-bg': 'rgba(15, 40, 20, 0.50)',
            '--font': "'Inter', sans-serif",
        }
    },
    {
        id: 'void',
        name: '⬛ Void',
        vars: {
            '--bg-color': '#000000',
            '--bg-gradient': 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
            '--panel-bg': 'rgba(10, 10, 10, 0.95)',
            '--border-color': 'rgba(255, 200, 0, 0.12)',
            '--text-main': '#e8e8e8',
            '--text-muted': '#666666',
            '--accent': '#fbbf24',
            '--accent-hover': '#f59e0b',
            '--code-color': '#34d399',
            '--md-bg': 'rgba(12, 12, 12, 0.90)',
            '--font': "'Inter', sans-serif",
        }
    },
];

/** Aplica un tema al elemento raíz del documento */
export function applyTheme(theme) {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([key, val]) => {
        root.style.setProperty(key, val);
    });
    root.setAttribute('data-theme', theme.id);
}
