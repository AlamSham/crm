import { Table, Tag, Button, Space, message, Popconfirm, Input, Modal, Form, Select, Switch, Tabs, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import useMerchAuthStore from '@/store/useMerchAuthStore';

type TemplateStatus = 'pending' | 'active' | 'rejected' | 'draft';

interface TemplateRow {
  key: string;
  name: string;
  type?: string;
  created?: string;
  status: TemplateStatus;
  version?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  variables?: string[];
  selectedCatalogItemIds?: string[];
  catalogLayout?: 'grid2' | 'grid3' | 'list';
  showPrices?: boolean;
  isActive?: boolean;
}

const TemplateApproval = () => {
  const merchUser = useMerchAuthStore((s) => s.user);
  const userId = (merchUser as any)?.id || (merchUser as any)?._id || '';
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [current, setCurrent] = useState<TemplateRow | null>(null);
  const [form] = Form.useForm();
  const [catalogItems, setCatalogItems] = useState<{ _id: string; title: string; images?: { url: string }[] }[]>([]);

  const colorOf = (s: TemplateStatus) => (s === 'active' ? 'green' : s === 'rejected' ? 'red' : s === 'pending' ? 'orange' : 'default');

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/follow-up/templates?userId=${encodeURIComponent(userId)}&role=merch`, { credentials: 'include' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load');
      const list = (json.data?.items || json.data || json.items || []).map((t: any) => ({
        key: t._id,
        name: t.name || t.title || 'Untitled',
        type: t.type || t.category,
        created: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
        status: ((t.isActive ? 'active' : 'pending')) as TemplateStatus,
        version: t.version,
        subject: t.subject,
        htmlContent: t.htmlContent,
        textContent: t.textContent,
        variables: t.variables || [],
        selectedCatalogItemIds: t.selectedCatalogItemIds || [],
        catalogLayout: t.catalogLayout || 'grid2',
        showPrices: !!t.showPrices,
        isActive: !!t.isActive,
      })) as TemplateRow[];
      setRows(list);
    } catch (e: any) {
      message.error(e.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  // Load catalog items when modals open
  useEffect(() => {
    const fetchCatalog = async () => {
      if (!userId || (!isCreateOpen && !isEditOpen)) return;
      try {
        const res = await fetch(`http://localhost:5000/api/catalog/items?userId=${encodeURIComponent(userId)}&role=merch&page=1&limit=100`, { credentials: 'include' });
        const json = await res.json();
        const items = (json?.data?.items || json?.data || json?.items || []) as any[];
        setCatalogItems(items.map((it: any) => ({ _id: it._id, title: it.title || it.name || 'Item', images: it.images })));
      } catch (e) {
        // soft fail
        console.error('Failed to load catalog items');
      }
    };
    fetchCatalog();
  }, [isCreateOpen, isEditOpen, userId]);

  const openCreate = () => { 
    form.resetFields(); 
    setIsCreateOpen(true); 
  };
  const openEdit = (row: TemplateRow) => { 
    setCurrent(row);
    form.setFieldsValue({ 
      name: row.name,
      subject: row.subject,
      htmlContent: row.htmlContent,
      textContent: row.textContent,
      type: row.type,
      variables: row.variables || [],
      selectedCatalogItemIds: row.selectedCatalogItemIds || [],
      catalogLayout: row.catalogLayout || 'grid2',
      showPrices: !!row.showPrices,
    }); 
    setIsEditOpen(true); 
  };

  const doCreate = async () => {
    try {
      const values = await form.validateFields();
      const res = await fetch(`http://localhost:5000/api/follow-up/templates?userId=${encodeURIComponent(userId)}&role=merch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: values.name,
          subject: values.subject,
          htmlContent: values.htmlContent,
          textContent: values.textContent,
          type: values.type,
          variables: values.variables || [],
          selectedCatalogItemIds: values.selectedCatalogItemIds || [],
          catalogLayout: values.catalogLayout || 'grid2',
          showPrices: !!values.showPrices,
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Create failed');
      message.success('Template created (pending approval)');
      setIsCreateOpen(false); load();
    } catch (e: any) { message.error(e.message || 'Create failed'); }
  };

  const doEdit = async () => {
    if (!current) return;
    try {
      const values = await form.validateFields();
      const res = await fetch(`http://localhost:5000/api/follow-up/templates/${current.key}?userId=${encodeURIComponent(userId)}&role=merch`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'include', 
        body: JSON.stringify({ 
          name: values.name,
          subject: values.subject,
          htmlContent: values.htmlContent,
          textContent: values.textContent,
          type: values.type,
          variables: values.variables || [],
          selectedCatalogItemIds: values.selectedCatalogItemIds || [],
          catalogLayout: values.catalogLayout || 'grid2',
          showPrices: !!values.showPrices,
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Update failed');
      message.success('Template updated');
      setIsEditOpen(false); setCurrent(null); load();
    } catch (e: any) { message.error(e.message || 'Update failed'); }
  };

  const doDelete = async (row: TemplateRow) => {
    try {
      const res = await fetch(`http://localhost:5000/api/follow-up/templates/${row.key}?userId=${encodeURIComponent(userId)}&role=merch`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Delete failed');
      message.success('Template deleted');
      load();
    } catch (e: any) { message.error(e.message || 'Delete failed'); }
  };

  const columns = [
    { title: 'Template Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Version', dataIndex: 'version', key: 'version' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: TemplateStatus) => <Tag color={colorOf(s)}>{s}</Tag> },
    { title: 'Actions', key: 'actions', render: (_: any, r: TemplateRow) => (
      <Space>
        <Button icon={<EditOutlined />} onClick={() => openEdit(r)} disabled={r.status === 'active'}>Edit</Button>
        <Popconfirm title="Delete this template?" onConfirm={() => doDelete(r)}>
          <Button icon={<DeleteOutlined />} danger disabled={r.status === 'active'}>Delete</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Templates</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="bg-black border-black">New Template</Button>
      </div>
      <Table rowKey="key" columns={columns as any} dataSource={rows} loading={loading} pagination={{ pageSize: 10 }} className="rounded-lg" />

      <Modal title="Create Template" open={isCreateOpen} onOk={doCreate} onCancel={() => setIsCreateOpen(false)} okText="Create">
        <Form form={form} layout="vertical">
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="Template name" />
          </Form.Item>
          <Form.Item label="Subject" name="subject" rules={[{ required: true }]}> 
            <Input placeholder="Email subject" />
          </Form.Item>
          <Form.Item label="Type" name="type" rules={[{ required: true }]}> 
            <Select placeholder="Select template type">
              <Select.Option value="initial">Initial Email</Select.Option>
              <Select.Option value="followup1">Follow-up 1</Select.Option>
              <Select.Option value="followup2">Follow-up 2</Select.Option>
              <Select.Option value="followup3">Follow-up 3</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="variables" label="Template Variables">
            <Select mode="tags" placeholder="Add variables (e.g., {{name}}, {{company}})" style={{ width: '100%' }} />
          </Form.Item>

          <Tabs defaultActiveKey="html" items={[
            {
              key: 'html',
              label: 'HTML Content',
              children: (
                <>
                  <Form.Item name="htmlContent" label="HTML Content" rules={[{ required: true }]}> 
                    <Input.TextArea rows={8} placeholder="Enter HTML content. You can use {{CATALOG_BLOCK}} to place catalog." />
                  </Form.Item>
                  <Typography.Paragraph type="secondary">
                    You can insert the placeholder {'{{CATALOG_BLOCK}}'} in your HTML to place the catalog where you want. If omitted, the catalog will be appended below.
                  </Typography.Paragraph>
                </>
              )
            },
            {
              key: 'text',
              label: 'Text Content',
              children: (
                <Form.Item name="textContent" label="Text Content" rules={[{ required: true }]}> 
                  <Input.TextArea rows={8} placeholder="Enter plain text content" />
                </Form.Item>
              )
            },
            {
              key: 'catalog',
              label: 'Catalog',
              children: (
                <>
                  <label className="ant-form-item-required mb-1 block">Catalog Items</label>
                  <Form.Item name="selectedCatalogItemIds">
                    <Select mode="multiple" placeholder="Select catalog items to include" optionFilterProp="label" maxTagCount={8}>
                      {catalogItems.map((item) => (
                        <Select.Option key={item._id} value={item._id} label={item.title}>
                          <div className="flex items-center gap-2">
                            {item.images?.[0]?.url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.images[0].url} alt={item.title} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4 }} />
                            )}
                            <span>{item.title}</span>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="catalogLayout" label="Layout" initialValue="grid2">
                    <Select>
                      <Select.Option value="grid2">Grid - 2 columns</Select.Option>
                      <Select.Option value="grid3">Grid - 3 columns</Select.Option>
                      <Select.Option value="list">List</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="showPrices" label="Show Prices" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </>
              )
            }
          ]} />
        </Form>
      </Modal>

      <Modal title="Edit Template" open={isEditOpen} onOk={doEdit} onCancel={() => setIsEditOpen(false)} okText="Save">
        <Form form={form} layout="vertical">
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Subject" name="subject" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
          <Form.Item label="Type" name="type" rules={[{ required: true }]}> 
            <Select placeholder="Select template type">
              <Select.Option value="initial">Initial Email</Select.Option>
              <Select.Option value="followup1">Follow-up 1</Select.Option>
              <Select.Option value="followup2">Follow-up 2</Select.Option>
              <Select.Option value="followup3">Follow-up 3</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="variables" label="Template Variables">
            <Select mode="tags" placeholder="Add variables" style={{ width: '100%' }} />
          </Form.Item>

          <Tabs defaultActiveKey="html" items={[
            {
              key: 'html',
              label: 'HTML Content',
              children: (
                <Form.Item name="htmlContent" label="HTML Content" rules={[{ required: true }]}> 
                  <Input.TextArea rows={8} />
                </Form.Item>
              )
            },
            {
              key: 'text',
              label: 'Text Content',
              children: (
                <Form.Item name="textContent" label="Text Content" rules={[{ required: true }]}> 
                  <Input.TextArea rows={8} />
                </Form.Item>
              )
            },
            {
              key: 'catalog',
              label: 'Catalog',
              children: (
                <>
                  <label className="ant-form-item-required mb-1 block">Catalog Items</label>
                  <Form.Item name="selectedCatalogItemIds">
                    <Select mode="multiple" placeholder="Select catalog items to include" optionFilterProp="label" maxTagCount={8}>
                      {catalogItems.map((item) => (
                        <Select.Option key={item._id} value={item._id} label={item.title}>
                          <div className="flex items-center gap-2">
                            {item.images?.[0]?.url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.images[0].url} alt={item.title} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4 }} />
                            )}
                            <span>{item.title}</span>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="catalogLayout" label="Layout" initialValue="grid2">
                    <Select>
                      <Select.Option value="grid2">Grid - 2 columns</Select.Option>
                      <Select.Option value="grid3">Grid - 3 columns</Select.Option>
                      <Select.Option value="list">List</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="showPrices" label="Show Prices" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </>
              )
            }
          ]} />
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateApproval;