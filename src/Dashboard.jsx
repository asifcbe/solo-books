import React, { useMemo } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, 
  useTheme, Stack, Button, alpha, Divider, Menu, MenuItem,
  ToggleButtonGroup, ToggleButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, 
  Plus, FileText, Wallet, ReceiptText, ShoppingBag, Download, Upload, DollarSign, TrendingUp
} from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useData } from './DataContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const MetricCard = ({ title, value, trend, trendLabel, icon: Icon, colorKey = "primary" }) => {
  const theme = useTheme();
  const mainColor = theme.palette[colorKey]?.main || theme.palette.primary.main;

  return (
    <Card 
      elevation={0} 
      sx={{ 
        borderRadius: 2, 
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: theme.shadows[2],
          transform: 'translateY(-2px)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: mainColor,
          opacity: 0.8,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, pl: 3, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mt: 0.5, fontSize: { xs: '1.25rem', sm: '1.35rem' } }}>
              ₹{value?.toLocaleString() || '0'}
            </Typography>
            {trend !== undefined && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
                <Box sx={{ 
                  display: 'flex', p: 0.35, borderRadius: 1, 
                  bgcolor: trend >= 0 ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.error.main, 0.15),
                  color: trend >= 0 ? 'success.main' : 'error.main' 
                }}>
                  {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </Box>
                <Typography variant="caption" sx={{ color: trend >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>
                  {Math.abs(trend).toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>{trendLabel}</Typography>
              </Stack>
            )}
          </Box>
          <Box sx={{ bgcolor: alpha(mainColor, 0.12), color: mainColor, p: 1.25, borderRadius: 2 }}>
            <Icon size={24} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const { currentBusiness } = useBusiness();
  const { getItems } = useData();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [period, setPeriod] = React.useState('week'); // 'day' | 'week' | 'month' | 'year'

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuItemClick = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const salesData = getItems('sales').filter(s => s.businessId === currentBusiness?.id);
  const purchasesData = getItems('purchases').filter(p => p.businessId === currentBusiness?.id);
  const transactions = [
    ...salesData.map(s => ({ ...s, type: 'Sales' })),
    ...purchasesData.map(p => ({ ...p, type: 'Purchases' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  const expenses = getItems('expenses').filter(e => e.businessId === currentBusiness?.id);
  const parties = getItems('parties').filter(p => p.businessId === currentBusiness?.id);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dayMs = 24 * 60 * 60 * 1000;

    let periodStart, periodEnd, prevPeriodStart, prevPeriodEnd;
    if (period === 'day') {
      periodStart = todayStart;
      periodEnd = todayEnd;
      prevPeriodStart = new Date(todayStart.getTime() - dayMs);
      prevPeriodEnd = new Date(todayEnd.getTime() - dayMs);
    } else if (period === 'week') {
      periodEnd = new Date(now);
      periodEnd.setHours(23, 59, 59, 999);
      periodStart = new Date(periodEnd.getTime() - 6 * dayMs);
      periodStart.setHours(0, 0, 0, 0);
      prevPeriodEnd = new Date(periodStart.getTime() - 1);
      prevPeriodStart = new Date(prevPeriodEnd.getTime() - 6 * dayMs);
      prevPeriodStart.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      periodEnd = new Date(now);
      periodEnd.setHours(23, 59, 59, 999);
      periodStart = new Date(periodEnd.getTime() - 29 * dayMs);
      periodStart.setHours(0, 0, 0, 0);
      prevPeriodEnd = new Date(periodStart.getTime() - 1);
      prevPeriodStart = new Date(prevPeriodEnd.getTime() - 29 * dayMs);
      prevPeriodStart.setHours(0, 0, 0, 0);
    } else {
      periodEnd = new Date(now);
      periodEnd.setHours(23, 59, 59, 999);
      periodStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      prevPeriodEnd = new Date(periodStart.getTime() - 1);
      prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 23, 1);
    }

    const inPeriod = (d) => {
      const t = new Date(d + 'T12:00:00');
      return t >= periodStart && t <= periodEnd;
    };
    const inPrevPeriod = (d) => {
      const t = new Date(d + 'T12:00:00');
      return t >= prevPeriodStart && t <= prevPeriodEnd;
    };

    const getAmount = (txs) => txs.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const sales = transactions.filter(t => t.type === 'Sales');
    const purchases = transactions.filter(t => t.type === 'Purchases');
    const currentSales = sales.filter(t => inPeriod(t.date));
    const prevSales = sales.filter(t => inPrevPeriod(t.date));
    const currentPurchases = purchases.filter(t => inPeriod(t.date));
    const prevPurchases = purchases.filter(t => inPrevPeriod(t.date));
    const calcTrend = (curr, prev) => {
      const c = getAmount(curr);
      const p = getAmount(prev);
      return p === 0 ? (c > 0 ? 100 : 0) : ((c - p) / p) * 100;
    };
    const pendingDues = parties.reduce((sum, p) => sum + (p.balance || 0), 0);
    const customers = parties.filter(p => p.type === 'Customer');
    const vendors = parties.filter(p => p.type === 'Vendor');
    const toGet = customers.reduce((sum, p) => sum + Math.max(0, p.balance || 0), 0);
    const toGive = vendors.reduce((sum, p) => sum + (p.balance < 0 ? -p.balance : 0), 0);
    const vendorsWithBalance = vendors.filter(v => (v.balance || 0) < 0).sort((a, b) => (a.balance || 0) - (b.balance || 0));
    const currentExpenses = expenses.filter(e => {
      const d = new Date(e.date + 'T12:00:00');
      return d >= periodStart && d <= periodEnd;
    });
    const totalExpenses = currentExpenses.reduce((sum, e) => sum + e.amount, 0);

    let chartData = [];
    if (period === 'day') {
      chartData = [{ label: 'Today', sales: getAmount(currentSales) }];
    } else if (period === 'week') {
      chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        return {
          label: d.toLocaleDateString(undefined, { weekday: 'short' }),
          sales: sales.filter(t => t.date === dateStr).reduce((sum, t) => sum + t.totalAmount, 0),
        };
      });
    } else if (period === 'month') {
      chartData = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const dateStr = d.toISOString().split('T')[0];
        return {
          label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
          sales: sales.filter(t => t.date === dateStr).reduce((sum, t) => sum + t.totalAmount, 0),
        };
      });
    } else {
      chartData = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthSales = sales.filter(t => {
          const txDate = new Date(t.date + 'T12:00:00');
          return txDate >= monthStart && txDate <= monthEnd;
        });
        return {
          label: monthStart.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
          sales: getAmount(monthSales),
        };
      });
    }

    return {
      totalSales: getAmount(currentSales),
      totalPurchases: getAmount(currentPurchases),
      salesTrend: calcTrend(currentSales, prevSales),
      purchaseTrend: calcTrend(currentPurchases, prevPurchases),
      pendingDues,
      toGet,
      toGive,
      vendorsWithBalance,
      totalExpenses,
      chartData,
      trendLabel: period === 'day' ? 'vs yesterday' : period === 'week' ? 'vs prev week' : period === 'month' ? 'vs prev 30d' : 'vs prev year',
    };
  }, [transactions, parties, expenses, period]);

  const recentTx = useMemo(() => {
    if (!period || period === 'year') return transactions.slice(0, 5);
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let periodStart;
    if (period === 'day') periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (period === 'week') periodStart = new Date(todayEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
    else periodStart = new Date(todayEnd.getTime() - 29 * 24 * 60 * 60 * 1000);
    return transactions
      .filter(t => {
        const d = new Date(t.date + 'T12:00:00');
        return d >= periodStart && d <= todayEnd;
      })
      .slice(0, 5);
  }, [transactions, period]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
      {/* Header: responsive stack */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        sx={{ mb: 3, gap: 2 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '1.75rem' }, color: 'text.primary' }}>
            Overview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {currentBusiness?.name || 'Your business'}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(e, v) => v != null && setPeriod(v)}
            size="small"
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, px: 1.5, py: 0.75 } }}
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="year">Year</ToggleButton>
          </ToggleButtonGroup>
          <Button 
            variant="contained" 
            size="medium"
            startIcon={<Plus size={18} />} 
            sx={{ 
              textTransform: 'none', 
              fontWeight: 700, 
              fontSize: '0.9375rem',
              borderRadius: 2,
              px: 2.5,
              boxShadow: 2,
            }}
            onClick={handleMenuOpen}
          >
            Add Entry
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { borderRadius: 2, mt: 1.5, minWidth: 220 } }}
          >
            <MenuItem dense onClick={() => handleMenuItemClick('/sales')}><ReceiptText size={16} style={{ marginRight: 10 }} /> New Sales Invoice</MenuItem>
            <MenuItem dense onClick={() => handleMenuItemClick('/purchases')}><ShoppingBag size={16} style={{ marginRight: 10 }} /> New Purchase Bill</MenuItem>
            <MenuItem dense onClick={() => handleMenuItemClick('/expenses')}><DollarSign size={16} style={{ marginRight: 10 }} /> Add Expense</MenuItem>
            <MenuItem dense onClick={() => handleMenuItemClick('/payment-in')}><Download size={16} style={{ marginRight: 10 }} /> Payment Received</MenuItem>
            <MenuItem dense onClick={() => handleMenuItemClick('/payment-out')}><Upload size={16} style={{ marginRight: 10 }} /> Payment Made</MenuItem>
          </Menu>
        </Stack>
      </Stack>

      {/* Metric cards: 5 cards - Sales, Purchases, To Get, To Give, Expenses */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard title="Total Sales" value={stats.totalSales} trend={stats.salesTrend} trendLabel={stats.trendLabel} icon={TrendingUp} colorKey="primary" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard title="Total Purchases" value={stats.totalPurchases} trend={stats.purchaseTrend} trendLabel={stats.trendLabel} icon={FileText} colorKey="error" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard title="To Get" value={stats.toGet} icon={Download} colorKey="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard title="To Give" value={stats.toGive} icon={Upload} colorKey="warning" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard title="Total Expenses" value={stats.totalExpenses} icon={DollarSign} colorKey="secondary" />
        </Grid>
      </Grid>

      {/* Chart + Recent */}
      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'divider',
              overflow: 'hidden',
              height: '100%',
            }}
          >
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp size={20} color={theme.palette.primary.main} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                {period === 'day' ? 'Daily' : period === 'week' ? 'Weekly' : period === 'month' ? 'Last 30 days' : 'Last 12 months'} Revenue
              </Typography>
            </Box>
            <Box sx={{ p: 2, height: { xs: 260, sm: 280 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.25}/>
                      <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 8, fontSize: 13, boxShadow: theme.shadows[3] }} 
                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="sales" stroke={theme.palette.primary.main} strokeWidth={2.5} fill="url(#chartGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              height: '100%',
              minHeight: { xs: 320, lg: 'auto' },
            }}
          >
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptText size={20} color={theme.palette.text.secondary} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>Recent Transactions</Typography>
            </Box>
            <Stack spacing={0}>
              {recentTx.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No transactions yet</Typography>
                </Box>
              ) : (
                recentTx.map((tx, idx) => (
                  <Box key={tx.id}>
                    <Stack 
                      direction="row" 
                      alignItems="center" 
                      spacing={2} 
                      sx={{ 
                        px: 2, 
                        py: 1.5, 
                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) },
                        cursor: 'pointer',
                      }}
                    >
                      <Box sx={{ 
                        bgcolor: alpha(tx.type === 'Sales' ? theme.palette.success.main : theme.palette.error.main, 0.12), 
                        color: tx.type === 'Sales' ? 'success.main' : 'error.main', 
                        borderRadius: 1.5, 
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <FileText size={18} />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }} noWrap>{tx.partyName}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>{tx.date}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: tx.type === 'Sales' ? 'success.main' : 'text.primary', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        {tx.type === 'Sales' ? '+' : '-'}₹{tx.totalAmount?.toLocaleString() ?? '0'}
                      </Typography>
                    </Stack>
                    {idx < recentTx.length - 1 && <Divider sx={{ mx: 2 }} />}
                  </Box>
                ))
              )}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* To Give - Vendors balance table */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mt: 2,
        }}
      >
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Upload size={20} color={theme.palette.warning.main} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>To Give – Vendor Balances</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Vendor</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Balance (₹ you owe)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.vendorsWithBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                    No vendor payables
                  </TableCell>
                </TableRow>
              ) : (
                stats.vendorsWithBalance.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{v.name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      ₹{((v.balance || 0) < 0 ? -v.balance : 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default Dashboard;
