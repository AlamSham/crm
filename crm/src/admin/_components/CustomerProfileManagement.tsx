import { Card, Descriptions, Tabs, Tag, Button, Input, Space,  } from 'antd';
import { SearchOutlined, MailOutlined, PhoneOutlined, HomeOutlined, EditOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

const CustomerProfileManagement = () => {
  const customerData = {
    id: 'CUST-1001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 234 567 890',
    address: '123 Main St, New York, NY 10001, USA',
    status: 'Hot',
    interestedProducts: ['Product A', 'Product B', 'Product D'],
    history: [
      { date: '2023-06-10', action: 'Inquiry', details: 'Asked about Product A specifications' },
      { date: '2023-06-12', action: 'Sample Sent', details: 'Sent sample of Product A, tracking #12345' },
      { date: '2023-06-15', action: 'Follow-up', details: 'Customer received sample, positive feedback' },
    ],
    notes: 'Potential bulk order next month. Prefers email communication.',
  };

  return (
    <Card 
      title="Customer Profile Management"
      headStyle={{ fontSize: '18px', fontWeight: 'bold' }}
      extra={
        <Input 
          placeholder="Search customers..." 
          prefix={<SearchOutlined />} 
          style={{ width: 300, borderRadius: '6px' }} 
        />
      }
      style={{ borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
    >
      <Tabs defaultActiveKey="1" tabBarStyle={{ fontWeight: 500 }}>
        <TabPane tab="Profile Details" key="1">
          <Descriptions bordered column={2} labelStyle={{ fontWeight: 600 }}>
            <Descriptions.Item label="Customer ID">{customerData.id}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag 
                color={customerData.status === 'Hot' ? 'red' : customerData.status === 'Warm' ? 'orange' : 'blue'}
                style={{ fontWeight: 600 }}
              >
                {customerData.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Name">{customerData.name}</Descriptions.Item>
            <Descriptions.Item label="Email">
              <Button 
                type="link" 
                icon={<MailOutlined />} 
                style={{ color: 'black', padding: 0 }}
              >
                {customerData.email}
              </Button>
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              <Button 
                type="link" 
                icon={<PhoneOutlined />} 
                style={{ color: 'black', padding: 0 }}
              >
                {customerData.phone}
              </Button>
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              <Button 
                type="link" 
                icon={<HomeOutlined />} 
                style={{ color: 'black', padding: 0 }}
              >
                {customerData.address}
              </Button>
            </Descriptions.Item>
            <Descriptions.Item label="Interested Products" span={2}>
              <Space wrap>
                {customerData.interestedProducts.map((product, index) => (
                  <Tag key={index} style={{ marginBottom: 4 }}>{product}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Notes" span={2}>
              {customerData.notes}
            </Descriptions.Item>
          </Descriptions>
        </TabPane>
        <TabPane tab="Interaction History" key="2">
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {customerData.history.map((item, index) => (
              <div 
                key={index} 
                style={{ 
                  marginBottom: 16, 
                  padding: 16, 
                  border: '1px solid #f0f0f0', 
                  borderRadius: '8px',
                  backgroundColor: index % 2 === 0 ? '#fafafa' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '15px' }}>{item.action}</strong>
                  <span style={{ color: '#888', fontSize: '13px' }}>{item.date}</span>
                </div>
                <div style={{ marginTop: 8, color: '#555' }}>{item.details}</div>
              </div>
            ))}
          </div>
        </TabPane>
      </Tabs>
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            style={{ background: 'black', borderColor: 'black', borderRadius: '6px' }}
          >
            Edit Profile
          </Button>
          <Button style={{ borderRadius: '6px', borderColor: '#d9d9d9' }}>Add Note</Button>
          <Button style={{ borderRadius: '6px', borderColor: '#d9d9d9' }}>Mark as Hot</Button>
          <Button style={{ borderRadius: '6px', borderColor: '#d9d9d9' }}>Mark as Cold</Button>
        </Space>
      </div>
    </Card>
  );
};

export default CustomerProfileManagement;