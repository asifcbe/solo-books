import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, TextField, Button, Grid, 
  Divider, List, ListItem, ListItemText, IconButton, Alert, Avatar
} from '@mui/material';
import { Save, Plus, Trash2, Building2, Check } from 'lucide-react';
import { db } from './db';
import { useBusiness } from './BusinessContext';

const SettingsPage = () => {
  const { currentBusiness, businesses, switchBusiness, setCurrentBusinessId } = useBusiness();
  const [formData, setFormData] = useState({
    name: '', gstNumber: '', address: '', phone: '', email: '', state: ''
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
        state: currentBusiness.state || ''
      });
    }
  }, [currentBusiness, isNew]);

  const handleSaveListUpdate = async (e) => {
    e.preventDefault();
    try {
      if (isNew) {
        const id = await db.businesses.add(formData);
        setCurrentBusinessId(id);
        setIsNew(false);
        setMsg({ type: 'success', text: 'New business created successfully!' });
      } else if (currentBusiness?.id) {
        await db.businesses.update(currentBusiness.id, formData);
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
        
        await db.transaction('rw', [db.businesses, db.parties, db.items, db.transactions], async () => {
          await db.parties.where('businessId').equals(id).delete();
          await db.items.where('businessId').equals(id).delete();
          await db.transactions.where('businessId').equals(id).delete();
          await db.businesses.delete(id);
        });

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
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Settings</Typography>
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
    </Box>
  );
};

export default SettingsPage;
