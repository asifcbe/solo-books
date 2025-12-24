import React, { useState } from 'react';
import { 
  Box, Button, Card, CardContent, Typography, Grid, 
  CircularProgress, Alert, Paper, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { Download, Upload, ShieldCheck, AlertCircle, FileJson } from 'lucide-react';
import { db } from './db';

const BackupPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const exportData = async () => {
    setLoading(true);
    try {
      const data = {};
      for (const table of db.tables) {
        data[table.name] = await table.toArray();
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
        const data = JSON.parse(e.target.result);
        
        await db.transaction('rw', db.tables, async () => {
          for (const table of db.tables) {
            if (data[table.name]) {
              await table.clear();
              await table.bulkAdd(data[table.name]);
            }
          }
        });
        
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
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 4 }}>Data Management & Backup</Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 4 }}>{message.text}</Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ color: 'primary.main', mb: 2 }}><Download size={48} /></Box>
              <Typography variant="h6" gutterBottom>Export Backup</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Download all your business data, parties, and transactions into a secure JSON file.
              </Typography>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={exportData}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Download size={18} />}
              >
                Download Backup
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ color: 'secondary.main', mb: 2 }}><Upload size={48} /></Box>
              <Typography variant="h6" gutterBottom>Restore Backup</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Restore your data from a previously exported JSON file. Current data will be replaced.
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth 
                component="label"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Upload size={18} />}
              >
                Upload & Restore
                <input type="file" hidden accept=".json" onChange={importData} />
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 3, bgcolor: '#fff4e5' }} variant="outlined">
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
