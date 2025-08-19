"use client"

import { useState } from 'react'
import { Card, Row, Col, Table, Button, Tag, Typography, Modal, Form, Input, Select, Space, Tooltip, Popconfirm, Upload, message, Statistic } from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 

  UploadOutlined,
  DownloadOutlined,
  UserOutlined,
  MailOutlined,

  ExclamationCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import { useFollowUpContext } from './hooks/use-follow-up'
import type { Contact, CreateContactData } from './types/follow-up'

const { Title, Text } = Typography
const { Option } = Select

export default function FollowUpContacts() {
  const { 
    contacts, 
    contactsLoading,
    createContact,
    updateContact,
    deleteContact,
    bulkCreateContacts
  } = useFollowUpContext()

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isBulkImportModalVisible, setIsBulkImportModalVisible] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [form] = Form.useForm()

  // Calculate contact statistics
  const contactStats = {
    total: contacts.length,
    active: contacts.filter(c => c.status === 'active').length,
    unsubscribed: contacts.filter(c => c.status === 'unsubscribed').length,
    bounced: contacts.filter(c => c.status === 'bounced').length,
    complained: contacts.filter(c => c.status === 'complained').length,
  }

  // Contact table columns
  const columns = [
    {
      title: 'Contact',
      key: 'contact',
      render: (record: Contact) => (
        <div>
          <div className="font-medium">
            {record.firstName && record.lastName 
              ? `${record.firstName} ${record.lastName}`
              : record.email
            }
          </div>
          <div className="text-sm text-gray-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'green', text: 'Active' },
          unsubscribed: { color: 'red', text: 'Unsubscribed' },
          bounced: { color: 'orange', text: 'Bounced' },
          complained: { color: 'red', text: 'Complained' },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
      render: (company: string) => company || '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: 'Engagement',
      dataIndex: 'engagementScore',
      key: 'engagementScore',
      render: (score: number) => (
        <div>
          <div className="font-medium">{score}%</div>
          <div className="text-sm text-gray-500">Engagement Score</div>
        </div>
      ),
    },
    {
      title: 'Tags',
      key: 'tags',
      render: (record: Contact) => (
        <div>
          {record.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {record.tags.slice(0, 2).map((tag, index) => (
                <Tag key={index}>{tag}</Tag>
              ))}
              {record.tags.length > 2 && (
                <Tag>+{record.tags.length - 2} more</Tag>
              )}
            </div>
          ) : (
            <Text type="secondary">No tags</Text>
          )}
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
      render: (record: Contact) => (
        <Space>
        
          
          <Tooltip title="Edit Contact">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEditContact(record)}
            />
          </Tooltip>
          
          <Popconfirm
            title="Delete Contact"
            description="Are you sure you want to delete this contact?"
            onConfirm={() => handleDeleteContact(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Contact">
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

  const handleCreateContact = () => {
    setIsCreateModalVisible(true)
    form.resetFields()
  }

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact)
    form.setFieldsValue({
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      company: contact.company,
      tags: contact.tags,
    })
    setIsEditModalVisible(true)
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId)
      message.success('Contact deleted successfully! 🗑️')
    } catch (error: any) {
      console.error('Failed to delete contact:', error)
      message.error(error?.response?.data?.message || 'Failed to delete contact. Please try again.')
    }
  }

  const handleViewContact = (contact: Contact) => {
    // TODO: Implement contact details view
    console.log('View contact:', contact)
  }

  const handleCreateSubmit = async (values: any) => {
    try {
      await createContact({
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        company: values.company,
        tags: values.tags || [],
      })
      message.success('Contact created successfully! 🎉')
      setIsCreateModalVisible(false)
      form.resetFields()
    } catch (error: any) {
      console.error('Failed to create contact:', error)
      message.error(error?.response?.data?.message || 'Failed to create contact. Please try again.')
    }
  }

  const handleEditSubmit = async (values: any) => {
    if (!selectedContact) return
    
    try {
      await updateContact(selectedContact._id, {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        company: values.company,
        tags: values.tags || [],
      })
      message.success('Contact updated successfully! ✅')
      setIsEditModalVisible(false)
      setSelectedContact(null)
      form.resetFields()
    } catch (error: any) {
      console.error('Failed to update contact:', error)
      message.error(error?.response?.data?.message || 'Failed to update contact. Please try again.')
    }
  }

  const handleBulkImport = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const contacts: CreateContactData[] = lines.slice(1).map(line => {
        const [email, firstName, lastName, phone, company] = line.split(',').map(field => field.trim())
        return {
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          company: company || undefined,
        }
      })
      
      await bulkCreateContacts(contacts)
      message.success(`Successfully imported ${contacts.length} contacts`)
      setIsBulkImportModalVisible(false)
    } catch (error) {
      console.error('Failed to import contacts:', error)
      message.error('Failed to import contacts')
    }
  }

  const renderContactForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={isCreateModalVisible ? handleCreateSubmit : handleEditSubmit}
    >
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Please enter email address' },
          { type: 'email', message: 'Please enter a valid email address' }
        ]}
      >
        <Input placeholder="Enter email address" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="firstName"
            label="First Name"
          >
            <Input placeholder="Enter first name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="lastName"
            label="Last Name"
          >
            <Input placeholder="Enter last name" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="company"
            label="Company"
          >
            <Input placeholder="Enter company name" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="tags"
        label="Tags"
      >
        <Select
          mode="tags"
          placeholder="Add tags"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            {isCreateModalVisible ? 'Create Contact' : 'Update Contact'}
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
          <Title level={2} className="mb-2">Contacts</Title>
          <Text type="secondary">Manage your contact database</Text>
        </div>
        <Space>
          <Button 
            icon={<UploadOutlined />} 
            onClick={() => setIsBulkImportModalVisible(true)}
          >
            Bulk Import
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreateContact}
            size="large"
          >
            Add Contact
          </Button>
        </Space>
      </div>

      {/* Contact Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Total Contacts"
              value={contactStats.total}
              prefix={<UserOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Active Contacts"
              value={contactStats.active}
              prefix={<UserOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Unsubscribed"
              value={contactStats.unsubscribed}
              prefix={<UserOutlined className="text-red-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Bounced"
              value={contactStats.bounced}
              prefix={<MailOutlined className="text-orange-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Complained"
              value={contactStats.complained}
              prefix={<ExclamationCircleOutlined className="text-red-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Avg Engagement"
              value={contacts.length > 0 
                ? Math.round(contacts.reduce((acc, c) => acc + c.engagementScore, 0) / contacts.length)
                : 0
              }
              prefix={<BarChartOutlined className="text-purple-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Contacts Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={contacts}
          loading={contactsLoading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} contacts`,
          }}
        />
      </Card>

      {/* Create Contact Modal */}
      <Modal
        title="Add New Contact"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        {renderContactForm()}
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        title="Edit Contact"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={600}
      >
        {renderContactForm()}
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        title="Bulk Import Contacts"
        open={isBulkImportModalVisible}
        onCancel={() => setIsBulkImportModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <Text strong>CSV Format Required</Text>
            <div className="text-sm text-gray-600 mt-1">
              Email, First Name, Last Name, Phone, Company
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Example: john@example.com, John, Doe, +1234567890, Company Inc
            </div>
          </div>
          
          <Upload
            accept=".csv"
            beforeUpload={(file) => {
              handleBulkImport(file)
              return false
            }}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />} block>
              Choose CSV File
            </Button>
          </Upload>
          
          <div className="text-center">
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => {
                const csvContent = 'Email,First Name,Last Name,Phone,Company\njohn@example.com,John,Doe,+1234567890,Company Inc'
                const blob = new Blob([csvContent], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'contacts_template.csv'
                a.click()
                window.URL.revokeObjectURL(url)
              }}
            >
              Download Template
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 