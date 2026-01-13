import React, { useMemo } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Avatar, 
  useTheme, Stack, Button, alpha, IconButton, Divider, Menu, MenuItem
} from '@mui/material';
import { 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, 
  Plus, FileText, Users, Settings, 
  ChevronRight, Calendar, Wallet, ReceiptText, ShoppingBag, Download, Upload, DollarSign
} from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useData } from './DataContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const MetricCard = ({ title, value, trend, icon: Icon, colorKey = "primary" }) => {
  const theme = useTheme();
  const mainColor = theme.palette[colorKey].main;

  return (
    <Card 
      elevation={0} 
      sx={{ 
        borderRadius: 4, 
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        height: '100%'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800, mt: 0.5 }}>
              ₹{value?.toLocaleString() || '0'}
            </Typography>
            {trend !== undefined && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                <Box sx={{ 
                  display: 'flex', p: 0.5, borderRadius: 1, 
                  bgcolor: trend >= 0 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                  color: trend >= 0 ? 'success.main' : 'error.main' 
                }}>
                  {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </Box>
                <Typography variant="caption" sx={{ color: trend >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>
                  {Math.abs(trend).toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>vs prev. week</Typography>
              </Stack>
            )}
          </Box>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, width: 48, height: 48 }}>
            <Icon size={24} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
};
const flipSign = (value) => -value;
const Dashboard = () => {
  const theme = useTheme();
  const { currentBusiness } = useBusiness();
  const { getItems } = useData();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMenuItemClick = (path) => {
    navigate(path);
    handleMenuClose();
  };

  // Database Queries
  const transactions = getItems('transactions', { businessId: currentBusiness?.id || 0 });
  const expenses = getItems('expenses', { businessId: currentBusiness?.id || 0 });
  const parties = getItems('parties', { businessId: currentBusiness?.id || 0 });

  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const getAmount = (txs) => txs.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    // Split Transactions by Time & Type
    const sales = transactions.filter(t => t.type === 'Sales');
    const purchases = transactions.filter(t => t.type === 'Purchases');

    const currentSales = sales.filter(t => new Date(t.date) >= oneWeekAgo);
    const prevSales = sales.filter(t => new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo);
    
    const currentPurchases = purchases.filter(t => new Date(t.date) >= oneWeekAgo);
    const prevPurchases = purchases.filter(t => new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo);

    // Calculate Percentages
    const calcTrend = (curr, prev) => {
      const c = getAmount(curr);
      const p = getAmount(prev);
      return p === 0 ? 0 : ((c - p) / p) * 100;
    };

    // Pending Dues (Net balance of all parties)
    const pendingDues = parties.reduce((sum, p) => sum + (p.balance || 0), 0);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      return {
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        sales: sales.filter(t => t.date === dateStr).reduce((sum, t) => sum + t.totalAmount, 0),
      };
    }).reverse();

    return {
      totalSales: getAmount(sales),
      totalPurchases: getAmount(purchases),
      salesTrend: calcTrend(currentSales, prevSales),
      purchaseTrend: calcTrend(currentPurchases, prevPurchases),
      pendingDues,
      totalExpenses,
      chartData
    };
  }, [transactions, parties, expenses]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 1, sm: 2, md: 4 } }}>
      
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: 2, md: 4 } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>Overview</Typography>
          <Typography variant="body2" color="text.secondary">Real-time performance for {currentBusiness?.name}</Typography>
        </Box>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<Plus size={18} />} 
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
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
          >
            <MenuItem onClick={() => handleMenuItemClick('/sales')}>
              <ReceiptText size={18} style={{ marginRight: 8 }} />
              New Sales Invoice
            </MenuItem>
            <MenuItem onClick={() => handleMenuItemClick('/purchases')}>
              <ShoppingBag size={18} style={{ marginRight: 8 }} />
              New Purchase Bill
            </MenuItem>
            <MenuItem onClick={() => handleMenuItemClick('/expenses')}>
              <DollarSign size={18} style={{ marginRight: 8 }} />
              Add Expense
            </MenuItem>
            <MenuItem onClick={() => handleMenuItemClick('/payment-in')}>
              <Download size={18} style={{ marginRight: 8 }} />
              Payment Received
            </MenuItem>
            <MenuItem onClick={() => handleMenuItemClick('/payment-out')}>
              <Upload size={18} style={{ marginRight: 8 }} />
              Payment Made
            </MenuItem>
          </Menu>
        </Box>
      </Stack>

      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Total Sales" value={stats.totalSales} trend={stats.salesTrend} icon={LayoutDashboard} colorKey="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Total Purchases" value={stats.totalPurchases} trend={stats.purchaseTrend} icon={FileText} colorKey="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Net Pending" value={stats.pendingDues} icon={Wallet} colorKey="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Total Expenses" value={stats.totalExpenses} icon={DollarSign} colorKey="secondary" />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Weekly Revenue Trend</Typography>
            </Box>
            <Box sx={{ p: { xs: 2, md: 3 }, height: { xs: 250, md: 350 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: theme.shadows[3] }} />
                  <Area type="monotone" dataKey="sales" stroke={theme.palette.primary.main} strokeWidth={3} fill="url(#chartGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: { xs: 'auto', lg: '100%' } }}>
            <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Recent Ledger</Typography>
            </Box>
            <Stack spacing={0}>
              {transactions.slice(-5).reverse().map((tx, idx) => (
                <Box key={tx.id}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ p: { xs: 1.5, md: 2 }, '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) } }}>
                    <Avatar sx={{ bgcolor: alpha(tx.type === 'Sales' ? theme.palette.success.main : theme.palette.error.main, 0.1), color: tx.type === 'Sales' ? 'success.main' : 'error.main', borderRadius: 2, width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                      <FileText size={18} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', md: '0.875rem' } }} noWrap>{tx.partyName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: { xs: '0.625rem', md: '0.75rem' } }}>{tx.date}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: tx.type === 'Sales' ? 'success.main' : 'text.primary', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      {tx.type === 'Sales' ? '+' : '-'}₹{tx.totalAmount.toLocaleString()}
                    </Typography>
                  </Stack>
                  {idx < 4 && <Divider sx={{ mx: { xs: 1, md: 2 } }} />}
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;