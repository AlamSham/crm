import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Table, Tag, Input, Button, Space, Badge, Drawer, Descriptions, message, Modal, Form, Select, Popconfirm, Tooltip } from 'antd';
import { SearchOutlined, MailOutlined, EyeOutlined, UserAddOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table'
import { useEnquiries } from '@/admin/_components/hooks/useEnquiries'
import type { CustomerEnquiry } from '@/admin/_components/types/enquiry'
import ComposeEmail from '@/admin/_components/email/compose-email'
import { EmailProvider } from '@/admin/_components/email/gmail-layout'

const CustomerEnquiryManagement = () => {
  const {
    items, total, page, limit, loading,
    search, status, priority,
    setSearch, setPage, setLimit, setStatus, setPriority,
    fetch, convert, update, remove,
  } = useEnquiries()

  const [viewOpen, setViewOpen] = useState(false)
  const [viewed, setViewed] = useState<CustomerEnquiry | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()
  const [customerOptions, setCustomerOptions] = useState<{ label: string; value: string; data: any }[]>([])
  const searchTimer = useRef<any>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined)
  const [editing, setEditing] = useState<CustomerEnquiry | null>(null)
  // Email compose state
  const [composeOpen, setComposeOpen] = useState(false)
  const [composePrefill, setComposePrefill] = useState<{ to?: string; subject?: string; text?: string } | undefined>(undefined)

  useEffect(() => {
    fetch().catch(() => message.error('Failed to load enquiries'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, status, priority])

  const columns: ColumnsType<CustomerEnquiry> = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      responsive: ['xs','sm','md','lg','xl'],
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
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      responsive: ['sm','md','lg','xl'],
      ellipsis: true,
      render: (text: string | undefined) => (
        <Tooltip title={text || '—'}>
          <span style={{ whiteSpace: 'nowrap' }}>{text || '—'}</span>
        </Tooltip>
      )
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      responsive: ['xs','sm','md','lg','xl'],
      ellipsis: true,
      render: (text: string | undefined) => (
        <Tooltip title={text || '—'}>
          <span style={{ whiteSpace: 'nowrap' }}>{text || '—'}</span>
        </Tooltip>
      )
    },
    {
      title: 'Interested Products',
      dataIndex: 'products',
      key: 'products',
      width: 260,
      responsive: ['md','lg','xl'],
      render: (products: string[] = []) => {
        const toShow = products.slice(0, 2)
        const extra = products.length - toShow.length
        return (
          <div style={{ maxWidth: 240 }}>
            {toShow.map((product, index) => (
              <Tag key={index} style={{ marginBottom: 4 }}>{product}</Tag>
            ))}
            {extra > 0 && (
              <Tooltip title={products.join(', ')}>
                <Tag style={{ marginBottom: 4 }}>+{extra} more</Tag>
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      responsive: ['xs','sm','md','lg','xl'],
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
      width: 360,
      fixed: 'right',
      render: (_, r) => (
        <Space wrap size={[8, 8]}>
          <Button 
            type="primary" 
            icon={<MailOutlined />} 
            style={{ background: 'black', borderColor: 'black' }}
            onClick={() => {
              if (!r.email) {
                message.info('No email')
                return
              }
              // Prefill email compose
              const subj = r.products && r.products.length
                ? `Regarding your enquiry about ${r.products[0]}`
                : `Regarding your enquiry`
              const body = `Hi ${r.name || ''},\n\n` +
                `Thanks for your enquiry${r.products?.length ? ` about ${r.products.join(', ')}` : ''}.` +
                `\nPlease let us know a suitable time to connect.`
              setComposePrefill({ to: r.email, subject: subj, text: body })
              setComposeOpen(true)
            }}
          >
            Respond
          </Button>
          <Button icon={<EyeOutlined />} style={{ color: 'black', borderColor: 'black' }} onClick={()=>{ setViewed(r); setViewOpen(true) }}>View</Button>
          <Button icon={<UserAddOutlined />} onClick={async()=>{
            const res = await convert(r._id)
            if (res?.customer?._id) message.success('Converted to customer')
            else if (res) message.success('Converted')
            else message.error('Convert failed')
          }}>Convert</Button>
          <Button icon={<EditOutlined />} onClick={()=>{
            setEditing(r)
            form.setFieldsValue({
              name: r.name,
              email: r.email,
              phone: r.phone,
              products: r.products,
              priority: r.priority,
              status: r.status,
              notes: r.notes,
            })
            setSelectedCustomerId((r as any).linkedCustomerId || undefined)
            setCreateOpen(true)
          }}>Edit</Button>
          <Popconfirm title="Delete this enquiry?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={async()=>{
            const ok = await remove(r._id)
            if (ok) message.success('Enquiry deleted')
            else message.error('Delete failed')
          }}>
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="Customer Enquiry Management" 
      headStyle={{ fontSize: '18px', fontWeight: 'bold' }}
      extra={
        <Space>
          <Input 
            placeholder="Search enquiries..." 
            prefix={<SearchOutlined />} 
            style={{ width: 300, borderRadius: '6px' }} 
            value={search}
            onChange={(e)=> setSearch(e.target.value)}
          />
          <Button type="primary" onClick={()=>{ setEditing(null); setSelectedCustomerId(undefined); form.resetFields(); setCreateOpen(true) }} style={{ background:'black', borderColor:'black' }}>New Enquiry</Button>
        </Space>
      }
      style={{ borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
    >
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            style={{ background: 'black', borderColor: 'black', borderRadius: '6px' }}
            onClick={()=>{ setPriority(undefined); setStatus(undefined); }}
          >
            All
          </Button>
          <Button style={{ borderRadius: '6px', borderColor: '#d9d9d9' }} onClick={()=> setPriority('High')}>High Priority</Button>
          <Button style={{ borderRadius: '6px', borderColor: '#d9d9d9' }} onClick={()=> setStatus('New')}>New</Button>
          <Button style={{ borderRadius: '6px', borderColor: '#d9d9d9' }} onClick={()=> setStatus('Responded')}>Responded</Button>
        </Space>
      </div>
      <Table 
        columns={columns as ColumnsType<any>} 
        dataSource={items} 
        bordered
        loading={loading}
        rowKey={(r)=> r._id}
        pagination={{ current: page, pageSize: limit, total, onChange: (p,l)=>{ setPage(p); setLimit(l) } }}
        style={{ borderRadius: '8px' }}
        size="middle"
        scroll={{ x: 960 }}
      />

      <Modal
        title={editing ? 'Edit Enquiry' : 'New Enquiry'}
        open={createOpen}
        onCancel={()=> setCreateOpen(false)}
        onOk={async ()=>{
          try {
            const values = await form.validateFields()
            const payload = { 
              name: values.name,
              email: values.email,
              phone: values.phone,
              products: values.products || [],
              priority: values.priority,
              status: values.status || 'New',
              notes: values.notes,
              linkedCustomerId: selectedCustomerId,
            }
            if (editing) {
              const updated = await update(editing._id, payload)
              if (updated?._id) {
                message.success('Enquiry updated')
                setCreateOpen(false)
                form.resetFields()
                setEditing(null)
                setSelectedCustomerId(undefined)
              } else {
                message.error('Update failed')
              }
            } else {
              const created = await (await import('@/admin/_components/services/enquiryService')).enquiryService.create(payload)
              if (created?._id) {
                message.success('Enquiry created')
                setCreateOpen(false)
                form.resetFields()
                setSelectedCustomerId(undefined)
                await fetch()
              } else {
                message.error('Failed to create')
              }
            }
          } catch {}
        }}
        okButtonProps={{ style: { background: 'black', borderColor: 'black' } }}
      >
        <Form layout="vertical" form={form} initialValues={{ priority: 'Medium', status: 'New' }}>
          <Form.Item label="Select Existing Customer">
            <Select
              showSearch
              allowClear
              placeholder="Search by name/email/phone"
              filterOption={false}
              onSearch={async (val)=>{
                if (searchTimer.current) clearTimeout(searchTimer.current)
                searchTimer.current = setTimeout(async ()=>{
                  const mod = await import('@/admin/_components/services/customerService')
                  const res = await mod.customerService.list({ q: val, page: 1, limit: 5 })
                  const opts = res.items.map((c:any)=> ({ label: `${c.name} • ${c.email || c.phone || ''}`.trim(), value: c._id, data: c }))
                  setCustomerOptions(opts)
                }, 300)
              }}
              options={customerOptions}
              value={selectedCustomerId}
              onChange={(val, option:any)=>{
                setSelectedCustomerId(val as string | undefined)
                const data = option?.data
                if (data) {
                  form.setFieldsValue({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    products: data.interestedProducts || [],
                  })
                }
              }}
            />
          </Form.Item>
          <Form.Item name="name" label="Customer Name" rules={[{ required: true }]}>
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+1 234 ..." />
          </Form.Item>
          <Form.Item name="products" label="Interested Products">
            <Select mode="tags" placeholder="Type and press enter" />
          </Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
            <Select options={[{value:'High',label:'High'},{value:'Medium',label:'Medium'},{value:'Low',label:'Low'}]} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={[{value:'New',label:'New'},{value:'In Progress',label:'In Progress'},{value:'Responded',label:'Responded'},{value:'Closed',label:'Closed'}]} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="Enquiry Details" open={viewOpen} width={520} onClose={()=> setViewOpen(false)}>
        {viewed && (
          <Descriptions bordered column={1} size="middle" items={[
            { key: 'name', label: 'Name', children: viewed.name },
            { key: 'email', label: 'Email', children: viewed.email || '—' },
            { key: 'phone', label: 'Phone', children: viewed.phone || '—' },
            { key: 'products', label: 'Products', children: (viewed.products||[]).map(p=> <Tag key={p}>{p}</Tag>) },
            { key: 'priority', label: 'Priority', children: <Tag color={viewed.priority==='High'?'red':viewed.priority==='Medium'?'orange':'blue'}>{viewed.priority}</Tag> },
            { key: 'status', label: 'Status', children: viewed.status },
            { key: 'notes', label: 'Notes', children: viewed.notes || '—' },
            { key: 'source', label: 'Source', children: viewed.source || '—' },
          ]} />
        )}
      </Drawer>
      {/* In-app Email Composer */}
      <EmailProvider>
        <ComposeEmail
          isOpen={composeOpen}
          onClose={() => setComposeOpen(false)}
          prefill={composePrefill}
        />
      </EmailProvider>
    </Card>
  );
};

export default CustomerEnquiryManagement;