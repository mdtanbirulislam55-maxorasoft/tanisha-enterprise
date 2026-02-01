import React, { useState } from 'react';
import { 
  Card, Row, Col, Button, Select, DatePicker, Table, 
  message, Space, Alert, Progress, Typography, Statistic 
} from 'antd';
import {
  DownloadOutlined, FilePdfOutlined, FileExcelOutlined,
  FileTextOutlined, PrinterOutlined, ReloadOutlined,
  BarChartOutlined, ShoppingOutlined, UserOutlined,
  DollarOutlined, TeamOutlined
} from '@ant-design/icons';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ExportData = () => {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState('sales');
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [format, setFormat] = useState('excel');
  const [exportProgress, setExportProgress] = useState(0);
  const [previewData, setPreviewData] = useState([]);

  const exportTypes = [
    { value: 'sales', label: 'Sales Report', icon: <ShoppingOutlined /> },
    { value: 'purchase', label: 'Purchase Report', icon: <DollarOutlined /> },
    { value: 'customers', label: 'Customer List', icon: <UserOutlined /> },
    { value: 'products', label: 'Product List', icon: <BarChartOutlined /> },
    { value: 'suppliers', label: 'Supplier List', icon: <TeamOutlined /> }
  ];

  const fetchPreviewData = async () => {
    setLoading(true);
    try {
      // Demo data for preview
      const demoData = {
        sales: [
          { id: 1, invoiceNo: 'INV-001', date: '2024-01-15', customer: 'John Doe', amount: 15000, status: 'Paid' },
          { id: 2, invoiceNo: 'INV-002', date: '2024-01-16', customer: 'Jane Smith', amount: 8500, status: 'Pending' }
        ],
        customers: [
          { id: 1, name: 'John Doe', email: 'john@email.com', phone: '0123456789', totalOrders: 5, totalSpent: 50000 },
          { id: 2, name: 'Jane Smith', email: 'jane@email.com', phone: '9876543210', totalOrders: 3, totalSpent: 25000 }
        ],
        products: [
          { id: 1, code: 'P001', name: 'Product A', category: 'Electronics', stock: 100, price: 1500 },
          { id: 2, code: 'P002', name: 'Product B', category: 'Clothing', stock: 50, price: 800 }
        ]
      };

      setPreviewData(demoData[exportType] || demoData.sales);
      message.success('Preview data loaded');
      
    } catch (error) {
      message.error('Failed to load preview data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setExportProgress(0);
    
    try {
      // Simulate progress
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call your backend API
      const response = await axios.get(`/api/reports/export/${exportType}`, {
        params: {
          startDate: dateRange[0]?.format('YYYY-MM-DD'),
          endDate: dateRange[1]?.format('YYYY-MM-DD'),
          format: format
        },
        responseType: 'blob'
      });

      clearInterval(interval);
      setExportProgress(100);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');
      const filename = `${exportType}_report_${timestamp}.${format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'}`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success(`Export completed successfully!`);
      
      setTimeout(() => setExportProgress(0), 1000);
      
    } catch (error) {
      message.error('Export failed. Please try again.');
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = {
    sales: [
      { title: 'Invoice No', dataIndex: 'invoiceNo', key: 'invoiceNo' },
      { title: 'Date', dataIndex: 'date', key: 'date' },
      { title: 'Customer', dataIndex: 'customer', key: 'customer' },
      { title: 'Amount', dataIndex: 'amount', key: 'amount', render: val => `৳${val.toLocaleString()}` },
      { title: 'Status', dataIndex: 'status', key: 'status', 
        render: status => <span style={{ 
          color: status === 'Paid' ? 'green' : status === 'Pending' ? 'orange' : 'red',
          fontWeight: 'bold'
        }}>{status}</span> }
    ],
    customers: [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      { title: 'Phone', dataIndex: 'phone', key: 'phone' },
      { title: 'Total Orders', dataIndex: 'totalOrders', key: 'totalOrders' },
      { title: 'Total Spent', dataIndex: 'totalSpent', key: 'totalSpent', render: val => `৳${val.toLocaleString()}` }
    ],
    products: [
      { title: 'Code', dataIndex: 'code', key: 'code' },
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { title: 'Category', dataIndex: 'category', key: 'category' },
      { title: 'Stock', dataIndex: 'stock', key: 'stock' },
      { title: 'Price', dataIndex: 'price', key: 'price', render: val => `৳${val.toLocaleString()}` }
    ]
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>📊 Data Export</Title>
      <Text type="secondary">Export business data in multiple formats</Text>

      <Row gutter={[24, 24]} style={{ marginTop: '20px' }}>
        <Col xs={24} lg={16}>
          <Card title="Export Settings">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Text strong>Report Type</Text>
                <Select
                  style={{ width: '100%', marginTop: '8px' }}
                  value={exportType}
                  onChange={setExportType}
                >
                  {exportTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              
              <Col xs={24} md={8}>
                <Text strong>Date Range</Text>
                <RangePicker
                  style={{ width: '100%', marginTop: '8px' }}
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD/MM/YYYY"
                />
              </Col>
              
              <Col xs={24} md={8}>
                <Text strong>Export Format</Text>
                <Select
                  style={{ width: '100%', marginTop: '8px' }}
                  value={format}
                  onChange={setFormat}
                >
                  <Option value="excel"><FileExcelOutlined /> Excel (.xlsx)</Option>
                  <Option value="pdf"><FilePdfOutlined /> PDF (.pdf)</Option>
                  <Option value="csv"><FileTextOutlined /> CSV (.csv)</Option>
                </Select>
              </Col>
            </Row>

            <Space style={{ marginTop: '20px' }}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchPreviewData}
                loading={loading}
              >
                Load Preview
              </Button>
              
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={loading}
                disabled={previewData.length === 0}
              >
                Export {format.toUpperCase()}
              </Button>
            </Space>

            {exportProgress > 0 && (
              <div style={{ marginTop: '20px' }}>
                <Progress percent={exportProgress} status="active" />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Preparing download...
                </Text>
              </div>
            )}
          </Card>

          <Card title="Data Preview" style={{ marginTop: '20px' }}>
            <Table
              columns={columns[exportType] || columns.sales}
              dataSource={previewData}
              loading={loading}
              pagination={{ pageSize: 5 }}
              size="small"
            />
            <Text type="secondary" style={{ display: 'block', marginTop: '10px' }}>
              Showing {previewData.length} records preview
            </Text>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Export Statistics">
            <Statistic
              title="Total Records Available"
              value={previewData.length}
              suffix="records"
              style={{ marginBottom: '20px' }}
            />
            
            <div style={{ marginBottom: '20px' }}>
              <Text strong>Selected Period:</Text>
              <div>
                {dateRange[0]?.format('DD/MM/YYYY')} to {dateRange[1]?.format('DD/MM/YYYY')}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <Text strong>File Size Estimate:</Text>
              <div>~{(previewData.length * 0.5).toFixed(1)} KB</div>
            </div>

            <Alert
              message="Export Tips"
              description="Export during off-peak hours for faster processing. CSV format is recommended for large datasets."
              type="info"
              showIcon
            />
          </Card>

          <Card title="Quick Export" style={{ marginTop: '20px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                block 
                icon={<FileExcelOutlined />}
                onClick={() => {
                  setExportType('sales');
                  setFormat('excel');
                  fetchPreviewData().then(() => setTimeout(handleExport, 500));
                }}
              >
                Export Sales Report
              </Button>
              
              <Button 
                block 
                icon={<FilePdfOutlined />}
                onClick={() => {
                  setExportType('customers');
                  setFormat('pdf');
                  fetchPreviewData().then(() => setTimeout(handleExport, 500));
                }}
              >
                Export Customer List
              </Button>
              
              <Button 
                block 
                icon={<FileTextOutlined />}
                onClick={() => {
                  setExportType('products');
                  setFormat('csv');
                  fetchPreviewData().then(() => setTimeout(handleExport, 500));
                }}
              >
                Export Product List
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExportData;