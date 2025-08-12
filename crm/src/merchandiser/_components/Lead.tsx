import { Table, Tag, Input, Button, Space, Badge, Dropdown, Menu, DatePicker } from 'antd';
import { SearchOutlined, FilterOutlined, DownOutlined, CalendarOutlined } from '@ant-design/icons';
import { useState } from 'react';
import moment from 'moment';
import type { ColumnType } from 'antd/es/table';

interface LeadData {
  key: string;
  customer: string;
  status: 'Hot' | 'Cold' | 'Follow-up';
  priority: 'High' | 'Medium' | 'Low';
  lastContact: string;
  nextAction: string;
}

const LeadTable = () => {
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);

  const statusMenu = (
    <Menu
      selectable
      multiple
      selectedKeys={selectedStatus}
      onSelect={({ selectedKeys }) => setSelectedStatus(selectedKeys as string[])}
      onDeselect={({ selectedKeys }) => setSelectedStatus(selectedKeys as string[])}
    >
      <Menu.Item key="hot">Hot</Menu.Item>
      <Menu.Item key="cold">Cold</Menu.Item>
      <Menu.Item key="followup">Follow-up</Menu.Item>
    </Menu>
  );

  const priorityMenu = (
    <Menu
      selectable
      multiple
      selectedKeys={selectedPriority}
      onSelect={({ selectedKeys }) => setSelectedPriority(selectedKeys as string[])}
      onDeselect={({ selectedKeys }) => setSelectedPriority(selectedKeys as string[])}
    >
      <Menu.Item key="high">High</Menu.Item>
      <Menu.Item key="medium">Medium</Menu.Item>
      <Menu.Item key="low">Low</Menu.Item>
    </Menu>
  );

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
      sorter: (a: LeadData, b: LeadData) => new Date(a.lastContact).getTime() - new Date(b.lastContact).getTime(),
    },
    {
      title: 'Next Action',
      dataIndex: 'nextAction',
      key: 'nextAction',
      render: (text: string) => (
        <div className="flex items-center">
          <CalendarOutlined className="mr-2 text-gray-400" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button 
            type="primary" 
            ghost
            className="border-black text-black hover:bg-gray-100"
          >
            Contact
          </Button>
          <Button>Details</Button>
        </Space>
      ),
    },
  ];

  const data: LeadData[] = [
    {
      key: '1',
      customer: 'John Doe',
      status: 'Hot',
      priority: 'High',
      lastContact: '2023-05-15',
      nextAction: '2023-05-18',
    },
    {
      key: '2',
      customer: 'Jane Smith',
      status: 'Cold',
      priority: 'Medium',
      lastContact: '2023-05-10',
      nextAction: '2023-05-20',
    },
    {
      key: '3',
      customer: 'Robert Johnson',
      status: 'Follow-up',
      priority: 'Low',
      lastContact: '2023-04-28',
      nextAction: '2023-06-01',
    },
  ];

  const filteredData = data.filter(lead => {
    // Apply date range filter if dateRange exists
    if (dateRange) {
      const [start, end] = dateRange;
      const lastContactDate = new Date(lead.lastContact);
      if (!(lastContactDate >= start.toDate() && lastContactDate <= end.toDate())) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Lead Deposition</h2>
        <div className="flex space-x-2">
          <Input 
            placeholder="Search leads..." 
            prefix={<SearchOutlined />} 
            className="w-64 rounded-lg"
          />
          <Dropdown 
            overlay={statusMenu} 
            visible={filterVisible}
            onVisibleChange={setFilterVisible}
          >
            <Button>
              <FilterOutlined />
              Status <DownOutlined />
            </Button>
          </Dropdown>
          <Dropdown overlay={priorityMenu}>
            <Button>
              <FilterOutlined />
              Priority <DownOutlined />
            </Button>
          </Dropdown>
          <DatePicker.RangePicker 
            onChange={dates => setDateRange(dates as [moment.Moment, moment.Moment])}
            className="rounded-lg"
          />
        </div>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredData}
        bordered
        pagination={{
          position: ['bottomRight'],
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
        className="rounded-lg overflow-hidden"
        rowClassName="hover:bg-gray-50"
      />
    </div>
  );
};

export default LeadTable;