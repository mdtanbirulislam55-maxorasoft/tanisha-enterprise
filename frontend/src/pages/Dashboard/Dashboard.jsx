import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  AttachMoney, People, Inventory, Warning, TrendingUp,
  Receipt, Add, Refresh, Home, BarChart, PieChart,
  ArrowUpward, ArrowDownward, ShoppingCart, ChevronRight
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { dashboardAPI } from '../../services/api';
import logo from '../../assets/tanisha-logo.jpg';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { language, changeLanguage } = useLanguage();

  const labels = {
    overview: language === 'bn' ? 'ড্যাশবোর্ড সারসংক্ষেপ' : 'Dashboard Overview',
    quickActions: language === 'bn' ? 'দ্রুত কার্যক্রম' : 'Quick Actions',
    quickActionsHint: language === 'bn' ? 'সবচেয়ে ব্যবহৃত কাজগুলিতে দ্রুত প্রবেশ করুন।' : 'Fast access to the most used workflows.',
    weeklySales: language === 'bn' ? 'সাপ্তাহিক বিক্রয় পারফরম্যান্স' : 'Weekly Sales Performance',
    weeklySalesHint: language === 'bn' ? 'শেষ ৭ দিনের রাজস্ব প্রবণতা' : 'Last 7 days revenue trend',
    financialOverview: language === 'bn' ? 'আর্থিক সারসংক্ষেপ' : 'Financial Overview',
    financialOverviewHint: language === 'bn' ? 'চলতি মাসের পারফরম্যান্স' : 'Current month performance',
    recentSales: language === 'bn' ? 'সাম্প্রতিক বিক্রয়' : 'Recent Sales',
    topProducts: language === 'bn' ? 'শীর্ষ পণ্যসমূহ' : 'Top Products',
    viewAll: language === 'bn' ? 'সব দেখুন' : 'View All',
    adminOnly: language === 'bn' ? 'শুধু অ্যাডমিন ড্যাশবোর্ড' : 'Admin-only Dashboard',
    serviceOverview: language === 'bn' ? 'সার্ভিস/অপারেশন সারসংক্ষেপ' : 'Service & Operations Overview',
    servicePending: language === 'bn' ? 'পেন্ডিং সার্ভিস' : 'Pending Service Requests',
    noServiceData: language === 'bn' ? 'কোনো সার্ভিস ডেটা নেই' : 'No service data available',
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dashboardAPI.getSummary();
      const payload = response?.data;
      if (payload?.success) {
        setDashboardData(payload.data);
      } else {
        setError(payload?.error || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-sale':
        navigate('/sales/create');
        break;
      case 'new-product':
        navigate('/products/add');
        break;
      case 'new-customer':
        navigate('/customers/add');
        break;
      case 'view-reports':
        navigate('/reports');
        break;
      default:
        break;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 4, textAlign: 'center' }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error && !dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              RETRY
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const data = dashboardData || {
    summary: {
      todaySales: 0,
      monthlyRevenue: 0,
      totalCustomers: 0,
      lowStockProducts: 0,
      pendingOrders: 0,
      todayOrders: 0,
      totalProducts: 0
    },
    recentSales: [],
    topProducts: [],
    charts: { weeklySales: [] }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        background: theme === 'dark'
          ? 'radial-gradient(circle at top, rgba(33,150,243,0.08), rgba(18,18,18,1) 60%)'
          : 'radial-gradient(circle at top, rgba(33,150,243,0.08), rgba(255,255,255,1) 60%)',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Paper
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          borderRadius: 3,
          background: theme === 'dark'
            ? 'linear-gradient(135deg, rgba(33,150,243,0.12), rgba(156,39,176,0.08))'
            : 'linear-gradient(135deg, rgba(33,150,243,0.08), rgba(156,39,176,0.06))',
          border: '1px solid',
          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }}
      >
        <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
          <Grid item xs={12} md="auto">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid',
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  boxShadow: theme === 'dark'
                    ? '0 8px 24px rgba(33,150,243,0.35)'
                    : '0 8px 24px rgba(33,150,243,0.25)',
                }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt="Tanisha Enterprise Logo"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {labels.overview}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Welcome back • {new Date().toLocaleDateString('en-BD', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md="auto">
            <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Chip
                icon={<BarChart />}
                label="Inventory • Sales • ERP"
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  px: 0.5,
                  bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                }}
              />
              <Tooltip title="Refresh Dashboard">
                <IconButton onClick={fetchDashboardData} color="primary">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Quick Actions */}
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 3,
          borderRadius: 3,
          bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
          border: '1px solid',
          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {labels.quickActions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {labels.quickActionsHint}
            </Typography>
          </Box>
          <Chip
            label={labels.adminOnly}
            color="primary"
            variant={theme === 'dark' ? 'outlined' : 'filled'}
            sx={{ borderRadius: 2 }}
          />
        </Stack>
        <Grid container spacing={2}>
          {[
            { label: 'New Sale', icon: <Add />, action: 'new-sale', color: 'primary' },
            { label: 'Add Product', icon: <Inventory />, action: 'new-product', color: 'primary' },
            { label: 'Add Customer', icon: <People />, action: 'new-customer', color: 'primary' },
            { label: 'View Reports', icon: <Receipt />, action: 'view-reports', color: 'secondary' }
          ].map((item) => (
            <Grid item xs={12} sm={6} md="auto" key={item.action}>
              <Button
                fullWidth
                variant={item.color === 'primary' ? 'contained' : 'outlined'}
                startIcon={item.icon}
                onClick={() => handleQuickAction(item.action)}
                sx={{
                  borderRadius: 2,
                  px: 2.5,
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: item.color === 'primary'
                    ? (theme === 'dark' ? '0 10px 24px rgba(33,150,243,0.35)' : '0 10px 24px rgba(33,150,243,0.25)')
                    : 'none',
                }}
              >
                {item.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: "Today's Sales",
            value: formatCurrency(data.summary.todaySales),
            subtitle: `${data.summary.todayOrders} orders`,
            icon: <AttachMoney />,
            color: 'success.main',
            trend: '+12.5%',
            trendUp: true
          },
          {
            title: "Monthly Revenue",
            value: formatCurrency(data.summary.monthlyRevenue),
            subtitle: "This month",
            icon: <TrendingUp />,
            color: 'primary.main',
            trend: '+8.2%',
            trendUp: true
          },
          {
            title: "Total Customers",
            value: data.summary.totalCustomers,
            subtitle: "Active customers",
            icon: <People />,
            color: 'warning.main',
            trend: '+5.3%',
            trendUp: true
          },
          {
            title: "Low Stock Items",
            value: data.summary.lowStockProducts,
            subtitle: "Need attention",
            icon: <Warning />,
            color: 'error.main',
            trend: data.summary.lowStockProducts > 0 ? 'Need Restock' : 'All Good',
            trendUp: data.summary.lowStockProducts === 0
          }
        ].map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.95)',
                boxShadow: theme === 'dark'
                  ? '0 12px 30px rgba(0,0,0,0.35)'
                  : '0 12px 30px rgba(0,0,0,0.08)',
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Avatar
                    sx={{
                      bgcolor: `${kpi.color}22`,
                      color: kpi.color,
                      mb: 2,
                      boxShadow: theme === 'dark' ? '0 6px 18px rgba(0,0,0,0.25)' : '0 6px 18px rgba(0,0,0,0.12)',
                    }}
                  >
                    {kpi.icon}
                  </Avatar>
                  <Chip
                    label={kpi.trend}
                    size="small"
                    color={kpi.trendUp ? 'success' : 'error'}
                    icon={kpi.trendUp ? <ArrowUpward /> : <ArrowDownward />}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Typography variant="h4" fontWeight={800}>
                  {kpi.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {kpi.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts and Tables */}
      <Grid container spacing={3}>
        {/* Weekly Sales */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {labels.weeklySales}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {labels.weeklySalesHint}
                </Typography>
              </Box>
            </Box>
            
            {data.charts.weeklySales && data.charts.weeklySales.length > 0 ? (
              <Box sx={{ height: 220 }}>
                <Box display="flex" alignItems="flex-end" height="75%" gap={2}>
                  {data.charts.weeklySales.map((day, index) => (
                    <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" mb={1}>
                        {day.day}
                      </Typography>
                      <Box
                        sx={{
                          width: '80%',
                          bgcolor: 'primary.main',
                          borderRadius: '4px 4px 0 0',
                          opacity: 0.75,
                          boxShadow: '0 8px 18px rgba(33,150,243,0.35)',
                        }}
                        style={{
                          height: `${Math.max(20, ((day.sales || 0) / 250000 * 100))}%`
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">
                  No sales data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Financial Overview */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  <PieChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {labels.financialOverview}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {labels.financialOverviewHint}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ '& > *': { mb: 2 } }}>
              <Card
                sx={{
                  bgcolor: theme === 'dark' ? 'rgba(33,150,243,0.08)' : 'primary.50',
                  border: '1px solid',
                  borderColor: theme === 'dark' ? 'rgba(33,150,243,0.25)' : 'primary.100',
                  borderRadius: 2,
                }}
              >
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Revenue
                  </Typography>
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    {formatCurrency(data.summary.monthlyRevenue)}
                  </Typography>
                </CardContent>
              </Card>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Pending Orders
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {data.summary.pendingOrders}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Total Products
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {data.summary.totalProducts}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Sales */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                {labels.recentSales}
              </Typography>
              <Button size="small" endIcon={<ChevronRight />} onClick={() => navigate('/sales')}>
                {labels.viewAll}
              </Button>
            </Box>

            {data.recentSales.length > 0 ? (
              data.recentSales.map((sale) => (
                <Card
                  key={sale.id}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {sale.invoiceNo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {sale.customer}
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {formatCurrency(sale.amount)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No recent sales
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                {labels.topProducts}
              </Typography>
            </Box>

            {data.topProducts.length > 0 ? (
              data.topProducts.map((product, index) => (
                <Card
                  key={product.id}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: index < 3 ? 'primary.main' : 'grey.500' }}>
                          {index + 1}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Stock: {product.stock} • Sold: {product.sold}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(product.price)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No product data
              </Typography>
            )}

            <Button
              fullWidth
              variant="outlined"
              endIcon={<ChevronRight />}
              sx={{ mt: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              onClick={() => navigate('/products')}
            >
              {labels.viewAll}
            </Button>
          </Paper>
        </Grid>

        {/* Service Overview */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.9)',
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight={700}>
                {labels.serviceOverview}
              </Typography>
              <Chip
                label={labels.servicePending}
                color="secondary"
                variant={theme === 'dark' ? 'outlined' : 'filled'}
                sx={{ borderRadius: 2 }}
              />
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    bgcolor: theme === 'dark' ? 'rgba(156,39,176,0.08)' : 'rgba(156,39,176,0.06)',
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <ShoppingCart />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {labels.servicePending}
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {typeof data.summary?.pendingServices === 'number' ? data.summary.pendingServices : 0}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              {typeof data.summary?.pendingServices !== 'number' && (
                <Grid item xs={12}>
                  <Typography color="text.secondary">{labels.noServiceData}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
