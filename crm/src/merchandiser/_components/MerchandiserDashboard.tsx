import { Card, Row, Col, Statistic, Table, Typography, Tag } from 'antd';
import { 
  ArrowUpOutlined, 
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  BarChartOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const { Title: AntTitle } = Typography;

const MerchandiserDashboard = () => {
  // Chart Data for Bar Chart
  const leadsChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Leads 2023',
        data: [12, 19, 15, 27, 22, 30],
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Communication Data for Line Chart
  const commData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Communications Sent',
        data: [24, 38, 30, 54, 44, 60],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  // Recent Leads Table Data
  const leadsColumns = [
    {
      title: 'Lead ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Product Interest',
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => (
        <Tag color={text === 'Hot' ? 'red' : text === 'Warm' ? 'orange' : 'blue'}>
          {text}
        </Tag>
      ),
    },
  ];

  const leadsTableData = [
    {
      key: '1',
      id: 'LD-1001',
      customer: 'John Doe',
      product: 'Product A',
      status: 'Hot',
    },
    {
      key: '2',
      id: 'LD-1002',
      customer: 'Jane Smith',
      product: 'Product C',
      status: 'Warm',
    },
    {
      key: '3',
      id: 'LD-1003',
      customer: 'Robert Johnson',
      product: 'Product B',
      status: 'Cold',
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <AntTitle level={3} style={{ marginBottom: '24px' }}>Merchandiser Dashboard</AntTitle>
      
      {/* Stats Cards Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={154}
              valueStyle={{ color: '#000' }}
              prefix={<UserOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> 12%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={8}
              valueStyle={{ color: '#000' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Scheduled Comms"
              value={24}
              valueStyle={{ color: '#000' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Upcoming Events"
              value={5}
              valueStyle={{ color: '#000' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="Monthly Leads" extra={<BarChartOutlined />}>
            <Bar data={leadsChartData} options={{ responsive: true }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Communications" extra={<LineChartOutlined />}>
            <Line data={commData} options={{ responsive: true }} />
          </Card>
        </Col>
      </Row>

      {/* Recent Leads Table */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Recent Leads">
            <Table 
              columns={leadsColumns} 
              dataSource={leadsTableData} 
              size="small"
              pagination={{ pageSize: 5 }} 
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MerchandiserDashboard;