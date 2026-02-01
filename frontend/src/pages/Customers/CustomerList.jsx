import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Avatar,
  Badge,
  Descriptions,
  DatePicker,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  WalletOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    type: undefined,
    area: undefined,
    city: undefined,
    active: true,
    hasDue: undefined,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [summary, setSummary] = useState({});
  const [filterOptions, setFilterOptions] = useState({
    areas: [],
    cities: [],
    types: ['individual', 'company']
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      const response = await axios.get('/api/customers', { params });
      
      if (response.data.success) {
        const { customers, pagination: paginationData, summary, filters: filterData } = response.data.data;
        
        setCustomers(customers);
        setPagination(prev => ({
          ...prev,
          total: paginationData.total
        }));
        setSummary(summary);
        setFilterOptions({
          areas: filterData?.areas || [],
          cities: filterData?.cities || [],
          types: filterData?.types || ['individual', 'company']
        });
      }
    } catch (error) {
      message.error('Failed to fetch customers');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: newPagination.total
    });

    if (sorter.field) {
      setFilters(prev => ({
        ...prev,
        sortBy: sorter.field === 'currentBalance' ? 'balance' : sorter.field,
        sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc'
      }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/customers/${id}`);
      message.success('Customer deactivated successfully');
      fetchCustomers();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to deactivate customer');
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    try {
      await axios.patch(`/api/customers/${id}`, {
        isActive: !currentStatus
      });
      message.success(`Customer ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchCustomers();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedRowKeys.length === 0) {
      message.warning('Please select customers and an action');
      return;
    }

    try {
      const response = await axios.post('/api/customers/bulk', {
        customerIds: selectedRowKeys,
        action: bulkAction,
        data: {}
      });

      if (response.data.success) {
        message.success(response.data.message);
        setSelectedRowKeys([]);
        setBulkAction('');
        fetchCustomers();
      }
    } catch (error) {
      message.error('Failed to perform bulk action');
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const response = await axios.get(`/api/customers/export?format=${format}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_${dayjs().format('YYYYMMDD_HHmmss')}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      message.success('Export started successfully');
    } catch (error) {
      message.error('Failed to export customers');
    }
  };

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text, record) => (
        <Space>
          <Avatar 
            size="large" 
            icon={<UserOutlined />}
            style={{ 
              backgroundColor: record.isActive ? 
                (record.currentBalance > 0 ? '#ff4d4f' : 
                 record.currentBalance < 0 ? '#52c41a' : '#1890ff') : '#d9d9d9' 
            }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {text}
              {!record.isActive && (
                <Tag color="red" style={{ marginLeft: 8, fontSize: 10 }}>Inactive</Tag>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.code} • {record.phone}
            </div>
            {record.company && (
              <div style={{ fontSize: '12px', color: '#888' }}>
                <TeamOutlined /> {record.company}
              </div>
            )}
          </div>
        </Space>
      )
    },
    {
      title: 'Type/Area',
      key: 'typeArea',
      render: (_, record) => (
        <div>
          <Tag color={record.type === 'company' ? 'blue' : 'green'}>
            {record.type === 'company' ? 'Company' : 'Individual'}
          </Tag>
          {record.area && (
            <div style={{ fontSize: '12px', marginTop: 4 }}>
              <EnvironmentOutlined /> {record.area}
              {record.city && `, ${record.city}`}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Balance',
      dataIndex: 'currentBalance',
      key: 'currentBalance',
      sorter: true,
      render: (balance, record) => {
        const amount = parseFloat(balance || 0);
        const isDue = amount > 0;
        const isCredit = amount < 0;
        const creditUtilization = record.creditLimit > 0 
          ? (amount / record.creditLimit * 100) 
          : 0;
        
        return (
          <div>
            <div style={{
              color: isDue ? '#f5222d' : isCredit ? '#52c41a' : '#666',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              ৳{Math.abs(amount).toLocaleString('en-BD')}
            </div>
            
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              {isDue ? 'Due' : isCredit ? 'Advance' : 'Paid'}
              {record.isOverdue && (
                <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>Over Limit</Tag>
              )}
            </div>

            {record.creditLimit > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: '11px', color: '#999' }}>
                  Limit: ৳{record.creditLimit.toLocaleString('en-BD')}
                </div>
                <ProgressBar 
                  percent={Math.min(creditUtilization, 100)} 
                  isOver={creditUtilization > 100}
                />
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Credit Utilization',
      key: 'creditUtilization',
      render: (_, record) => {
        const utilization = parseFloat(record.creditUtilization || 0);
        
        if (record.creditLimit <= 0) {
          return <Text type="secondary">No Limit</Text>;
        }

        return (
          <div>
            <div style={{ 
              color: utilization > 100 ? '#f5222d' : 
                     utilization > 80 ? '#fa8c16' : '#52c41a',
              fontWeight: 'bold'
            }}>
              {utilization.toFixed(1)}%
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {record.totalSales || 0} sales
            </div>
          </div>
        );
      }
    },
    {
      title: 'Last Activity',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => (
        <div>
          <div>{dayjs(date).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(date).fromNow()}
          </div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedCustomer(record);
                setDetailsModalVisible(true);
              }}
            />
          </Tooltip>
          
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedCustomer(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          
          <Tooltip title={record.isActive ? 'Deactivate' : 'Activate'}>
            <Switch
              checked={record.isActive}
              onChange={() => handleStatusChange(record.id, record.isActive)}
              size="small"
            />
          </Tooltip>
          
          <Popconfirm
            title="Deactivate this customer?"
            description="Customer will be marked as inactive."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const ProgressBar = ({ percent, isOver }) => (
    <div style={{
      width: '100%',
      height: 6,
      backgroundColor: '#f0f0f0',
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: 2
    }}>
      <div style={{
        width: `${Math.min(percent, 100)}%`,
        height: '100%',
        backgroundColor: isOver ? '#f5222d' : 
                        percent > 80 ? '#fa8c16' : '#52c41a',
        transition: 'width 0.3s'
      }} />
    </div>
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: !record.isActive
    })
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>👥 Customer Management</Title>
      <Text type="secondary">Manage customers, track balances and credit limits</Text>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24} sm={12} md={4.8}>
          <Card>
            <Statistic
              title="Total Customers"
              value={summary.totalCustomers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={4.8}>
          <Card>
            <Statistic
              title="Active Customers"
              value={summary.customersWithDue || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={4.8}>
          <Card>
            <Statistic
              title="Total Balance"
              value={summary.totalBalance || 0}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix="৳"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={4.8}>
          <Card>
            <Statistic
              title="Credit Limit"
              value={summary.totalCreditLimit || 0}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              suffix="৳"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={4.8}>
          <Card>
            <Statistic
              title="Avg Balance"
              value={summary.averageBalance || 0}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix="৳"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginTop: '20px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <Input
              placeholder="Search name, phone, email, code"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </Col>
          
          <Col xs={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Type"
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              allowClear
            >
              <Option value="individual">Individual</Option>
              <Option value="company">Company</Option>
            </Select>
          </Col>
          
          <Col xs={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Area"
              value={filters.area}
              onChange={(value) => handleFilterChange('area', value)}
              allowClear
            >
              {filterOptions.areas.map(area => (
                <Option key={area} value={area}>{area}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Status"
              value={filters.active}
              onChange={(value) => handleFilterChange('active', value)}
            >
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
              <Option value="">All</Option>
            </Select>
          </Col>
          
          <Col xs={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Balance"
              value={filters.hasDue}
              onChange={(value) => handleFilterChange('hasDue', value)}
              allowClear
            >
              <Option value="true">Has Due</Option>
              <Option value="false">No Due</Option>
            </Select>
          </Col>
          
          <Col xs={24} md={2} style={{ textAlign: 'right' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchCustomers}
              loading={loading}
            />
          </Col>
        </Row>
      </Card>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <Card style={{ marginTop: '16px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Text strong>{selectedRowKeys.length} customers selected</Text>
            </Col>
            
            <Col xs={24} md={8}>
              <Select
                style={{ width: '100%' }}
                placeholder="Select action"
                value={bulkAction}
                onChange={setBulkAction}
              >
                <Option value="activate">Activate Selected</Option>
                <Option value="deactivate">Deactivate Selected</Option>
                <Option value="updateArea">Update Area</Option>
                <Option value="updateCreditLimit">Update Credit Limit</Option>
              </Select>
            </Col>
            
            <Col xs={24} md={8} style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setSelectedRowKeys([])}>
                  Clear Selection
                </Button>
                <Button
                  type="primary"
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                >
                  Apply Action
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Actions Bar */}
      <Card style={{ marginTop: '20px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedCustomer(null);
                  setModalVisible(true);
                }}
              >
                Add Customer
              </Button>
              
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleExport('csv')}
              >
                Export CSV
              </Button>
              
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleExport('excel')}
              >
                Export Excel
              </Button>
            </Space>
          </Col>
          
          <Col>
            <Text type="secondary">
              Showing {((pagination.current - 1) * pagination.pageSize) + 1}-
              {Math.min(pagination.current * pagination.pageSize, pagination.total)} 
              of {pagination.total} customers
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Customers Table */}
      <Card style={{ marginTop: '20px' }}>
        <Table
          columns={columns}
          dataSource={customers}
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} customers`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        visible={detailsModalVisible}
        customer={selectedCustomer}
        onClose={() => setDetailsModalVisible(false)}
      />

      {/* Add/Edit Customer Modal */}
      <CustomerFormModal
        visible={modalVisible}
        customer={selectedCustomer}
        onSuccess={() => {
          setModalVisible(false);
          setSelectedCustomer(null);
          fetchCustomers();
        }}
        onCancel={() => {
          setModalVisible(false);
          setSelectedCustomer(null);
        }}
      />
    </div>
  );
};

// Customer Details Modal Component
const CustomerDetailsModal = ({ visible, customer, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (visible && customer) {
      fetchCustomerDetails();
    }
  }, [visible, customer]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/customers/${customer.id}`);
      if (response.data.success) {
        setCustomerData(response.data.data);
      }
    } catch (error) {
      message.error('Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <Modal
      title="Customer Details"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
    >
      {customerData ? (
        <CustomerDetailsView customer={customerData} activeTab={activeTab} onTabChange={setActiveTab} />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading...
        </div>
      )}
    </Modal>
  );
};

// Customer Details View Component
const CustomerDetailsView = ({ customer, activeTab, onTabChange }) => {
  const { customer: cust, statistics, recentSales, recentPayments, recentActivity, summary } = customer;

  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'sales', label: 'Sales History' },
    { key: 'payments', label: 'Payments' },
    { key: 'ledger', label: 'Ledger' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={16}>
            <Title level={3}>{cust.name}</Title>
            <Space size="middle">
              <Tag color={cust.type === 'company' ? 'blue' : 'green'}>
                {cust.type === 'company' ? 'Company' : 'Individual'}
              </Tag>
              <Tag color={cust.isActive ? 'green' : 'red'}>
                {cust.isActive ? 'Active' : 'Inactive'}
              </Tag>
              <Text type="secondary">{cust.code}</Text>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
              ৳{cust.currentBalance.toLocaleString('en-BD')}
            </div>
            <Text type="secondary">Current Balance</Text>
          </Col>
        </Row>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 24 }}>
        <Space size="large">
          {tabs.map(tab => (
            <Button
              key={tab.key}
              type={activeTab === tab.key ? 'primary' : 'default'}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </Space>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <CustomerDetailsTab customer={cust} statistics={statistics} summary={summary} />
      )}
      
      {activeTab === 'sales' && (
        <CustomerSalesTab sales={recentSales} />
      )}
      
      {activeTab === 'payments' && (
        <CustomerPaymentsTab payments={recentPayments} />
      )}
      
      {activeTab === 'ledger' && (
        <CustomerLedgerTab customerId={cust.id} />
      )}
    </div>
  );
};

// Tab Components
const CustomerDetailsTab = ({ customer, statistics, summary }) => (
  <Row gutter={[16, 16]}>
    <Col span={12}>
      <Card title="Contact Information">
        <Descriptions column={1}>
          <Descriptions.Item label="Phone">{customer.phone}</Descriptions.Item>
          {customer.email && <Descriptions.Item label="Email">{customer.email}</Descriptions.Item>}
          {customer.address && <Descriptions.Item label="Address">{customer.address}</Descriptions.Item>}
          {customer.area && <Descriptions.Item label="Area">{customer.area}</Descriptions.Item>}
          {customer.city && <Descriptions.Item label="City">{customer.city}</Descriptions.Item>}
          {customer.company && <Descriptions.Item label="Company">{customer.company}</Descriptions.Item>}
          <Descriptions.Item label="Created">
            {dayjs(customer.createdAt).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Col>
    
    <Col span={12}>
      <Card title="Financial Summary">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Statistic
              title="Credit Limit"
              value={customer.creditLimit}
              suffix="৳"
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Credit Available"
              value={summary?.creditAvailable || 0}
              suffix="৳"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Total Sales"
              value={statistics?.totalSales || 0}
              suffix="৳"
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Average Sale"
              value={statistics?.averageSaleValue || 0}
              suffix="৳"
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Total Payments"
              value={statistics?.totalPayments || 0}
              suffix="৳"
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Avg Payment Days"
              value={statistics?.avgPaymentDays || 0}
              suffix=" days"
            />
          </Col>
        </Row>
      </Card>
    </Col>
  </Row>
);

const CustomerSalesTab = ({ sales }) => (
  <Card>
    <Table
      columns={[
        { title: 'Invoice', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
        { title: 'Date', dataIndex: 'invoiceDate', key: 'date', render: date => dayjs(date).format('DD/MM/YYYY') },
        { title: 'Amount', dataIndex: 'totalAmount', key: 'amount', render: amount => `৳${amount.toLocaleString('en-BD')}` },
        { title: 'Paid', dataIndex: 'paidAmount', key: 'paid', render: amount => `৳${amount.toLocaleString('en-BD')}` },
        { title: 'Due', dataIndex: 'dueAmount', key: 'due', render: amount => `৳${amount.toLocaleString('en-BD')}` },
        { title: 'Status', dataIndex: 'paymentStatus', key: 'status', 
          render: status => <Tag color={status === 'paid' ? 'green' : 'orange'}>{status}</Tag> }
      ]}
      dataSource={sales || []}
      pagination={false}
    />
  </Card>
);

const CustomerPaymentsTab = ({ payments }) => (
  <Card>
    <Table
      columns={[
        { title: 'Reference', dataIndex: 'referenceNo', key: 'reference' },
        { title: 'Date', dataIndex: 'paymentDate', key: 'date', render: date => dayjs(date).format('DD/MM/YYYY') },
        { title: 'Amount', dataIndex: 'amount', key: 'amount', render: amount => `৳${amount.toLocaleString('en-BD')}` },
        { title: 'Method', dataIndex: 'paymentMethod', key: 'method' },
        { title: 'Notes', dataIndex: 'notes', key: 'notes' }
      ]}
      dataSource={payments || []}
      pagination={false}
    />
  </Card>
);

const CustomerLedgerTab = ({ customerId }) => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLedger();
  }, [customerId]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/customers/${customerId}/ledger`);
      if (response.data.success) {
        setLedger(response.data.data.ledger || []);
      }
    } catch (error) {
      message.error('Failed to fetch ledger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Table
        columns={[
          { title: 'Date', dataIndex: 'date', key: 'date', render: date => dayjs(date).format('DD/MM/YYYY') },
          { title: 'Type', dataIndex: 'type', key: 'type' },
          { title: 'Reference', dataIndex: 'reference', key: 'reference' },
          { title: 'Debit', dataIndex: 'debit', key: 'debit', render: amount => amount > 0 ? `৳${amount.toLocaleString('en-BD')}` : '-' },
          { title: 'Credit', dataIndex: 'credit', key: 'credit', render: amount => amount > 0 ? `৳${amount.toLocaleString('en-BD')}` : '-' },
          { title: 'Balance', dataIndex: 'balance', key: 'balance', render: amount => `৳${amount.toLocaleString('en-BD')}` },
          { title: 'Details', dataIndex: 'details', key: 'details' }
        ]}
        dataSource={ledger}
        loading={loading}
        pagination={false}
      />
    </Card>
  );
};

// Customer Form Modal
const CustomerFormModal = ({ visible, customer, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        ...customer,
        openingBalance: customer.currentBalance,
        isActive: customer.isActive !== false
      });
    } else {
      form.resetFields();
    }
  }, [customer, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (customer) {
        await axios.put(`/api/customers/${customer.id}`, values);
        message.success('Customer updated successfully');
      } else {
        await axios.post('/api/customers', values);
        message.success('Customer created successfully');
      }
      onSuccess();
    } catch (error) {
      message.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: 'individual',
          city: 'Dhaka',
          openingBalance: 0,
          creditLimit: 0,
          isActive: true
        }}
      >
        <Form.Item
          name="name"
          label="Customer Name"
          rules={[{ required: true, message: 'Please enter customer name' }]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Customer Type"
        >
          <Select>
            <Option value="individual">Individual</Option>
            <Option value="company">Company</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="company"
          label="Company Name"
        >
          <Input placeholder="Company name (if applicable)" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone Number"
          rules={[
            { required: true, message: 'Please enter phone number' },
            { pattern: /^[0-9+]{10,15}$/, message: 'Please enter valid phone number' }
          ]}
        >
          <Input placeholder="e.g., 01234567890" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { type: 'email', message: 'Please enter valid email' }
          ]}
        >
          <Input placeholder="e.g., customer@email.com" />
        </Form.Item>

        <Form.Item
          name="address"
          label="Address"
        >
          <Input.TextArea placeholder="Full address" rows={2} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="area"
              label="Area"
            >
              <Input placeholder="Area" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="city"
              label="City"
            >
              <Input placeholder="City" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="openingBalance"
              label="Opening Balance"
            >
              <Input type="number" placeholder="0.00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="creditLimit"
              label="Credit Limit"
            >
              <Input type="number" placeholder="0.00" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="taxNumber"
          label="Tax Number"
        >
          <Input placeholder="Tax/VAT number" />
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Status"
          valuePropName="checked"
        >
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notes"
        >
          <Input.TextArea placeholder="Additional notes" rows={2} />
        </Form.Item>

        <Form.Item>
          <Space style={{ float: 'right' }}>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {customer ? 'Update Customer' : 'Create Customer'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomerList;