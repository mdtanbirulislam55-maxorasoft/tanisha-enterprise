import React, { useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Typography,
  Paper
} from '@mui/material';
import { Print, Download, Close } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';

const PrintInvoice = ({ invoiceData, open, onClose }) => {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Invoice-${invoiceData?.invoiceNumber || 'TAN'}`,
    onAfterPrint: () => onClose()
  });

  const handleDownloadPDF = () => {
    // Implement PDF download functionality
    alert('PDF download functionality will be implemented');
  };

  if (!invoiceData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Invoice Preview - {invoiceData.invoiceNumber}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Preview your invoice before printing. Make sure all details are correct.
        </Alert>

        {/* Invoice Preview */}
        <Paper ref={componentRef} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
          {/* Invoice Header */}
          <Box sx={{ mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  TANISHA ENTERPRISE
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Agricultural Machinery & Equipment
                </Typography>
                <Typography variant="body2">
                  Bogura, Bangladesh | Phone: +880 1711-XXXXXX
                </Typography>
                <Typography variant="body2">
                  Email: info@tanisha-agri.com | GST: XXXXXXX
                </Typography>
              </Box>
              
              <Box textAlign="right">
                <Typography variant="h5" color="primary" fontWeight="bold">
                  TAX INVOICE
                </Typography>
                <Typography variant="body2">
                  Invoice No: <strong>{invoiceData.invoiceNumber}</strong>
                </Typography>
                <Typography variant="body2">
                  Date: {new Date(invoiceData.invoiceDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  Time: {new Date().toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Customer & Company Info */}
          <Box display="flex" justifyContent="space-between" sx={{ mb: 4 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Billed To:
              </Typography>
              <Typography variant="body1">
                {invoiceData.customerName}
              </Typography>
              <Typography variant="body2">
                {invoiceData.customerAddress}
              </Typography>
              <Typography variant="body2">
                Phone: {invoiceData.customerPhone}
              </Typography>
              {invoiceData.customerGST && (
                <Typography variant="body2">
                  GST: {invoiceData.customerGST}
                </Typography>
              )}
            </Box>

            <Box textAlign="right">
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Branch:
              </Typography>
              <Typography variant="body1">
                {invoiceData.branchName}
              </Typography>
              <Typography variant="body2">
                {invoiceData.branchAddress}
              </Typography>
              <Typography variant="body2">
                Phone: {invoiceData.branchPhone}
              </Typography>
            </Box>
          </Box>

          {/* Items Table */}
          <Box sx={{ mb: 3 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>#</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Product</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>HSN/SAC</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Qty</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Rate (৳)</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tax %</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Amount (৳)</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{index + 1}</td>
                    <td style={{ padding: '10px' }}>{item.productName}</td>
                    <td style={{ padding: '10px' }}>{item.hsnCode || 'N/A'}</td>
                    <td style={{ padding: '10px' }}>{item.quantity} {item.unit}</td>
                    <td style={{ padding: '10px' }}>{item.rate.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{item.taxRate}%</td>
                    <td style={{ padding: '10px' }}>{(item.quantity * item.rate).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          {/* Summary Section */}
          <Box display="flex" justifyContent="flex-end">
            <Box sx={{ width: '300px' }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Sub Total:</Typography>
                <Typography variant="body2">৳ {invoiceData.subTotal?.toLocaleString()}</Typography>
              </Box>
              
              {invoiceData.discount > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Discount:</Typography>
                  <Typography variant="body2" color="error">
                    -৳ {invoiceData.discount?.toLocaleString()}
                  </Typography>
                </Box>
              )}
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Tax ({invoiceData.taxRate}%):</Typography>
                <Typography variant="body2">৳ {invoiceData.taxAmount?.toLocaleString()}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={2} sx={{ borderTop: '1px solid #ddd', pt: 1 }}>
                <Typography variant="body1" fontWeight="bold">Grand Total:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  ৳ {invoiceData.grandTotal?.toLocaleString()}
                </Typography>
              </Box>

              {/* Amount in Words */}
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
                <Typography variant="body2" fontStyle="italic">
                  Amount in Words: {invoiceData.amountInWords || ''}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Terms & Footer */}
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px dashed #ddd' }}>
            <Typography variant="body2" gutterBottom>
              <strong>Terms & Conditions:</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              1. Goods once sold will not be taken back.<br/>
              2. Payment should be made within 15 days.<br/>
              3. Warranty as per manufacturer terms.<br/>
              4. Subject to Bogura jurisdiction.
            </Typography>
            
            <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
              <Box textAlign="center">
                <Typography variant="body2" fontWeight="bold">
                  Customer Signature
                </Typography>
                <Box sx={{ mt: 2, height: '1px', width: '150px', borderBottom: '1px solid #000' }} />
              </Box>
              
              <Box textAlign="center">
                <Typography variant="body2" fontWeight="bold">
                  For Tanisha Enterprise
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                  Authorized Signatory
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 3 }}>
              This is a computer generated invoice. No signature required.
            </Typography>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button
          startIcon={<Download />}
          onClick={handleDownloadPDF}
          variant="outlined"
        >
          Download PDF
        </Button>
        <Button
          startIcon={<Print />}
          onClick={handlePrint}
          variant="contained"
          color="primary"
        >
          Print Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintInvoice;