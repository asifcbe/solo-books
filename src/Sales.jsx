import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Button, Card, CardContent, Typography, TextField, Grid, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, MenuItem, Divider, Autocomplete, InputAdornment, Chip
} from '@mui/material';
import { Plus, Trash2, Printer, Save, ChevronLeft, Receipt, ShoppingBasket, Edit } from 'lucide-react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBusiness } from './BusinessContext';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from './InvoiceTemplate';

const SalesPage = ({ mode = 'sales' }) => {
  const isSale = mode === 'sales';
  const { currentBusiness } = useBusiness();
  const [view, setView] = useState('list'); // 'list' or 'create' or 'edit'
  const [editId, setEditId] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState([{ itemId: '', name: '', qty: 1, price: 0, taxRate: 0, total: 0 }]);
  const [printingTx, setPrintingTx] = useState(null);
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  // Queries
  const parties = useLiveQuery(() => 
    db.parties.where('businessId').equals(currentBusiness?.id || 0)
      .and(p => p.type === (isSale ? 'Customer' : 'Vendor'))
      .toArray()
  , [currentBusiness, isSale]) || [];

  const stockItems = useLiveQuery(() => db.items.where('businessId').equals(currentBusiness?.id || 0).toArray()) || [];
  
  const transactions = useLiveQuery(
    () => db.transactions
      .where('businessId').equals(currentBusiness?.id || 0)
      .and(t => t.type === (isSale ? 'Sales' : 'Purchases'))
      .reverse()
      .toArray(),
    [currentBusiness, isSale]
  ) || [];

  useEffect(() => {
    if (view === 'create') {
      const prefix = isSale ? 'INV' : 'BILL';
      setInvoiceNumber(`${prefix}-${Date.now().toString().slice(-6)}`);
      setItems([{ itemId: '', name: '', qty: 1, price: 0, taxRate: 0, total: 0 }]);
      setSelectedParty(null);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setEditId(null);
    }
  }, [view, isSale]);

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
    
    const transactionData = {
      businessId: currentBusiness.id,
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      type: isSale ? 'Sales' : 'Purchases',
      date: invoiceDate,
      invoiceNumber,
      items: items.filter(i => i.name),
      subtotal: calculateSubtotal(),
      taxAmount: calculateTax(),
      totalAmount: calculateTotal(),
    };

    try {
      await db.transaction('rw', [db.transactions, db.parties, db.items], async () => {
        if (editId) {
          const oldTx = await db.transactions.get(editId);
          if (oldTx) {
            // Rollback old effects
            const oldBalanceRollback = isSale ? -oldTx.totalAmount : oldTx.totalAmount;
            const oldParty = await db.parties.get(oldTx.partyId);
            if(oldParty) await db.parties.update(oldTx.partyId, { balance: oldParty.balance + oldBalanceRollback });

            for (const item of oldTx.items) {
              if (item.itemId) {
                const stockItem = await db.items.get(item.itemId);
                if (stockItem) {
                  const stockRollback = isSale ? item.qty : -item.qty;
                  await db.items.update(item.itemId, { stock: stockItem.stock + stockRollback });
                }
              }
            }
          }
        }

        if (editId) {
          await db.transactions.update(editId, transactionData);
        } else {
          await db.transactions.add(transactionData);
        }
        
        // Apply new effects
        const balanceChange = isSale ? transactionData.totalAmount : -transactionData.totalAmount;
        const newParty = await db.parties.get(selectedParty.id);
        if(newParty) await db.parties.update(selectedParty.id, { balance: newParty.balance + balanceChange });

        for (const item of transactionData.items) {
          if (item.itemId) {
            const stockItem = await db.items.get(item.itemId);
            if (stockItem) {
              const stockChange = isSale ? -item.qty : item.qty;
              await db.items.update(item.itemId, { stock: stockItem.stock + stockChange });
            }
          }
        }
      });
      setView('list');
      setEditId(null);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save: " + error.message);
    }
  };

  const handleDelete = async (tx) => {
    if (!window.confirm(`Are you sure you want to delete this ${isSale ? 'invoice' : 'bill'}?`)) return;

    try {
      await db.transaction('rw', [db.transactions, db.parties, db.items], async () => {
        // 1. Reverse Balance
        const balanceRollback = isSale ? -tx.totalAmount : tx.totalAmount;
        const party = await db.parties.get(tx.partyId);
        if (party) {
          await db.parties.update(tx.partyId, { balance: party.balance + balanceRollback });
        }

        // 2. Reverse Stock
        for (const item of tx.items) {
          if (item.itemId) {
            const stockItem = await db.items.get(item.itemId);
            if (stockItem) {
              const stockRollback = isSale ? item.qty : -item.qty;
              await db.items.update(item.itemId, { stock: stockItem.stock + stockRollback });
            }
          }
        }

        // 3. Delete Record
        await db.transactions.delete(tx.id);
      });
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

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
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
            {transactions.map((tx) => (
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

      <div style={{ display: 'none' }}>
        <InvoiceTemplate ref={printRef} transaction={printingTx} business={currentBusiness} />
      </div>
    </Box>
  );
};

export default SalesPage;