import { Table, Tag, Input, Button, Space, Badge, Dropdown, Menu, DatePicker, Modal, Form, Select, Popconfirm, message } from 'antd';
import { SearchOutlined, FilterOutlined, DownOutlined, CalendarOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import type { ColumnType } from 'antd/es/table';
import TextArea from 'antd/es/input/TextArea';
import { leadApi, type LeadDto, type LeadPayload } from '../_libs/lead-api';

interface LeadData {
  key: string;
  customer: string;
  status: 'Hot' | 'Cold' | 'Follow-up';
  priority: 'High' | 'Medium' | 'Low';
  lastContact: string | null;
  nextAction: string | null;
  notes?: string;
}

const LeadTable = () => {
  const [filterVisible, setFilterVisible] = useState(false);
  const [priorityFilterVisible, setPriorityFilterVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const [search, setSearch] = useState<string>('');

  // Data state
  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number }>({ page: 1, limit: 10, total: 0 });

  // Modal/Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<LeadDto | null>(null);
  const [form] = Form.useForm<LeadPayload & { dates?: [moment.Moment, moment.Moment] }>();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEdit = (lead: LeadDto) => {
    setEditing(lead);
    form.setFieldsValue({
      customer: lead.customer,
      status: lead.status,
      priority: lead.priority,
      notes: lead.notes || '',
      dates: [lead.lastContact ? moment(lead.lastContact) : null, lead.nextAction ? moment(lead.nextAction) : null].filter(Boolean) as any,
    } as any);
    setIsModalOpen(true);
  };

  const loadLeads = async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      // map status keys ['hot','cold','followup'] -> labels with proper casing
      if (selectedStatus.length > 0) {
        const mapped = selectedStatus.map((s) =>
          s === 'followup'
            ? 'Follow-up'
            : s.toString().replace(/^./, (c: string) => c.toUpperCase())
        );
        params.status = mapped.join(',');
      }
      // map priority keys ['high','medium','low'] -> labels ['High','Medium','Low']
      if (selectedPriority.length > 0) {
        const mappedP = selectedPriority.map((p) => p.toString().replace(/^./, (c: string) => c.toUpperCase()));
        params.priority = mappedP.join(',');
      }
      if (dateRange) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      const { leads: items, pagination: pg } = await leadApi.list(params);
      setLeads(items);
      setPagination({ page: pg.page, limit: pg.limit, total: pg.total });
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusMenu = {
    items: [
      { key: 'hot', label: 'Hot' },
      { key: 'cold', label: 'Cold' },
      { key: 'followup', label: 'Follow-up' },
    ],
    selectable: true,
    multiple: true,
    selectedKeys: selectedStatus as any,
    onSelect: ({ selectedKeys }: any) => setSelectedStatus(selectedKeys as string[]),
    onDeselect: ({ selectedKeys }: any) => setSelectedStatus(selectedKeys as string[]),
  } as const

  const priorityMenu = {
    items: [
      { key: 'high', label: 'High' },
      { key: 'medium', label: 'Medium' },
      { key: 'low', label: 'Low' },
    ],
    selectable: true,
    multiple: true,
    selectedKeys: selectedPriority as any,
    onSelect: ({ selectedKeys }: any) => setSelectedPriority(selectedKeys as string[]),
    onDeselect: ({ selectedKeys }: any) => setSelectedPriority(selectedKeys as string[]),
  } as const

  const columns: ColumnType<LeadData>[] = [
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: (text: string) => <span className="font-medium">{text}</span>,
      sorter: (a: LeadData, b: LeadData) => a.customer.localeCompare(b.customer),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: 'Hot' | 'Cold' | 'Follow-up') => (
        <Tag
          color={status === 'Hot' ? 'red' : status === 'Cold' ? 'blue' : 'orange'}
          className="font-semibold"
        >
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Hot', value: 'Hot' },
        { text: 'Cold', value: 'Cold' },
        { text: 'Follow-up', value: 'Follow-up' },
      ],
      onFilter: (value: React.Key | boolean, record: LeadData) =>
        typeof value === 'string' ? record.status === value : false,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: 'High' | 'Medium' | 'Low') => (
        <Badge
          status={priority === 'High' ? 'error' : priority === 'Medium' ? 'warning' : 'success'}
          text={priority}
          className="font-medium"
        />
      ),
      sorter: (a: LeadData, b: LeadData) => a.priority.localeCompare(b.priority),
    },
    {
      title: 'Last Contact',
      dataIndex: 'lastContact',
      key: 'lastContact',
      render: (v: string | null) => (v ? moment(v).format('YYYY-MM-DD') : '-'),
      sorter: (a: LeadData, b: LeadData) => new Date(a.lastContact || '').getTime() - new Date(b.lastContact || '').getTime(),
    },
    {
      title: 'Next Action',
      dataIndex: 'nextAction',
      key: 'nextAction',
      render: (text: string) => (
        <div className="flex items-center">
          <CalendarOutlined className="mr-2 text-gray-400" />
          <span>{text ? moment(text).format('YYYY-MM-DD') : '-'}</span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record as any)}>Edit</Button>
          <Popconfirm title="Delete this lead?" onConfirm={async () => {
            try {
              await leadApi.remove((record as any).key)
              message.success('Lead deleted')
              loadLeads(pagination.page)
            } catch (e: any) {
              message.error(e?.response?.data?.message || 'Delete failed')
            }
          }}>
            <Button danger type="link">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tableData: LeadData[] = useMemo(() => {
    const mapped = leads.map((l) => ({
      key: l._id,
      customer: l.customer,
      status: l.status,
      priority: l.priority,
      lastContact: l.lastContact ? l.lastContact : null,
      nextAction: l.nextAction ? l.nextAction : null,
      notes: l.notes,
    }))
    const filtered = mapped.filter(lead => {
      // Apply date range filter if dateRange exists
      if (dateRange) {
        const [start, end] = dateRange;
        const lastContactDate = lead.lastContact ? new Date(lead.lastContact) : null;
        if (!lastContactDate || !(lastContactDate >= start.toDate() && lastContactDate <= end.toDate())) {
          return false;
        }
      }
      return true;
    })
    return filtered
  }, [leads, dateRange]);

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Lead Deposition</h2>
        <div className="flex space-x-2">
          <Input
            placeholder="Search leads..."
            prefix={<SearchOutlined />}
            className="w-64 rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Dropdown
            menu={statusMenu as any}
            open={filterVisible}
            onOpenChange={setFilterVisible}
            trigger={['click']}
          >
            <Button>
              <FilterOutlined />
              Status <DownOutlined />
            </Button>
          </Dropdown>
          <Dropdown
            menu={priorityMenu as any}
            open={priorityFilterVisible}
            onOpenChange={setPriorityFilterVisible}
            trigger={['click']}
          >
            <Button>
              <FilterOutlined />
              Priority <DownOutlined />
            </Button>
          </Dropdown>
          <DatePicker.RangePicker
            value={dateRange as any}
            onChange={(dates) => setDateRange(dates as [moment.Moment, moment.Moment] | null)}
            className="rounded-lg"
          />
          <Button type="primary" onClick={() => loadLeads(1)}>
            Apply Filters
          </Button>
          <Button onClick={openCreate}>New Lead</Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={tableData}
        bordered
        loading={loading}
        pagination={{
          position: ['bottomRight'],
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          onChange: (p, s) => loadLeads(p, s),
        }}
        className="rounded-lg overflow-hidden"
        rowClassName="hover:bg-gray-50"
      />

      <Modal
        title={editing ? 'Edit Lead' : 'New Lead'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        onOk={() => {
          form.submit()
        }}
        okText={editing ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" onFinish={async (values) => {
          const payload: LeadPayload = {
            customer: values.customer,
            status: values.status,
            priority: values.priority,
            notes: values.notes || '',
            lastContact: values.dates?.[0] ? values.dates[0].toISOString() : undefined,
            nextAction: values.dates?.[1] ? values.dates[1].toISOString() : undefined,
          }
          try {
            if (editing) {
              await leadApi.update(editing._id, payload)
              message.success('Lead updated')
            } else {
              await leadApi.create(payload)
              message.success('Lead created')
            }
            setIsModalOpen(false)
            loadLeads(pagination.page)
          } catch (e: any) {
            message.error(e?.response?.data?.message || 'Save failed')
          }
        }}>
          <Form.Item label="Customer" name="customer" rules={[{ required: true, message: 'Customer is required' }]}>
            <Input placeholder="Enter customer name" />
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue={'Follow-up'} rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Hot', value: 'Hot' },
                { label: 'Cold', value: 'Cold' },
                { label: 'Follow-up', value: 'Follow-up' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Priority" name="priority" initialValue={'Medium'} rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'High', value: 'High' },
                { label: 'Medium', value: 'Medium' },
                { label: 'Low', value: 'Low' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Last Contact / Next Action" name="dates">
            <DatePicker.RangePicker />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeadTable;