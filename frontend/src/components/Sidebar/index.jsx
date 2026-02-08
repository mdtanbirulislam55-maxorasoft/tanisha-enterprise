// frontend/src/components/Sidebar/index.jsx
import React from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, IconButton, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import tanishaLogo from '../../assets/tanisha-logo.jpg';
import maxoraLogo from '../../assets/maxorasoft-logo.png';

const Sidebar = ({ mobileOpen, handleDrawerToggle, collapsed, setCollapsed, drawerWidth, collapsedDrawerWidth }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { language } = useLanguage();

  const menuItems = [
    { text: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: language === 'bn' ? 'বিক্রয়' : 'Sales', icon: <PointOfSaleIcon />, path: '/sales' },
    { text: language === 'bn' ? 'ক্রয়' : 'Purchase', icon: <ShoppingCartIcon />, path: '/purchase' },

    // If you don't have these pages yet, keep them but expect 404 routes.
    { text: language === 'bn' ? 'সার্ভিসিং' : 'Servicing', icon: <BuildIcon />, path: '/servicing/requests' },
    { text: language === 'bn' ? 'স্টক' : 'Stock', icon: <InventoryIcon />, path: '/stock/current' },

    { text: language === 'bn' ? 'পণ্য' : 'Products', icon: <InventoryIcon />, path: '/products' },
    { text: language === 'bn' ? 'গ্রাহক' : 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { text: language === 'bn' ? 'রিপোর্ট' : 'Reports', icon: <AssessmentIcon />, path: '/reports/sales' },
    { text: language === 'bn' ? 'সেটিংস' : 'Settings', icon: <SettingsIcon />, path: '/settings/company' },
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          component="img"
          src={tanishaLogo}
          alt="Tanisha Enterprise"
          sx={{
            width: collapsed ? 48 : 52,
            height: collapsed ? 48 : 52,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 6px 18px rgba(0,0,0,0.35)'
              : '0 6px 18px rgba(0,0,0,0.12)',
          }}
        />
        {!collapsed && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Tanisha ERP
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Premium Business Suite
            </Typography>
          </Box>
        )}
        <IconButton
          size="small"
          onClick={() => setCollapsed(!collapsed)}
          sx={{ display: { xs: 'none', md: 'inline-flex' } }}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* Menu Items */}
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              mb: 1,
              mx: collapsed ? 1 : 2,
              borderRadius: 2,
              justifyContent: collapsed ? 'center' : 'flex-start',
              backgroundColor: location.pathname === item.path ? 'primary.main' : 'transparent',
              color: location.pathname === item.path ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: location.pathname === item.path ? 'primary.dark' : 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : 'inherit', minWidth: collapsed ? 'auto' : 40 }}>
              {item.icon}
            </ListItemIcon>
            {!collapsed && <ListItemText primary={item.text} />}
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mx: 2, mb: 1 }} />

      {/* Credit Footer */}
      {!collapsed && (
        <Box sx={{ px: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="img"
            src={maxoraLogo}
            alt="MaxoraSoft"
            sx={{ width: 24, height: 24 }}
          />
          <Typography variant="caption" color="text.secondary">
            Prepared by Engr. Tanbir Rifat | MaxoraSoft
          </Typography>
        </Box>
      )}

      {/* Logout Section */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItem
          button
          onClick={async () => {
            await logout(true);
            navigate('/login', { replace: true });
          }}
          sx={{
            borderRadius: 2,
            justifyContent: collapsed ? 'center' : 'flex-start',
            '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText' },
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          {!collapsed && <ListItemText primary={language === 'bn' ? 'লগআউট' : 'Logout'} />}
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: collapsed ? collapsedDrawerWidth : drawerWidth,
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.shorter,
            }),
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
