import React, { useState } from 'react';
import {
  Box, Button, Typography, TextField, Grid, IconButton, InputAdornment,InputBase,
  Stack, Paper, Divider, Container, alpha, Autocomplete, Alert, Snackbar, MenuItem
} from '@mui/material';
import { 
  Save, Edit2, Trash2, ChevronLeft, 
  Eye, Info, Plus, Calendar, User, Printer, Phone, Share2
} from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useData } from './DataContext';
import DataGrid from './DataGrid';
import { useReactToPrint } from 'react-to-print';
import OpticalTemplate from './OpticalTemplate';
import { useRef } from 'react';

// --- Elegant Styled Components ---

const ReadingField = ({ label, value, onChange, unit, color }) => (
  <Box sx={{ flex: 1, textAlign: 'center', minWidth: '65px' }}>
    <Typography variant="caption" sx={{ 
      color: 'text.secondary', 
      fontWeight: 700, 
      fontSize: '0.65rem', 
      textTransform: 'uppercase',
      letterSpacing: 1,
      mb: 1,
      display: 'block',
      opacity: 0.8
    }}>
      {label}
    </Typography>
    <Box sx={{ 
      position: 'relative',
      bgcolor: alpha(color, 0.05),
      borderRadius: 1.5,
      border: '1px solid',
      borderColor: alpha(color, 0.1),
      transition: 'all 0.2s',
      '&:focus-within': {
        borderColor: color,
        bgcolor: alpha(color, 0.08),
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 12px ${alpha(color, 0.15)}`
      },
      p: '4px 8px'
    }}>
      <InputBase
        fullWidth
        value={value}
        onChange={onChange}
        placeholder="0.00"
        sx={{
          fontSize: '1rem',
          fontWeight: 700,
          color: color,
          '& input': { textAlign: 'center', p: 0 }
        }}
      />
      <Typography sx={{ 
        position: 'absolute', 
        right: 4, 
        bottom: 2, 
        fontSize: '0.6rem', 
        color: alpha(color, 0.5), 
        fontWeight: 800 
      }}>
        {unit}
      </Typography>
    </Box>
  </Box>
);


const OpticalsPage = () => {
  const { currentBusiness } = useBusiness();
  const { getItems, addItem, updateItem, deleteItem } = useData();
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [printingData, setPrintingData] = useState(null);
  const [paperSize, setPaperSize] = useState('A4');
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleShare = (row) => {
    const text = `*Optical Prescription from ${currentBusiness?.name || 'Solo Books'}*\n\n` +
      `Patient: ${row.patientName}\n` +
      `Date: ${row.date}\n` +
      `R (OD): ${row.rightEye.sphere || '0'} / ${row.rightEye.cylinder || '0'} x ${row.rightEye.axis || '0'}°\n` +
      `L (OS): ${row.leftEye.sphere || '0'} / ${row.leftEye.cylinder || '0'} x ${row.leftEye.axis || '0'}°\n\n` +
      `Shared via Solo Books`;
    
    if (navigator.share) {
      navigator.share({ title: `Prescription for ${row.patientName}`, text }).catch(e => console.error(e));
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };
  
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

  const readings = getItems('opticals').filter(o => o.businessId === currentBusiness?.id);
  const parties = getItems('parties').filter(p => p.businessId === currentBusiness?.id && p.type === 'Customer');

  const handleEyeDataChange = (eyeKey, field, value) => {
    setFormData(prev => ({ ...prev, [eyeKey]: { ...prev[eyeKey], [field]: value } }));
  };

  const showSnackbar = (message, severity = 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSave = async () => {
    // Validate business
    if (!currentBusiness?.id) {
      showSnackbar('Business not selected. Please refresh and try again.', 'error');
      return;
    }

    // Validate required fields
    if (!formData.patientName || formData.patientName.trim() === '') {
      showSnackbar('Please enter a patient name', 'warning');
      return;
    }

    if (!formData.date) {
      showSnackbar('Please select a date', 'warning');
      return;
    }

    try {
      const dataToSave = { 
        ...formData, 
        businessId: currentBusiness.id,
        patientName: formData.patientName.trim(),
        date: formData.date,
        updatedAt: new Date().toISOString()
      };
      
      let saved;
      if (editId) {
        saved = await updateItem('opticals', editId, dataToSave);
      } else {
        saved = await addItem('opticals', { 
          ...dataToSave, 
          createdAt: new Date().toISOString() 
        });
      }
      
      if (!saved) {
        // Check if optical was actually saved despite return value
        const savedOptical = getItems('opticals').find(o => 
          o.patientName === dataToSave.patientName && 
          o.date === dataToSave.date &&
          o.businessId === dataToSave.businessId &&
          (!editId || o.id === editId)
        );
        
        if (!savedOptical) {
          showSnackbar('Failed to save optical record. Please check your connection and try again.', 'error');
          return;
        }
      }
      
      showSnackbar(editId ? 'Prescription updated successfully!' : 'Examination saved successfully!', 'success');
      setView('list');
      setEditId(null);
      setFormData({
        patientName: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        rightEye: { sphere: '', cylinder: '', axis: '', add: '', va: '' },
        leftEye: { sphere: '', cylinder: '', axis: '', add: '', va: '' },
        frameType: '',
        lensType: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error saving optical record:', error);
      showSnackbar('An error occurred while saving. Please try again.', 'error');
    }
  };

  if (view === 'create' || view === 'edit') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 2, md: 4 } }}>
        <div style={{ display: 'none' }}>
          <OpticalTemplate ref={printRef} data={formData} business={currentBusiness} paperSize={paperSize} />
        </div>
        <Container maxWidth="lg">
          
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Stack direction="row" spacing={2}>
              <IconButton 
                onClick={() => { setView('list'); setEditId(null); }} 
                sx={{ 
                  bgcolor: 'background.paper', 
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ChevronLeft size={20} />
              </IconButton>
              <TextField
                select
                size="small"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                sx={{ minWidth: 100, bgcolor: 'background.paper' }}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="A4">A4</MenuItem>
                <MenuItem value="A5">A5</MenuItem>
                <MenuItem value="Letter">Letter</MenuItem>
                <MenuItem value="Legal">Legal</MenuItem>
              </TextField>
              <Button 
                startIcon={<Printer size={18} />}
                onClick={() => handlePrint()}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Print
              </Button>
              <Button 
                startIcon={<Share2 size={18} />}
                onClick={() => handleShare(formData)}
                variant="outlined"
                sx={{ borderRadius: 2, color: '#25D366', borderColor: '#25D366', '&:hover': { borderColor: '#128C7E', bgcolor: 'rgba(37, 211, 102, 0.04)' } }}
              >
                Share
              </Button>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {editId ? 'Edit Prescription' : 'New Examination'}
            </Typography>
            <Button 
              variant="contained" 
              size="medium"
              disableElevation
              startIcon={<Save size={18} />}
              onClick={handleSave}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Save
            </Button>
          </Stack>

          <Stack spacing={3}>
            {/* Patient Card */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                Patient Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    freeSolo
                    options={parties.map((option) => option.name)}
                    fullWidth
                    value={formData.patientName}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({ ...prev, patientName: newValue || '' }));
                    }}
                    onInputChange={(event, newInputValue) => {
                      setFormData(prev => ({ ...prev, patientName: newInputValue }));
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Patient Name" 
                        required
                        InputProps={{ 
                          ...params.InputProps,
                          startAdornment: <User size={18} style={{ marginRight: 8, color: 'rgba(0,0,0,0.54)' }} />
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Phone Number"
                    variant="outlined"
                    value={formData.phone}
                    placeholder="Enter patient phone"
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone size={18} color="rgba(0,0,0,0.54)" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    type="date" 
                    label="Examination Date"
                    variant="outlined"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Calendar size={18} color="rgba(0,0,0,0.54)" />
                        </InputAdornment>
                      )
                    }}
                    required
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* The Refraction Bridge - Grid Alignment */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ p: 1.5, bgcolor: 'primary.main', display: 'flex', justifyContent: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 1.5, color: 'white' }}>
                  REFRACTION DATA
                </Typography>
              </Box>
              
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Right Eye Section */}
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        bgcolor: alpha('#1976d2', 0.05), 
                        borderRadius: 2, 
                        border: '2px solid', 
                        borderColor: alpha('#1976d2', 0.2) 
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1976d2', mb: 2 }}>
                        Right Eye (OD)
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={6} sm={4} md={2.4}>
                          <ReadingField label="Sphere" unit="D" color="#1976d2" value={formData.rightEye.sphere} onChange={(e) => handleEyeDataChange('rightEye', 'sphere', e.target.value)} />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <ReadingField label="Cylinder" unit="D" color="#1976d2" value={formData.rightEye.cylinder} onChange={(e) => handleEyeDataChange('rightEye', 'cylinder', e.target.value)} />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <ReadingField label="Axis" unit="°" color="#1976d2" value={formData.rightEye.axis} onChange={(e) => handleEyeDataChange('rightEye', 'axis', e.target.value)} />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <ReadingField label="Add" unit="D" color="#1976d2" value={formData.rightEye.add} onChange={(e) => handleEyeDataChange('rightEye', 'add', e.target.value)} />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <ReadingField label="VA" unit="" color="#1976d2" value={formData.rightEye.va} onChange={(e) => handleEyeDataChange('rightEye', 'va', e.target.value)} />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Left Eye Section */}
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        bgcolor: alpha('#dc004e', 0.05), 
                        borderRadius: 2, 
                        border: '2px solid', 
                        borderColor: alpha('#dc004e', 0.2) 
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#dc004e', mb: 2 }}>
                        Left Eye (OS)
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={6} sm={4} md={2.4}>
                          <ReadingField label="Sphere" unit="D" color="#dc004e" value={formData.leftEye.sphere} onChange={(e) => handleEyeDataChange('leftEye', 'sphere', e.target.value)} />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <ReadingField label="Cylinder" unit="D" color="#dc004e" value={formData.leftEye.cylinder} onChange={(e) => handleEyeDataChange('leftEye', 'cylinder', e.target.value)} />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <ReadingField label="Axis" unit="°" color="#dc004e" value={formData.leftEye.axis} onChange={(e) => handleEyeDataChange('leftEye', 'axis', e.target.value)} />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <ReadingField label="Add" unit="D" color="#dc004e" value={formData.leftEye.add} onChange={(e) => handleEyeDataChange('leftEye', 'add', e.target.value)} />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <ReadingField label="VA" unit="" color="#dc004e" value={formData.leftEye.va} onChange={(e) => handleEyeDataChange('leftEye', 'va', e.target.value)} />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* Notes & Specs */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Plus size={18} /> Product Recommendations
                  </Typography>
                  <Stack spacing={2}>
                    <TextField 
                      fullWidth 
                      label="Frame Type" 
                      value={formData.frameType} 
                      onChange={(e) => setFormData({...formData, frameType: e.target.value})} 
                      placeholder="e.g., Full Frame, Half Frame"
                    />
                    <TextField 
                      fullWidth 
                      label="Lens Type" 
                      value={formData.lensType} 
                      onChange={(e) => setFormData({...formData, lensType: e.target.value})} 
                      placeholder="e.g., Progressive, Bifocal"
                    />
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info size={18} /> Clinical Notes
                  </Typography>
                  <TextField 
                    fullWidth 
                    multiline 
                    rows={4} 
                    placeholder="Additional observations, recommendations, or notes..." 
                    value={formData.notes} 
                    onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  />
                </Paper>
              </Grid>
            </Grid>
          </Stack>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setSnackbar({ ...snackbar, open: false })} 
              severity={snackbar.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1100, mx: 'auto' }}>
      <div style={{ display: 'none' }}>
        <OpticalTemplate ref={printRef} data={printingData} business={currentBusiness} paperSize={paperSize} />
      </div>
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
          { key: 'patientName', header: 'Patient', width: 200, render: (v) => <Typography sx={{ fontWeight: 600 }}>{v}</Typography> },
          { key: 'phone', header: 'Phone', width: 150 },
          { key: 'rightEye', header: 'R (OD)', width: 200, render: (v) => `${v.sphere || '0'} / ${v.cylinder || '0'} x ${v.axis || '0'}°` },
          { key: 'leftEye', header: 'L (OS)', width: 200, render: (v) => `${v.sphere || '0'} / ${v.cylinder || '0'} x ${v.axis || '0'}°` },
        ]} 
        actions={(row) => (
          <Stack direction="row" spacing={1}>
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => {
                setPrintingData(row);
                setTimeout(() => handlePrint(), 100);
              }}
              title="Print"
            >
              <Printer size={18} />
            </IconButton>
            <IconButton 
              size="small" 
              sx={{ color: '#25D366' }}
              onClick={() => handleShare(row)}
              title="Share on WhatsApp"
            >
              <Share2 size={18} />
            </IconButton>
            <IconButton size="small" onClick={() => { setEditId(row.id); setFormData(row); setView('edit'); }}><Edit2 size={18} /></IconButton>
            <IconButton size="small" color="error" onClick={() => deleteItem('opticals', row.id)}><Trash2 size={18} /></IconButton>
          </Stack>
        )}
      />
    </Box>
  );
};

export default OpticalsPage;