import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Table, Form, Input,
  Select, Modal, message, Tag, Switch, Space,
  Typography, Popconfirm, Tooltip, Descriptions
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EnvironmentOutlined, PhoneOutlined, MailOutlined,
  UserOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const BranchSettings = () => {
  const [form] = Form.useForm();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/settings/branches');
      setBranches(response.data.data?.branches || []);
    } catch (error) {
      message.error('Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingBranch) {
        await axios.put(`/api/settings/branches/${editingBranch.id}`, values);
        message.success('Branch updated successfully');
      } else {
        await axios.post('/api/settings/branches', values);
        message.success('Branch created successfully');
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingBranch(null);
      fetchBranches();
    } catch (error) {
      message.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/settings/branches/${id}`);
      message.success('Branch deleted successfully');
      fetchBranches();
    } catch (error) {
      message.error('Failed to delete branch');
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await axios.patch(`/api/settings/branches/${id}/status`, { status: newStatus });
      message.success(`Branch ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchBranches();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const columns = [
    {
      title: 'Branch Info',
      dataIndex: 'name',
      key: 'info',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Code: {record.code}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <EnvironmentOutlined /> {record.city}, {record.state}
          </div>
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div><PhoneOutlined /> {record.phone}</div>
          {record.email && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <MailOutlined /> {record.email}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingBranch(record);
                form.setFieldsValue(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          
          <Tooltip title={record.status === 'active' ? 'Deactivate' : 'Activate'}>
            <Switch
              checked={record.status === 'active'}
              onChange={() => handleStatusChange(record.id, record.status)}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this branch?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>🏢 Branch Management</Title>
      <Text type="secondary">Manage multiple branches of Tanisha Enterprise</Text>

      <Card
        style={{ marginTop: '20px' }}
        title="Branch List"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingBranch(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Add New Branch
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={branches}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingBranch ? 'Edit Branch' : 'Add New Branch'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingBranch(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Branch Code"
                rules={[{ required: true, message: 'Please enter branch code' }]}
              >
                <Input placeholder="e.g., DHA-MAIN" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="name"
                label="Branch Name"
                rules={[{ required: true, message: 'Please enter branch name' }]}
              >
                <Input placeholder="e.g., Dhaka Main Branch" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <TextArea rows={2} placeholder="Full address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="e.g., Dhaka" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="e.g., 01234567890" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="e.g., dhaka@tanisha.com" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                initialValue="active"
              >
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="managerId"
            label="Manager (Optional)"
          >
            <Input placeholder="Manager user ID" />
          </Form.Item>

          <Form.Item
            name="openingDate"
            label="Opening Date (Optional)"
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                {editingBranch ? 'Update Branch' : 'Create Branch'}
              </Button>
              
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BranchSettings;