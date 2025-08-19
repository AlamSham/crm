"use client"

import { useState } from 'react'

import { Card, Row, Col, Table, Button, Tag, Typography, Modal, Form, Input, Select, Space, Tooltip, Popconfirm, Statistic, InputNumber, Checkbox } from 'antd'
import { 
  PlusOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  BarChartOutlined,
  MailOutlined,
  CalendarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useFollowUpContext } from './hooks/use-follow-up'
import type { Campaign } from './types/follow-up'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

// Helpers to handle IST (Asia/Kolkata) timezone consistently
// 1) Format a Date/ISO string to datetime-local (YYYY-MM-DDTHH:mm) in IST
function formatDateTimeIST(date: string | Date): string {
  const d = new Date(date)
  // Convert UTC -> IST by adding 5h30m
  const IST_OFFSET_MIN = 5 * 60 + 30
  const ms = d.getTime() + IST_OFFSET_MIN * 60 * 1000
  const ist = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = ist.getUTCFullYear()
  const mm = pad(ist.getUTCMonth() + 1)
  const dd = pad(ist.getUTCDate())
  const hh = pad(ist.getUTCHours())
  const mi = pad(ist.getUTCMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

// 2) Parse a datetime-local string (interpreted as IST) into a UTC Date object
function parseISTLocalToUTC(local: string): Date {
  // local format: YYYY-MM-DDTHH:mm
  const [datePart, timePart] = local.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  // Build a Date in UTC corresponding to the IST time by subtracting 5h30m
  const IST_OFFSET_MIN = 5 * 60 + 30
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MIN * 60 * 1000
  return new Date(utcMs)
}

export default function FollowUpCampaigns() {
  const { 
    campaigns, 
    templates,
    contacts,
    contactLists,
    campaignsLoading,
    templatesLoading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    startCampaign,
  } = useFollowUpContext()

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [form] = Form.useForm()

  // Calculate status statistics
  const statusStats = {
    draft: campaigns.filter(c => c.status === 'draft').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    sending: campaigns.filter(c => c.status === 'sending').length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
  }

  // Campaign table columns
  const columns = [
    {
      title: 'Campaign Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Campaign) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record.description || 'No description'}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          draft: { color: 'default', text: 'Draft' },
          scheduled: { color: 'processing', text: 'Scheduled' },
          sending: { color: 'processing', text: 'Sending' },
          sent: { color: 'success', text: 'Sent' },
          completed: { color: 'success', text: 'Completed' },
          paused: { color: 'warning', text: 'Paused' },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: 'Template',
      key: 'template',
      render: (record: Campaign) => {
        const template = templates.find(t => t._id === record.template)
        return template ? template.name : 'No template'
      },
    },
    {
      title: 'Send Type',
      key: 'sendType',
      render: (record: Campaign) => {
        const sendTypeConfig = {
          immediate: { color: 'green', text: 'Immediate', icon: '⚡' },
          scheduled: { color: 'blue', text: 'Scheduled', icon: '📅' },
          sequence: { color: 'purple', text: 'Sequence', icon: '🔄' },
        }
        const config = sendTypeConfig[record.sendType] || { color: 'default', text: record.sendType, icon: '❓' }
        return (
          <div className="flex items-center space-x-1">
            <span>{config.icon}</span>
            <Tag color={config.color}>{config.text}</Tag>
          </div>
        )
      },
    },
    {
      title: 'Contacts',
      key: 'contacts',
      render: (record: Campaign) => (
        <div>
          <div className="font-medium">{record.contacts.length + record.contactLists.length}</div>
          <div className="text-sm text-gray-500">
            {record.contacts.length} direct, {record.contactLists.length} lists
          </div>
        </div>
      ),
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (record: Campaign) => (
        <div>
          <div className="font-medium">
            {record.stats.totalSent} sent
          </div>
          <div className="text-sm text-gray-500">
            {record.stats.opened} opened ({record.stats.totalSent > 0 ? Math.round((record.stats.opened / record.stats.totalSent) * 100) : 0}%)
          </div>
        </div>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Campaign) => (
        <Space>
          {record.status === 'draft' && (
            <Tooltip title="Start Campaign">
              <Button 
                type="text" 
                size="small" 
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartCampaign(record._id)}
              />
            </Tooltip>
          )}
          
          <Tooltip title="Edit Campaign">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEditCampaign(record)}
            />
          </Tooltip>
          
          <Popconfirm
            title="Delete Campaign"
            description="Are you sure you want to delete this campaign?"
            onConfirm={() => handleDeleteCampaign(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Campaign">
              <Button 
                type="text" 
                size="small" 
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleCreateCampaign = () => {
    setIsCreateModalVisible(true)
    form.resetFields()
  }

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    form.setFieldsValue({
      name: campaign.name,
      description: campaign.description,
      template: campaign.template,
      contacts: campaign.contacts,
      contactLists: campaign.contactLists,
      sendType: campaign.sendType,
      // Convert stored Date/ISO -> datetime-local (IST)
      scheduledAt: campaign.scheduledAt ? formatDateTimeIST(campaign.scheduledAt) : undefined,
      sequence: campaign.sequence,
    })
    setIsEditModalVisible(true)
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await deleteCampaign(campaignId)
      // Success message could be added here
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    }
  }

  const handleStartCampaign = async (campaignId: string) => {
    try {
      await startCampaign(campaignId)
      // Success message could be added here
    } catch (error) {
      console.error('Failed to start campaign:', error)
    }
  }

  const handleCreateSubmit = async (values: any) => {
    try {
      setCreateSubmitting(true)
      await createCampaign({
        name: values.name,
        description: values.description,
        template: values.template,
        contacts: values.contacts || [],
        contactLists: values.contactLists || [],
        sendType: values.sendType,
        // Parse IST input -> UTC Date object
        scheduledAt: values.scheduledAt ? parseISTLocalToUTC(values.scheduledAt) : undefined,
        sequence: values.sequence,
      })
      setIsCreateModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('Failed to create campaign:', error)
    } finally {
      setCreateSubmitting(false)
    }
  }

  const handleEditSubmit = async (values: any) => {
    if (!selectedCampaign) return
    
    try {
      setEditSubmitting(true)
      await updateCampaign(selectedCampaign._id, {
        name: values.name,
        description: values.description,
        template: values.template,
        contacts: values.contacts || [],
        contactLists: values.contactLists || [],
        sendType: values.sendType,
        // Parse IST input -> UTC Date object
        scheduledAt: values.scheduledAt ? parseISTLocalToUTC(values.scheduledAt) : undefined,
        sequence: values.sequence,
      })
      setIsEditModalVisible(false)
      setSelectedCampaign(null)
      form.resetFields()
    } catch (error) {
      console.error('Failed to update campaign:', error)
    } finally {
      setEditSubmitting(false)
    }
  }

  const renderCampaignForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={isCreateModalVisible ? handleCreateSubmit : handleEditSubmit}
      disabled={isCreateModalVisible ? createSubmitting : editSubmitting}
    >
      <Form.Item
        name="name"
        label="Campaign Name"
        rules={[{ required: true, message: 'Please enter campaign name' }]}
      >
        <Input placeholder="Enter campaign name" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <TextArea 
          rows={3} 
          placeholder="Enter campaign description"
        />
      </Form.Item>

      <Form.Item
        name="sendType"
        label="Send Type"
        rules={[{ required: true, message: 'Please select send type' }]}
      >
        <Select placeholder="Select send type">
          <Option value="immediate">Send Immediately</Option>
          <Option value="scheduled">Schedule for Later</Option>
          <Option value="sequence">Follow-up Sequence</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="template"
        label="Email Template"
        rules={[{ required: true, message: 'Please select a template' }]}
      >
        <Select placeholder="Select template" loading={templatesLoading}>
          {templates.map(template => (
            <Option key={template._id} value={template._id}>
              {template.name} ({template.type})
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="contacts"
        label="Direct Contacts"
      >
        <Select
          mode="multiple"
          placeholder="Select contacts"
          loading={campaignsLoading}
          showSearch
          filterOption={(input, option) =>
            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {contacts.map(contact => (
            <Option key={contact._id} value={contact._id}>
              {contact.email} {contact.firstName && `(${contact.firstName} ${contact.lastName})`}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="contactLists"
        label="Contact Lists"
      >
        <Select
          mode="multiple"
          placeholder="Select contact lists"
          loading={campaignsLoading}
        >
          {contactLists.map(list => (
            <Option key={list._id} value={list._id}>
              {list.name} ({list.totalContacts} contacts)
            </Option>
          ))}
        </Select>
      </Form.Item>

      

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.sendType !== currentValues.sendType}
      >
        {({ getFieldValue }) => {
          const sendType = getFieldValue('sendType')
          
          if (sendType === 'scheduled') {
            return (
              <Form.Item
                name="scheduledAt"
                label="Schedule Date & Time"
                rules={[{ required: true, message: 'Please select schedule time' }]}
              >
                <Input type="datetime-local" />
              </Form.Item>
            )
          }
          
          if (sendType === 'sequence') {
            return (
              <div className="space-y-4">
                <Form.Item
                  name={['sequence', 'initialDelay']}
                  label="Initial Delay (hours)"
                  rules={[{ required: true, message: 'Please enter initial delay' }]}
                >
                  <InputNumber 
                    min={0} 
                    max={168} 
                    placeholder="0 = Send immediately"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                
                <Form.Item
                  name={['sequence', 'maxFollowups']}
                  label="Maximum Follow-ups"
                  rules={[{ required: true, message: 'Please enter max followups' }]}
                >
                  <InputNumber 
                    min={1} 
                    max={10} 
                    placeholder="1-10 followups"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                
                <Form.Item
                  name={['sequence', 'followupDelays']}
                  label="Delay Between Follow-ups (hours)"
                >
                  <Select
                    mode="tags"
                    placeholder="Enter delays (e.g., 24, 48, 72)"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Text strong>Sequence Conditions:</Text>
                  <div className="mt-2 space-y-2">
                    <Form.Item
                      name={['sequence', 'conditions', 'openEmail']}
                      valuePropName="checked"
                    >
                      <Checkbox>Send if email is opened</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={['sequence', 'conditions', 'clickLink']}
                      valuePropName="checked"
                    >
                      <Checkbox>Send if link is clicked</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={['sequence', 'conditions', 'replyEmail']}
                      valuePropName="checked"
                    >
                      <Checkbox>Send if email is replied</Checkbox>
                    </Form.Item>
                  </div>
                </div>
              </div>
            )
          }
          
          return null
        }}
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={isCreateModalVisible ? createSubmitting : editSubmitting}>
            {isCreateModalVisible ? 'Create Campaign' : 'Update Campaign'}
          </Button>
          <Button onClick={() => {
            setIsCreateModalVisible(false)
            setIsEditModalVisible(false)
          }}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">Campaigns</Title>
          <Text type="secondary">Manage and track your email campaigns</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreateCampaign}
          size="large"
        >
          Create Campaign
        </Button>
      </div>

      {/* Status Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Draft"
              value={statusStats.draft}
              prefix={<MailOutlined className="text-gray-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Scheduled"
              value={statusStats.scheduled}
              prefix={<CalendarOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Sending"
              value={statusStats.sending}
              prefix={<PlayCircleOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Sent"
              value={statusStats.sent}
              prefix={<CheckCircleOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Completed"
              value={statusStats.completed}
              prefix={<BarChartOutlined className="text-purple-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Paused"
              value={statusStats.paused}
              prefix={<PauseCircleOutlined className="text-orange-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Campaigns Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={campaigns}
          loading={campaignsLoading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} campaigns`,
          }}
        />
      </Card>

      {/* Create Campaign Modal */}
      <Modal
        title="Create New Campaign"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        {renderCampaignForm()}
      </Modal>

      {/* Edit Campaign Modal */}
      <Modal
        title="Edit Campaign"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={600}
      >
        {renderCampaignForm()}
      </Modal>
    </div>
  )
} 