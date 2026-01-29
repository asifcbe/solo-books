import React, { useState, useMemo, useRef } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  TextField, MenuItem, Button, Stack, Tabs, Tab, InputAdornment,
  Autocomplete, Divider, alpha
} from '@mui/material';
import { 
  FileText, Filter, Printer, Download, Search, Share2, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Receipt
} from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useData } from './DataContext';
import { useReactToPrint } from 'react-to-print';
import ReportTemplate from './ReportTemplate';

const ReportsPage = () => {
  const { currentBusiness } = useBusiness();
  const { getItems } = useData();
  const reportRef = useRef();
  const [paperSize, setPaperSize] = useState('A4');
  
  // States
  const [reportType, setReportType] = useState('sales'); // sales, purchases, items-sales, items-purchase, gst
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    partyId: '',
    itemId: ''
  });

  // Data
  const sales = getItems('sales').filter(s => s.businessId === currentBusiness?.id);
  const purchases = getItems('purchases').filter(p => p.businessId === currentBusiness?.id);
  const parties = getItems('parties').filter(p => p.businessId === currentBusiness?.id);
  const items = getItems('items').filter(i => i.businessId === currentBusiness?.id);

  const filteredData = useMemo(() => {
    let data = [];
    if (reportType === 'sales' || reportType === 'items-sales') data = sales;
    if (reportType === 'purchases' || reportType === 'items-purchase') data = purchases;
    
    return data.filter(tx => {
      const matchesDate = tx.date >= filters.dateFrom && tx.date <= filters.dateTo;
      const matchesParty = !filters.partyId || tx.partyId === filters.partyId;
      const matchesItem = !filters.itemId || tx.items.some(i => i.itemId === filters.itemId);
      return matchesDate && matchesParty && matchesItem;
    });
  }, [reportType, sales, purchases, filters]);

  // Specific Report Generation Logic
  const reportConfig = useMemo(() => {
    const config = {
      title: '',
      columns: [],
      rows: [],
      totals: {}
    };

    if (reportType === 'sales' || reportType === 'purchases') {
      config.title = reportType === 'sales' ? 'Sales Detail Report' : 'Purchase Detail Report';
      config.columns = [
        { key: 'date', header: 'Date' },
        { key: 'invoiceNumber', header: 'Invoice #' },
        { key: 'partyName', header: reportType === 'sales' ? 'Customer' : 'Vendor' },
        { key: 'subtotal', header: 'Subtotal', align: 'right', isTotal: true },
        { key: 'taxAmount', header: 'Tax', align: 'right', isTotal: true },
        { key: 'totalAmount', header: 'Total', align: 'right', isTotal: true }
      ];
      config.rows = filteredData.map(tx => ({
        ...tx,
        subtotal: `₹${tx.subtotal.toFixed(2)}`,
        taxAmount: `₹${tx.taxAmount.toFixed(2)}`,
        totalAmount: `₹${tx.totalAmount.toFixed(2)}`
      }));
      config.totals = {
        subtotal: filteredData.reduce((s, tx) => s + tx.subtotal, 0),
        taxAmount: filteredData.reduce((s, tx) => s + tx.taxAmount, 0),
        totalAmount: filteredData.reduce((s, tx) => s + tx.totalAmount, 0)
      };
    } else if (reportType === 'items-sales' || reportType === 'items-purchase') {
      config.title = reportType === 'items-sales' ? 'Item-wise Sales Report' : 'Item-wise Purchase Report';
      config.columns = [
        { key: 'itemName', header: 'Item Name' },
        { key: 'qty', header: 'Qty Sold', align: 'right', isTotal: true },
        { key: 'avgPrice', header: 'Avg Price', align: 'right' },
        { key: 'totalAmount', header: 'Total Value', align: 'right', isTotal: true }
      ];
      
      const itemStats = {};
      filteredData.forEach(tx => {
        tx.items.forEach(item => {
          if (filters.itemId && item.itemId !== filters.itemId) return;
          if (!itemStats[item.itemId]) {
            itemStats[item.itemId] = { itemName: item.name, qty: 0, totalAmount: 0 };
          }
          itemStats[item.itemId].qty += item.qty;
          itemStats[item.itemId].totalAmount += (item.qty * item.price);
        });
      });

      config.rows = Object.values(itemStats).map(stat => ({
        ...stat,
        avgPrice: `₹${(stat.totalAmount / stat.qty).toFixed(2)}`,
        qty: stat.qty.toString(),
        totalAmount: `₹${stat.totalAmount.toFixed(2)}`
      }));

      config.totals = {
        qty: Object.values(itemStats).reduce((s, i) => s + i.qty, 0),
        totalAmount: Object.values(itemStats).reduce((s, i) => s + i.totalAmount, 0)
      };
    } else if (reportType === 'gst') {
      config.title = 'GST Summary (Sales)';
      config.columns = [
        { key: 'taxRate', header: 'Tax Rate (%)' },
        { key: 'taxableValue', header: 'Taxable Value', align: 'right', isTotal: true },
        { key: 'cgst', header: 'CGST (2.5% / 6% / 9%)', align: 'right', isTotal: true },
        { key: 'sgst', header: 'SGST (2.5% / 6% / 9%)', align: 'right', isTotal: true },
        { key: 'taxAmount', header: 'Total GST', align: 'right', isTotal: true }
      ];

      const gstStats = {};
      sales.filter(tx => tx.date >= filters.dateFrom && tx.date <= filters.dateTo).forEach(tx => {
        tx.items.forEach(item => {
          const rate = item.taxRate || 0;
          if (!gstStats[rate]) gstStats[rate] = { taxRate: `${rate}%`, taxableValue: 0, taxAmount: 0 };
          const taxable = item.qty * item.price;
          const tax = taxable * (rate / 100);
          gstStats[rate].taxableValue += taxable;
          gstStats[rate].taxAmount += tax;
        });
      });

      config.rows = Object.values(gstStats).map(stat => ({
        ...stat,
        taxableValue: `₹${stat.taxableValue.toFixed(2)}`,
        cgst: `₹${(stat.taxAmount / 2).toFixed(2)}`,
        sgst: `₹${(stat.taxAmount / 2).toFixed(2)}`,
        taxAmount: `₹${stat.taxAmount.toFixed(2)}`
      }));

      config.totals = {
        taxableValue: Object.values(gstStats).reduce((s, i) => s + i.taxableValue, 0),
        cgst: Object.values(gstStats).reduce((s, i) => s + i.taxAmount / 2, 0),
        sgst: Object.values(gstStats).reduce((s, i) => s + i.taxAmount / 2, 0),
        taxAmount: Object.values(gstStats).reduce((s, i) => s + i.taxAmount, 0)
      };
    }

    return config;
  }, [reportType, filteredData, filters.itemId]);

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
  });

  const handleShare = () => {
    const text = `*Report from ${currentBusiness?.name || 'Solo Books'}*\n\n` +
      `Report: ${reportConfig.title}\n` +
      `Date Range: ${filters.dateFrom} to ${filters.dateTo}\n\n` +
      `Shared via Solo Books`;
    
    if (navigator.share) {
      navigator.share({ title: reportConfig.title, text }).catch(e => console.error(e));
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 5 }}>
      {/* Hidden Print Template */}
      <Box sx={{ display: 'none' }}>
        <ReportTemplate 
          ref={reportRef}
          title={reportConfig.title}
          business={currentBusiness}
          filters={{
            ...filters,
            partyName: parties.find(p => p.id === filters.partyId)?.name,
            itemName: items.find(i => i.id === filters.itemId)?.name
          }}
          reportData={reportConfig}
          paperSize={paperSize}
        />
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Business Reports</Typography>
          <Typography variant="body1" color="text.secondary">
            Generate and print detailed financial reports.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
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
            startIcon={<Printer size={20} />}
            onClick={handlePrint}
            sx={{ borderRadius: 2.5, px: 3 }}
          >
            Print Report
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Share2 size={20} />}
            onClick={handleShare}
            sx={{ borderRadius: 2.5, px: 3, color: '#25D366', borderColor: '#25D366', '&:hover': { borderColor: '#128C7E', bgcolor: 'rgba(37, 211, 102, 0.04)' } }}
          >
            Share
          </Button>
        </Stack>
      </Stack>

      {/* Filter Card */}
      <Card sx={{ mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Filter size={20} color={alpha('#4f46e5', 0.7)} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Customize Report</Typography>
          </Stack>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField 
                fullWidth label="From Date" type="date" value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField 
                fullWidth label="To Date" type="date" value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={parties}
                getOptionLabel={(option) => option.name}
                value={parties.find(p => p.id === filters.partyId) || null}
                onChange={(e, v) => setFilters({...filters, partyId: v?.id || ''})}
                renderInput={(params) => <TextField {...params} label="Filter by Party" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={items}
                getOptionLabel={(option) => option.name}
                value={items.find(i => i.id === filters.itemId) || null}
                onChange={(e, v) => setFilters({...filters, itemId: v?.id || ''})}
                renderInput={(params) => <TextField {...params} label="Filter by Item" />}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={reportType} 
          onChange={(e, v) => setReportType(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="sales" label="Sales Details" icon={<TrendingUp size={18} />} iconPosition="start" />
          <Tab value="purchases" label="Purchase Details" icon={<Receipt size={18} />} iconPosition="start" />
          <Tab value="items-sales" label="Item-wise Sales" icon={<TrendingUp size={18} />} iconPosition="start" />
          <Tab value="items-purchase" label="Item-wise Purchases" icon={<Receipt size={18} />} iconPosition="start" />
          <Tab value="gst" label="GST Summary" icon={<FileText size={18} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Report View */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {reportConfig.columns.map((col, idx) => (
                <TableCell key={idx} align={col.align || 'left'} sx={{ fontWeight: 800 }}>
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {reportConfig.rows.map((row, rowIdx) => (
              <TableRow key={rowIdx} hover>
                {reportConfig.columns.map((col, colIdx) => (
                  <TableCell key={colIdx} align={col.align || 'left'}>
                    {row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {reportConfig.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={reportConfig.columns.length} align="center" sx={{ py: 8 }}>
                  <Stack alignItems="center" spacing={2} sx={{ opacity: 0.5 }}>
                    <Search size={48} />
                    <Typography variant="body1">No records found for the selected criteria</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {reportConfig.rows.length > 0 && (
            <TableHead sx={{ bgcolor: alpha('#4f46e5', 0.05) }}>
              <TableRow>
                {reportConfig.columns.map((col, idx) => (
                  <TableCell key={idx} align={col.align || 'left'} sx={{ fontWeight: 900, color: 'primary.main' }}>
                    {col.isTotal ? `₹${reportConfig.totals[col.key].toFixed(2)}` : idx === 0 ? 'TOTAL' : ''}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          )}
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReportsPage;

