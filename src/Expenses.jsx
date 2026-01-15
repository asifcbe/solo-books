import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Card, CardContent, Typography, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, 
  InputAdornment, Chip, MenuItem, TablePagination
} from '@mui/material';
import { Plus, Search, Edit2, Trash2, DollarSign } from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useData } from './DataContext';

const EXPENSE_CATEGORIES = ['Office Supplies', 'Travel', 'Utilities', 'Rent', 'Marketing', 'Equipment', 'Miscellaneous'];

const ExpensesPage = () => {
  const { currentBusiness } = useBusiness();
  const { data, addItem, updateItem, deleteItem, getItems } = useData();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Miscellaneous', amount: 0, date: new Date().toISOString().split('T')[0], description: ''
  });

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: 'all',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date', // date, amount, category
    sortOrder: 'desc' // asc, desc
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const expenses = getItems('expenses')
    .filter(e => e.businessId === currentBusiness?.id)
    .reverse();

  const filteredExpenses = expenses
    .filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) || 
                            e.category.toLowerCase().includes(search.toLowerCase());
      
      // Additional filters
      const matchesDateFrom = !filters.dateFrom || new Date(e.date) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || new Date(e.date) <= new Date(filters.dateTo);
      const matchesCategory = filters.category === 'all' || e.category === filters.category;
      const matchesMinAmount = !filters.minAmount || e.amount >= parseFloat(filters.minAmount);
      const matchesMaxAmount = !filters.maxAmount || e.amount <= parseFloat(filters.maxAmount);
      
      return matchesSearch && matchesDateFrom && matchesDateTo && matchesCategory && matchesMinAmount && matchesMaxAmount;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (filters.sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }
      
      if (filters.sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, filters]);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleOpen = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData(expense);
    } else {
      setEditingExpense(null);
      setFormData({ category: 'Miscellaneous', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate business
    if (!currentBusiness?.id) {
      alert('Business not selected. Please refresh and try again.');
      return;
    }

    // Validate required fields
    if (!formData.category || !formData.description || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const amountNum = Number(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount greater than zero');
      return;
    }

    if (!formData.date) {
      alert('Please select a date');
      return;
    }

    try {
      const expenseData = { 
        ...formData, 
        businessId: currentBusiness.id,
        amount: amountNum,
        description: formData.description.trim(),
        date: formData.date
      };
      
      let saved;
      if (editingExpense) {
        saved = await updateItem('expenses', editingExpense.id, expenseData);
      } else {
        saved = await addItem('expenses', expenseData);
      }
      
      if (!saved) {
        // Check if expense was actually saved despite return value
        const savedExpense = getItems('expenses').find(e => 
          e.description === expenseData.description && 
          e.amount === expenseData.amount &&
          e.date === expenseData.date &&
          e.businessId === expenseData.businessId &&
          (!editingExpense || e.id === editingExpense.id)
        );
        
        if (!savedExpense) {
          alert('Failed to save expense. Please check your connection and try again.');
          return;
        }
      }
      
      handleClose();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('An error occurred while saving. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteItem('expenses', id);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Expenses</Typography>
          <Typography variant="body2" color="text.secondary">Track and manage your business expenses</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />} 
          onClick={() => handleOpen()}
        >
          Add Expense
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <DollarSign size={32} color="#f44336" style={{ marginBottom: 8 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Total Expenses</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main' }}>
                ₹{totalExpenses.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search expenses..."
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

          {/* Filter Controls */}
          <Box sx={{ mb: 3 }}>
            <Button 
              onClick={() => setShowFilters(!showFilters)}
              variant="outlined"
              size="small"
              sx={{ mr: 2 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            {(filters.dateFrom || filters.dateTo || filters.category !== 'all' || filters.minAmount || filters.maxAmount || filters.sortBy !== 'date' || filters.sortOrder !== 'desc') && (
              <Button 
                onClick={() => setFilters({ dateFrom: '', dateTo: '', category: 'all', minAmount: '', maxAmount: '', sortBy: 'date', sortOrder: 'desc' })}
                variant="text"
                size="small"
                color="error"
              >
                Clear Filters
              </Button>
            )}
          </Box>
          
          {showFilters && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="From Date"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="To Date"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  size="small"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Min Amount"
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Max Amount"
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Sort By"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  size="small"
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="amount">Amount</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Sort Order"
                  value={filters.sortOrder}
                  onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
                  size="small"
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>
                      <Chip label={expense.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                      ₹{expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpen(expense)} color="primary">
                        <Edit2 size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(expense.id)} color="error">
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No expenses found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredExpenses.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save Expense</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ExpensesPage;