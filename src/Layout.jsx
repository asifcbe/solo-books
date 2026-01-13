import React, { useState } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem, 
  Tooltip, useTheme, useMediaQuery, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Alert
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  LayoutDashboard, 
  Users, 
  Package, 
  ReceiptText, 
  ShoppingBag, 
  FileText, 
  Settings, 
  Database,
  ChevronLeft,
  Store,
  Plus,
  Download,
  Upload,
  DollarSign,
  Eye
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBusiness } from './BusinessContext';
import { useAuth } from './AuthContext';
import { useConfig } from './ConfigContext';

const drawerWidth = 260;

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [passwordDialog, setPasswordDialog] = useState({ open: false, business: null, password: '', error: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const { currentBusiness, businesses, switchBusiness } = useBusiness();
  const { logout, currentUser } = useAuth();
  const { config } = useConfig();

  const handleDrawerToggle = () => setOpen(!open);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const menuItems = [
    ...(config.features?.dashboard ? [{ text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' }] : []),
    ...(config.features?.parties ? [{ text: 'Parties', icon: <Users size={20} />, path: '/parties' }] : []),
    ...(config.features?.items ? [{ text: 'Items', icon: <Package size={20} />, path: '/items' }] : []),
    ...(config.features?.sales ? [{ text: 'Sales', icon: <ReceiptText size={20} />, path: '/sales' }] : []),
    ...(config.features?.purchases ? [{ text: 'Purchases', icon: <ShoppingBag size={20} />, path: '/purchases' }] : []),
    ...(config.features?.expenses ? [{ text: 'Expenses', icon: <DollarSign size={20} />, path: '/expenses' }] : []),
    ...(config.features?.opticals && config.businessType === 'opticals' ? [{ text: 'Opticals', icon: <Eye size={20} />, path: '/opticals' }] : []),
    ...(config.features?.payments ? [{ text: 'Payments', icon: <Download size={20} />, path: '/payment-in' }] : []),
    ...(config.features?.reports ? [{ text: 'Reports', icon: <FileText size={20} />, path: '/reports' }] : []),
    ...(config.features?.backup ? [{ text: 'Backup/Restore', icon: <Database size={20} />, path: '/backup' }] : []),
    ...(config.features?.settings ? [{ text: 'Settings', icon: <Settings size={20} />, path: '/settings' }] : []),
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: [1], display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', ml: 1 }}>
          Solo Books
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <ChevronLeft />
        </IconButton>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{ 
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.main' },
                  '& .MuiListItemIcon-root': { color: 'inherit' }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? 'inherit' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <ListItemButton 
          onClick={handleMenuOpen}
          sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Store size={20} />
          </ListItemIcon>
          <ListItemText 
            primary={currentBusiness?.name || 'Select Business'} 
            secondary="Switch Business"
            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600, noWrap: true }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </ListItemButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {businesses.map((biz) => (
          <MenuItem key={biz.id} onClick={() => { 
            if (biz.id === currentBusiness?.id) {
              handleMenuClose();
              return;
            }
            setPasswordDialog({ open: true, business: biz, password: '', error: '' }); 
            handleMenuClose(); 
          }}>
            {biz.name}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
          <ListItemIcon><Plus size={18} /></ListItemIcon>
          Add New Business
        </MenuItem>
      </Menu>
    </Box>
  );

  const handlePasswordSubmit = () => {
    if (passwordDialog.business && passwordDialog.business.password === passwordDialog.password) {
      switchBusiness(passwordDialog.business.id);
      setPasswordDialog({ open: false, business: null, password: '', error: '' });
    } else {
      setPasswordDialog({ ...passwordDialog, error: 'Incorrect password' });
    }
  };

  const handlePasswordClose = () => {
    setPasswordDialog({ open: false, business: null, password: '', error: '' });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { xs: '100%', md: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { xs: 0, md: `${open ? drawerWidth : 0}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { xs: open ? 'none' : 'inline-flex', md: open ? 'none' : 'inline-flex' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' }, flexGrow: 1 }}>
            {menuItems.find(i => i.path === location.pathname)?.text || 'Accounting'}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
            {currentUser?.username} @ {currentBusiness?.name}
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={logout}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { xs: open ? drawerWidth : 0, md: open ? drawerWidth : 0 }, flexShrink: { md: 0 }, transition: 'width 0.3s' }}
      >
        <Drawer
          variant={isMobile ? "temporary" : "persistent"}
          open={open}
          onClose={handleDrawerToggle}
          sx={{
            '& .MuiDrawer-paper': { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none'
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { xs: '100%', md: `calc(100% - ${open ? drawerWidth : 0}px)` },
          mt: { xs: 7, sm: 8 },
          transition: 'margin 0.3s',
        }}
      >
        {children}
      </Box>

      {/* Password Dialog for Business Switching */}
      <Dialog open={passwordDialog.open} onClose={handlePasswordClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Switch to {passwordDialog.business?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the password for this business to switch to it.
          </Typography>
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={passwordDialog.password}
            onChange={(e) => setPasswordDialog({ ...passwordDialog, password: e.target.value, error: '' })}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handlePasswordSubmit();
              }
            }}
            error={!!passwordDialog.error}
            helperText={passwordDialog.error}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordClose}>Cancel</Button>
          <Button onClick={handlePasswordSubmit} variant="contained">
            Switch Business
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;
