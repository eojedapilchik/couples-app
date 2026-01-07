import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Home as HomeIcon,
  Style as CardsIcon,
  SendAndArchive as ProposalsIcon,
  Assessment as ReportsIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import CreditBadge from '../CreditBadge';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

export default function MobileLayout({
  children,
  title = 'Couple Cards',
  showNav = true,
}: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Inicio', icon: <HomeIcon />, path: '/' },
    { label: 'Cartas', icon: <CardsIcon />, path: '/cards' },
    { label: 'Retos', icon: <ProposalsIcon />, path: '/proposals' },
    { label: 'Stats', icon: <ReportsIcon />, path: '/reports' },
  ];

  const currentNavIndex = navItems.findIndex((item) => item.path === location.pathname);

  const handleNavChange = (_: unknown, newValue: number) => {
    navigate(navItems[newValue].path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const backgroundTheme = (() => {
    if (location.pathname.startsWith('/cards')) {
      return {
        top: '#fff1e8',
        mid: '#f7f1f0',
        bottom: '#f3f4f6',
        blob1: '#ffd9d9',
        blob2: '#ffe3c6',
      };
    }
    if (location.pathname.startsWith('/proposals')) {
      return {
        top: '#ffe4ee',
        mid: '#f6eef3',
        bottom: '#f3f4f6',
        blob1: '#ffcfe1',
        blob2: '#ffd9c2',
      };
    }
    if (location.pathname.startsWith('/reports')) {
      return {
        top: '#ffeef2',
        mid: '#f6f1f4',
        bottom: '#f2f5f7',
        blob1: '#ffd6e5',
        blob2: '#ffeac9',
      };
    }
    if (location.pathname.startsWith('/settings')) {
      return {
        top: '#fff0f6',
        mid: '#f7f1f4',
        bottom: '#f3f4f6',
        blob1: '#ffd6e5',
        blob2: '#ffeac9',
      };
    }
    return {
      top: '#ffe7f0',
      mid: '#f6f1f4',
      bottom: '#f3f4f6',
      blob1: '#ffd6e5',
      blob2: '#ffeac9',
    };
  })();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: `radial-gradient(circle at top, ${backgroundTheme.top} 0%, ${backgroundTheme.mid} 55%, ${backgroundTheme.bottom} 100%)`,
        '&::before, &::after': {
          content: '""',
          position: 'absolute',
          borderRadius: '999px',
          opacity: 0.35,
          zIndex: 0,
          pointerEvents: 'none',
        },
        '&::before': {
          width: { xs: 220, sm: 280 },
          height: { xs: 220, sm: 280 },
          background: backgroundTheme.blob1,
          top: { xs: -80, sm: -110 },
          right: { xs: '6vw', sm: '10vw' },
        },
        '&::after': {
          width: { xs: 260, sm: 360 },
          height: { xs: 260, sm: 360 },
          background: backgroundTheme.blob2,
          bottom: { xs: -90, sm: -130 },
          left: { xs: '6vw', sm: '8vw' },
        },
      }}
    >
      {/* App Bar */}
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          zIndex: 2,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
          overflow: 'hidden',
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {title}
          </Typography>
          {user && <CreditBadge />}
          {user && (
            <IconButton onClick={() => navigate('/settings')} size="small" sx={{ ml: 1 }}>
              <SettingsIcon />
            </IconButton>
          )}
          {user && (
            <IconButton onClick={handleLogout} size="small" sx={{ ml: 0.5 }}>
              <LogoutIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px', // AppBar height
          pb: showNav ? '70px' : 0, // BottomNav height
          position: 'relative',
          zIndex: 1,
          bgcolor: 'transparent',
          overflow: 'auto',
          // Custom scrollbar - positioned on far right of viewport
          '&::-webkit-scrollbar': {
            width: '10px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#F5F5F5',
            borderRadius: '0',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #A5B4FC 0%, #818CF8 100%)',
            borderRadius: '10px',
            border: '2px solid #F5F5F5',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(180deg, #818CF8 0%, #6366F1 100%)',
          },
          scrollbarWidth: 'thin',
          scrollbarColor: '#818CF8 #F5F5F5',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', md: '60%' },
            mx: 'auto', // Center the content
            px: { xs: 2, md: 3 },
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Bottom Navigation */}
      {showNav && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            bgcolor: 'rgba(255, 241, 248, 0.92)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(233, 30, 99, 0.12)',
          }}
          elevation={3}
        >
          <BottomNavigation
            value={currentNavIndex >= 0 ? currentNavIndex : 0}
            onChange={handleNavChange}
            showLabels
          >
            {navItems.map((item) => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
