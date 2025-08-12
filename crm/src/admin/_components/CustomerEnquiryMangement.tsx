import { Card, Table, Tag, Input, Button, Space, Badge } from 'antd';
import { SearchOutlined, MailOutlined } from '@ant-design/icons';

const CustomerEnquiryManagement = () => {
  const columns = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag 
          color={priority === 'High' ? 'red' : priority === 'Medium' ? 'orange' : 'blue'}
          style={{ fontWeight: 600 }}
        >
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Customer Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Interested Products',
      dataIndex: 'products',
      key: 'products',
      render: (products: string[]) => (
        <div style={{ maxWidth: 200 }}>
          {products.map((product, index) => (
            <Tag key={index} style={{ marginBottom: 4 }}>{product}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          status={status === 'New' ? 'processing' : status === 'Responded' ? 'success' : 'default'} 
          text={status}
          style={{ fontWeight: 500 }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button 
            type="primary" 
            icon={<MailOutlined />} 
            style={{ background: 'black', borderColor: 'black' }}
          >
            Respond
          </Button>
          <Button style={{ color: 'black', borderColor: 'black' }}>View Details</Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      priority: 'High',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 890',
      products: ['Product A', 'Product B'],
      status: 'New',
    },
    {
      key: '2',
      priority: 'Medium',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 345 678 901',
      products: ['Product C'],
      status: 'In Progress',
    },
    {
      key: '3',
      priority: 'Low',
      name: 'Robert Johnson',
      email: 'robert@example.com',
      phone: '+1 456 789 012',
      products: ['Product A', 'Product D', 'Product E'],
      status: 'Responded',
    },
  ];

  return (
    <Card 
      title="Customer Enquiry Management" 
      headStyle={{ fontSize: '18px', fontWeight: 'bold' }}
      extra={
        <Input 
          placeholder="Search enquiries..." 
          prefix={<SearchOutlined />} 
          style={{ width: 300, borderRadius: '6px' }} 
        />
      }
      style={{ borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
    >
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            style={{ background: 'black', borderColor: 'black', borderRadius: '6px' }}
          >
            All Enquiries
          </Button>
          <Button style={{ borderRadius: '6px', borderColor: '#d9d9d9' }}>High Priority</Button>
          <Button style={{ borderRadius: '6px', borderColor: '#d9d9d9' }}>New</Button>
          <Button style={{ borderRadius: '6px', borderColor: '#d9d9d9' }}>Responded</Button>
        </Space>
      </div>
      <Table 
        columns={columns} 
        dataSource={data} 
        bordered
        pagination={{ pageSize: 10 }}
        style={{ borderRadius: '8px' }}
      />
    </Card>
  );
};

export default CustomerEnquiryManagement;