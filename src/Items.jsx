import React, { useState } from 'react';
import {
  Box, Button, Card, CardContent, Typography, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, MenuItem,
  InputAdornment, Chip, IconButton
} from '@mui/material';
import { Plus, Edit2, Trash2, Box as BoxIcon } from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useData } from './DataContext';
import DataGrid from './DataGrid';

const UNITES = ['NOS', 'BAGS', 'BOX', 'KGS', 'Ltr', 'Mtr', 'Pcs'];
const TAX_SLABS = [0, 5, 12, 18, 28];

const ItemsPage = () => {
  const { currentBusiness } = useBusiness();
  const { data, addItem, updateItem, deleteItem, getItems } = useData();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', unit: 'NOS', salePrice: 0, purchasePrice: 0,
    taxRate: 18, hsnCode: '', stock: 0
  });

  // Filter states for DataGrid
  const [filters, setFilters] = useState({});

  const items = getItems('items').filter(item => item.businessId === currentBusiness?.id);

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
    const itemData = { ...formData, businessId: currentBusiness.id };
    if (editingItem) {
      updateItem('items', editingItem.id, itemData);
    } else {
      addItem('items', itemData);
    }
    handleClose();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItem('items', id);
    }
  };

  // DataGrid columns configuration
  const columns = [
    {
      key: 'name',
      header: 'Item Name',
      width: 250,
      searchable: true,
      render: (value, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{row.unit}</Typography>
        </Box>
      )
    },
    {
      key: 'hsnCode',
      header: 'HSN Code',
      width: 120,
      searchable: true,
      render: (value) => value || '-'
    },
    {
      key: 'salePrice',
      header: 'Sale Price',
      width: 120,
      align: 'right',
      filterType: 'range',
      render: (value) => `₹${value?.toFixed(2) || '0.00'}`
    },
    {
      key: 'taxRate',
      header: 'Tax Rate',
      width: 100,
      align: 'right',
      filterType: 'select',
      filterOptions: TAX_SLABS.map(rate => ({ value: rate.toString(), label: `${rate}%` })),
      render: (value) => `${value || 0}%`
    },
    {
      key: 'stock',
      header: 'Stock',
      width: 120,
      align: 'right',
      filterType: 'range',
      render: (value, row) => (
        <Chip
          label={`${value || 0} ${row.unit}`}
          size="small"
          color={value > 10 ? 'success' : value > 0 ? 'warning' : 'error'}
        />
      )
    },
    {
      key: 'unit',
      header: 'Unit',
      width: 100,
      filterType: 'select',
      filterOptions: UNITES.map(unit => ({ value: unit, label: unit }))
    }
  ];

  const actions = (row) => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <IconButton size="small" color="primary" onClick={() => handleOpen(row)}>
        <Edit2 size={16} />
      </IconButton>
      <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
        <Trash2 size={16} />
      </IconButton>
    </Box>
  );

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

      <DataGrid
        data={items}
        columns={columns}
        title="Items / Inventory"
        searchPlaceholder="Search by name or HSN code..."
        enableSearch={true}
        enableFilters={true}
        enablePagination={true}
        enableSorting={true}
        pageSize={15}
        emptyMessage="No items found. Add your first inventory item."
        actions={actions}
        height={600}
      />

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
