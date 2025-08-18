import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, Switch, Avatar, message } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, MailOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useUsers } from '@/admin/_components/hooks/useUsers';

const { Option } = Select;

const AccessControl = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Users state from store
  const {
    rows,
    loading,
    fetchUsers,
    grantLeadAccess,
    revokeLeadAccess,
    grantCatalogAccess,
    revokeCatalogAccess,
    grantTemplateAccess,
    revokeTemplateAccess,
  } = useUsers();
  // Local search state (decoupled from global store)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers().catch(() => message.error('Users fetch failed'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns = [
    {
      title: 'Name',
      dataIndex: 'user',
      key: 'name',
      render: (_: any, record: any) => (
        <Space>
          <Avatar src={record.user?.avatar} icon={!record.user?.avatar ? <UserOutlined /> : undefined} />
          <div style={{ fontWeight: 600 }}>{record.user?.name}</div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (_: any, record: any) => (
        <span style={{ color: '#555' }}>{record.user?.email}</span>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => <strong>{text}</strong>,
    },
    
    {
      title: 'Lead Access',
      dataIndex: 'isLeadAccess',
      key: 'isLeadAccess',
      render: (_: any, record: any) => (
        <Switch
          checked={!!record.isLeadAccess}
          checkedChildren="Enabled"
          unCheckedChildren="Disabled"
          onChange={async (checked) => {
            if (checked) {
              const res = await grantLeadAccess(record.key)
              if (res) message.success('Lead access enabled')
              else message.error('Failed to enable lead access')
            } else {
              const res = await revokeLeadAccess(record.key)
              if (res) message.success('Lead access disabled')
              else message.error('Failed to disable lead access')
            }
          }}
          style={{ backgroundColor: record.isLeadAccess ? 'black' : undefined }}
        />
      ),
    },
    {
      title: 'Catalog Access',
      dataIndex: 'isCatalogAccess',
      key: 'isCatalogAccess',
      render: (_: any, record: any) => (
        <Switch
          checked={!!record.isCatalogAccess}
          checkedChildren="Enabled"
          unCheckedChildren="Disabled"
          onChange={async (checked) => {
            if (checked) {
              const res = await grantCatalogAccess(record.key)
              if (res) message.success('Catalog access enabled')
              else message.error('Failed to enable catalog access')
            } else {
              const res = await revokeCatalogAccess(record.key)
              if (res) message.success('Catalog access disabled')
              else message.error('Failed to disable catalog access')
            }
          }}
          style={{ backgroundColor: record.isCatalogAccess ? 'black' : undefined }}
        />
      ),
    },
    {
      title: 'Template Access',
      dataIndex: 'isTemplateAccess',
      key: 'isTemplateAccess',
      render: (_: any, record: any) => (
        <Switch
          checked={!!record.isTemplateAccess}
          checkedChildren="Enabled"
          unCheckedChildren="Disabled"
          onChange={async (checked) => {
            if (checked) {
              const res = await grantTemplateAccess(record.key)
              if (res) message.success('Template access enabled')
              else message.error('Failed to enable template access')
            } else {
              const res = await revokeTemplateAccess(record.key)
              if (res) message.success('Template access disabled')
              else message.error('Failed to disable template access')
            }
          }}
          style={{ backgroundColor: record.isTemplateAccess ? 'black' : undefined }}
        />
      ),
    },
  ] as any

  // Client-side filtered rows (name/email/role)
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r: any) => {
      return (
        r.user?.name?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        String(r.role || '').toLowerCase().includes(q)
      )
    })
  }, [rows, search])

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
            placeholder="Search users..." 
            prefix={<SearchOutlined />} 
            style={{ width: 200 }} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {/* Optional future: Add Role Modal retained */}
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={filteredRows}
        loading={loading}
        rowKey={(r) => r.key}
        bordered
        pagination={{ pageSize: 10 }}
      />

      {/* Modal kept for future role creation if needed */}
    </Card>
  );
};

export default AccessControl;