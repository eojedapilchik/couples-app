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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed" color="default" elevation={0}>
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
          px: 2,
          bgcolor: 'background.default',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>

      {/* Bottom Navigation */}
      {showNav && (
        <Paper
          sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
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
