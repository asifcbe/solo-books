import React, { forwardRef } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Grid } from '@mui/material';

const InvoiceTemplate = forwardRef(({ transaction, business }, ref) => {
  if (!transaction || !business) return null;

  const isSale = transaction.type === 'Sales';

  return (
    <Box ref={ref} sx={{ p: 6, bgcolor: 'white', color: 'black', width: '210mm', minHeight: '297mm', mx: 'auto', border: '1px solid #eee' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
            {business.name}
          </Typography>
          <Typography variant="body2">{business.address}</Typography>
          <Typography variant="body2">Phone: {business.phone}</Typography>
          {business.gstNumber && <Typography variant="body2">GSTIN: {business.gstNumber}</Typography>}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {isSale ? 'TAX INVOICE' : 'PURCHASE BILL'}
          </Typography>
          <Typography variant="body2"># {transaction.invoiceNumber}</Typography>
          <Typography variant="body2">Date: {transaction.date}</Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Bill To / From */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
          {isSale ? 'Bill To:' : 'Vendor Details:'}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{transaction.partyName}</Typography>
        {/* We could fetch party details if needed, but for now we use what's in tx */}
      </Box>

      {/* Items Table */}
      <TableContainer>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f3f4f6' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Item Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Rate</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">GST %</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transaction.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                <TableCell align="right">{item.qty}</TableCell>
                <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                <TableCell align="right">{item.taxRate}%</TableCell>
                <TableCell align="right">₹{item.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ width: 250 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Subtotal</Typography>
            <Typography variant="body2">₹{transaction.subtotal?.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Tax Amount</Typography>
            <Typography variant="body2">₹{transaction.taxAmount?.toFixed(2)}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Total</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
              ₹{transaction.totalAmount?.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 'auto', pt: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">Terms & Conditions:</Typography>
            <Typography variant="caption" color="text.secondary">
              1. Goods once sold will not be taken back.<br />
              2. Interest @ 18% will be charged if payment is not made within 7 days.
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Box sx={{ height: 60 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>For {business.name}</Typography>
            <Typography variant="caption" color="text.secondary">Authorized Signatory</Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
});

export default InvoiceTemplate;
