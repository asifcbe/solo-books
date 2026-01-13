import React, { useState } from 'react';
import {
  Box, Button, Typography, TextField, Grid, IconButton, 
  Stack, Paper, Divider, Container, alpha
} from '@mui/material';
import { 
  Save, Edit2, Trash2, ChevronLeft, 
  Eye, Info, Plus, Calendar, User
} from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useData } from './DataContext';
import DataGrid from './DataGrid';

// --- Elegant Styled Components ---

const ReadingField = ({ label, value, onChange, unit, color }) => (
  <Box sx={{ flex: 1, textAlign: 'center' }}>
    <Typography variant="caption" sx={{ 
      color: 'text.secondary', 
      fontWeight: 600, 
      fontSize: '0.65rem', 
      textTransform: 'uppercase',
      letterSpacing: 1,
      mb: 1,
      display: 'block'
    }}>
      {label}
    </Typography>
    <TextField
      variant="standard"
      value={value}
      onChange={onChange}
      placeholder="0.00"
      InputProps={{
        disableUnderline: true,
        endAdornment: <Typography sx={{ fontSize: '0.7rem', ml: 0.5, color: alpha(color, 0.5), fontWeight: 700 }}>{unit}</Typography>,
        sx: {
          fontSize: '1.4rem',
          fontWeight: 500,
          fontFamily: '"Inter", sans-serif',
          color: color,
          '& input': { textAlign: 'center', p: 0.5 }
        }
      }}
      sx={{
        bgcolor: alpha(color, 0.03),
        borderRadius: 2,
        transition: 'all 0.2s',
        '&:hover': { bgcolor: alpha(color, 0.06) },
        '& .MuiInputBase-root': { px: 1 }
      }}
    />
  </Box>
);

const OpticalsPage = () => {
  const { currentBusiness } = useBusiness();
  const { getItems, addItem, updateItem, deleteItem } = useData();
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    rightEye: { sphere: '', cylinder: '', axis: '', add: '', va: '' },
    leftEye: { sphere: '', cylinder: '', axis: '', add: '', va: '' },
    frameType: '',
    lensType: '',
    notes: ''
  });

  const readings = getItems('opticals', { businessId: currentBusiness?.id || 0 });

  const handleEyeDataChange = (eyeKey, field, value) => {
    setFormData(prev => ({ ...prev, [eyeKey]: { ...prev[eyeKey], [field]: value } }));
  };

  const handleSave = async () => {
    const dataToSave = { ...formData, businessId: currentBusiness?.id || 0, updatedAt: new Date() };
    if (editId) updateItem('opticals', editId, dataToSave);
    else addItem('opticals', { ...dataToSave, createdAt: new Date() });
    setView('list');
  };

  if (view === 'create' || view === 'edit') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F8F9FB', p: { xs: 2, md: 6 } }}>
        <Container maxWidth="md">
          
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <IconButton onClick={() => setView('list')} sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <ChevronLeft size={20} />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1C1E' }}>
              {editId ? 'Edit Prescription' : 'New Examination'}
            </Typography>
            <Button 
              variant="contained" 
              disableElevation
              startIcon={<Save size={18} />}
              onClick={handleSave}
              sx={{ bgcolor: '#1A1C1E', borderRadius: 2, px: 3, '&:hover': { bgcolor: '#000' } }}
            >
              Save
            </Button>
          </Stack>

          <Stack spacing={3}>
            {/* Patient Card */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E8EAED' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <User size={18} color="#9AA0A6" />
                    <TextField 
                      fullWidth variant="standard" label="Patient Name"
                      value={formData.patientName}
                      onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                      InputProps={{ sx: { fontWeight: 600 } }}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Calendar size={18} color="#9AA0A6" />
                    <TextField 
                      fullWidth variant="standard" type="date" label="Examination Date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* The Refraction Bridge - Both eyes in one elegant container */}
            <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #E8EAED', overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: '#F1F3F4', display: 'flex', justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 2, color: '#5F6368' }}>REFRACTION DATA</Typography>
              </Box>
              
              <Box sx={{ p: 4 }}>
                {/* Right Eye Row */}
                <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 5 }}>
                  <Typography sx={{ minWidth: 60, fontWeight: 900, color: '#1967D2', fontSize: '0.8rem' }}>R (OD)</Typography>
                  <ReadingField label="Sphere" unit="D" color="#1967D2" value={formData.rightEye.sphere} onChange={(e) => handleEyeDataChange('rightEye', 'sphere', e.target.value)} />
                  <ReadingField label="Cylinder" unit="D" color="#1967D2" value={formData.rightEye.cylinder} onChange={(e) => handleEyeDataChange('rightEye', 'cylinder', e.target.value)} />
                  <ReadingField label="Axis" unit="°" color="#1967D2" value={formData.rightEye.axis} onChange={(e) => handleEyeDataChange('rightEye', 'axis', e.target.value)} />
                  <ReadingField label="Add" unit="D" color="#1967D2" value={formData.rightEye.add} onChange={(e) => handleEyeDataChange('rightEye', 'add', e.target.value)} />
                  <ReadingField label="VA" unit="" color="#1967D2" value={formData.rightEye.va} onChange={(e) => handleEyeDataChange('rightEye', 'va', e.target.value)} />
                </Stack>

                <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

                {/* Left Eye Row */}
                <Stack direction="row" alignItems="center" spacing={3} sx={{ mt: 5 }}>
                  <Typography sx={{ minWidth: 60, fontWeight: 900, color: '#D93025', fontSize: '0.8rem' }}>L (OS)</Typography>
                  <ReadingField label="Sphere" unit="D" color="#D93025" value={formData.leftEye.sphere} onChange={(e) => handleEyeDataChange('leftEye', 'sphere', e.target.value)} />
                  <ReadingField label="Cylinder" unit="D" color="#D93025" value={formData.leftEye.cylinder} onChange={(e) => handleEyeDataChange('leftEye', 'cylinder', e.target.value)} />
                  <ReadingField label="Axis" unit="°" color="#D93025" value={formData.leftEye.axis} onChange={(e) => handleEyeDataChange('leftEye', 'axis', e.target.value)} />
                  <ReadingField label="Add" unit="D" color="#D93025" value={formData.leftEye.add} onChange={(e) => handleEyeDataChange('leftEye', 'add', e.target.value)} />
                  <ReadingField label="VA" unit="" color="#D93025" value={formData.leftEye.va} onChange={(e) => handleEyeDataChange('leftEye', 'va', e.target.value)} />
                </Stack>
              </Box>
            </Paper>

            {/* Notes & Specs */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E8EAED', height: '100%' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Plus size={16} /> Product Recommendations
                  </Typography>
                  <Stack spacing={2}>
                    <TextField fullWidth size="small" label="Frame" value={formData.frameType} onChange={(e) => setFormData({...formData, frameType: e.target.value})} />
                    <TextField fullWidth size="small" label="Lenses" value={formData.lensType} onChange={(e) => setFormData({...formData, lensType: e.target.value})} />
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E8EAED' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info size={16} /> Clinical Notes
                  </Typography>
                  <TextField fullWidth multiline rows={3} placeholder="Additional observations..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Optical Records</Typography>
        <Button 
          variant="contained" 
          disableElevation
          startIcon={<Plus />} 
          onClick={() => { setEditId(null); setView('create'); }}
          sx={{ bgcolor: '#1A1C1E', borderRadius: 2, px: 3 }}
        >
          New Exam
        </Button>
      </Stack>

      <DataGrid 
        data={readings} 
        columns={[
          { key: 'date', header: 'Date', width: 120 },
          { key: 'patientName', header: 'Patient', width: 250, render: (v) => <Typography sx={{ fontWeight: 600 }}>{v}</Typography> },
          { key: 'rightEye', header: 'R (OD)', width: 200, render: (v) => `${v.sphere || '0'} / ${v.cylinder || '0'} x ${v.axis || '0'}°` },
          { key: 'leftEye', header: 'L (OS)', width: 200, render: (v) => `${v.sphere || '0'} / ${v.cylinder || '0'} x ${v.axis || '0'}°` },
        ]} 
        actions={(row) => (
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={() => { setEditId(row.id); setFormData(row); setView('edit'); }}><Edit2 size={18} /></IconButton>
            <IconButton size="small" color="error" onClick={() => deleteItem('opticals', row.id)}><Trash2 size={18} /></IconButton>
          </Stack>
        )}
      />
    </Box>
  );
};

export default OpticalsPage;