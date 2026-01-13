import { createTheme } from '@mui/material/styles';

const createAppTheme = (mode = 'light', primaryColor = 'indigo') => {
  const colorPalettes = {
    indigo: {
      primary: { main: '#4f46e5', light: '#818cf8', dark: '#3730a3' },
      secondary: { main: '#ec4899' },
    },
    blue: {
      primary: { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8' },
      secondary: { main: '#f59e0b' },
    },
    green: {
      primary: { main: '#059669', light: '#34d399', dark: '#047857' },
      secondary: { main: '#dc2626' },
    },
    purple: {
      primary: { main: '#7c3aed', light: '#a78bfa', dark: '#6d28d9' },
      secondary: { main: '#f97316' },
    },
  };

  const palette = colorPalettes[primaryColor] || colorPalettes.indigo;

  return createTheme({
    palette: {
      mode,
      primary: {
        ...palette.primary,
        contrastText: '#ffffff',
      },
      secondary: {
        ...palette.secondary,
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f9fafb',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      success: { main: '#10b981' },
      error: { main: '#ef4444' },
      warning: { main: '#f59e0b' },
      info: { main: '#3b82f6' },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#111827',
        secondary: mode === 'dark' ? '#b0b0b0' : '#4b5563',
      },
      divider: mode === 'dark' ? '#333333' : '#e5e7eb',
    },
    typography: {
      fontFamily: '"Outfit", "Inter", "system-ui", sans-serif',
      h4: { fontWeight: 800, letterSpacing: '-0.025em' },
      h5: { fontWeight: 700, letterSpacing: '-0.02em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      button: { textTransform: 'none', fontWeight: 600 },
      body1: { fontSize: '0.9375rem' },
      body2: { fontSize: '0.875rem' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            padding: '8px 16px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: mode === 'dark' 
                ? '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)'
                : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.light} 100%)`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'dark'
              ? '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)'
              : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            border: `1px solid ${mode === 'dark' ? '#333333' : '#f3f4f6'}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'dark'
              ? '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            backgroundColor: mode === 'dark' ? '#2a2a2a' : '#f9fafb',
            color: mode === 'dark' ? '#ffffff' : '#4b5563',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#111827',
            boxShadow: mode === 'dark'
              ? '0 1px 3px 0 rgb(0 0 0 / 0.3)'
              : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            borderRight: `1px solid ${mode === 'dark' ? '#333333' : '#e5e7eb'}`,
          },
        },
      },
    },
  });
};

export const themes = {
  lightIndigo: createAppTheme('light', 'indigo'),
  lightBlue: createAppTheme('light', 'blue'),
  lightGreen: createAppTheme('light', 'green'),
  lightPurple: createAppTheme('light', 'purple'),
  darkIndigo: createAppTheme('dark', 'indigo'),
  darkBlue: createAppTheme('dark', 'blue'),
  darkGreen: createAppTheme('dark', 'green'),
  darkPurple: createAppTheme('dark', 'purple'),
};

export default themes.lightIndigo;
