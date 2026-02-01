import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { Save, Business, Phone, Email, LocationOn } from '@mui/icons-material';
import api from '../../services/api';

const SettingsGeneral = () => {
  const [settings, setSettings] = useState({
    companyName: 'Tanisha Enterprise',
    companyAddress: 'Agricultural Machinery Market, Bogura',
    companyPhone: '+880 1711-XXXXXX',
    companyEmail: 'info@tanisha-agri.com',
    currency: 'BDT',
    taxRate: 15,
    enableGST: true,
    enableStockAlert: true,
    lowStockThreshold: 5,
    invoicePrefix: 'TAN',
    fiscalYearStart: '2024-07-01',
    fiscalYearEnd: '2025-06-30'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/company');
      if (response.data.success) {
        setSettings(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/settings/company', settings);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
        <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
        Company Settings
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Company Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Company Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <TextField
              fullWidth
              label="Company Name"
              name="companyName"
              value={settings.companyName}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Address"
              name="companyAddress"
              value={settings.companyAddress}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              multiline
              rows={2}
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />
              }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="companyPhone"
                  value={settings.companyPhone}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="companyEmail"
                  value={settings.companyEmail}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Financial Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Financial Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Currency"
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Tax Rate (%)"
                  name="taxRate"
                  type="number"
                  value={settings.taxRate}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableGST}
                  onChange={handleChange}
                  name="enableGST"
                  color="primary"
                />
              }
              label="Enable GST/VAT"
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              label="Invoice Prefix"
              name="invoicePrefix"
              value={settings.invoicePrefix}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
            />
          </Paper>
        </Grid>

        {/* Stock Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Stock Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableStockAlert}
                  onChange={handleChange}
                  name="enableStockAlert"
                  color="primary"
                />
              }
              label="Enable Low Stock Alert"
            />

            <TextField
              fullWidth
              label="Low Stock Threshold"
              name="lowStockThreshold"
              type="number"
              value={settings.lowStockThreshold}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              disabled={!settings.enableStockAlert}
            />
          </Paper>
        </Grid>

        {/* Fiscal Year */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Fiscal Year
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="fiscalYearStart"
                  type="date"
                  value={settings.fiscalYearStart}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="fiscalYearEnd"
                  type="date"
                  value={settings.fiscalYearEnd}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* System Info */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Version: 2.0.0 | Last Updated: {new Date().toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Container>
  );
};

export default SettingsGeneral;