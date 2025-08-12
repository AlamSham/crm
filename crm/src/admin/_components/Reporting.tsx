import { Card, Tabs, DatePicker, Button, Table,  Space } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, TableOutlined } from '@ant-design/icons';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const Reporting = () => {
  // Sales Report Data
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales 2023',
        data: [12500, 19000, 15000, 28000, 21000, 25000],
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Customer Acquisition Data
  const customerData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Customers',
        data: [15, 22, 18, 30, 25, 35],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  // Lead Conversion Data
  const leadData = {
    labels: ['Hot', 'Warm', 'Cold'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Recent Activities Data
  const activitiesColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Activity',
      dataIndex: 'activity',
      key: 'activity',
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
    },
  ];

  const activitiesData = [
    {
      key: '1',
      date: '2023-06-15',
      activity: 'New Lead Added',
      user: 'merch1@company.com',
      details: 'John Doe - Product A',
    },
    {
      key: '2',
      date: '2023-06-14',
      activity: 'Template Uploaded',
      user: 'admin@company.com',
      details: 'Payment Reminder Template',
    },
    {
      key: '3',
      date: '2023-06-13',
      activity: 'Order Processed',
      user: 'merch2@company.com',
      details: 'ORD-1002 - $850',
    },
  ];

  return (
    <Card
      title="Reporting Dashboard"
      extra={
        <Space>
          <RangePicker />
          <Button 
            type="primary" 
            style={{ background: 'black', borderColor: 'black' }}
          >
            Generate Report
          </Button>
          <Button>Export</Button>
        </Space>
      }
    >
      <Tabs defaultActiveKey="1">
        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              Sales Reports
            </span>
          }
          key="1"
        >
          <Bar data={salesData} options={{ responsive: true }} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <LineChartOutlined />
              Customer Reports
            </span>
          }
          key="2"
        >
          <Line data={customerData} options={{ responsive: true }} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <PieChartOutlined />
              Lead Conversion
            </span>
          }
          key="3"
        >
          <Pie data={leadData} options={{ responsive: true }} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <TableOutlined />
              Recent Activities
            </span>
          }
          key="4"
        >
          <Table 
            columns={activitiesColumns} 
            dataSource={activitiesData} 
            size="small"
            pagination={{ pageSize: 5 }}
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default Reporting;