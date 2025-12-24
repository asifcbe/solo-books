import React, { useState } from 'react';
import { 
  Box, Button, Card, CardContent, Typography, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, 
  Tabs, Tab, Chip, InputAdornment
} from '@mui/material';
import { Plus, Search, Edit2, Trash2, Phone, MapPin, Calculator } from 'lucide-react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBusiness } from './BusinessContext';

const PartiesPage = () => {
  const { currentBusiness } = useBusiness();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [formData, setFormData] = useState({
    name: '', type: 'Customer', phone: '', gstNumber: '', address: '', balance: 0
  });

  const parties = useLiveQuery(
    () => db.parties
      .where('businessId').equals(currentBusiness?.id || 0)
      .toArray(),
    [currentBusiness]
  ) || [];

  const filteredParties = parties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.phone.includes(search);
    const matchesTab = tab === 0 ? p.type === 'Customer' : p.type === 'Vendor';
    return matchesSearch && matchesTab;
  });

  const handleOpen = (party = null) => {
    if (party) {
      setEditingParty(party);
      setFormData(party);
    } else {
      setEditingParty(null);
      setFormData({ name: '', type: tab === 0 ? 'Customer' : 'Vendor', phone: '', gstNumber: '', address: '', balance: 0 });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData, businessId: currentBusiness.id };
    if (editingParty) {
      await db.parties.update(editingParty.id, data);
    } else {
      await db.parties.add(data);
    }
    handleClose();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this party?')) {
      await db.parties.delete(id);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Parties</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />} 
          onClick={() => handleOpen()}
        >
          Add Party
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            <Tab label="Customers" />
            <Tab label="Vendors" />
          </Tabs>
        </Box>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>GSTIN</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Balance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredParties.map((party) => (
                  <TableRow key={party.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{party.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{party.address}</Typography>
                    </TableCell>
                    <TableCell>{party.phone}</TableCell>
                    <TableCell>{party.gstNumber || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`₹${Math.abs(party.balance).toFixed(2)}`} 
                        size="small"
                        color={party.balance >= 0 ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpen(party)} color="primary">
                        <Edit2 size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(party.id)} color="error">
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredParties.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No parties found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingParty ? 'Edit Party' : 'Add New Party'}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Party Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="GSTIN (Optional)"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Opening Balance"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  helperText="Negative for you owe them, positive for they owe you"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save Party</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default PartiesPage;
