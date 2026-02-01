import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  RadioGroup,
  Radio,
  Slider,
  InputAdornment
} from '@mui/material';
import { Save, Print, Receipt, Description } from '@mui/icons-material';
import api from '../../services/api';

const PrintSettings = () => {
  const [settings, setSettings] = useState({
    // Paper Settings
    paperSize: 'A4',
    orientation: 'portrait',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    
    // Header Settings
    showHeader: true,
    showLogo: true,
    headerText: 'TANISHA ENTERPRISE',
    subHeaderText: 'Agricultural Machinery & Equipment',
    
    // Invoice Settings
    invoicePrefix: 'TAN',
    showTaxInvoiceText: true,
    showTermsConditions: true,
    showSignature: true,
    showBarcode: false,
    
    // Footer Settings
    showFooter: true,
    footerText: 'Thank you for your business!',
    showPageNumbers: true,
    
    // Printer Settings
    printerName: 'Default',
    copies: 1,
    autoPrint: false,
    
    // Content Settings
    showHSNCode: true,
    showUnit: true,
    showTaxBreakup: true,
    showAmountInWords: true,
    
    // Style Settings
    fontSize: 12,
    fontFamily: 'Arial',
    lineHeight: 1.5
  });

  const [printers, setPrinters] = useState(['Default Printer', 'Thermal Printer', 'PDF Printer']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/print');
      if (response.data.success) {
        setSettings(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('Failed to fetch print settings:', error);
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
      const response = await api.put('/settings/print', settings);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Print settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = () => {
    alert('Test print functionality will be implemented');
    // Implement test print functionality
  };

  const handleReset = () => {
    if (window.confirm('Reset all print settings to default?')) {
      setSettings({
        paperSize: 'A4',
        orientation: 'portrait',
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
        showHeader: true,
        showLogo: true,
        headerText: 'TANISHA ENTERPRISE',
        subHeaderText: 'Agricultural Machinery & Equipment',
        invoicePrefix: 'TAN',
        showTaxInvoiceText: true,
        showTermsConditions: true,
        showSignature: true,
        showBarcode: false,
        showFooter: true,
        footerText: 'Thank you for your business!',
        showPageNumbers: true,
        printerName: 'Default',
        copies: 1,
        autoPrint: false,
        showHSNCode: true,
        showUnit: true,
        showTaxBreakup: true,
        showAmountInWords: true,
        fontSize: 12,
        fontFamily: 'Arial',
        lineHeight: 1.5
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#ff9800' }}>
        <Print sx={{ mr: 1, verticalAlign: 'middle' }} />
        Print Settings
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Paper Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
              Paper Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Paper Size</InputLabel>
                  <Select
                    name="paperSize"
                    value={settings.paperSize}
                    label="Paper Size"
                    onChange={handleChange}
                  >
                    <MenuItem value="A4">A4 (210mm × 297mm)</MenuItem>
                    <MenuItem value="A5">A5 (148mm × 210mm)</MenuItem>
                    <MenuItem value="LETTER">Letter (8.5" × 11")</MenuItem>
                    <MenuItem value="THERMAL">Thermal (80mm)</MenuItem>
                    <MenuItem value="CUSTOM">Custom Size</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Orientation</InputLabel>
                  <Select
                    name="orientation"
                    value={settings.orientation}
                    label="Orientation"
                    onChange={handleChange}
                  >
                    <MenuItem value="portrait">Portrait</MenuItem>
                    <MenuItem value="landscape">Landscape</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Margins (mm)
            </Typography>
            <Grid container spacing={2}>
              {['Top', 'Bottom', 'Left', 'Right'].map((position) => (
                <Grid item xs={6} sm={3} key={position}>
                  <TextField
                    fullWidth
                    label={position}
                    name={`margin${position}`}
                    type="number"
                    value={settings[`margin${position}`]}
                    onChange={handleChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Header & Footer Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Header & Footer
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.showHeader}
                  onChange={handleChange}
                  name="showHeader"
                />
              }
              label="Show Header"
              sx={{ display: 'block', mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.showLogo}
                  onChange={handleChange}
                  name="showLogo"
                />
              }
              label="Show Company Logo"
              sx={{ display: 'block', mb: 2 }}
            />

            <TextField
              fullWidth
              label="Header Text"
              name="headerText"
              value={settings.headerText}
              onChange={handleChange}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Sub Header Text"
              name="subHeaderText"
              value={settings.subHeaderText}
              onChange={handleChange}
              margin="normal"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.showFooter}
                  onChange={handleChange}
                  name="showFooter"
                />
              }
              label="Show Footer"
              sx={{ display: 'block', mt: 2, mb: 1 }}
            />

            <TextField
              fullWidth
              label="Footer Text"
              name="footerText"
              value={settings.footerText}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.showPageNumbers}
                  onChange={handleChange}
                  name="showPageNumbers"
                />
              }
              label="Show Page Numbers"
              sx={{ display: 'block', mt: 1 }}
            />
          </Paper>
        </Grid>

        {/* Invoice Content Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
              Invoice Content
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <TextField
              fullWidth
              label="Invoice Prefix"
              name="invoicePrefix"
              value={settings.invoicePrefix}
              onChange={handleChange}
              margin="normal"
              helperText="e.g., TAN for TAN-001, TAN-002"
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Show/Hide Sections:
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showTaxInvoiceText}
                    onChange={handleChange}
                    name="showTaxInvoiceText"
                  />
                }
                label="'TAX INVOICE' Text"
                sx={{ display: 'block', mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showHSNCode}
                    onChange={handleChange}
                    name="showHSNCode"
                  />
                }
                label="HSN/SAC Code"
                sx={{ display: 'block', mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showUnit}
                    onChange={handleChange}
                    name="showUnit"
                  />
                }
                label="Unit Column"
                sx={{ display: 'block', mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showTaxBreakup}
                    onChange={handleChange}
                    name="showTaxBreakup"
                  />
                }
                label="Tax Breakup"
                sx={{ display: 'block', mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showAmountInWords}
                    onChange={handleChange}
                    name="showAmountInWords"
                  />
                }
                label="Amount in Words"
                sx={{ display: 'block', mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showTermsConditions}
                    onChange={handleChange}
                    name="showTermsConditions"
                  />
                }
                label="Terms & Conditions"
                sx={{ display: 'block', mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showSignature}
                    onChange={handleChange}
                    name="showSignature"
                  />
                }
                label="Signature Section"
                sx={{ display: 'block', mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showBarcode}
                    onChange={handleChange}
                    name="showBarcode"
                  />
                }
                label="Barcode/QR Code"
                sx={{ display: 'block' }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Printer & Style Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Printer & Style
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Printer</InputLabel>
              <Select
                name="printerName"
                value={settings.printerName}
                label="Printer"
                onChange={handleChange}
              >
                {printers.map((printer) => (
                  <MenuItem key={printer} value={printer}>
                    {printer}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Copies"
              name="copies"
              type="number"
              value={settings.copies}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                inputProps: { min: 1, max: 10 }
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoPrint}
                  onChange={handleChange}
                  name="autoPrint"
                />
              }
              label="Auto Print after Save"
              sx={{ display: 'block', mt: 2, mb: 3 }}
            />

            <Typography variant="subtitle2" gutterBottom>
              Font Size: {settings.fontSize}px
            </Typography>
            <Slider
              value={settings.fontSize}
              onChange={(e, value) => handleChange({ target: { name: 'fontSize', value } })}
              min={8}
              max={16}
              step={1}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth>
              <InputLabel>Font Family</InputLabel>
              <Select
                name="fontFamily"
                value={settings.fontFamily}
                label="Font Family"
                onChange={handleChange}
              >
                <MenuItem value="Arial">Arial</MenuItem>
                <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                <MenuItem value="Calibri">Calibri</MenuItem>
                <MenuItem value="Courier New">Courier New</MenuItem>
                <MenuItem value="Verdana">Verdana</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
              Line Height: {settings.lineHeight}
            </Typography>
            <Slider
              value={settings.lineHeight}
              onChange={(e, value) => handleChange({ target: { name: 'lineHeight', value } })}
              min={1}
              max={2}
              step={0.1}
              marks
              valueLabelDisplay="auto"
            />
          </Paper>
        </Grid>

        {/* Preview Card */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Paper: {settings.paperSize.toUpperCase()} | Orientation: {settings.orientation} |
                Font: {settings.fontFamily} {settings.fontSize}px
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'white', border: '1px dashed #ccc', borderRadius: 1 }}>
                <Typography variant="caption" fontFamily={settings.fontFamily} fontSize={settings.fontSize}>
                  This is a sample preview text with current settings.
                  Line height: {settings.lineHeight}, Margins: {settings.marginTop}mm all sides.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{ mr: 2 }}
          >
            Reset to Default
          </Button>
          <Button
            variant="outlined"
            onClick={handleTestPrint}
            startIcon={<Print />}
          >
            Test Print
          </Button>
        </Box>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Print Settings'}
        </Button>
      </Box>
    </Container>
  );
};

export default PrintSettings;