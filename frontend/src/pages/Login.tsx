import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Favorite as HeartIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { users, login, isLoading: usersLoading } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    setPin('');
    setError(null);
  };

  const handleLogin = async () => {
    if (!selectedUserId || !pin) return;

    setIsLoading(true);
    setError(null);
    try {
      await login(selectedUserId, pin);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de login');
    } finally {
      setIsLoading(false);
    }
  };

  if (usersLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      {/* Logo */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <HeartIcon sx={{ fontSize: 64, color: 'primary.main', mb: 1 }} />
        <Typography variant="h4" fontWeight={700}>
          Couple Cards
        </Typography>
        <Typography color="text.secondary">Selecciona tu perfil</Typography>
      </Box>

      {/* User Selection */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        {users.map((user) => (
          <Card
            key={user.id}
            onClick={() => handleUserSelect(user.id)}
            sx={{
              cursor: 'pointer',
              bgcolor: selectedUserId === user.id ? 'primary.main' : 'background.paper',
              color: selectedUserId === user.id ? 'white' : 'text.primary',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center', px: 4, py: 3 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 1,
                  bgcolor: selectedUserId === user.id ? 'white' : 'primary.main',
                  color: selectedUserId === user.id ? 'primary.main' : 'white',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                {user.name.charAt(0)}
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                {user.name}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* PIN Entry */}
      {selectedUserId && (
        <Card sx={{ width: '100%', maxWidth: 320 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Introduce tu PIN
            </Typography>
            <TextField
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="****"
              fullWidth
              inputProps={{ maxLength: 10, style: { textAlign: 'center', fontSize: '1.5rem' } }}
              sx={{ mb: 2 }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleLogin}
              disabled={!pin || isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Entrar'}
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center', mt: 2 }}
            >
              PIN por defecto: 1234
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
