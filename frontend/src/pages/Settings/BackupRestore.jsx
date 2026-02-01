import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Table, Tag, Progress,
  Alert, Modal, message, Space, Typography, Statistic,
  Timeline, Select, Upload, Popconfirm
} from 'antd';
import {
  CloudDownloadOutlined, CloudUploadOutlined,
  DatabaseOutlined, ReloadOutlined, DeleteOutlined,
  DownloadOutlined, HistoryOutlined, CheckCircleOutlined,
  WarningOutlined, FileZipOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const BackupRestore = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/settings/backups');
      setBackups(response.data.data?.backups || []);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setBackupProgress(0);
    
    try {
      // Simulate progress
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await axios.post('/api/settings/backups/create', {
        name: `Manual_Backup_${dayjs().format('YYYYMMDD_HHmmss')}`,
        description: 'Manual backup created by user'
      });

      clearInterval(interval);
      setBackupProgress(100);

      if (response.data.success) {
        message.success('Backup created successfully!');
        fetchBackups();
      }

      setTimeout(() => setBackupProgress(0), 1000);
      
    } catch (error) {
      message.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (backupId) => {
    Modal.confirm({
      title: '⚠️ Confirm Restore',
      content: 'This will replace all current data with backup data. Are you sure?',
      okText: 'Yes, Restore',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.post(`/api/settings/backups/${backupId}/restore`);
          message.success('Restore process started successfully!');
        } catch (error) {
          message.error('Failed to restore backup');
        }
      }
    });
  };

  const downloadBackup = async (backupId) => {
    try {
      const response = await axios.get(`/api/settings/backups/${backupId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${dayjs().format('YYYYMMDD')}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Backup download started');
    } catch (error) {
      message.error('Failed to download backup');
    }
  };

  const deleteBackup = async (backupId) => {
    try {
      await axios.delete(`/api/settings/backups/${backupId}`);
      message.success('Backup deleted successfully');
      fetchBackups();
    } catch (error) {
      message.error('Failed to delete backup');
    }
  };

  const columns = [
    {
      title: 'Backup Name',
      dataIndex: 'backupId',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.fileName}
          </div>
        </div>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Size',
      dataIndex: 'fileSize',
      key: 'size',
      render: (size) => `${(size / 1024).toFixed(2)} KB`
    },
    {
      title: 'Type',
      dataIndex: 'backupType',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'full' ? 'blue' : 'green'}>
          {type}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadBackup(record.id)}
          >
            Download
          </Button>
          
          <Button
            size="small"
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={() => restoreBackup(record.id)}
          >
            Restore
          </Button>
          
          <Popconfirm
            title="Delete this backup?"
            onConfirm={() => deleteBackup(record.id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const recentActivities = [
    { time: '2 hours ago', action: 'Auto backup completed', status: 'success' },
    { time: 'Yesterday', action: 'Weekly system check', status: 'success' },
    { time: '3 days ago', action: 'Manual backup by admin', status: 'success' },
    { time: '1 week ago', action: 'Database optimization', status: 'info' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>💾 Backup & Restore</Title>
      <Text type="secondary">Protect your business data with regular backups</Text>

      <Alert
        style={{ margin: '20px 0' }}
        message="Data Protection"
        description="Regular backups are essential for business continuity. We recommend daily automated backups."
        type="warning"
        showIcon
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title="Backup History"
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchBackups}
                loading={loading}
              >
                Refresh
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={backups}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>

          <Card title="Create New Backup" style={{ marginTop: '20px' }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={16}>
                <div>
                  <Text strong>Manual Backup</Text>
                  <Text type="secondary" style={{ display: 'block' }}>
                    Create an immediate backup of all system data.
                  </Text>
                </div>
              </Col>
              
              <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<DatabaseOutlined />}
                  onClick={createBackup}
                  loading={loading && backupProgress === 0}
                  size="large"
                >
                  Create Backup Now
                </Button>
              </Col>
            </Row>

            {backupProgress > 0 && (
              <div style={{ marginTop: '20px' }}>
                <Progress percent={backupProgress} status="active" />
                <Text type="secondary">Creating backup...</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Backup Status">
            <Statistic
              title="Total Backups"
              value={backups.length}
              style={{ marginBottom: '20px' }}
            />
            
            <Statistic
              title="Total Size"
              value={backups.reduce((sum, b) => sum + (b.fileSize || 0), 0) / 1024}
              suffix="KB"
              precision={2}
              style={{ marginBottom: '20px' }}
            />

            <div style={{ marginBottom: '20px' }}>
              <Text strong>Last Backup:</Text>
              <div>
                {backups[0] ? dayjs(backups[0].createdAt).format('DD/MM/YYYY HH:mm') : 'Never'}
              </div>
            </div>
          </Card>

          <Card title="Auto Backup Settings" style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Automatic Backups</Text>
              <div>
                <Switch
                  checked={autoBackup}
                  onChange={setAutoBackup}
                  style={{ marginRight: '8px' }}
                />
                {autoBackup ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>Frequency</Text>
              <Select
                style={{ width: '100%' }}
                value={backupFrequency}
                onChange={setBackupFrequency}
                disabled={!autoBackup}
              >
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="monthly">Monthly</Option>
              </Select>
            </div>

            <Button
              type="primary"
              block
              onClick={() => message.success('Settings saved')}
            >
              Save Settings
            </Button>
          </Card>

          <Card title="Recent Activities" style={{ marginTop: '20px' }}>
            <Timeline>
              {recentActivities.map((activity, index) => (
                <Timeline.Item
                  key={index}
                  color={activity.status === 'success' ? 'green' : 'blue'}
                  dot={activity.status === 'success' ? <CheckCircleOutlined /> : <WarningOutlined />}
                >
                  <div>
                    <Text strong>{activity.action}</Text>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {activity.time}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BackupRestore;