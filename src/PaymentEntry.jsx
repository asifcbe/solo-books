import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Grid, TextField, MenuItem, Button, 
  Card, CardContent, Stack, Avatar, alpha, useTheme, 
  Divider, InputAdornment, IconButton, InputBase, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  CheckCircle2, ArrowLeft, Landmark, Banknote, 
  CreditCard, User, Search, 
  Calendar, FileClock, Wallet, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBusiness } from './BusinessContext';
import { useNavigate } from 'react-router-dom';

const PaymentEntry = ({ mode = 'payment-in' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentBusiness } = useBusiness();
  
  // States
  const [formData, setFormData] = useState({
    partyId: '', amount: '', date: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash', referenceNo: '', notes: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Database Queries
  const parties = useLiveQuery(() => db.parties.where('businessId').equals(currentBusiness?.id || 0).toArray(), [currentBusiness]) || [];
  const transactions = useLiveQuery(() => 
    db.transactions.where('businessId').equals(currentBusiness?.id || 0)
    .filter(t => t.type === (mode === 'payment-in' ? 'PaymentIn' : 'PaymentOut'))
    .toArray(), [currentBusiness, mode]) || [];

  const isPaymentIn = mode === 'payment-in';
  const accentColor = isPaymentIn ? theme.palette.success.main : theme.palette.warning.main;

  const selectedParty = useMemo(() => parties.find(p => p.id === formData.partyId), [formData.partyId, parties]);

  const filteredHistory = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.partyName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = t.date >= dateRange.start && t.date <= dateRange.end;
      return matchesSearch && matchesDate;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, searchQuery, dateRange]);

  const handleSave = async () => {
    if (!formData.partyId || !formData.amount) return;
    const amountNum = parseFloat(formData.amount);
    
    await db.transactions.add({
      businessId: currentBusiness.id, partyId: formData.partyId, partyName: selectedParty.name,
      type: isPaymentIn ? 'PaymentIn' : 'PaymentOut', totalAmount: amountNum,
      date: formData.date, paymentMode: formData.paymentMode,
      referenceNo: formData.referenceNo || `REF-${Date.now().toString().slice(-6)}`, notes: formData.notes
    });

    const newBalance = (selectedParty.balance || 0) + (isPaymentIn ? -amountNum : amountNum);
    await db.parties.update(formData.partyId, { balance: newBalance });
    setFormData({ ...formData, amount: '', referenceNo: '', notes: '' });
  };

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, md: 4 } }}>
      
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <ArrowLeft size={20} />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>{isPaymentIn ? 'Payment In' : 'Payment Out'}</Typography>
      </Stack>
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
            </Box>
            <TableContainer sx={{ flexGrow: 1 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Party</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Reference</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistory.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.date}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.partyName}</TableCell>
                      <TableCell color="text.secondary">{row.referenceNo}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: accentColor }}>₹{row.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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