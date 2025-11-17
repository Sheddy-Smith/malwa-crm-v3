import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
    const { theme, setTheme } = useThemeStore();
    return (
        <div className="flex items-center space-x-1 p-1 rounded-full bg-gray-200/50 dark:bg-gray-700/50">
           <ToggleButton themeName="light" currentTheme={theme} setTheme={setTheme} Icon={Sun} />
           <ToggleButton themeName="dark" currentTheme={theme} setTheme={setTheme} Icon={Moon} />
           <ToggleButton themeName="system" currentTheme={theme} setTheme={setTheme} Icon={Monitor} />
        </div>
    );
};

const ToggleButton = ({ themeName, currentTheme, setTheme, Icon }) => {
    const isActive = themeName === currentTheme;
    return (
        <button onClick={() => setTheme(themeName)} className="p-1.5 rounded-full relative">
            {isActive && (
                <motion.div
                    layoutId="theme-active"
                    className="absolute inset-0 bg-white dark:bg-gray-800/80 rounded-full shadow-sm"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
            )}
            <Icon className={`h-5 w-5 text-gray-700 dark:text-gray-300 z-10 relative transition-colors ${isActive ? 'text-brand-blue' : ''}`} />
        </button>
    );
}

export default ThemeToggle;
