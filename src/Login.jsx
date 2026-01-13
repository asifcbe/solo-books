import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  Alert, Container
} from '@mui/material';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';

const Login = () => {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        // Full viewport centering
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // Modern soft background gradient
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        p: 3
      }}
    >
      <Container maxWidth="xs">
        <Card 
          sx={{ 
            borderRadius: 4, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: '1px solid rgba(255,255,255,0.3)',
            overflow: 'visible'
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box 
                sx={{ 
                  width: 60, height: 60, bgcolor: 'primary.main', 
                  borderRadius: 3, display: 'inline-flex', 
                  alignItems: 'center', justifyContent: 'center',
                  mb: 2, color: 'white', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                }}
              >
                <ShieldCheck size={32} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1A1C1E', mb: 0.5 }}>
                Solo Books
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Management Terminal Login
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={handleGoogleSignIn}
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ 
                  py: 1.8, 
                  px: 4,
                  borderRadius: 2, 
                  fontWeight: 700, 
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  backgroundColor: '#4285f4',
                  '&:hover': {
                    backgroundColor: '#3367d6'
                  }
                }}
                startIcon={
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                }
              >
                {loading ? 'Signing In...' : 'Sign In with Google'}
              </Button>
            </Box>

            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #eee', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.disabled', letterSpacing: 0.5 }}>
                SECURE AUTHENTICATION REQUIRED
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;