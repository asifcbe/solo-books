import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, Typography, Grid, TextField, MenuItem, Button, 
  Card, CardContent, Stack, Avatar, alpha, useTheme, 
   InputAdornment, IconButton, InputBase, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Tabs, Tab
} from '@mui/material';
import { 
  CheckCircle2, ArrowLeft, Landmark, Banknote, 
  CreditCard, User, Search, 
  Calendar, FileClock, Wallet, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useData } from './DataContext';
import { useNavigate } from 'react-router-dom';

const PaymentEntry = ({ mode = 'payment-in' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentBusiness } = useBusiness();
  const { data, addItem, updateItem, deleteItem, getItems } = useData();
  
  // States
  const [tabValue, setTabValue] = useState(0); // 0: In, 1: Out
  const [formData, setFormData] = useState({
    partyId: '', amount: '', date: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash', referenceNo: '', notes: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Additional filter states
  const [filters, setFilters] = useState({
    paymentMode: 'all',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date', // date, amount, party
    sortOrder: 'desc' // asc, desc
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Database Queries
  const isPaymentIn = tabValue === 0;
  
  // Filter parties based on payment type
  const parties = getItems('parties').filter(p => {
    if (p.businessId !== currentBusiness?.id) return false;
    // Payment In = Customers, Payment Out = Vendors
    return isPaymentIn ? p.type === 'Customer' : p.type === 'Vendor';
  });
  
  const transactions = getItems('payments')
    .filter(t => t.businessId === currentBusiness?.id && t.type === (isPaymentIn ? 'PaymentIn' : 'PaymentOut'));

  const accentColor = isPaymentIn ? theme.palette.success.main : theme.palette.warning.main;

  const selectedParty = useMemo(() => parties.find(p => p.id === formData.partyId), [formData.partyId, parties]);

  const filteredHistory = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.partyName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = t.date >= dateRange.start && t.date <= dateRange.end;
      
      // Additional filters
      const matchesPaymentMode = filters.paymentMode === 'all' || t.paymentMode === filters.paymentMode;
      const matchesMinAmount = !filters.minAmount || t.totalAmount >= parseFloat(filters.minAmount);
      const matchesMaxAmount = !filters.maxAmount || t.totalAmount <= parseFloat(filters.maxAmount);
      
      return matchesSearch && matchesDate && matchesPaymentMode && matchesMinAmount && matchesMaxAmount;
    }).sort((a, b) => {
      let aValue, bValue;
      switch (filters.sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'party':
          aValue = a.partyName.toLowerCase();
          bValue = b.partyName.toLowerCase();
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
  }, [transactions, searchQuery, dateRange, filters]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, dateRange, filters]);

  const handleSave = async () => {
    // Validate business
    if (!currentBusiness?.id) {
      alert('Business not selected. Please refresh and try again.');
      return;
    }

    // Validate required fields
    if (!formData.partyId || !formData.amount) {
      alert('Please select a party and enter an amount');
      return;
    }

    if (!selectedParty) {
      alert('Please select a valid party');
      return;
    }

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount greater than zero');
      return;
    }

    try {
      const paymentData = {
        businessId: currentBusiness.id,
        partyId: formData.partyId,
        partyName: selectedParty.name || 'Unknown',
        type: isPaymentIn ? 'PaymentIn' : 'PaymentOut',
        totalAmount: amountNum,
        date: formData.date || new Date().toISOString().split('T')[0],
        paymentMode: formData.paymentMode || 'Cash',
        referenceNo: formData.referenceNo || `REF-${Date.now().toString().slice(-6)}`,
        notes: formData.notes || ''
      };
      
      const saved = await addItem('payments', paymentData);

      if (!saved) {
        // Check if payment was actually saved despite return value
        const savedPayment = getItems('payments').find(p => 
          p.partyId === paymentData.partyId && 
          p.totalAmount === paymentData.totalAmount &&
          p.date === paymentData.date &&
          p.businessId === paymentData.businessId
        );
        
        if (!savedPayment) {
          alert('Failed to save payment. Please check your connection and try again.');
          return;
        }
      }

      // Update party balance
      const newBalance = (selectedParty.balance || 0) + (isPaymentIn ? -amountNum : amountNum);
      await updateItem('parties', formData.partyId, { balance: newBalance });
      
      // Reset form
      setFormData({ ...formData, amount: '', referenceNo: '', notes: '' });
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('An error occurred while saving. Please try again.');
    }
  };

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, md: 4 } }}>
      
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <ArrowLeft size={20} />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>Payments</Typography>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} aria-label="payment tabs">
          <Tab label="Payment In (Received)" sx={{ fontWeight: 700 }} />
          <Tab label="Payment Out (Paid)" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>
{/* BOTTOM: Entry Form */}
        <Grid item xs={12} sx={{pb:2}}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ px: 4, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>New Payment Entry</Typography>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <TextField select fullWidth label="Party" value={formData.partyId} onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}>
                    {parties.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField fullWidth label="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField select fullWidth label="Method" value={formData.paymentMode} onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Bank">Bank</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField fullWidth label="Ref No" value={formData.referenceNo} onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button fullWidth variant="contained" size="large" onClick={handleSave} disabled={!formData.partyId || !formData.amount}
                    sx={{ height: '56px', borderRadius: 2, fontWeight: 800, bgcolor: accentColor, '&:hover': { bgcolor: accentColor } }} startIcon={<CheckCircle2 />}>
                    Confirm Transaction
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      <Grid container spacing={3}>
        
        {/* TOP LEFT: Grid History */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '400px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
              <Paper variant="outlined" sx={{ px: 2, py: 0.5, display: 'flex', alignItems: 'center', flex: 1, borderRadius: 2 }}>
                <Search size={16} color={theme.palette.text.disabled} />
                <InputBase sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }} placeholder="Search vouchers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </Paper>
              <TextField type="date" size="small" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
              <TextField type="date" size="small" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outlined"
                size="small"
              >
                {showFilters ? 'Hide' : 'More'}
              </Button>
            </Box>

            {showFilters && (
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Payment Mode"
                      value={filters.paymentMode}
                      onChange={(e) => setFilters({...filters, paymentMode: e.target.value})}
                      size="small"
                    >
                      <MenuItem value="all">All Modes</MenuItem>
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Bank">Bank</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
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
                      <MenuItem value="party">Party</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Box>
            )}
            <TableContainer sx={{ flexGrow: 1 }}>
              <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Party</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Reference</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistory
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.date}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.partyName}</TableCell>
                      <TableCell color="text.secondary">{row.referenceNo}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: accentColor }}>₹{row.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredHistory.length}
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
            </TableContainer>
          </Card>
        </Grid>

        {/* TOP RIGHT: Live Ledger Balance */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 4, bgcolor: alpha(accentColor, 0.04), border: '1px solid', borderColor: alpha(accentColor, 0.2), height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CardContent sx={{ textAlign: 'center', width: '100%' }}>
              <Avatar sx={{ bgcolor: accentColor, width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <Wallet size={32} />
              </Avatar>
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>{selectedParty?.name || "Select a Party"}</Typography>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', fontWeight: 700 }}>Current Ledger Balance</Typography>
              <Typography variant="h2" sx={{ fontWeight: 900, color: 'text.primary', my: 1 }}>
                ₹{selectedParty?.balance?.toLocaleString() || '0'}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                {isPaymentIn ? <ArrowDownRight size={20} color={theme.palette.success.main} /> : <ArrowUpRight size={20} color={theme.palette.warning.main} />}
                <Typography variant="body2" sx={{ fontWeight: 600, color: accentColor }}>
                  {isPaymentIn ? "Receivable" : "Payable"} Settlement
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        

      </Grid>
    </Box>
  );
};

export default PaymentEntry;