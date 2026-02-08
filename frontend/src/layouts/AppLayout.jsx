import React, { useState } from 'react';
import { Box, IconButton, Paper, InputBase, Stack, Avatar, Badge, Typography, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import tanishaLogo from '../assets/tanisha-logo.jpg';

const drawerWidth = 280;
const collapsedDrawerWidth = 88;

const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        drawerWidth={drawerWidth}
        collapsedDrawerWidth={collapsedDrawerWidth}
      />
      
      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${collapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { md: `${collapsed ? collapsedDrawerWidth : drawerWidth}px` },
          backgroundColor: 'background.default',
          minHeight: '100vh'
        }}
      >
        {/* Top Navigation */}
        <Paper
          sx={{
            mb: 3,
            px: { xs: 2, md: 3 },
            py: 1.5,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            border: '1px solid',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            background: theme === 'dark'
              ? 'linear-gradient(135deg, rgba(17,24,39,0.9), rgba(30,41,59,0.95))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,1))',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={tanishaLogo}
              alt="Tanisha Enterprise"
              sx={{
                width: 40,
                height: 40,
                border: '2px solid',
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
              }}
            />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Tanisha Enterprise ERP
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Admin Console
              </Typography>
            </Box>
          </Stack>

          <Paper
            component="form"
            sx={{
              px: 1.5,
              py: 0.3,
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              minWidth: 280,
            }}
          >
            <SearchIcon fontSize="small" />
            <InputBase placeholder={language === 'bn' ? 'অনুসন্ধান করুন...' : 'Search...'} sx={{ flex: 1 }} />
          </Paper>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant={language === 'en' ? 'contained' : 'outlined'}
              onClick={() => changeLanguage('en')}
              sx={{ borderRadius: 2, minWidth: 44, textTransform: 'none', fontWeight: 600 }}
            >
              EN
            </Button>
            <Button
              size="small"
              variant={language === 'bn' ? 'contained' : 'outlined'}
              onClick={() => changeLanguage('bn')}
              sx={{ borderRadius: 2, minWidth: 60, textTransform: 'none', fontWeight: 600 }}
            >
              বাংলা
            </Button>
            <IconButton onClick={toggleTheme}>
              {theme === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
            <IconButton>
              <Badge color="error" variant="dot">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>A</Avatar>
          </Stack>
        </Paper>
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
