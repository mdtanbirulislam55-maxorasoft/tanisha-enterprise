import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Box, Button, Card, CardContent,
  LinearProgress, Alert, IconButton, Chip, Avatar, Tooltip, Fade
} from '@mui/material';
import {
  AttachMoney, People, Inventory, Warning, TrendingUp,
  Receipt, Add, Refresh, Home, BarChart, PieChart,
  ArrowUpward, ArrowDownward, ShoppingCart, ChevronRight
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { dashboardAPI } from '../../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dashboardAPI.getSummary();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.error || 'Failed to load dashboard data');
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
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Box textAlign="center">
          <LinearProgress sx={{ width: 300, mb: 3 }} />
          <Typography variant="h6" color="primary">
            Loading Dashboard...
          </Typography>
        </Box>
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
              Retry
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <Home fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Dashboard Overview
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Welcome back • {new Date().toLocaleDateString('en-BD', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item>
            <Tooltip title="Refresh Dashboard">
              <IconButton onClick={fetchDashboardData} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
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
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {[
            { label: 'New Sale', icon: <Add />, action: 'new-sale', color: 'primary' },
            { label: 'Add Product', icon: <Inventory />, action: 'new-product', color: 'primary' },
            { label: 'Add Customer', icon: <People />, action: 'new-customer', color: 'primary' },
            { label: 'View Reports', icon: <Receipt />, action: 'view-reports', color: 'secondary' }
          ].map((item) => (
            <Grid item key={item.action}>
              <Button
                variant={item.color === 'primary' ? 'contained' : 'outlined'}
                startIcon={item.icon}
                onClick={() => handleQuickAction(item.action)}
                sx={{ borderRadius: 2 }}
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
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Avatar sx={{ bgcolor: `${kpi.color}20`, color: kpi.color, mb: 2 }}>
                    {kpi.icon}
                  </Avatar>
                  <Chip
                    label={kpi.trend}
                    size="small"
                    color={kpi.trendUp ? 'success' : 'error'}
                    icon={kpi.trendUp ? <ArrowUpward /> : <ArrowDownward />}
                  />
                </Box>
                <Typography variant="h4" fontWeight="bold">
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
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Weekly Sales Performance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last 7 days revenue trend
                </Typography>
              </Box>
            </Box>
            
            {data.charts.weeklySales && data.charts.weeklySales.length > 0 ? (
              <Box sx={{ height: 200 }}>
                <Box display="flex" alignItems="flex-end" height="70%" gap={2}>
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
                          opacity: 0.7
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
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  <PieChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Financial Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current month performance
                </Typography>
              </Box>
            </Box>

            <Box sx={{ '& > *': { mb: 2 } }}>
              <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
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
                  <Card sx={{ height: '100%' }}>
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
                  <Card sx={{ height: '100%' }}>
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
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                Recent Sales
              </Typography>
              <Button size="small" endIcon={<ChevronRight />} onClick={() => navigate('/sales')}>
                View All
              </Button>
            </Box>

            {data.recentSales.length > 0 ? (
              data.recentSales.map((sale) => (
                <Card key={sale.id} sx={{ mb: 2 }}>
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
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top Products
              </Typography>
            </Box>

            {data.topProducts.length > 0 ? (
              data.topProducts.map((product, index) => (
                <Card key={product.id} sx={{ mb: 2 }}>
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
              sx={{ mt: 2 }}
              onClick={() => navigate('/products')}
            >
              View All Products
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;