import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Button, Card, CardContent, Typography, TextField, Grid, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, MenuItem, Divider, Autocomplete, InputAdornment, Chip,
  TablePagination, FormControlLabel, Switch
} from '@mui/material';
import { Plus, Trash2, Printer, Save, ChevronLeft, Receipt, ShoppingBasket, Edit } from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useData } from './DataContext';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from './InvoiceTemplate';

const SalesPage = ({ mode = 'sales' }) => {
  const isSale = mode === 'sales';
  const { currentBusiness } = useBusiness();
  const { data, addItem, updateItem, deleteItem, getItems } = useData();
  const [view, setView] = useState('list'); // 'list' or 'create' or 'edit'
  const [editId, setEditId] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState([{ itemId: '', name: '', qty: 1, price: 0, taxRate: 0, total: 0 }]);
  const [description, setDescription] = useState('');
  const [noGST, setNoGST] = useState(false);
  const [printingTx, setPrintingTx] = useState(null);
  const printRef = useRef();

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    partyId: '',
    minAmount: '',
    maxAmount: '',
    status: 'all' // all, completed
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  // Queries
  const parties = getItems('parties').filter(p => p.businessId === currentBusiness?.id && p.type === (isSale ? 'Customer' : 'Vendor'));

  const stockItems = getItems('items').filter(item => item.businessId === currentBusiness?.id);
  
  const transactions = getItems('transactions')
    .filter(tx => tx.businessId === currentBusiness?.id && tx.type === (isSale ? 'Sales' : 'Purchases'))
    .filter(tx => {
      // Date range filter
      if (filters.dateFrom && new Date(tx.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(tx.date) > new Date(filters.dateTo)) return false;
      
      // Party filter
      if (filters.partyId && tx.partyId !== filters.partyId) return false;
      
      // Amount range filter
      if (filters.minAmount && tx.totalAmount < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && tx.totalAmount > parseFloat(filters.maxAmount)) return false;
      
      // Status filter
      if (filters.status !== 'all' && tx.status !== filters.status) return false;
      
      return true;
    })
    .reverse();
  useEffect(() => {
    if (view === 'create') {
      const prefix = isSale ? 'INV' : 'BILL';
      setInvoiceNumber(`${prefix}-${Date.now().toString().slice(-6)}`);
      setItems([{ itemId: '', name: '', qty: 1, price: 0, taxRate: 0, total: 0 }]);
      setSelectedParty(null);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setNoGST(false);
      setEditId(null);
    }
  }, [view, isSale]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filters]);

  // Logic Handlers
  const addItemRow = () => {
    setItems([...items, { itemId: '', name: '', qty: 1, price: 0, taxRate: 0, total: 0 }]);
  };

  const removeItemRow = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems.length ? newItems : [{ itemId: '', name: '', qty: 1, price: 0, taxRate: 0, total: 0 }]);
  };

  const updateItemRow = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'itemId') {
      const selected = stockItems.find(i => i.id === value);
      if (selected) {
        item.name = selected.name;
        item.price = isSale ? selected.salePrice : selected.purchasePrice;
        item.taxRate = selected.taxRate;
      }
    }

    item.total = item.qty * item.price * (1 + item.taxRate / 100);
    newItems[index] = item;
    setItems(newItems);
  };

  const calculateSubtotal = () => items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const calculateTax = () => items.reduce((sum, item) => sum + (item.qty * item.price * (item.taxRate / 100)), 0);
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const handleSave = async () => {
    if (!selectedParty) return alert('Please select a party');
    
    const finalTaxAmount = noGST ? 0 : calculateTax();
    const finalTotalAmount = calculateSubtotal() + finalTaxAmount;
    
    const transactionData = {
      businessId: currentBusiness.id,
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      type: isSale ? 'Sales' : 'Purchases',
      date: invoiceDate,
      invoiceNumber,
      items: items.filter(i => i.name).map(item => ({
        ...item,
        taxRate: noGST ? 0 : item.taxRate
      })),
      description,
      noGST,
      subtotal: calculateSubtotal(),
      taxAmount: finalTaxAmount,
      totalAmount: finalTotalAmount,
    };

    if (editId) {
      const oldTx = getItems('transactions').find(t => t.id === editId);
      if (oldTx) {
        // Rollback old effects
        const oldBalanceRollback = isSale ? -oldTx.totalAmount : oldTx.totalAmount;
        const oldParty = getItems('parties').find(p => p.id === oldTx.partyId);
        if(oldParty) updateItem('parties', oldTx.partyId, { balance: oldParty.balance + oldBalanceRollback });

        for (const item of oldTx.items) {
          if (item.itemId) {
            const stockItem = getItems('items').find(i => i.id === item.itemId);
            if (stockItem) {
              const stockRollback = isSale ? item.qty : -item.qty;
              updateItem('items', item.itemId, { stock: stockItem.stock + stockRollback });
            }
          }
        }
      }
    }

    if (editId) {
      updateItem('transactions', editId, transactionData);
    } else {
      addItem('transactions', transactionData);
    }
    // Apply new effects
    const balanceChange = isSale ? transactionData.totalAmount : -transactionData.totalAmount;
    const newParty = getItems('parties').find(p => p.id === selectedParty.id);
    if(newParty) updateItem('parties', selectedParty.id, { balance: newParty.balance + balanceChange });

    for (const item of transactionData.items) {
      if (item.itemId) {
        const stockItem = getItems('items').find(i => i.id === item.itemId);
        if (stockItem) {
          const stockChange = isSale ? -item.qty : item.qty;
          updateItem('items', item.itemId, { stock: stockItem.stock + stockChange });
        }
      }
    }
    
    setView('list');
    setEditId(null);
  };

  const handleDelete = async (tx) => {
    if (!window.confirm(`Are you sure you want to delete this ${isSale ? 'invoice' : 'bill'}?`)) return;

    try {
      // 1. Reverse Balance
      const balanceRollback = isSale ? -tx.totalAmount : tx.totalAmount;
      const party = getItems('parties').find(p => p.id === tx.partyId);
      if (party) {
        updateItem('parties', tx.partyId, { balance: party.balance + balanceRollback });
      }

      // 2. Reverse Stock
      for (const item of tx.items) {
        if (item.itemId) {
          const stockItem = getItems('items').find(i => i.id === item.itemId);
          if (stockItem) {
            const stockRollback = isSale ? item.qty : -item.qty;
            updateItem('items', item.itemId, { stock: stockItem.stock + stockRollback });
          }
        }
      }

      // 3. Delete Record
      deleteItem('transactions', tx.id);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Error deleting record: " + error.message);
    }
  };

  const startEdit = (tx) => {
    setEditId(tx.id);
    setSelectedParty(parties.find(p => p.id === tx.partyId) || { id: tx.partyId, name: tx.partyName });
    setInvoiceDate(tx.date);
    setInvoiceNumber(tx.invoiceNumber);
    setItems(tx.items.map(i => ({ ...i })));
    setDescription(tx.description || '');
    setNoGST(tx.noGST || false);
    setView('edit');
  };

  const triggerPrint = (tx) => {
    setPrintingTx(tx);
    setTimeout(() => handlePrint(), 100);
  };

  // RENDER CREATE/EDIT VIEW
  if (view === 'create' || view === 'edit') {
    return (
      <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setView('list')} 
            startIcon={<ChevronLeft size={18} />}
            sx={{ borderRadius: 3 }}
          >
            Back to List
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {view === 'edit' ? 'Edit ' : 'New '}
            {isSale ? 'Sales Invoice' : 'Purchase Bill'}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={parties}
                      getOptionLabel={(option) => option.name || ''}
                      value={selectedParty}
                      onChange={(e, v) => setSelectedParty(v)}
                      renderInput={(params) => <TextField {...params} label={isSale ? "Customer" : "Vendor"} required />}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label={isSale ? "Invoice #" : "Bill #"}
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Description/Notes"
                      placeholder="Add any additional notes or description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={noGST}
                          onChange={(e) => setNoGST(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="No GST (0% tax)"
                      sx={{ m: 0 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                      <TableRow>
                        <TableCell sx={{ pl: 3 }}>Item Details</TableCell>
                        <TableCell width={80}>Qty</TableCell>
                        <TableCell width={120}>Price</TableCell>
                        <TableCell width={100}>GST %</TableCell>
                        <TableCell width={120} align="right" sx={{ pr: 3 }}>Total</TableCell>
                        <TableCell width={50}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ pl: 3, py: 2 }}>
                            <Autocomplete
                              options={stockItems}
                              getOptionLabel={(option) => option.name || ''}
                              size="small"
                              value={stockItems.find(i => i.id === item.itemId) || null}
                              onChange={(e, v) => updateItemRow(index, 'itemId', v?.id)}
                              renderInput={(params) => <TextField {...params} placeholder="Select Product" variant="standard" />}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              variant="standard"
                              value={item.qty}
                              onChange={(e) => updateItemRow(index, 'qty', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              variant="standard"
                              value={item.price}
                              onChange={(e) => updateItemRow(index, 'price', Number(e.target.value))}
                              InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 0.5 }}>₹</Typography> }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.taxRate}%</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 3 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              ₹{item.total.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ pr: 1 }}>
                            <IconButton size="small" color="error" onClick={() => removeItemRow(index)}>
                              <Trash2 size={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ p: 2, pl: 3 }}>
                  <Button startIcon={<Plus size={18} />} onClick={addItemRow} variant="text" sx={{ fontWeight: 600 }}>
                    Add Another Item
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ position: 'sticky', top: 24, border: '1px solid', borderColor: 'primary.light', bgcolor: 'primary.50' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Billing Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography color="text.secondary" variant="body2">Subtotal</Typography></Grid>
                  <Grid item xs={6} sx={{ textAlign: 'right' }}><Typography variant="body2">₹{calculateSubtotal().toFixed(2)}</Typography></Grid>
                  <Grid item xs={6}><Typography color="text.secondary" variant="body2">GST Total</Typography></Grid>
                  <Grid item xs={6} sx={{ textAlign: 'right' }}><Typography variant="body2">₹{calculateTax().toFixed(2)}</Typography></Grid>
                </Grid>
                <Divider sx={{ my: 2.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>Total</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    ₹{calculateTotal().toFixed(2)}
                  </Typography>
                </Box>
                <Button variant="contained" fullWidth size="large" startIcon={<Save size={20} />} onClick={handleSave} sx={{ borderRadius: 3, py: 1.5 }}>
                  {view === 'edit' ? 'Update Transaction' : 'Save Transaction'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // RENDER LIST VIEW
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            {isSale ? 'Sales Invoices' : 'Purchase Bills'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isSale ? 'Record sales and track customer receivables.' : 'Manage purchases and track vendor payables.'}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={isSale ? <Receipt size={20} /> : <ShoppingBasket size={20} />} 
          onClick={() => setView('create')}
          size="large"
          sx={{ borderRadius: 3 }}
        >
          {isSale ? 'Create Invoice' : 'Add Bill'}
        </Button>
      </Box>

      {/* Filter Controls */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Button 
              onClick={() => setShowFilters(!showFilters)}
              variant="outlined"
              size="small"
              sx={{ mr: 2 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            {(filters.dateFrom || filters.dateTo || filters.partyId || filters.minAmount || filters.maxAmount || filters.status !== 'all') && (
              <Button 
                onClick={() => setFilters({ dateFrom: '', dateTo: '', partyId: '', minAmount: '', maxAmount: '', status: 'all' })}
                variant="text"
                size="small"
                color="error"
              >
                Clear Filters
              </Button>
            )}
          </Box>
          
          {showFilters && (
            <Grid container spacing={2}>
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
                <Autocomplete
                  fullWidth
                  size="small"
                  options={parties}
                  getOptionLabel={(option) => option.name}
                  value={parties.find(p => p.id === filters.partyId) || null}
                  onChange={(e, value) => setFilters({...filters, partyId: value?.id || ''})}
                  renderInput={(params) => <TextField {...params} label={isSale ? 'Customer' : 'Vendor'} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  size="small"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
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
            </Grid>
          )}
        </CardContent>
      </Card>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Document #</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{isSale ? 'Customer' : 'Vendor'}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((tx) => (
              <TableRow key={tx.id} hover>
                <TableCell>{tx.date}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{tx.invoiceNumber}</TableCell>
                <TableCell>{tx.partyName}</TableCell>
                <TableCell align="right">
                  <Typography sx={{ fontWeight: 700 }}>₹{tx.totalAmount.toFixed(2)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip label="Completed" size="small" color="success" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <IconButton size="small" color="primary" onClick={() => startEdit(tx)} title="Edit">
                      <Edit size={18} />
                    </IconButton>
                    <IconButton size="small" color="primary" onClick={() => triggerPrint(tx)} title="Print">
                      <Printer size={18} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(tx)} title="Delete">
                      <Trash2 size={18} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">No transactions found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={transactions.length}
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

      <div style={{ display: 'none' }}>
        <InvoiceTemplate ref={printRef} transaction={printingTx} business={currentBusiness} />
      </div>
    </Box>
  );
};

export default SalesPage;