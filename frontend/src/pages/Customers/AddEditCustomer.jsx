import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, InputNumber, Space, message } from 'antd';
import { PhoneOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;

const AddEditCustomer = ({ customer, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        ...customer,
        openingBalance: parseFloat(customer.openingBalance || 0),
        creditLimit: parseFloat(customer.creditLimit || 0)
      });
    } else {
      form.resetFields();
    }
  }, [customer, form]);

  const generateCustomerCode = () => {
    const prefix = 'CUST';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${random}`;
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        code: values.code || generateCustomerCode()
      };

      if (customer) {
        // Update existing customer
        await axios.put(`/api/customers/${customer.id}`, payload);
        message.success('Customer updated successfully');
      } else {
        // Create new customer
        await axios.post('/api/customers', payload);
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
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        status: 'active',
        openingBalance: 0,
        creditLimit: 0
      }}
    >
      <Form.Item
        name="name"
        label="Customer Name"
        rules={[{ required: true, message: 'Please enter customer name' }]}
      >
        <Input 
          placeholder="Enter full name" 
          prefix={<UserOutlined />}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="code"
        label="Customer Code"
      >
        <Input 
          placeholder="Auto-generated if left empty" 
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="phone"
        label="Phone Number"
        rules={[
          { required: true, message: 'Please enter phone number' },
          { pattern: /^[0-9+]{10,15}$/, message: 'Please enter valid phone number' }
        ]}
      >
        <Input 
          placeholder="e.g., 01234567890" 
          prefix={<PhoneOutlined />}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { type: 'email', message: 'Please enter valid email' }
        ]}
      >
        <Input 
          placeholder="e.g., customer@email.com" 
          prefix={<MailOutlined />}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="address"
        label="Address"
      >
        <TextArea 
          placeholder="Enter full address" 
          rows={3}
        />
      </Form.Item>

      <Form.Item
        name="openingBalance"
        label="Opening Balance"
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="0.00"
          prefix="৳"
          size="large"
          min={-1000000}
          max={1000000}
        />
      </Form.Item>

      <Form.Item
        name="creditLimit"
        label="Credit Limit"
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="0.00"
          prefix="৳"
          size="large"
          min={0}
        />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
      >
        <Select size="large">
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="notes"
        label="Notes"
      >
        <TextArea 
          placeholder="Additional notes about this customer" 
          rows={2}
        />
      </Form.Item>

      <Form.Item>
        <Space style={{ float: 'right' }}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size="large"
          >
            {customer ? 'Update Customer' : 'Create Customer'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default AddEditCustomer;