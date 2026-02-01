import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  MenuItem
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
  Phone,
  Email,
  People,
  AttachMoney,
  Store,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import api from '../../services/api';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchStats, setBranchStats] = useState({});

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      if (response.data.success) {
        setBranches(response.data.data);
        
        // Fetch stats for each branch
        const statsPromises = response.data.data.map(branch => 
          api.get(`/branches/${branch.id}/stats`)
        );
        
        const statsResults = await Promise.all(statsPromises);
        const statsMap = {};
        statsResults.forEach((result, index) => {
          if (result.data.success) {
            statsMap[response.data.data[index].id] = result.data.data;
          }
        });
        
        setBranchStats(statsMap);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = () => {
    setSelectedBranch(null);
    setOpenDialog(true);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setOpenDialog(true);
  };

  const handleDeleteBranch = async (branchId) => {
    if (!window.confirm('Are you sure you want to deactivate this branch?')) {
      return;
    }

    try {
      await api.delete(`/branches/${branchId}`);
      fetchBranches();
    } catch (error) {
      alert('Failed to delete branch');
    }
  };

  const handleSaveBranch = async (formData) => {
    try {
      if (selectedBranch) {
        await api.put(`/branches/${selectedBranch.id}`, formData);
      } else {
        await api.post('/branches', formData);
      }
      setOpenDialog(false);
      fetchBranches();
    } catch (error) {
      alert('Failed to save branch');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <Container>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
        <Store sx={{ mr: 1, verticalAlign: 'middle' }} />
        Branch Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f3e5f5' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Branches
              </Typography>
              <Typography variant="h3">
                {branches.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8eaf6' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Branches
              </Typography>
              <Typography variant="h3" color="success.main">
                {branches.filter(b => b.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e0f7fa' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Sales
              </Typography>
              <Typography variant="h5">
                {formatCurrency(
                  Object.values(branchStats).reduce((sum, stats) => sum + (stats.totalSales || 0), 0)
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f1f8e9' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Stock
              </Typography>
              <Typography variant="h5">
                {Object.values(branchStats).reduce((sum, stats) => sum + (stats.totalStock || 0), 0)} units
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            All Branches ({branches.length})
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleCreateBranch}
          >
            Add New Branch
          </Button>
        </Box>
      </Paper>

      {/* Branches Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><b>Branch Code</b></TableCell>
              <TableCell><b>Branch Name</b></TableCell>
              <TableCell><b>Contact Info</b></TableCell>
              <TableCell><b>Address</b></TableCell>
              <TableCell><b>Sales</b></TableCell>
              <TableCell><b>Stock</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch.id} hover>
                <TableCell>
                  <Chip 
                    label={branch.code} 
                    color="primary" 
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography fontWeight="medium">
                    {branch.name}
                  </Typography>
                  {branch.isDefault && (
                    <Chip 
                      label="Main Branch" 
                      size="small" 
                      color="success"
                      sx={{ ml: 1 }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      <Phone fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                      {branch.phone}
                    </Typography>
                    <Typography variant="body2">
                      <Email fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                      {branch.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    <LocationOn fontSize="small" sx={{ mr: 0.5, verticalAlign: 'top' }} />
                    {branch.address}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <AttachMoney fontSize="small" sx={{ mr: 0.5, color: '#4caf50' }} />
                    <Typography variant="body2">
                      {formatCurrency(branchStats[branch.id]?.totalSales || 0)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {branchStats[branch.id]?.totalOrders || 0} orders
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {branchStats[branch.id]?.totalStock || 0} units
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={branch.isActive ? <CheckCircle /> : <Cancel />}
                    label={branch.isActive ? 'Active' : 'Inactive'}
                    color={branch.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleEditBranch(branch)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteBranch(branch.id)}
                    disabled={branch.isDefault}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Branch Dialog */}
      <BranchDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        branch={selectedBranch}
        onSave={handleSaveBranch}
      />
    </Container>
  );
};

const BranchDialog = ({ open, onClose, branch, onSave }) => {
  const [formData, setFormData] = useState({
    name: branch?.name || '',
    code: branch?.code || '',
    address: branch?.address || '',
    phone: branch?.phone || '',
    email: branch?.email || '',
    managerName: branch?.managerName || '',
    isActive: branch?.isActive !== undefined ? branch.isActive : true,
    isDefault: branch?.isDefault || false
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {branch ? 'Edit Branch' : 'Create New Branch'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Branch Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Branch Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            margin="normal"
            helperText="Unique code for branch (e.g., BOG, DHA)"
            required
          />

          <TextField
            fullWidth
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={2}
            required
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Manager Name"
            name="managerName"
            value={formData.managerName}
            onChange={handleChange}
            margin="normal"
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={handleChange}
                name="isActive"
                color="primary"
              />
            }
            label="Active Branch"
            sx={{ mt: 2 }}
          />

          {!branch && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isDefault}
                  onChange={handleChange}
                  name="isDefault"
                  color="success"
                />
              }
              label="Set as Main Branch"
            />
          )}

          {formData.isDefault && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Main branch cannot be deactivated or deleted.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {branch ? 'Update' : 'Create'} Branch
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BranchManagement;