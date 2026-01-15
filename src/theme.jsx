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
            padding: '10px 20px',
            boxShadow: 'none',
            borderRadius: 10,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: mode === 'dark' 
                ? '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)'
                : '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
            '&:active': {
              transform: 'translateY(0)',
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
            backgroundImage: 'none',
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
            borderRadius: 20,
            boxShadow: mode === 'dark'
              ? '0 4px 20px -5px rgb(0 0 0 / 0.5)'
              : '0 4px 20px -5px rgb(0 0 0 / 0.1)',
            border: `1px solid ${mode === 'dark' ? '#333333' : '#f1f5f9'}`,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              transition: 'all 0.2s ease-in-out',
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#ffffff',
              '& fieldset': {
                borderColor: mode === 'dark' ? '#444444' : '#e2e8f0',
              },
              '&:hover fieldset': {
                borderColor: palette.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderWidth: '1.5px',
                borderColor: palette.primary.main,
              },
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.9rem',
              color: mode === 'dark' ? '#a0aec0' : '#718096',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '16px',
            borderColor: mode === 'dark' ? '#333333' : '#f1f5f9',
          },
          head: {
            fontWeight: 700,
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: mode === 'dark' ? '#1a1a1a' : '#f8fafc',
            color: mode === 'dark' ? '#a0aec0' : '#64748b',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#111827',
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'dark' ? '#333333' : '#f1f5f9'}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
            borderRight: `1px solid ${mode === 'dark' ? '#333333' : '#f1f5f9'}`,
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 42,
            height: 26,
            padding: 0,
            '& .MuiSwitch-switchBase': {
              padding: 0,
              margin: 2,
              transitionDuration: '300ms',
              '&.Mui-checked': {
                transform: 'translateX(16px)',
                color: '#fff',
                '& + .MuiSwitch-track': {
                  backgroundColor: palette.primary.main,
                  opacity: 1,
                  border: 0,
                },
              },
            },
            '& .MuiSwitch-thumb': {
              boxSizing: 'border-box',
              width: 22,
              height: 22,
            },
            '& .MuiSwitch-track': {
              borderRadius: 26 / 2,
              backgroundColor: mode === 'dark' ? '#39393D' : '#E9E9EA',
              opacity: 1,
            },
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
