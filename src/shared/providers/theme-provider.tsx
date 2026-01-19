import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  accentColors,
  getSettings,
  saveSettings,
  type AccentColor,
} from '@/shared/db/settings';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function applyAccentColor(colorId: AccentColor, resolvedTheme: ResolvedTheme) {
  const colorConfig = accentColors.find((c) => c.id === colorId);
  if (!colorConfig) return;

  const root = document.documentElement;
  const color =
    resolvedTheme === 'dark' ? colorConfig.darkColor : colorConfig.color;

  // Set primary color CSS variable
  root.style.setProperty('--primary', color);
  root.style.setProperty('--ring', color);
  root.style.setProperty('--sidebar-primary', color);
  root.style.setProperty('--sidebar-ring', color);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const settings = getSettings();
    return settings.theme;
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const settings = getSettings();
    return settings.accentColor || 'orange';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const settings = getSettings();
    return resolveTheme(settings.theme);
  });

  // Apply theme and accent color on mount and when they change
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    applyAccentColor(accentColor, resolved);
  }, [theme, accentColor]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme: ResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolvedTheme);
      applyTheme(newResolvedTheme);
      applyAccentColor(accentColor, newResolvedTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, accentColor]);

  // Apply on initial load
  useEffect(() => {
    applyTheme(resolvedTheme);
    applyAccentColor(accentColor, resolvedTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    const settings = getSettings();
    saveSettings({ ...settings, theme: newTheme });
  };

  const setAccentColor = (newColor: AccentColor) => {
    setAccentColorState(newColor);
    const settings = getSettings();
    saveSettings({ ...settings, accentColor: newColor });
    applyAccentColor(newColor, resolvedTheme);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, accentColor, setTheme, setAccentColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
