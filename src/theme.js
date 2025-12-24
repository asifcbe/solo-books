import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#4f46e5', // Elegant Indigo
            light: '#818cf8',
            dark: '#3730a3',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#ec4899', // Sophisticated Pink/Magenta
        },
        background: {
            default: '#f9fafb',
            paper: '#ffffff',
        },
        success: {
            main: '#10b981',
        },
        error: {
            main: '#ef4444',
        },
        warning: {
            main: '#f59e0b',
        },
        text: {
            primary: '#111827',
            secondary: '#4b5563',
        },
    },
    typography: {
        fontFamily: '"Outfit", "Inter", "system-ui", sans-serif',
        h5: {
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        h6: {
            fontWeight: 600,
            letterSpacing: '-0.01em',
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
        body1: {
            fontSize: '0.9375rem',
        },
        body2: {
            fontSize: '0.875rem',
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    padding: '8px 16px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                    border: '1px solid #f3f4f6',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 600,
                    backgroundColor: '#f9fafb',
                    color: '#4b5563',
                },
            },
        },
    },
});

export default theme;
