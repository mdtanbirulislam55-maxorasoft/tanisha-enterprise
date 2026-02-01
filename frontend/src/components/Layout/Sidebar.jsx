import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Chip,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  PointOfSale as SalesIcon,
  Inventory as ProductsIcon,
  People as CustomersIcon,
  ShoppingCart as PurchaseIcon,
  Warehouse as StockIcon,
  Build as ServiceIcon,
  AccountBalance as AccountsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Business as BranchIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  Home as HomeIcon,
  Person,
  Notifications,
  Brightness4,
  Brightness7,
  Logout
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

const drawerWidth = 280;
const collapsedWidth = 80;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const { theme: appTheme, toggleTheme } = useCustomTheme();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState({
    sales: false,
    purchase: false,
    products: false,
    service: false,
    accounts: false,
    reports: false,
    settings: false,
    stock: false
  });

  const handleMenuClick = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      handleDrawerToggle();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
      exact: true,
      color: '#4caf50'
    },
    {
      text: 'Sales',
      icon: <SalesIcon />,
      subItems: [
        { text: 'Create Sale', path: '/sales/create' },
        { text: 'Sales List', path: '/sales' },
        { text: 'Sales Return', path: '/sales/return' },
        { text: 'Sales Report', path: '/reports/sales' }
      ],
      menu: 'sales',
      color: '#2196f3'
    },
    {
      text: 'Purchase',
      icon: <PurchaseIcon />,
      subItems: [
        { text: 'Create Purchase', path: '/purchase/create' },
        { text: 'Purchase List', path: '/purchase' },
        { text: 'Suppliers', path: '/suppliers' },
        { text: 'Purchase Return', path: '/purchase/return' }
      ],
      menu: 'purchase',
      color: '#ff9800'
    },
    {
      text: 'Servicing',
      icon: <ServiceIcon />,
      subItems: [
        { text: 'Service Requests', path: '/servicing/requests' },
        { text: 'Ongoing Services', path: '/servicing/ongoing' },
        { text: 'Completed Services', path: '/servicing/completed' },
        { text: 'Service Reports', path: '/servicing/reports' }
      ],
      menu: 'service',
      color: '#9c27b0'
    },
    {
      text: 'Products',
      icon: <ProductsIcon />,
      subItems: [
        { text: 'Product List', path: '/products' },
        { text: 'Add Product', path: '/products/add' },
        { text: 'Categories', path: '/products/categories' },
        { text: 'Brands', path: '/products/brands' }
      ],
      menu: 'products',
      color: '#f44336'
    },
    {
      text: 'Customers',
      icon: <CustomersIcon />,
      path: '/customers',
      color: '#673ab7'
    },
    {
      text: 'Stock',
      icon: <StockIcon />,
      subItems: [
        { text: 'Current Stock', path: '/stock' },
        { text: 'Stock Report', path: '/reports/inventory' },
        { text: 'Low Stock Alert', path: '/stock/alerts' },
        { text: 'Stock Transfer', path: '/stock/transfer' }
      ],
      menu: 'stock',
      color: '#795548'
    },
    {
      text: 'Accounts',
      icon: <AccountsIcon />,
      subItems: [
        { text: 'Journal Entry', path: '/accounts/journal' },
        { text: 'Ledger Report', path: '/accounts/ledger' },
        { text: 'Balance Sheet', path: '/accounts/balance-sheet' },
        { text: 'Profit & Loss', path: '/accounts/profit-loss' }
      ],
      menu: 'accounts',
      color: '#009688'
    },
    {
      text: 'Reports',
      icon: <ReportsIcon />,
      subItems: [
        { text: 'Financial Reports', path: '/reports/financial' },
        { text: 'Sales Reports', path: '/reports/sales' },
        { text: 'Purchase Reports', path: '/reports/purchase' },
        { text: 'Inventory Reports', path: '/reports/inventory' }
      ],
      menu: 'reports',
      color: '#3f51b5'
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      subItems: [
        { text: 'Company Settings', path: '/settings/company' },
        { text: 'User Management', path: '/settings/users' },
        { text: 'Branch Management', path: '/settings/branches' },
        { text: 'Backup & Restore', path: '/settings/backup' }
      ],
      menu: 'settings',
      color: '#607d8b'
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Main File-এর style inspiration
  const getSidebarStyle = () => {
    const isDark = appTheme === 'dark';
    return {
      background: isDark
        ? 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)'
        : 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
      borderRight: `1px solid ${isDark ? '#404040' : '#e0e0e0'}`,
      color: isDark ? '#ffffff' : '#333333'
    };
  };

  const getMenuItemStyle = (item, isActiveItem) => {
    const isDark = appTheme === 'dark';
    if (isActiveItem) {
      return {
        background: `linear-gradient(135deg, ${item.color}20 0%, ${item.color}40 100%)`,
        borderLeft: `4px solid ${item.color}`,
        color: item.color,
        '&:hover': {
          background: `linear-gradient(135deg, ${item.color}30 0%, ${item.color}50 100%)`,
        }
      };
    }
    return {
      color: isDark ? '#b0b0b0' : '#666666',
      '&:hover': {
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        color: isDark ? '#ffffff' : '#333333'
      }
    };
  };

  const drawerContent = (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        ...getSidebarStyle(),
        transition: 'all 0.3s ease'
      }}
    >
      {/* Header - Main File style */}
      <Box sx={{ p: sidebarOpen ? 3 : 2, position: 'relative' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          {sidebarOpen ? (
            <>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.main',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                  }}
                >
                  TE
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    noWrap 
                    sx={{ 
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #2196f3 0%, #9c27b0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Tanisha Enterprise
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Premium Business Suite
                  </Typography>
                </Box>
              </Box>
              <Tooltip title="Collapse Sidebar">
                <IconButton 
                  onClick={toggleSidebar}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(0,0,0,0.1)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.2)' }
                  }}
                >
                  <ChevronLeft />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  mx: 'auto'
                }}
              >
                TE
              </Avatar>
              <Tooltip title="Expand Sidebar">
                <IconButton 
                  onClick={toggleSidebar}
                  size="small"
                  sx={{ 
                    position: 'absolute',
                    right: -12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: appTheme === 'dark' ? '#404040' : '#e0e0e0' }} />

      {/* User Profile - Main File style */}
      {sidebarOpen && (
        <Box sx={{ p: 3, borderBottom: `1px solid ${appTheme === 'dark' ? '#404040' : '#e0e0e0'}` }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              color="success"
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}
              >
                {user?.fullName?.charAt(0) || 'A'}
              </Avatar>
            </Badge>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" noWrap fontWeight="bold">
                {user?.fullName || 'Admin User'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }} noWrap>
                {user?.role || 'Administrator'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.5, display: 'block' }} noWrap>
                {user?.email || 'admin@tanisha.com'}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1} mt={2}>
            <Chip 
              label="Main Branch" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
            <Chip 
              label="Active" 
              size="small" 
              color="success" 
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Box>
      )}

      {/* Menu Items */}
      <List 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 2,
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: appTheme === 'dark' ? '#555' : '#ccc',
            borderRadius: '3px'
          }
        }}
      >
        {menuItems.map((item, index) => {
          const hasSubmenu = item.subItems && item.subItems.length > 0;
          const isExpanded = openMenus[item.menu];
          const itemIsActive = hasSubmenu 
            ? item.subItems.some(sub => isActive(sub.path))
            : isActive(item.path, item.exact);

          return (
            <React.Fragment key={index}>
              {hasSubmenu ? (
                <>
                  <ListItem 
                    button 
                    onClick={() => handleMenuClick(item.menu)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      px: sidebarOpen ? 2 : 1,
                      py: 1.5,
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      ...getMenuItemStyle(item, itemIsActive),
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        minWidth: sidebarOpen ? 40 : 'auto',
                        color: itemIsActive ? item.color : 'inherit',
                        justifyContent: 'center'
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {sidebarOpen && (
                      <>
                        <ListItemText 
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: itemIsActive ? 'bold' : 'medium',
                            fontSize: '0.95rem'
                          }}
                          sx={{ ml: 1 }}
                        />
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </>
                    )}
                  </ListItem>
                  
                  {sidebarOpen && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.subItems.map((subItem, subIndex) => {
                          const subIsActive = isActive(subItem.path);
                          return (
                            <ListItem
                              key={subIndex}
                              button
                              onClick={() => handleNavigation(subItem.path)}
                              sx={{
                                pl: 4,
                                borderRadius: 2,
                                mb: 0.5,
                                py: 1,
                                background: subIsActive 
                                  ? alpha(item.color, 0.1)
                                  : 'transparent',
                                borderLeft: subIsActive 
                                  ? `3px solid ${item.color}`
                                  : 'none',
                                '&:hover': {
                                  background: alpha(item.color, 0.05),
                                  pl: 5,
                                  transition: 'all 0.3s ease'
                                }
                              }}
                            >
                              <ListItemText 
                                primary={subItem.text}
                                primaryTypographyProps={{
                                  fontSize: '0.875rem',
                                  fontWeight: subIsActive ? 'bold' : 'normal',
                                  color: subIsActive ? item.color : 'inherit'
                                }}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </Collapse>
                  )}
                </>
              ) : (
                <Tooltip title={!sidebarOpen ? item.text : ''} placement="right">
                  <ListItem 
                    button 
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      px: sidebarOpen ? 2 : 1,
                      py: 1.5,
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      ...getMenuItemStyle(item, itemIsActive),
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        minWidth: sidebarOpen ? 40 : 'auto',
                        color: itemIsActive ? item.color : 'inherit',
                        justifyContent: 'center'
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {sidebarOpen && (
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: itemIsActive ? 'bold' : 'medium',
                          fontSize: '0.95rem'
                        }}
                        sx={{ ml: 1 }}
                      />
                    )}
                  </ListItem>
                </Tooltip>
              )}
            </React.Fragment>
          );
        })}
      </List>

      {/* Footer Controls - Main File style */}
      <Box sx={{ p: 2, borderTop: `1px solid ${appTheme === 'dark' ? '#404040' : '#e0e0e0'}` }}>
        {sidebarOpen ? (
          <>
            {/* Theme Toggle */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Theme
              </Typography>
              <IconButton 
                onClick={toggleTheme}
                size="small"
                sx={{ 
                  bgcolor: appTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  '&:hover': { bgcolor: appTheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }
                }}
              >
                {appTheme === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Box>

            {/* Logout Button */}
            <Box
              component="button"
              onClick={handleLogout}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                border: 'none',
                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
            >
              <Logout fontSize="small" />
              <span>Logout</span>
            </Box>

            {/* Version Info */}
            <Box textAlign="center" mt={2}>
              <Typography variant="caption" sx={{ opacity: 0.5 }}>
                Version 2.0.0
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.3, display: 'block' }}>
                Tanisha Enterprise
              </Typography>
            </Box>
          </>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Tooltip title="Toggle Theme" placement="right">
              <IconButton 
                onClick={toggleTheme}
                size="small"
                sx={{ 
                  bgcolor: appTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  '&:hover': { bgcolor: appTheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }
                }}
              >
                {appTheme === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout" placement="right">
              <IconButton 
                onClick={handleLogout}
                size="small"
                sx={{ 
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' }
                }}
              >
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: sidebarOpen ? drawerWidth : collapsedWidth,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: sidebarOpen ? drawerWidth : collapsedWidth,
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Menu Button - Main File style */}
      {isMobile && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1200,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            boxShadow: 3
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
    </>
  );
};

export default Sidebar;