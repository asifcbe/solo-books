import React, { useMemo } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { useBusiness } from './BusinessContext';
import { useData } from './DataContext';

const ReportsPage = () => {
  const { currentBusiness } = useBusiness();
  const { getItems } = useData();
  
  const transactions = getItems('transactions', { businessId: currentBusiness?.id || 0 });

  const gstSummary = useMemo(() => {
    const summary = {};
    transactions.forEach(tx => {
      tx.items.forEach(item => {
        const rate = item.taxRate || 0;
        if (!summary[rate]) summary[rate] = { taxableValue: 0, taxAmount: 0 };
        const taxable = item.qty * item.price;
        const tax = taxable * (rate / 100);
        summary[rate].taxableValue += taxable;
        summary[rate].taxAmount += tax;
      });
    });
    return summary;
  }, [transactions]);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 4 }}>Reports</Typography>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>GST Summary (Sales)</Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Tax Rate (%)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Taxable Value</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">CGST</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">SGST</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Total Tax</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(gstSummary).map(([rate, data]) => (
                      <TableRow key={rate}>
                        <TableCell>{rate}%</TableCell>
                        <TableCell align="right">₹{data.taxableValue.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{(data.taxAmount / 2).toFixed(2)}</TableCell>
                        <TableCell align="right">₹{(data.taxAmount / 2).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Chip label={`₹${data.taxAmount.toFixed(2)}`} size="small" color="primary" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {Object.keys(gstSummary).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>No data found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;
