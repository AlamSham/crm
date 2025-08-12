import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, Switch } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Option } = Select;

const AccessControl = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const rolesData = [
    {
      key: '1',
      role: 'Super Admin',
      permissions: ['All'],
      users: 1,
      status: true,
    },
    {
      key: '2',
      role: 'Merchandiser',
      permissions: ['Leads', 'Templates', 'Events'],
      users: 5,
      status: true,
    },
    {
      key: '3',
      role: 'Sales',
      permissions: ['Leads', 'Customers'],
      users: 3,
      status: false,
    },
  ];

  const columns = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <div style={{ maxWidth: 300 }}>
          {permissions.map((perm, index) => (
            <Tag key={index} color="blue" style={{ marginBottom: 4 }}>{perm}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'users',
      key: 'users',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean) => (
        <Switch 
          checked={status} 
          checkedChildren="Active" 
          unCheckedChildren="Inactive"
          style={{ backgroundColor: status ? 'black' : undefined }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button icon={<EditOutlined />} style={{ color: 'black' }}>Edit</Button>
          <Button danger icon={<DeleteOutlined />}>Delete</Button>
        </Space>
      ),
    },
  ];

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      console.log('Received values:', values);
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <Card
      title="Access Control Management"
      extra={
        <Space>
          <Input 
            placeholder="Search roles..." 
            prefix={<SearchOutlined />} 
            style={{ width: 200 }} 
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showModal}
            style={{ background: 'black', borderColor: 'black' }}
          >
            Add New Role
          </Button>
        </Space>
      }
    >
      <Table 
        columns={columns} 
        dataSource={rolesData} 
        bordered
        pagination={{ pageSize: 5 }}
      />

      <Modal 
        title="Add New Role" 
        visible={isModalVisible} 
        onOk={handleOk} 
        onCancel={handleCancel}
        okButtonProps={{ style: { background: 'black', borderColor: 'black' } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="roleName"
            label="Role Name"
            rules={[{ required: true, message: 'Please input role name!' }]}
          >
            <Input placeholder="e.g. Inventory Manager" />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Permissions"
            rules={[{ required: true, message: 'Please select permissions!' }]}
          >
            <Select mode="multiple" placeholder="Select permissions">
              <Option value="Dashboard">Dashboard</Option>
              <Option value="Customers">Customers</Option>
              <Option value="Products">Products</Option>
              <Option value="Orders">Orders</Option>
              <Option value="Templates">Templates</Option>
              <Option value="Reports">Reports</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AccessControl;