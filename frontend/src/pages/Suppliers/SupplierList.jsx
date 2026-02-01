import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Card, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';

const SupplierList = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);

    const columns = [
        {
            title: 'Supplier Code',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Company',
            dataIndex: 'company',
            key: 'company',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Balance',
            dataIndex: 'balance',
            key: 'balance',
            render: (balance) => (
                <Tag color={balance >= 0 ? 'blue' : 'orange'}>
                    {balance.toLocaleString()} BDT
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'error'}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: () => (
                <Space>
                    <Button type="link">View</Button>
                    <Button type="link">Edit</Button>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setSuppliers([
                {
                    key: '1',
                    code: 'SUP-001',
                    name: 'Abdul Mannan',
                    company: 'Mannan Traders',
                    phone: '01711223344',
                    balance: -25000,
                    status: 'active',
                },
                {
                    key: '2',
                    code: 'SUP-002',
                    name: 'Karim Hardware',
                    company: 'Karim Hardware Store',
                    phone: '01899887766',
                    balance: 0,
                    status: 'active',
                },
            ]);
            setLoading(false);
        }, 500);
    }, []);

    return (
        <Card title="Supplier Management">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Input
                    placeholder="Search suppliers..."
                    prefix={<SearchOutlined />}
                    style={{ width: 300 }}
                />
                <Button type="primary" icon={<PlusOutlined />}>
                    Add Supplier
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={suppliers}
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </Card>
    );
};

export default SupplierList;