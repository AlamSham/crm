import { Form, Input, Button, Select, DatePicker, TimePicker,  Space, Card, Divider } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Option } = Select;
const { TextArea } = Input;

const EventCreator = () => {
  const [form] = Form.useForm();
  const [recurring, setRecurring] = useState(false);
  const [customRecurrence, setCustomRecurrence] = useState(false);

  const onFinish = (values: any) => {
    console.log('Received values:', values);
    // Submit logic here
  };

  return (
    <Card
      title="Create New Event"
      headStyle={{ fontSize: '18px', fontWeight: 'bold', border: 'none' }}
      bodyStyle={{ padding: '24px' }}
      className="rounded-xl shadow"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ type: 'one-time' }}
      >
        <Form.Item
          label="Event Name"
          name="name"
          rules={[{ required: true, message: 'Please input event name' }]}
        >
          <Input placeholder="e.g. Monthly Newsletter" size="large" />
        </Form.Item>

        <Form.Item
          label="Event Type"
          name="type"
        >
          <Select 
            size="large"
            onChange={val => setRecurring(val === 'recurring')}
          >
            <Option value="one-time">One-time Event</Option>
            <Option value="recurring">Recurring Event</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Start Date & Time"
          name="startTime"
          rules={[{ required: true, message: 'Please select start time' }]}
        >
          <Space>
            <DatePicker size="large" />
            <TimePicker size="large" format="HH:mm" />
          </Space>
        </Form.Item>

        {recurring && (
          <>
            <Form.Item
              label="Recurrence Pattern"
              name="recurrence"
            >
              <Select 
                size="large"
                onChange={val => setCustomRecurrence(val === 'custom')}
              >
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="monthly">Monthly</Option>
                <Option value="custom">Custom Interval</Option>
              </Select>
            </Form.Item>

            {customRecurrence && (
              <Form.Item
                label="Custom Interval (days)"
                name="interval"
                rules={[{ required: true, message: 'Please input interval' }]}
              >
                <Input 
                  type="number" 
                  min="1" 
                  size="large"
                  placeholder="e.g. 3 for every 3 days" 
                />
              </Form.Item>
            )}

            <Form.Item
              label="End Date"
              name="endDate"
            >
              <DatePicker size="large" />
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Target Audience"
          name="audience"
        >
          <Select 
            mode="multiple"
            size="large"
            placeholder="Select customer segments"
          >
            <Option value="hot">Hot Leads</Option>
            <Option value="cold">Cold Leads</Option>
            <Option value="followup">Follow-up Required</Option>
          </Select>
        </Form.Item>

        <Divider />

        <Form.Item
          label="Message Template"
          name="template"
        >
          <TextArea rows={6} placeholder="Enter your message content here..." />
        </Form.Item>

        <Form.List name="attachments">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'file']}
                    rules={[{ required: true, message: 'Missing file' }]}
                  >
                    <Input placeholder="File URL" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button 
                  type="dashed" 
                  onClick={() => add()} 
                  block 
                  icon={<PlusOutlined />}
                >
                  Add Attachment
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large"
            block
            className="bg-black hover:bg-gray-800 border-none h-12"
          >
            Create Event
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EventCreator;