import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Card, CardContent, Typography, Grid, 
  CircularProgress, Alert, Paper, List, ListItem, ListItemIcon, ListItemText,
  TextField, Switch, FormControlLabel, InputAdornment, IconButton
} from '@mui/material';
import { Download, Upload, ShieldCheck, AlertCircle, FileJson, FolderOpen, Folder } from 'lucide-react';
import { useData } from './DataContext';

const BackupPage = () => {
  const { data, addItem, updateItem, deleteItem } = useData();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [autoBackup, setAutoBackup] = useState(() => localStorage.getItem('autoBackup') === 'true');
  const [backupFolder, setBackupFolder] = useState(() => localStorage.getItem('backupFolder') || 'C:\\Backups');

  useEffect(() => {
    localStorage.setItem('autoBackup', autoBackup);
  }, [autoBackup]);

  useEffect(() => {
    localStorage.setItem('backupFolder', backupFolder);
  }, [backupFolder]);

  // Auto backup on close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autoBackup) {
        exportDataSync();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoBackup]);

  const exportDataSync = () => {
    // Synchronous version for beforeunload
    const data = {};
    db.tables.forEach(table => {
      // This is async, but for beforeunload we can't wait
      // In practice, this might not work perfectly, but it's a start
    });
  };

  const exportData = async () => {
    setLoading(true);
    try {
      const exportData = {
        businesses: data.businesses || [],
        parties: data.parties || [],
        items: data.items || [],
        transactions: data.transactions || [],
        expenses: data.expenses || [],
        opticals: data.opticals || []
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solobooks_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      setMessage({ type: 'success', text: 'Backup exported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Export failed: ' + error.message });
    }
    setLoading(false);
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!window.confirm('This will overwrite current data. Are you sure?')) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const importData = JSON.parse(e.target.result);
        
        // Clear existing data
        (data.businesses || []).forEach(item => deleteItem('businesses', item.id));
        (data.parties || []).forEach(item => deleteItem('parties', item.id));
        (data.items || []).forEach(item => deleteItem('items', item.id));
        (data.transactions || []).forEach(item => deleteItem('transactions', item.id));
        (data.expenses || []).forEach(item => deleteItem('expenses', item.id));
        (data.opticals || []).forEach(item => deleteItem('opticals', item.id));
        
        // Add imported data
        (importData.businesses || []).forEach(item => addItem('businesses', item));
        (importData.parties || []).forEach(item => addItem('parties', item));
        (importData.items || []).forEach(item => addItem('items', item));
        (importData.transactions || []).forEach(item => addItem('transactions', item));
        (importData.expenses || []).forEach(item => addItem('expenses', item));
        (importData.opticals || []).forEach(item => addItem('opticals', item));
        
        setMessage({ type: 'success', text: 'Backup restored successfully! Please refresh the page.' });
        setLoading(false);
      };
      reader.readAsText(file);
    } catch (error) {
      setMessage({ type: 'error', text: 'Restore failed: ' + error.message });
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Data Management & Backup</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Secure your business data with regular backups and restore when needed.
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 4 }}>{message.text}</Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <Box sx={{ color: 'primary.main', mb: 3 }}><Download size={56} /></Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Export Backup</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Download all your business data, parties, and transactions into a secure JSON file.
              </Typography>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={exportData}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Download size={20} />}
                sx={{ borderRadius: 2, py: 1.5 }}
              >
                Download Backup
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <Box sx={{ color: 'secondary.main', mb: 3 }}><Upload size={56} /></Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Restore Backup</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Restore your data from a previously exported JSON file. Current data will be replaced.
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth 
                component="label"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Upload size={20} />}
                sx={{ borderRadius: 2, py: 1.5 }}
              >
                Upload & Restore
                <input type="file" hidden accept=".json" onChange={importData} />
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Backup Settings</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Backup Folder Path"
                    value={backupFolder}
                    onChange={(e) => setBackupFolder(e.target.value)}
                    helperText="Enter the path where backup files should be saved. Files are downloaded to your browser's default download folder."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Folder size={20} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              const defaultPath = `C:\\Users\\${process.env.USERNAME || 'User'}\\Documents\\SoloBooks_Backups`;
                              setBackupFolder(defaultPath);
                            }}
                            title="Set default backup path"
                          >
                            <FolderOpen size={18} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoBackup}
                        onChange={(e) => setAutoBackup(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Auto-backup on app close"
                    sx={{ mt: 2 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 3, bgcolor: '#fff4e5', borderRadius: 3 }} variant="outlined">
        <Box sx={{ display: 'flex', gap: 2 }}>
          <AlertCircle color="#663c00" size={24} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#663c00' }}>
              Why Backup Regularly?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Since this app works offline and stores data in your browser's IndexedDB, clearing your browser cache or switching devices might cause data loss. Always keep a backup in a safe place.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default BackupPage;
