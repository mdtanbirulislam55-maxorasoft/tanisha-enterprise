import React from 'react';
import { Descriptions, Tag, Table, Card, Row, Col, Statistic, Timeline } from 'antd';
import { 
  UserOutlined, PhoneOutlined, MailOutlined, 
  EnvironmentOutlined, CalendarOutlined, WalletOutlined,
  ShoppingOutlined, HistoryOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const CustomerDetails = ({ customer }) => {
  // Sample recent transactions data
  const recentTransactions = [
    { id: 1, date: '2024-01-15', type: 'Sale', invoice: 'INV-001', amount: 15000, status: 'Paid' },
    { id: 2, date: '2024-01-10', type: 'Payment', reference: 'PAY-001', amount: 10000, status: 'Completed' },
    { id: 3, date: '2024-01-05', type: 'Sale', invoice: 'INV-002', amount: 8500, status: 'Pending' },
  ];

  const transactionColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Reference', dataIndex: 'invoice', key: 'reference' },
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      key: 'amount',
      render: amount => `৳${amount.toLocaleString('en-BD')}`
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: status => (
        <Tag color={status === 'Paid' ? 'green' : status === 'Pending' ? 'orange' : 'blue'}>
          {status}
        </Tag>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Basic Information">
            <Descriptions column={2}>
              <Descriptions.Item label={<><UserOutlined /> Name</>}>
                {customer.name}
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                {customer.phone}
              </Descriptions.Item>
              {customer.email && (
                <Descriptions.Item label={<><MailOutlined /> Email</>}>
                  {customer.email}
                </Descriptions.Item>
              )}
              {customer.address && (
                <Descriptions.Item label={<><EnvironmentOutlined /> Address</>} span={2}>
                  {customer.address}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Customer Code">
                <Tag color="blue">{customer.code}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={customer.status === 'active' ? 'green' : 'red'}>
                  {customer.status === 'active' ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<><CalendarOutlined /> Created</>}>
                {dayjs(customer.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              {customer.openingDate && (
                <Descriptions.Item label="Opening Date">
                  {dayjs(customer.openingDate).format('DD/MM/YYYY')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Financial Summary">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Current Balance"
                  value={parseFloat(customer.currentBalance || 0)}
                  prefix={<WalletOutlined />}
                  valueStyle={{ 
                    color: parseFloat(customer.currentBalance || 0) > 0 ? '#f5222d' : '#52c41a' 
                  }}
                  suffix="৳"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Credit Limit"
                  value={parseFloat(customer.creditLimit || 0)}
                  prefix={<WalletOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                  suffix="৳"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Total Purchases"
                  value={customer.totalPurchases || 0}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Total Payments"
                  value={customer.totalPayments || 0}
                  prefix={<WalletOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  suffix="৳"
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Recent Activity">
            <Timeline>
              <Timeline.Item color="green">
                Account created {dayjs(customer.createdAt).fromNow()}
              </Timeline.Item>
              <Timeline.Item color="blue">
                Last purchase 2 days ago
              </Timeline.Item>
              <Timeline.Item color="blue">
                Last payment 1 week ago
              </Timeline.Item>
              <Timeline.Item color="gray">
                Account verified
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Recent Transactions">
            <Table
              columns={transactionColumns}
              dataSource={recentTransactions}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerDetails;