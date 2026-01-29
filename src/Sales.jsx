import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Button, Card, CardContent, Typography, TextField, Grid, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, MenuItem, Divider, Autocomplete, InputAdornment, Chip,
  TablePagination, FormControlLabel, Switch, alpha
} from '@mui/material';
import { Plus, Trash2, Printer, Save, ChevronLeft, Receipt, ShoppingBasket, Edit, Share2, Calendar, User, Phone } from 'lucide-react';
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
  const [paperSize, setPaperSize] = useState('A4');
  const printRef = useRef();

  const [isSaving, setIsSaving] = useState(false);

  // NEW: ref to prevent multiple saves
  const savingRef = useRef(false);

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
  const parties = getItems('parties').filter(
    p =>
      p.businessId === currentBusiness?.id &&
      p.type === (isSale ? 'Customer' : 'Vendor')
  );

  const stockItems = getItems('items').filter(
    item => item.businessId === currentBusiness?.id
  );

  const tableName = isSale ? 'sales' : 'purchases';
  const transactions = getItems(tableName)
    .filter(tx => tx.businessId === currentBusiness?.id)
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
    // Only reset form when switching to create view AND not currently saving
    if (view === 'create' && !savingRef.current && !isSaving) {
      const prefix = isSale ? 'INV' : 'BILL';
      setInvoiceNumber(`${prefix}-${Date.now().toString().slice(-6)}`);
      setItems([{ itemId: '', name: '', qty: 1, price: 0, taxRate: 0, total: 0 }]);
      setSelectedParty(null);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setNoGST(false);
      setEditId(null);
    }
  }, [view, isSale, isSaving]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filters]);

  // Logic Handlers
  const addItemRow = () => {
    setItems([
      ...items,
      { itemId: '', name: '', qty: 1, price: 0, taxRate: 0, total: 0 },
    ]);
  };

  const removeItemRow = index => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(
      newItems.length
        ? newItems
        : [{ itemId: '', name: '', qty: 1, price: 0, taxRate: 0, total: 0 }]
    );
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

  const calculateSubtotal = () =>
    items.reduce((sum, item) => sum + item.qty * item.price, 0);

  const calculateTax = () => {
    if (noGST) return 0;
    return items.reduce(
      (sum, item) => sum + item.qty * item.price * (item.taxRate / 100),
      0
    );
  };

  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const handleSave = async () => {
    // Prevent multiple simultaneous saves using ref
    if (savingRef.current) {
      console.log('⚠️ Save already in progress, ignoring duplicate call');
      return;
    }
    savingRef.current = true;
    setIsSaving(true);

    try {
      // CAPTURE ALL DATA AT THE BEGINNING to prevent race conditions
      const currentSelectedParty = selectedParty;
      const currentInvoiceDate = invoiceDate;
      const currentInvoiceNumber = invoiceNumber;
      const currentItems = [...items];
      const currentDescription = description;
      const currentNoGST = noGST;
      const currentEditId = editId;
      const currentIsSale = isSale;
      const currentBusinessId = currentBusiness?.id;

      // Validate business ID
      if (!currentBusinessId) {
        alert('Business not selected. Please refresh and try again.');
        savingRef.current = false;
        setIsSaving(false);
        return;
      }

      // Validate party selection
      if (!currentSelectedParty || !currentSelectedParty.id) {
        alert('Please select a party');
        savingRef.current = false;
        setIsSaving(false);
        return;
      }

      // Validate invoice number
      if (!currentInvoiceNumber || currentInvoiceNumber.trim() === '') {
        alert('Please enter an invoice/bill number');
        savingRef.current = false;
        setIsSaving(false);
        return;
      }

      // Validate date
      if (!currentInvoiceDate) {
        alert('Please select a date');
        savingRef.current = false;
        setIsSaving(false);
        return;
      }

      // Prepare transaction data with captured values
      const finalSubtotal = currentItems.reduce((sum, item) => sum + item.qty * item.price, 0);
      const finalTaxAmount = currentNoGST ? 0 : currentItems.reduce(
        (sum, item) => sum + item.qty * item.price * (item.taxRate / 100),
        0
      );
      const finalTotalAmount = finalSubtotal + finalTaxAmount;

      // stricter: only keep items which have an itemId and positive qty
      const cleanedItems = currentItems
        .filter(i => i.itemId && i.qty > 0 && i.price >= 0)
        .map(item => ({
          ...item,
          taxRate: currentNoGST ? 0 : item.taxRate,
        }));

      // Validate items
      if (!cleanedItems.length) {
        alert('Please add at least one item with valid quantity and price');
        savingRef.current = false;
        setIsSaving(false);
        return;
      }

      // Additional validation: ensure total amount is positive
      if (finalTotalAmount <= 0) {
        alert('Total amount must be greater than zero');
        savingRef.current = false;
        setIsSaving(false);
        return;
      }

      const transactionData = {
        businessId: currentBusinessId,
        partyId: currentSelectedParty.id,
        partyName: currentSelectedParty.name || 'Unknown',
        type: currentIsSale ? 'Sales' : 'Purchases',
        date: currentInvoiceDate,
        invoiceNumber: currentInvoiceNumber.trim(),
        items: cleanedItems,
        description: currentDescription || '',
        noGST: currentNoGST,
        subtotal: finalSubtotal,
        taxAmount: finalTaxAmount,
        totalAmount: finalTotalAmount,
      };

      // Validate transaction data before saving
      if (!transactionData.partyId || !transactionData.items || transactionData.items.length === 0) {
        console.error('❌ Invalid transaction data:', transactionData);
        alert('Invalid transaction data. Please check all fields and try again.');
        savingRef.current = false;
        setIsSaving(false);
        return;
      }

      // Get current data state for rollback calculations
      const currentData = data;
      const currentParties = getItems('parties');
      const currentStockItems = getItems('items');

      if (currentEditId) {
        const tableName = currentIsSale ? 'sales' : 'purchases';
        const oldTx = currentData[tableName]?.find(t => t.id === currentEditId);
        if (oldTx) {
          // Rollback old effects
          const oldBalanceRollback = currentIsSale
            ? -oldTx.totalAmount
            : oldTx.totalAmount;
          const oldParty = currentParties.find(p => p.id === oldTx.partyId);
          if (oldParty) {
            await updateItem('parties', oldTx.partyId, {
              balance: oldParty.balance + oldBalanceRollback,
            });
          }

          for (const item of oldTx.items) {
            if (item.itemId) {
              const stockItem = currentStockItems.find(i => i.id === item.itemId);
              if (stockItem) {
                const stockRollback = currentIsSale ? item.qty : -item.qty;
                await updateItem('items', item.itemId, {
                  stock: stockItem.stock + stockRollback,
                });
              }
            }
          }
        }
      }

      // Save the transaction
      const tableName = currentIsSale ? 'sales' : 'purchases';
      let saved;
      if (currentEditId) {
        saved = await updateItem(tableName, currentEditId, transactionData);
      } else {
        saved = await addItem(tableName, transactionData);
      }

      if (!saved) {
        console.error('❌ Save returned false, but checking if data was actually saved...');
        // Even if save returns false, the data might have been saved
        // Check if the item exists in the data
        const tableName = currentIsSale ? 'sales' : 'purchases';
        const savedItem = getItems(tableName).find(t => 
          t.invoiceNumber === transactionData.invoiceNumber && 
          t.partyId === transactionData.partyId
        );
        
        if (!savedItem) {
          alert(
            'Failed to save transaction. Please check your connection and try again.'
          );
          savingRef.current = false;
          setIsSaving(false);
          return;
        } else {
          console.log('✅ Transaction was saved despite return value');
          // Continue with the flow
        }
      }

      // Apply new effects
      const balanceChange = currentIsSale
        ? transactionData.totalAmount
        : -transactionData.totalAmount;
      const newParty = currentParties.find(
        p => p.id === currentSelectedParty.id
      );
      if (newParty) {
        await updateItem('parties', currentSelectedParty.id, {
          balance: newParty.balance + balanceChange,
        });
      }

      for (const item of transactionData.items) {
        if (item.itemId) {
          const stockItem = currentStockItems.find(i => i.id === item.itemId);
          if (stockItem) {
            const stockChange = currentIsSale ? -item.qty : item.qty;
            await updateItem('items', item.itemId, {
              stock: stockItem.stock + stockChange,
            });
          }
        }
      }

      // Only update UI state after everything succeeds
      setView('list');
      setEditId(null);
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('An error occurred while saving. Please try again.');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleDelete = async tx => {
    if (
      !window.confirm(
        `Are you sure you want to delete this ${
          isSale ? 'invoice' : 'bill'
        }?`
      )
    )
      return;

    try {
      // 1. Reverse Balance
      const balanceRollback = isSale ? -tx.totalAmount : tx.totalAmount;
      const party = getItems('parties').find(p => p.id === tx.partyId);
      if (party) {
        updateItem('parties', tx.partyId, {
          balance: party.balance + balanceRollback,
        });
      }

      // 2. Reverse Stock
      for (const item of tx.items) {
        if (item.itemId) {
          const stockItem = getItems('items').find(i => i.id === item.itemId);
          if (stockItem) {
            const stockRollback = isSale ? item.qty : -item.qty;
            updateItem('items', item.itemId, {
              stock: stockItem.stock + stockRollback,
            });
          }
        }
      }

      // 3. Delete Record
      const tableName = isSale ? 'sales' : 'purchases';
      deleteItem(tableName, tx.id);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Error deleting record: ' + error.message);
    }
  };

  const startEdit = tx => {
    setEditId(tx.id);
    setSelectedParty(
      parties.find(p => p.id === tx.partyId) || {
        id: tx.partyId,
        name: tx.partyName,
      }
    );
    setInvoiceDate(tx.date);
    setInvoiceNumber(tx.invoiceNumber);
    setItems(tx.items.map(i => ({ ...i })));
    setDescription(tx.description || '');
    setNoGST(tx.noGST || false);
    setView('edit');
  };

  const triggerPrint = tx => {
    setPrintingTx(tx);
    setTimeout(() => handlePrint(), 100);
  };

  const handleShare = tx => {
    const text = `*Invoice from ${currentBusiness?.name || 'Solo Books'}*\n\n` +
      `Invoice #: ${tx.invoiceNumber}\n` +
      `Date: ${tx.date}\n` +
      `Party: ${tx.partyName}\n` +
      `Total: ₹${tx.totalAmount.toFixed(2)}\n\n` +
      `Shared via Solo Books`;
    
    if (navigator.share) {
      navigator.share({ title: `Invoice ${tx.invoiceNumber}`, text }).catch(e => console.error(e));
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
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
            sx={{ 
              borderRadius: 2.5,
              px: 2,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50'
              }
            }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {view === 'edit' ? 'Edit ' : 'New '}
            {isSale ? 'Sales Invoice' : 'Purchase Bill'}
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} md={8}>
            <Card
              elevation={0}
              sx={{ 
                mb: 3, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  bgcolor: 'primary.main',
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>
                  Transaction Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={parties}
                      getOptionLabel={option => option.name || ''}
                      value={selectedParty}
                      onChange={(e, v) => setSelectedParty(v)}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label={isSale ? 'Customer' : 'Vendor'}
                          required
                          placeholder="Select a party"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <User size={20} color={alpha('#4f46e5', 0.5)} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label={isSale ? 'Invoice #' : 'Bill #'}
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Receipt size={18} color={alpha('#4f46e5', 0.6)} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date"
                      value={invoiceDate}
                      onChange={e => setInvoiceDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Calendar size={18} color={alpha('#4f46e5', 0.6)} />
                          </InputAdornment>
                        ),
                      }}
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
                      onChange={e => setDescription(e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={4}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={noGST}
                          onChange={e => setNoGST(e.target.checked)}
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

            <Card
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}
            >
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>
                  Items & Quantities
                </Typography>
                <Chip label={`${items.length} Items`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
              </Box>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                      <TableRow>
                        <TableCell sx={{ pl: 3, fontWeight: 700 }}>Item Details</TableCell>
                        <TableCell width={80} align="center" sx={{ fontWeight: 700 }}>
                          Qty
                        </TableCell>
                        <TableCell width={120} align="right" sx={{ fontWeight: 700 }}>
                          Price
                        </TableCell>
                        <TableCell width={100} align="center" sx={{ fontWeight: 700 }}>
                          GST %
                        </TableCell>
                        <TableCell width={140} align="right" sx={{ pr: 3, fontWeight: 700 }}>
                          Total
                        </TableCell>
                        <TableCell width={50}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ pl: 3, py: 2 }}>
                            <Autocomplete
                              options={stockItems}
                              getOptionLabel={option => option.name || ''}
                              size="small"
                              value={
                                stockItems.find(i => i.id === item.itemId) ||
                                null
                              }
                              onChange={(e, v) =>
                                updateItemRow(index, 'itemId', v?.id)
                              }
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  placeholder="Select Product"
                                  variant="outlined"
                                  size="small"
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              variant="outlined"
                              value={item.qty}
                              onChange={e =>
                                updateItemRow(
                                  index,
                                  'qty',
                                  Number(e.target.value)
                                )
                              }
                              inputProps={{ style: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              variant="outlined"
                              value={item.price}
                              onChange={e =>
                                updateItemRow(
                                  index,
                                  'price',
                                  Number(e.target.value)
                                )
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Typography variant="body2" color="text.secondary">₹</Typography>
                                  </InputAdornment>
                                ),
                              }}
                              inputProps={{ style: { textAlign: 'right' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {item.taxRate}%
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 3 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              ₹{item.total.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ pr: 1 }}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeItemRow(index)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ p: 2, pl: 3 }}>
                  <Button
                    startIcon={<Plus size={18} />}
                    onClick={addItemRow}
                    variant="outlined"
                    sx={{ 
                      fontWeight: 700,
                      borderRadius: 2.5,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: alpha('#4f46e5', 0.05),
                        borderColor: 'primary.dark',
                      }
                    }}
                  >
                    Add Another Item
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                position: 'sticky',
                top: 24,
                border: '1px solid',
                borderColor: 'primary.main',
                bgcolor: mode === 'dark' ? 'rgba(79, 70, 229, 0.05)' : 'rgba(79, 70, 229, 0.02)',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  bgcolor: 'primary.main',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 3 }}
                >
                  Billing Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography
                      color="text.secondary"
                      variant="body2"
                    >
                      Subtotal
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">
                      ₹{calculateSubtotal().toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      color="text.secondary"
                      variant="body2"
                    >
                      GST Total
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">
                      ₹{calculateTax().toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2.5 }} />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 4,
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 800 }}
                  >
                    Total
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: 'primary.main',
                    }}
                  >
                    ₹{calculateTotal().toFixed(2)}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<Save size={20} />}
                  onClick={handleSave}
                  disabled={isSaving}
                  sx={{ 
                    borderRadius: 3, 
                    py: 1.8,
                    fontWeight: 800,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    boxShadow: mode === 'dark' ? '0 8px 16px rgba(0,0,0,0.4)' : '0 8px 16px rgba(79, 70, 229, 0.2)',
                    background: `linear-gradient(45deg, #4f46e5 30%, #6366f1 90%)`,
                    '&:hover': {
                      background: `linear-gradient(45deg, #4338ca 30%, #4f46e5 90%)`,
                      transform: 'translateY(-2px)',
                      boxShadow: mode === 'dark' ? '0 12px 20px rgba(0,0,0,0.5)' : '0 12px 20px rgba(79, 70, 229, 0.3)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {isSaving
                    ? 'Saving...'
                    : view === 'edit'
                    ? 'Update Transaction'
                    : 'Save Transaction'}
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            {isSale ? 'Sales Invoices' : 'Purchase Bills'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isSale
              ? 'Record sales and track customer receivables.'
              : 'Manage purchases and track vendor payables.'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value)}
            sx={{ minWidth: 100 }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="A4">A4</MenuItem>
            <MenuItem value="A5">A5</MenuItem>
            <MenuItem value="Letter">Letter</MenuItem>
            <MenuItem value="Legal">Legal</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={
              isSale ? <Receipt size={20} /> : <ShoppingBasket size={20} />
            }
            onClick={() => setView('create')}
            size="large"
            sx={{ borderRadius: 3 }}
          >
            {isSale ? 'Create Invoice' : 'Add Bill'}
          </Button>
        </Box>
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
            {(filters.dateFrom ||
              filters.dateTo ||
              filters.partyId ||
              filters.minAmount ||
              filters.maxAmount ||
              filters.status !== 'all') && (
              <Button
                onClick={() =>
                  setFilters({
                    dateFrom: '',
                    dateTo: '',
                    partyId: '',
                    minAmount: '',
                    maxAmount: '',
                    status: 'all',
                  })
                }
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
                  onChange={e =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
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
                  onChange={e =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  fullWidth
                  size="small"
                  options={parties}
                  getOptionLabel={option => option.name}
                  value={
                    parties.find(p => p.id === filters.partyId) || null
                  }
                  onChange={(e, value) =>
                    setFilters({
                      ...filters,
                      partyId: value?.id || '',
                    })
                  }
                  renderInput={params => (
                    <TextField
                      {...params}
                      label={isSale ? 'Customer' : 'Vendor'}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={filters.status}
                  onChange={e =>
                    setFilters({ ...filters, status: e.target.value })
                  }
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
                  onChange={e =>
                    setFilters({ ...filters, minAmount: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        ₹
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Max Amount"
                  type="number"
                  value={filters.maxAmount}
                  onChange={e =>
                    setFilters({ ...filters, maxAmount: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        ₹
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          overflowX: 'auto',
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Document #</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                {isSale ? 'Customer' : 'Vendor'}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Amount
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(tx => (
                <TableRow key={tx.id} hover>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {tx.invoiceNumber}
                  </TableCell>
                  <TableCell>{tx.partyName}</TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700 }}>
                      ₹{tx.totalAmount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label="Completed"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => startEdit(tx)}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => triggerPrint(tx)}
                        title="Print"
                      >
                        <Printer size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: '#25D366' }}
                        onClick={() => handleShare(tx)}
                        title="Share on WhatsApp"
                      >
                        <Share2 size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(tx)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">
                    No transactions found
                  </Typography>
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
        onRowsPerPageChange={event => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
      />

      <div style={{ display: 'none' }}>
        <InvoiceTemplate
          ref={printRef}
          transaction={printingTx}
          business={currentBusiness}
          paperSize={paperSize}
        />
      </div>
    </Box>
  );
};

export default SalesPage;
