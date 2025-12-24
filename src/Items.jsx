import React, { useState } from 'react';
import { 
  Box, Button, Card, CardContent, Typography, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, 
  InputAdornment, Chip, MenuItem
} from '@mui/material';
import { Plus, Search, Edit2, Trash2, Box as BoxIcon, Tag } from 'lucide-react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBusiness } from './BusinessContext';

const UNITES = ['NOS', 'BAGS', 'BOX', 'KGS', 'Ltr', 'Mtr', 'Pcs'];
const TAX_SLABS = [0, 5, 12, 18, 28];

const ItemsPage = () => {
  const { currentBusiness } = useBusiness();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', unit: 'NOS', salePrice: 0, purchasePrice: 0, 
    taxRate: 18, hsnCode: '', stock: 0
  });

  const items = useLiveQuery(
    () => db.items
      .where('businessId').equals(currentBusiness?.id || 0)
      .toArray(),
    [currentBusiness]
  ) || [];

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.hsnCode.includes(search)
  );

  const handleOpen = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ 
        name: '', unit: 'NOS', salePrice: 0, purchasePrice: 0, 
        taxRate: 18, hsnCode: '', stock: 0 
      });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData, businessId: currentBusiness.id };
    if (editingItem) {
      await db.items.update(editingItem.id, data);
    } else {
      await db.items.add(data);
    }
    handleClose();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await db.items.delete(id);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Items / Inventory</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />} 
          onClick={() => handleOpen()}
        >
          Add Item
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name or HSN..."
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
                  <TableCell sx={{ fontWeight: 600 }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>HSN</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Sale Price</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Tax</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Stock</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.unit}</Typography>
                    </TableCell>
                    <TableCell>{item.hsnCode || '-'}</TableCell>
                    <TableCell align="right">₹{item.salePrice.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.taxRate}%</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${item.stock} ${item.unit}`} 
                        size="small"
                        color={item.stock > 10 ? 'success' : item.stock > 0 ? 'warning' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpen(item)} color="primary">
                        <Edit2 size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(item.id)} color="error">
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No items found</Typography>
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
          <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Item Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  {UNITES.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="HSN Code"
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sale Price"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Purchase Price"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Tax Rate (%)"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                >
                  {TAX_SLABS.map(s => <MenuItem key={s} value={s}>{s}%</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Opening Stock"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save Item</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ItemsPage;
