import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Build,
  CheckCircle,
  Pending,
  Cancel,
  Assignment,
  Person
} from '@mui/icons-material';
import api from '../../services/api';

const ServiceManagement = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('all');

  const statusColors = {
    PENDING: 'warning',
    IN_PROGRESS: 'info',
    COMPLETED: 'success',
    CANCELLED: 'error'
  };

  const statusIcons = {
    PENDING: <Pending />,
    IN_PROGRESS: <Build />,
    COMPLETED: <CheckCircle />,
    CANCELLED: <Cancel />
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsRes, techsRes] = await Promise.all([
        api.get('/service/requests'),
        api.get('/service/technicians')
      ]);

      if (requestsRes.data.success) {
        setServiceRequests(requestsRes.data.data);
      }
      if (techsRes.data.success) {
        setTechnicians(techsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = () => {
    setSelectedRequest(null);
    setOpenDialog(true);
  };

  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    setOpenDialog(true);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/service/requests/${id}/status`, { status });
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const filteredRequests = serviceRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const stats = {
    total: serviceRequests.length,
    pending: serviceRequests.filter(r => r.status === 'PENDING').length,
    inProgress: serviceRequests.filter(r => r.status === 'IN_PROGRESS').length,
    completed: serviceRequests.filter(r => r.status === 'COMPLETED').length
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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#ff9800' }}>
        <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
        Service Request Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Requests
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4" color="info.main">{stats.inProgress}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f1f8e9' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">{stats.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleCreateRequest}
            >
              New Service Request
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filter}
                label="Filter by Status"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All Requests</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Service Requests Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><b>Request ID</b></TableCell>
              <TableCell><b>Customer</b></TableCell>
              <TableCell><b>Product</b></TableCell>
              <TableCell><b>Issue</b></TableCell>
              <TableCell><b>Technician</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell><b>Created Date</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id} hover>
                <TableCell>SR-{request.id.toString().padStart(4, '0')}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Person sx={{ mr: 1, color: 'action.active' }} />
                    {request.customerName}
                  </Box>
                </TableCell>
                <TableCell>{request.productName}</TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {request.issueDescription}
                  </Typography>
                </TableCell>
                <TableCell>
                  {request.technicianName || 'Unassigned'}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={statusIcons[request.status]}
                    label={request.status.replace('_', ' ')}
                    color={statusColors[request.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(request.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="info">
                    <Visibility />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleEditRequest(request)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Service Request Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedRequest ? 'Edit Service Request' : 'Create New Service Request'}
        </DialogTitle>
        <DialogContent>
          <ServiceRequestForm 
            request={selectedRequest}
            technicians={technicians}
            onClose={() => {
              setOpenDialog(false);
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

const ServiceRequestForm = ({ request, technicians, onClose }) => {
  const [formData, setFormData] = useState({
    customerId: request?.customerId || '',
    productId: request?.productId || '',
    issueDescription: request?.issueDescription || '',
    priority: request?.priority || 'MEDIUM',
    technicianId: request?.technicianId || '',
    estimatedCost: request?.estimatedCost || '',
    estimatedTime: request?.estimatedTime || ''
  });

  const handleSubmit = async () => {
    try {
      if (request) {
        await api.put(`/service/requests/${request.id}`, formData);
      } else {
        await api.post('/service/requests', formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save request:', error);
    }
  };

  return (
    <Box component="form" sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Customer"
            value={formData.customerId}
            onChange={(e) => setFormData({...formData, customerId: e.target.value})}
            margin="normal"
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Product"
            value={formData.productId}
            onChange={(e) => setFormData({...formData, productId: e.target.value})}
            margin="normal"
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Issue Description"
            value={formData.issueDescription}
            onChange={(e) => setFormData({...formData, issueDescription: e.target.value})}
            margin="normal"
            multiline
            rows={3}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              value={formData.priority}
              label="Priority"
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
            >
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="URGENT">Urgent</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Assign Technician</InputLabel>
            <Select
              value={formData.technicianId}
              label="Assign Technician"
              onChange={(e) => setFormData({...formData, technicianId: e.target.value})}
            >
              <MenuItem value="">Select Technician</MenuItem>
              {technicians.map((tech) => (
                <MenuItem key={tech.id} value={tech.id}>
                  {tech.name} - {tech.specialization}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Estimated Cost (৳)"
            type="number"
            value={formData.estimatedCost}
            onChange={(e) => setFormData({...formData, estimatedCost: e.target.value})}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Estimated Time (days)"
            type="number"
            value={formData.estimatedTime}
            onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})}
            margin="normal"
          />
        </Grid>
      </Grid>
      <DialogActions sx={{ mt: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {request ? 'Update' : 'Create'} Request
        </Button>
      </DialogActions>
    </Box>
  );
};

export default ServiceManagement;