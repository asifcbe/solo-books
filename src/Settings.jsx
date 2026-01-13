import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, TextField, Button, Grid, 
  Divider, List, ListItem, ListItemText, IconButton, Alert, Avatar,
  FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import { Save, Plus, Trash2, Building2, Check } from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useThemeContext } from './ThemeContext';
import { useConfig } from './ConfigContext';
import { useData } from './DataContext';

const SettingsPage = () => {
  const { currentBusiness, businesses, switchBusiness, setCurrentBusinessId } = useBusiness();
  const { mode, primaryColor, updateTheme } = useThemeContext();
  const { config, reloadConfig } = useConfig();
  const { addItem, updateItem, deleteItem, getItems } = useData();
  const [formData, setFormData] = useState({
    name: '', gstNumber: '', address: '', phone: '', email: '', state: '',
    username: '', password: '', confirmPassword: ''
  });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [isNew, setIsNew] = useState(false);

  // Sync formData with currentBusiness when it changes, unless we are in "isNew" mode
  useEffect(() => {
    if (currentBusiness && !isNew) {
      setFormData({
        name: currentBusiness.name || '',
        gstNumber: currentBusiness.gstNumber || '',
        address: currentBusiness.address || '',
        phone: currentBusiness.phone || '',
        email: currentBusiness.email || '',
        state: currentBusiness.state || '',
        username: currentBusiness.username || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [currentBusiness, isNew]);

  const handleSaveListUpdate = async (e) => {
    e.preventDefault();
    
    if (isNew) {
      if (formData.password !== formData.confirmPassword) {
        setMsg({ type: 'error', text: 'Passwords do not match!' });
        return;
      }
      if (!formData.username || !formData.password) {
        setMsg({ type: 'error', text: 'Username and password are required!' });
        return;
      }
    }
    
    try {
      if (isNew) {
        const businessData = {
          name: formData.name,
          gstNumber: formData.gstNumber,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          state: formData.state,
          username: formData.username,
          password: formData.password
        };
        const id = await addItem('businesses', businessData);
        setCurrentBusinessId(id);
        setIsNew(false);
        setMsg({ type: 'success', text: 'New business created successfully!' });
      } else if (currentBusiness?.id) {
        const updateData = {
          name: formData.name,
          gstNumber: formData.gstNumber,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          state: formData.state
        };
        updateItem('businesses', currentBusiness.id, updateData);
        setMsg({ type: 'success', text: 'Business profile updated successfully!' });
      }
    } catch (err) {
      console.error("Save failed:", err);
      setMsg({ type: 'error', text: 'Failed to save: ' + err.message });
    }
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const deleteBusiness = async (id) => {
    const bizToDelete = businesses.find(b => b.id === id);
    if (!bizToDelete) return;

    if (businesses.length <= 1) {
      alert("You need at least one business at all times.");
      return;
    }
    
    const confirmDelete = window.confirm(
      `EXTREME CAUTION: Deleting "${bizToDelete.name}" will permanently remove ALL associated parties, items, and transactions.\n\nAre you absolutely sure?`
    );

    if (confirmDelete) {
      try {
        const otherBusiness = businesses.find(b => b.id !== id);
        
        // Delete all related data
        const parties = getItems('parties', { businessId: id });
        const items = getItems('items', { businessId: id });
        const transactions = getItems('transactions', { businessId: id });
        const opticals = getItems('opticals', { businessId: id });
        
        parties.forEach(party => deleteItem('parties', party.id));
        items.forEach(item => deleteItem('items', item.id));
        transactions.forEach(tx => deleteItem('transactions', tx.id));
        opticals.forEach(opt => deleteItem('opticals', opt.id));
        deleteItem('businesses', id);

        if (id === currentBusiness?.id && otherBusiness) {
          switchBusiness(otherBusiness.id);
        }
        
        setMsg({ type: 'success', text: 'Business and all its data deleted.' });
      } catch (err) {
        console.error("Deletion failed:", err);
        setMsg({ type: 'error', text: 'Deletion failed: ' + err.message });
      }
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', pb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Settings</Typography>
        <Button variant="outlined" onClick={reloadConfig}>Reload Config</Button>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Manage your business profiles and application preferences.</Typography>

      {msg.text && (
        <Alert severity={msg.type} variant="filled" sx={{ mb: 4, borderRadius: 2 }}>
          {msg.text}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card elevation={0}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
                <Avatar sx={{ bgcolor: isNew ? 'secondary.main' : 'primary.main', width: 40, height: 40 }}>
                  <Building2 size={24} color="white" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {isNew ? 'New Business Profile' : 'Edit Business Profile'}
                </Typography>
              </Box>
              
              <form onSubmit={handleSaveListUpdate}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Business Name"
                      placeholder="e.g. Acme Corp"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="GSTIN"
                      placeholder="Optional"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </Grid>
                  {isNew && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Username"
                          placeholder="Choose a username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Password"
                          type="password"
                          placeholder="Choose a password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirm Password"
                          type="password"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          required
                          error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                          helperText={formData.password !== formData.confirmPassword && formData.confirmPassword !== '' ? 'Passwords do not match' : ''}
                        />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    {isNew && (
                      <Button 
                        variant="outlined" 
                        fullWidth
                        onClick={() => setIsNew(false)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      variant="contained" 
                      fullWidth
                      size="large"
                      startIcon={<Save size={20} />}
                    >
                      {isNew ? 'Create Business' : 'Update Profile'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card elevation={0}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Multiple Businesses</Typography>
              <List disablePadding>
                {businesses.map((biz) => (
                  <Box key={biz.id} sx={{ mb: 2, border: '1px solid', borderColor: biz.id === currentBusiness?.id ? 'primary.main' : 'divider', borderRadius: 3, overflow: 'hidden' }}>
                    <ListItem 
                      sx={{ 
                        py: 2,
                        bgcolor: biz.id === currentBusiness?.id ? 'primary.50' : 'transparent',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ListItemText 
                        primary={biz.name} 
                        secondary={biz.gstNumber || 'No GSTIN'}
                        primaryTypographyProps={{ fontWeight: 600, color: biz.id === currentBusiness?.id ? 'primary.main' : 'text.primary' }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => {
                            setIsNew(false);
                            switchBusiness(biz.id);
                          }} 
                          disabled={biz.id === currentBusiness?.id}
                          title="Switch to this business"
                        >
                          {biz.id === currentBusiness?.id ? <Check size={18} /> : <Save size={18} />}
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => deleteBusiness(biz.id)}
                          title="Delete business"
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Box>
                    </ListItem>
                  </Box>
                ))}
              </List>
              <Button 
                variant="outlined"
                fullWidth
                sx={{ mt: 1, borderStyle: 'dashed', borderWidth: 2 }}
                startIcon={<Plus size={20} />}
                onClick={() => {
                  setFormData({ name: '', gstNumber: '', address: '', phone: '', email: '', state: '' });
                  setIsNew(true);
                }}
              >
                Add New Business
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Appearance</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Customize the look and feel of your application.</Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card elevation={0}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Theme Mode</Typography>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Mode</InputLabel>
                  <Select
                    value={mode}
                    label="Mode"
                    onChange={(e) => updateTheme(e.target.value, primaryColor)}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Primary Color</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {[
                    { value: 'indigo', label: 'Indigo', color: '#4f46e5' },
                    { value: 'blue', label: 'Blue', color: '#2563eb' },
                    { value: 'green', label: 'Green', color: '#059669' },
                    { value: 'purple', label: 'Purple', color: '#7c3aed' },
                  ].map((colorOption) => (
                    <Chip
                      key={colorOption.value}
                      label={colorOption.label}
                      onClick={() => updateTheme(mode, colorOption.value)}
                      sx={{
                        bgcolor: primaryColor === colorOption.value ? colorOption.color : 'transparent',
                        color: primaryColor === colorOption.value ? 'white' : 'text.primary',
                        border: `2px solid ${colorOption.color}`,
                        '&:hover': {
                          bgcolor: colorOption.color,
                          color: 'white',
                        },
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SettingsPage;
