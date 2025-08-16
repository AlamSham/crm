import { useEffect, useMemo, useState } from 'react';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, Select, Upload, message, Popconfirm, Drawer, Descriptions, List, Avatar, Tooltip } from 'antd';
import { SearchOutlined, UploadOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCustomers } from '@/admin/_components/hooks/useCustomers';
import type { Customer, CreateCustomerInput } from '@/admin/_components/types/customer';

const { Option } = Select;

const CustomerProfileManagement = () => {
  const [form] = Form.useForm<CreateCustomerInput>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewVisible, setViewVisible] = useState(false);
  const [viewed, setViewed] = useState<Customer | null>(null);

  const { items, total, page, limit, loading, query, setQuery, setPage, setLimit, fetch, create, update, remove, uploadExcel } = useCustomers();

  useEffect(() => {
    fetch().catch(() => message.error('Failed to load customers'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, query])

  const onOpenCreate = () => {
    setEditing(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const onOpenView = (record: Customer) => {
    setViewed(record)
    setViewVisible(true)
  }
  const onOpenEdit = (record: Customer) => {
    setEditing(record)
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      phone: record.phone,
      address: record.address,
      status: record.status,
      interestedProducts: record.interestedProducts,
      history: record.history,
      notes: record.notes,
    } as any)
    setIsModalVisible(true)
  }

  const onSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        const res = await update({ id: editing._id, ...values })
        if (res) message.success('Customer updated')
        else message.error('Update failed')
      } else {
        const res = await create(values)
        if (res) message.success('Customer created')
        else message.error('Create failed')
      }
      setIsModalVisible(false)
      form.resetFields()
    } catch {}
  }

  const onDelete = async (id: string) => {
    const ok = await remove(id)
    if (ok) message.success('Customer deleted')
    else message.error('Delete failed')
  }

  const beforeUpload = async (file: File) => {
    const ok = await uploadExcel(file)
    if (ok) message.success('Excel uploaded')
    else message.error('Upload failed')
    return false // prevent auto upload
  }

  const columns: ColumnsType<Customer> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text: string, record) => (
        <Space>
          <Avatar style={{ background: '#111' }}>{(record.name || '?').charAt(0).toUpperCase()}</Avatar>
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      sorter: (a, b) => (a.phone || '').localeCompare(b.phone || ''),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Hot', value: 'Hot' },
        { text: 'Warm', value: 'Warm' },
        { text: 'Cold', value: 'Cold' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (s: Customer['status']) => (
        <Tag color={s === 'Hot' ? 'red' : s === 'Warm' ? 'orange' : 'blue'} style={{ fontWeight: 600 }}>{s}</Tag>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (text?: string) => (text ? <span title={text}>{text}</span> : <span style={{ color: '#999' }}>—</span>),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space wrap size={4} style={{ display: 'flex' }}>
          <Tooltip title="View">
            <Button size="small" icon={<EyeOutlined />} onClick={() => onOpenView(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => onOpenEdit(record)} />
          </Tooltip>
          <Popconfirm title="Delete this customer?" onConfirm={() => onDelete(record._id)} okButtonProps={{ style: { background: 'black', borderColor: 'black' } }}>
            <Tooltip title="Delete">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="Customer Management"
      styles={{ header: { fontSize: '18px', fontWeight: 'bold' } }}
      extra={
        <Space wrap>
          <Input
            placeholder="Search customers..."
            prefix={<SearchOutlined />}
            style={{ width: 260, borderRadius: 6 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Upload showUploadList={false} beforeUpload={beforeUpload} accept=".xlsx,.xls,.csv">
            <Button icon={<UploadOutlined />} style={{ borderRadius: 6 }}>Upload Excel</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreate} style={{ background: 'black', borderColor: 'black', borderRadius: 6 }}>
            New Customer
          </Button>
        </Space>
      }
      style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
    >
      {/* local styles for zebra rows */}
      <style>{`
        .crm-table-row-light { background: #fafafa; }
        .crm-table-row-dark { background: #ffffff; }
        .crm-fab { position: fixed; bottom: 24px; right: 24px; z-index: 1000; display: inline-flex; }
      `}</style>

      <Table
        columns={columns}
        dataSource={items}
        loading={loading}
        rowKey={(r) => r._id}
        bordered
        sticky
        rowClassName={(_, index) => (index % 2 === 0 ? 'crm-table-row-light' : 'crm-table-row-dark')}
        expandable={{
          expandedRowRender: (r) => (
            <div style={{ padding: '8px 16px' }}>
              <div><strong>Notes:</strong> {r.notes || '—'}</div>
              <div style={{ marginTop: 4 }}>
                <strong>Interested:</strong> {r.interestedProducts?.length ? r.interestedProducts.map(p => <Tag key={p} style={{ marginTop: 4 }}>{p}</Tag>) : '—'}
              </div>
              <div style={{ marginTop: 4 }}><strong>History entries:</strong> {r.history?.length || 0}</div>
            </div>
          ),
        }}
        locale={{
          emptyText: (
            <div style={{ padding: 24, color: '#999' }}>
              <div>No customers found. Try adjusting the search or upload an Excel to add customers.</div>
              <div style={{ marginTop: 12 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreate}>
                  Add Customer
                </Button>
              </div>
            </div>
          ),
        }}
        pagination={{ current: page, pageSize: limit, total, onChange: (p, l) => { setPage(p); setLimit(l) } }}
      />

      {/* Mobile FAB for quick create */}
      <Button type="primary" className="crm-fab" shape="circle" size="large" icon={<PlusOutlined />} onClick={onOpenCreate} />

      <Modal
        title={editing ? 'Edit Customer' : 'Create Customer'}
        open={isModalVisible}
        onOk={onSubmit}
        onCancel={() => setIsModalVisible(false)}
        okButtonProps={{ style: { background: 'black', borderColor: 'black' } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Customer name" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+1 234 ..." />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input placeholder="Full address" />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue={'Warm'}>
            <Select>
              <Option value="Hot">Hot</Option>
              <Option value="Warm">Warm</Option>
              <Option value="Cold">Cold</Option>
            </Select>
          </Form.Item>
          <Form.Item name="interestedProducts" label="Interested Products">
            <Select mode="tags" placeholder="Type and press enter" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Customer Details"
        open={viewVisible}
        width={520}
        onClose={() => setViewVisible(false)}
        styles={{ body: { paddingTop: 0 } }}
      >
        {viewed && (
          <>
            <Descriptions
              column={1}
              size="middle"
              bordered
              items={[
                { key: 'name', label: 'Name', children: <strong>{viewed.name}</strong> },
                { key: 'email', label: 'Email', children: viewed.email || '—' },
                { key: 'phone', label: 'Phone', children: viewed.phone || '—' },
                { key: 'address', label: 'Address', children: viewed.address || '—' },
                { key: 'status', label: 'Status', children: <Tag color={viewed.status === 'Hot' ? 'red' : viewed.status === 'Warm' ? 'orange' : 'blue'} style={{ fontWeight: 600 }}>{viewed.status}</Tag> },
                { key: 'products', label: 'Interested Products', children: (viewed.interestedProducts?.length ? viewed.interestedProducts.map(p => <Tag key={p}>{p}</Tag>) : '—') },
                { key: 'notes', label: 'Notes', children: viewed.notes || '—' },
              ]}
            />

            <div style={{ marginTop: 16 }} />
            <Card size="small" title="History">
              {viewed.history && viewed.history.length > 0 ? (
                <List
                  dataSource={viewed.history}
                  renderItem={(h) => (
                    <List.Item>
                      <Space direction="vertical" size={0}>
                        <strong>{h.action}</strong>
                        <span style={{ color: '#666' }}>{h.details || '—'} • {h.date ? new Date(h.date).toLocaleString() : ''}</span>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ color: '#999' }}>No history</div>
              )}
            </Card>
          </>
        )}
      </Drawer>
    </Card>
  );
};

export default CustomerProfileManagement;