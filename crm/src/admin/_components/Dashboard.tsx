import { Card, Row, Col, Statistic, Table, Typography, Tag } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
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
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const { Title: AntTitle } = Typography;

const Dashboard = () => {
  // Sales Data for Bar Chart
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales 2023',
        data: [65, 59, 80, 81, 56, 55],
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Customer Growth Data for Line Chart
  const customerData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Customers',
        data: [12, 19, 15, 27, 22, 30],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  // Product Distribution Data for Pie Chart
  const productData = {
    labels: ['Product A', 'Product B', 'Product C', 'Product D'],
    datasets: [
      {
        data: [30, 25, 20, 25],
        backgroundColor: [
          'rgba(0, 0, 0, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
        ],
        borderColor: [
          'rgba(0, 0, 0, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Recent Orders Table Data
  const ordersColumns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (text: string) => `$${text}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => (
        <Tag color={text === 'Delivered' ? 'green' : text === 'Pending' ? 'orange' : 'blue'}>
          {text}
        </Tag>
      ),
    },
  ];

  const ordersData = [
    {
      key: '1',
      id: 'ORD-1001',
      customer: 'John Doe',
      date: '2023-06-15',
      amount: '1250',
      status: 'Delivered',
    },
    {
      key: '2',
      id: 'ORD-1002',
      customer: 'Jane Smith',
      date: '2023-06-14',
      amount: '850',
      status: 'Shipped',
    },
    {
      key: '3',
      id: 'ORD-1003',
      customer: 'Robert Johnson',
      date: '2023-06-13',
      amount: '2200',
      status: 'Pending',
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <AntTitle level={3} style={{ marginBottom: '24px' }}>Dashboard Overview</AntTitle>
      
      {/* Stats Cards Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={1254}
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
              title="Total Orders"
              value={342}
              valueStyle={{ color: '#000' }}
              prefix={<ShoppingOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> 8%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Revenue"
              value={65890}
              valueStyle={{ color: '#000' }}
              prefix={<DollarOutlined />}
              precision={2}
              suffix={
                <span style={{ fontSize: '14px', color: '#f5222d' }}>
                  <ArrowDownOutlined /> 3%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Conversion Rate"
              value={4.2}
              valueStyle={{ color: '#000' }}
              prefix={<BarChartOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="Monthly Sales" extra={<BarChartOutlined />}>
            <Bar data={salesData} options={{ responsive: true }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Customer Growth" extra={<LineChartOutlined />}>
            <Line data={customerData} options={{ responsive: true }} />
          </Card>
        </Col>
      </Row>

      {/* Second Charts Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="Product Distribution" extra={<PieChartOutlined />}>
            <Pie data={productData} options={{ responsive: true }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Recent Orders">
            <Table 
              columns={ordersColumns} 
              dataSource={ordersData} 
              size="small"
              pagination={{ pageSize: 5 }} 
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;