import { createTheme } from '@mui/material/styles';

// Category colors from sample images
export const categoryColors = {
  calientes: {
    main: '#E91E63',      // Hot pink
    light: '#F48FB1',
    dark: '#C2185B',
    contrastText: '#FFFFFF',
  },
  romance: {
    main: '#1A1A2E',      // Deep navy blue (from sample)
    light: '#2D2D44',
    dark: '#0F0F1A',
    contrastText: '#FFFFFF',
  },
  risas: {
    main: '#FF9800',      // Orange
    light: '#FFB74D',
    dark: '#F57C00',
    contrastText: '#FFFFFF',
  },
  otras: {
    main: '#6B7280',      // Gray
    light: '#9CA3AF',
    dark: '#4B5563',
    contrastText: '#FFFFFF',
  },
};

// Get category color
export const getCategoryColor = (category: string) => {
  return categoryColors[category as keyof typeof categoryColors] || categoryColors.otras;
};

// MUI Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#E91E63',
      light: '#F48FB1',
      dark: '#C2185B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1C1C1E',
      light: '#3A3A3C',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(233, 30, 99, 0.4)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 70,
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          padding: '8px 12px',
          '&.Mui-selected': {
            color: '#E91E63',
          },
        },
      },
    },
  },
});

export default theme;
