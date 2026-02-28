import { createTheme } from '@mui/material/styles';

const createAppTheme = (mode = 'light', primaryColor = 'indigo') => {
  const colorPalettes = {
    indigo: {
      primary: { main: '#4f46e5', light: '#818cf8', dark: '#3730a3' },
      secondary: { main: '#64748b' },
    },
    blue: {
      primary: { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8' },
      secondary: { main: '#64748b' },
    },
    green: {
      primary: { main: '#059669', light: '#34d399', dark: '#047857' },
      secondary: { main: '#64748b' },
    },
    purple: {
      primary: { main: '#7c3aed', light: '#a78bfa', dark: '#6d28d9' },
      secondary: { main: '#64748b' },
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
        default: mode === 'dark' ? '#0f0f0f' : '#f4f5f7',
        paper: mode === 'dark' ? '#1a1a1a' : '#ffffff',
      },
      success: { main: '#059669' },
      error: { main: '#dc2626' },
      warning: { main: '#d97706' },
      info: { main: '#0284c7' },
      text: {
        primary: mode === 'dark' ? '#fafafa' : '#1f2937',
        secondary: mode === 'dark' ? '#9ca3af' : '#6b7280',
      },
      divider: mode === 'dark' ? '#2d2d2d' : '#e5e7eb',
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
      fontSize: 13,
      h4: { fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.01em' },
      h5: { fontWeight: 600, fontSize: '1.125rem' },
      h6: { fontWeight: 600, fontSize: '1rem' },
      subtitle1: { fontSize: '0.8125rem', fontWeight: 500 },
      subtitle2: { fontSize: '0.75rem', fontWeight: 500 },
      body1: { fontSize: '0.8125rem' },
      body2: { fontSize: '0.75rem' },
      caption: { fontSize: '0.6875rem' },
      button: { textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
    },
    shape: { borderRadius: 6 },
    spacing: 8,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            padding: '6px 14px',
            minHeight: 32,
            boxShadow: 'none',
            borderRadius: 6,
            '&:hover': { boxShadow: 'none' },
          },
          sizeSmall: {
            padding: '4px 10px',
            minHeight: 28,
            fontSize: '0.75rem',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { padding: 6 },
          sizeSmall: { padding: 4 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 6,
            boxShadow: mode === 'dark' ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
            border: `1px solid ${mode === 'dark' ? '#2d2d2d' : '#e5e7eb'}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            boxShadow: 'none',
            border: `1px solid ${mode === 'dark' ? '#2d2d2d' : '#e5e7eb'}`,
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: 16, '&:last-child': { pb: 2 } },
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
              borderRadius: 6,
              fontSize: '0.8125rem',
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
              '& fieldset': { borderColor: mode === 'dark' ? '#374151' : '#e5e7eb' },
              '&:hover fieldset': { borderColor: mode === 'dark' ? '#4b5563' : '#d1d5db' },
              '&.Mui-focused fieldset': { borderWidth: 1, borderColor: palette.primary.main },
            },
            '& .MuiInputLabel-root': { fontSize: '0.8125rem' },
            '& .MuiInputBase-input': { py: '7px' },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '8px 12px',
            fontSize: '0.8125rem',
            borderColor: mode === 'dark' ? '#2d2d2d' : '#f3f4f6',
          },
          head: {
            fontWeight: 600,
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: mode === 'dark' ? '#111' : '#f9fafb',
            color: mode === 'dark' ? '#9ca3af' : '#6b7280',
            padding: '8px 12px',
            lineHeight: 1.3,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td': { borderBottom: 'none' },
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: { borderTop: `1px solid ${mode === 'dark' ? '#2d2d2d' : '#e5e7eb'}` },
          toolbar: { minHeight: 40 },
          selectLabel: { fontSize: '0.75rem' },
          displayedRows: { fontSize: '0.75rem' },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40 },
          indicator: { height: 2 },
          flexContainer: { gap: 0 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', minHeight: 40, py: 0 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { height: 22, fontSize: '0.6875rem', fontWeight: 600 },
          label: { px: 1 },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'dark' ? '#2d2d2d' : '#e5e7eb'}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${mode === 'dark' ? '#2d2d2d' : '#e5e7eb'}`,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 6 },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { fontSize: '1rem', fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${mode === 'dark' ? '#2d2d2d' : '#e5e7eb'}` },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { padding: 16 },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { padding: '8px 16px 12px' },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: { borderRadius: 4 },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: { minWidth: 36 },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: { fontSize: '0.8125rem' },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: { minHeight: '48px !important', paddingLeft: '12px', paddingRight: '12px' },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { fontSize: '0.8125rem', py: 0.5 },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { fontSize: '0.8125rem' },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: { width: 36, height: 22, padding: 0 },
          switchBase: { padding: 2 },
          thumb: { width: 18, height: 18 },
          track: { borderRadius: 11 },
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
