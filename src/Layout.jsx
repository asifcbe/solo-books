import React, { useState } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem, 
  Tooltip, useTheme, useMediaQuery
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
  Upload
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBusiness } from './BusinessContext';

const drawerWidth = 260;

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentBusiness, businesses, switchBusiness } = useBusiness();

  const handleDrawerToggle = () => setOpen(!open);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { text: 'Parties', icon: <Users size={20} />, path: '/parties' },
    { text: 'Items', icon: <Package size={20} />, path: '/items' },
    { text: 'Sales', icon: <ReceiptText size={20} />, path: '/sales' },
    { text: 'Purchases', icon: <ShoppingBag size={20} />, path: '/purchases' },
    { text: 'Payments', icon: <Download size={20} />, path: '/payment-in' },
    { text: 'Reports', icon: <FileText size={20} />, path: '/reports' },
    { text: 'Backup/Restore', icon: <Database size={20} />, path: '/backup' },
    { text: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  // { text: 'Payment Out', icon: <Upload size={20} />, path: '/payment-out' },
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
          <MenuItem key={biz.id} onClick={() => { switchBusiness(biz.id); handleMenuClose(); }}>
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { md: `${open ? drawerWidth : 0}px` },
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
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: open ? 'none' : 'inline-flex' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            {menuItems.find(i => i.path === location.pathname)?.text || 'Accounting'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: open ? drawerWidth : 0 }, flexShrink: { md: 0 }, transition: 'width 0.3s' }}
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
          p: 3,
          width: { md: `calc(100% - ${open ? drawerWidth : 0}px)` },
          mt: 8,
          transition: 'margin 0.3s',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
