import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Toolbar,
  AppBar,
  IconButton,
  Typography,
  InputBase,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Translate as TranslateIcon,
  Person,
  Settings,
  Help,
  Logout,
  ChevronRight
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Layout = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const { theme: appTheme, toggleTheme } = useCustomTheme();
  const { language, changeLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for dropdowns
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElLang, setAnchorElLang] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // User menu handlers
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // Language menu handlers
  const handleOpenLangMenu = (event) => {
    setAnchorElLang(event.currentTarget);
  };
  const handleCloseLangMenu = () => {
    setAnchorElLang(null);
  };

  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    handleCloseLangMenu();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${mobileOpen ? 280 : 80}px)` },
          ml: { md: mobileOpen ? '280px' : '80px' },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          background: appTheme === 'dark'
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
            : 'linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)',
          boxShadow: appTheme === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(46, 125, 50, 0.3)'
        }}
      >
        <Toolbar>
          {/* Mobile Menu Button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Title */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              background: appTheme === 'dark'
                ? 'linear-gradient(135deg, #fff 30%, #ddd 90%)'
                : 'linear-gradient(135deg, #fff 30%, #e8f5e9 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Tanisha Enterprise ERP
          </Typography>

          {/* Search Bar - Main File থেকে */}
          <Box
            sx={{
              display: searchOpen || !isMobile ? 'flex' : 'none',
              alignItems: 'center',
              backgroundColor: alpha(theme.palette.common.white, 0.15),
              borderRadius: 2,
              px: 2,
              py: 0.5,
              mr: 2,
              transition: 'all 0.3s',
              width: { xs: searchOpen ? '100%' : 'auto', sm: 250 }
            }}
          >
            <SearchIcon sx={{ color: 'white', mr: 1 }} />
            <InputBase
              placeholder="Search..."
              sx={{
                color: 'white',
                width: '100%',
                '& .MuiInputBase-input': {
                  color: 'white',
                  '&::placeholder': {
                    color: alpha(theme.palette.common.white, 0.7)
                  }
                }
              }}
            />
            {isMobile && searchOpen && (
              <IconButton
                size="small"
                onClick={() => setSearchOpen(false)}
                sx={{ color: 'white', ml: 1 }}
              >
                <ChevronRight />
              </IconButton>
            )}
          </Box>

          {!searchOpen && isMobile && (
            <IconButton
              color="inherit"
              onClick={() => setSearchOpen(true)}
              sx={{ mr: 1 }}
            >
              <SearchIcon />
            </IconButton>
          )}

          {/* Right Side Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Language Selector - Main File থেকে */}
            <Tooltip title="Change Language">
              <IconButton
                onClick={handleOpenLangMenu}
                sx={{
                  color: 'white',
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2)
                  }
                }}
              >
                <TranslateIcon />
              </IconButton>
            </Tooltip>

            {/* Dark Mode Toggle - Main File থেকে */}
            <Tooltip title={appTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  color: 'white',
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2)
                  }
                }}
              >
                {appTheme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Notifications - Main File থেকে */}
            <Tooltip title="Notifications">
              <IconButton
                sx={{
                  color: 'white',
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2)
                  }
                }}
              >
                <Badge
                  badgeContent={3}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.6rem',
                      height: 16,
                      minWidth: 16
                    }
                  }}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Profile - Main File থেকে */}
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleOpenUserMenu}
                sx={{
                  color: 'white',
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2)
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'secondary.main',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                >
                  {user?.fullName?.charAt(0) || 'A'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          {/* Language Menu */}
          <Menu
            anchorEl={anchorElLang}
            open={Boolean(anchorElLang)}
            onClose={handleCloseLangMenu}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 180,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                borderRadius: 2
              }
            }}
          >
            <MenuItem
              onClick={() => handleLanguageChange('en')}
              selected={language === 'en'}
              sx={{
                bgcolor: language === 'en' ? 'action.selected' : 'transparent'
              }}
            >
              <ListItemIcon>
                <TranslateIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="English" />
              {language === 'en' && (
                <Typography variant="body2" color="success.main">
                  ✓
                </Typography>
              )}
            </MenuItem>
            <MenuItem
              onClick={() => handleLanguageChange('bn')}
              selected={language === 'bn'}
              sx={{
                bgcolor: language === 'bn' ? 'action.selected' : 'transparent'
              }}
            >
              <ListItemIcon>
                <TranslateIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="বাংলা" />
              {language === 'bn' && (
                <Typography variant="body2" color="success.main">
                  ✓
                </Typography>
              )}
            </MenuItem>
          </Menu>

          {/* User Menu */}
          <Menu
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 220,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                borderRadius: 2
              }
            }}
          >
            {/* User Info - Main File থেকে */}
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {user?.fullName || 'Admin User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role || 'Administrator'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {user?.email || 'admin@tanisha.com'}
              </Typography>
            </Box>
            <Divider />

            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </MenuItem>
            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <Help fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Help" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'error.main' }}>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${mobileOpen ? 280 : 80}px)` },
          ml: { md: mobileOpen ? '280px' : '80px' },
          mt: { xs: '56px', sm: '64px' },
          minHeight: 'calc(100vh - 56px)',
          bgcolor: 'background.default',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Outlet />
      </Box>

      {/* Footer - Main File থেকে */}
      <Box
        component="footer"
        sx={{
          width: { md: `calc(100% - ${mobileOpen ? 280 : 80}px)` },
          ml: { md: mobileOpen ? '280px' : '80px' },
          p: 3,
          mt: 'auto',
          bgcolor: appTheme === 'dark' ? 'grey.900' : 'grey.100',
          borderTop: 1,
          borderColor: appTheme === 'dark' ? 'grey.800' : 'grey.200',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 3
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Tanisha Enterprise. All rights reserved.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Premium Agricultural Machinery Trading & Servicing System • Version 2.0.0
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Typography
              variant="body2"
              component="a"
              href="#"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' }
              }}
            >
              Privacy Policy
            </Typography>
            <Typography
              variant="body2"
              component="a"
              href="#"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' }
              }}
            >
              Terms of Service
            </Typography>
            <Typography
              variant="body2"
              component="a"
              href="#"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' }
              }}
            >
              Support
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;