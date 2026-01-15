import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Alert
} from '@mui/material';
import { Plus, Save, Trash2, ShieldCheck } from 'lucide-react';
import { firestore } from './db';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const featureKeys = [
  'dashboard',
  'parties',
  'items',
  'sales',
  'purchases',
  'expenses',
  'opticals',
  'payments',
  'reports',
  'backup',
  'settings'
];

const Admin = () => {
  const { currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [form, setForm] = useState({
    email: '',
    allowed: true,
    isAdmin: false,
    businessType: 'general',
    multiBusiness: true,
    useIndexedDB: true,
    themePrimary: '#1976d2',
    themeSecondary: '#dc004e',
    features: featureKeys.reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    )
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const ref = collection(firestore, 'userConfig');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));
        setUsers(list);
      },
      (error) => {
        console.error('Error loading userConfig:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setSelectedEmail('');
    setForm({
      email: '',
      allowed: true,
      isAdmin: false,
      businessType: 'general',
      multiBusiness: true,
      useIndexedDB: true,
      themePrimary: '#1976d2',
      themeSecondary: '#dc004e',
      features: featureKeys.reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      )
    });
  };

  const loadUser = (user) => {
    const cfg = user.config || {};
    setSelectedEmail(user.email || user.id);
    setForm({
      email: user.email || user.id,
      allowed: user.allowed !== false,
      isAdmin: !!user.isAdmin,
      businessType: cfg.businessType || 'general',
      multiBusiness: cfg.multiBusiness !== false,
      useIndexedDB: cfg.useIndexedDB !== false,
      themePrimary: cfg.theme?.primaryColor || '#1976d2',
      themeSecondary: cfg.theme?.secondaryColor || '#dc004e',
      features: {
        ...featureKeys.reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        ),
        ...(cfg.features || {})
      }
    });
  };

  const handleSave = async () => {
    if (!form.email) {
      setMessage({ type: 'error', text: 'Email is required.' });
      return;
    }
    try {
      const id = form.email;
      const ref = doc(firestore, 'userConfig', id);
      await setDoc(
        ref,
        {
          email: form.email,
          allowed: form.allowed,
          isAdmin: form.isAdmin,
          config: {
            businessType: form.businessType,
            multiBusiness: form.multiBusiness,
            useIndexedDB: form.useIndexedDB,
            theme: {
              primaryColor: form.themePrimary,
              secondaryColor: form.themeSecondary
            },
            features: form.features
          }
        },
        { merge: true }
      );
      setMessage({ type: 'success', text: 'User configuration saved.' });
    } catch (err) {
      console.error('Failed to save user config:', err);
      setMessage({
        type: 'error',
        text: 'Failed to save: ' + (err.message || 'Unknown error')
      });
    }
  };

  const handleDelete = async (email) => {
    if (!window.confirm(`Remove access for ${email}?`)) return;
    try {
      await deleteDoc(doc(firestore, 'userConfig', email));
      if (selectedEmail === email) {
        resetForm();
      }
      setMessage({ type: 'success', text: 'User removed.' });
    } catch (err) {
      console.error('Failed to delete user config:', err);
      setMessage({
        type: 'error',
        text: 'Failed to delete: ' + (err.message || 'Unknown error')
      });
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Admin Access Required
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Only administrators can manage user access and configuration.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 6 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Admin Panel
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage which email IDs can access the app and their configuration.
          </Typography>
        </Box>
        <Chip
          icon={<ShieldCheck size={16} />}
          label={currentUser?.email || 'Admin'}
          color="primary"
          variant="outlined"
        />
      </Box>

      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={0}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Allowed Users
                </Typography>
                <Button
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={resetForm}
                >
                  New
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {users.map((u) => (
                  <Box
                    key={u.id}
                    sx={{
                      mb: 1.5,
                      p: 1.2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor:
                        selectedEmail === (u.email || u.id)
                          ? 'primary.main'
                          : 'divider',
                      bgcolor:
                        selectedEmail === (u.email || u.id)
                          ? 'primary.50'
                          : 'background.paper',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1
                    }}
                  >
                    <Box
                      sx={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => loadUser(u)}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          wordBreak: 'break-all'
                        }}
                      >
                        {u.email || u.id}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {u.allowed === false ? 'Blocked' : 'Allowed'}
                        {u.isAdmin ? ' • Admin' : ''}
                      </Typography>
                    </Box>
                    <Tooltip title="Remove user">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(u.email || u.id)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
                {users.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    No users configured yet.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={0}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                User Configuration
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.allowed}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            allowed: e.target.checked
                          }))
                        }
                      />
                    }
                    label="Allowed to Access App"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.isAdmin}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            isAdmin: e.target.checked
                          }))
                        }
                      />
                    }
                    label="Admin"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Business Type"
                    fullWidth
                    value={form.businessType}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        businessType: e.target.value
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.multiBusiness}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            multiBusiness: e.target.checked
                          }))
                        }
                      />
                    }
                    label="Allow Multiple Businesses"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.useIndexedDB}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            useIndexedDB: e.target.checked
                          }))
                        }
                      />
                    }
                    label="Use IndexedDB Storage"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Primary Color"
                    fullWidth
                    value={form.themePrimary}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        themePrimary: e.target.value
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Secondary Color"
                    fullWidth
                    value={form.themeSecondary}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        themeSecondary: e.target.value
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    Enabled Features
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {featureKeys.map((key) => (
                      <Chip
                        key={key}
                        label={key}
                        clickable
                        color={form.features[key] ? 'primary' : 'default'}
                        variant={
                          form.features[key] ? 'filled' : 'outlined'
                        }
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            features: {
                              ...f.features,
                              [key]: !f.features[key]
                            }
                          }))
                        }
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      justifyContent: 'flex-end'
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Save size={18} />}
                      onClick={handleSave}
                    >
                      Save Configuration
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Admin;

