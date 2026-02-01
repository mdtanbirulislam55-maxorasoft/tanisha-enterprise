import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Download,
  Print,
  PictureAsPdf,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  AttachMoney,
  ShoppingCart,
  People
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';

const FinancialReport = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [reportType, setReportType] = useState('profit_loss');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    { value: 'profit_loss', label: 'Profit & Loss Statement' },
    { value: 'balance_sheet', label: 'Balance Sheet' },
    { value: 'cash_flow', label: 'Cash Flow Statement' },
    { value: 'sales_summary', label: 'Sales Summary' },
    { value: 'expense_report', label: 'Expense Report' }
  ];

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reportType
      };

      const response = await api.get('/reports/financial', { params });
      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    alert(`Exporting report as ${format.toUpperCase()}...`);
    // Implement export functionality here
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Container>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#4caf50' }}>
          <AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} />
          Financial Reports
        </Typography>

        {/* Report Controls */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={generateReport}
                disabled={loading}
              >
                Generate Report
              </Button>
            </Grid>
          </Grid>

          {/* Export Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <IconButton onClick={() => handleExport('pdf')} color="error">
              <PictureAsPdf />
            </IconButton>
            <IconButton onClick={() => handleExport('excel')} color="success">
              <Download />
            </IconButton>
            <IconButton onClick={() => handleExport('print')} color="primary">
              <Print />
            </IconButton>
          </Box>
        </Paper>

        {/* Financial Summary Cards */}
        {reportData && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#e8f5e9' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <AttachMoney sx={{ mr: 1, color: '#2e7d32' }} />
                    <Typography variant="h4">
                      {formatCurrency(reportData.summary.totalRevenue)}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<TrendingUp />}
                    label={`${reportData.summary.revenueGrowth}%`}
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#fff3e0' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Expenses
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <ShoppingCart sx={{ mr: 1, color: '#f57c00' }} />
                    <Typography variant="h4">
                      {formatCurrency(reportData.summary.totalExpenses)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#e3f2fd' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Net Profit
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <AccountBalance sx={{ mr: 1, color: '#1976d2' }} />
                    <Typography variant="h4">
                      {formatCurrency(reportData.summary.netProfit)}
                    </Typography>
                  </Box>
                  <Chip
                    icon={reportData.summary.profitGrowth >= 0 ? <TrendingUp /> : <TrendingDown />}
                    label={`${Math.abs(reportData.summary.profitGrowth)}%`}
                    color={reportData.summary.profitGrowth >= 0 ? "success" : "error"}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#f3e5f5' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Active Customers
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <People sx={{ mr: 1, color: '#7b1fa2' }} />
                    <Typography variant="h4">
                      {reportData.summary.activeCustomers}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Detailed Report Table */}
        {reportData && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><b>Category</b></TableCell>
                  <TableCell align="right"><b>Amount (৳)</b></TableCell>
                  <TableCell align="right"><b>% of Revenue</b></TableCell>
                  <TableCell align="right"><b>Last Period</b></TableCell>
                  <TableCell align="center"><b>Trend</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.details.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{item.category}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="medium">
                        {formatCurrency(item.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {item.percentage}%
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.lastPeriod)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={item.change >= 0 ? <TrendingUp /> : <TrendingDown />}
                        label={`${Math.abs(item.change)}%`}
                        color={item.change >= 0 ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Notes Section */}
        {reportData && (
          <Paper sx={{ p: 3, mt: 4, bgcolor: '#fffde7' }}>
            <Typography variant="h6" gutterBottom color="warning.main">
              Report Notes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Report period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}<br/>
              • All amounts are in Bangladeshi Taka (৳)<br/>
              • Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}<br/>
              • This report is for internal management purposes only
            </Typography>
          </Paper>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default FinancialReport;