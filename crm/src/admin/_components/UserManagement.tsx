import { Card, Table, Tag, Input, Button, Space, Popconfirm, Switch, Avatar } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';

const UserManagement = () => {
  const columns = [
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user: { name: string; email: string; avatar?: string }) => (
        <Space>
          <Avatar 
            src={user.avatar} 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#f0f0f0', color: 'black' }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{user.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag 
          color={role === 'Super Admin' ? 'red' : 'blue'}
          style={{ fontWeight: 600 }}
        >
          {role}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Switch 
          checked={active} 
          checkedChildren="Active" 
          unCheckedChildren="Inactive"
          style={{ backgroundColor: active ? 'black' : undefined }}
        />
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (text: string) => <span style={{ color: '#555' }}>{text}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            style={{ color: 'black', borderColor: '#d9d9d9', borderRadius: '6px' }}
          >
            Edit
          </Button>
          <Popconfirm 
            title="Are you sure to delete this user?" 
            okText="Yes" 
            cancelText="No"
            okButtonProps={{ style: { background: 'black', borderColor: 'black' } }}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              style={{ borderRadius: '6px' }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      user: { name: 'Admin User', email: 'admin@company.com' },
      role: 'Super Admin',
      active: true,
      lastLogin: '2023-06-15 14:30',
    },
    {
      key: '2',
      user: { name: 'Merchandiser 1', email: 'merch1@company.com' },
      role: 'Merchandiser',
      active: true,
      lastLogin: '2023-06-14 10:15',
    },
    {
      key: '3',
      user: { name: 'Merchandiser 2', email: 'merch2@company.com', avatar: 'https://i.pravatar.cc/150?img=3' },
      role: 'Merchandiser',
      active: false,
      lastLogin: '2023-06-10 09:45',
    },
  ];

  return (
    <Card 
      title="User Management"
      headStyle={{ fontSize: '18px', fontWeight: 'bold' }}
      extra={
        <Space>
          <Input 
            placeholder="Search users..." 
            prefix={<SearchOutlined />} 
            style={{ width: 250, borderRadius: '6px' }} 
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            style={{ background: 'black', borderColor: 'black', borderRadius: '6px' }}
          >
            Add New User
          </Button>
        </Space>
      }
      style={{ borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
    >
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

export default UserManagement;