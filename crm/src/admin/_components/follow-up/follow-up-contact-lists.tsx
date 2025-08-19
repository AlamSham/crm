"use client"

import { useState } from 'react'
import { Card, Row, Col, Table, Button, Tag, Typography, Modal, Form, Input, Select, Space, Tooltip, Popconfirm, Progress, Statistic } from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  UserOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  BarChartOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { useFollowUpContext } from './hooks/use-follow-up'
import type { ContactList, Contact, CreateContactListData } from './types/follow-up'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

export default function FollowUpContactLists() {
  const { 
    contactLists, 
    contacts,
    contactListsLoading,
    contactsLoading,
    createContactList,
    updateContactList,
    deleteContactList,
    addContactsToList
  } = useFollowUpContext()

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isManageContactsModalVisible, setIsManageContactsModalVisible] = useState(false)
  const [selectedList, setSelectedList] = useState<ContactList | null>(null)
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [form] = Form.useForm()

  // Contact List table columns
  const columns = [
    {
      title: 'List Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ContactList) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record?.description || 'No description'}</div>
        </div>
      ),
    },
    {
      title: 'Contacts',
      key: 'contacts',
      render: (record: ContactList) => (
        <div>
          <div className="font-medium">{record?.totalContacts}</div>
          <div className="text-sm text-gray-500">
            {record?.contacts.length} direct contacts
          </div>
        </div>
      ),
    },
    {
      title: 'Active Contacts',
      key: 'activeContacts',
      render: (record: ContactList) => {
        const activeContacts = record?.contacts.filter(c => c.status === 'active').length
        const percentage = record?.totalContacts > 0 ? (activeContacts / record?.totalContacts) * 100 : 0
        return (
          <div>
            <div className="font-medium">{activeContacts}</div>
            <Progress 
              percent={Math.round(percentage)} 
              size="small" 
              showInfo={false}
              strokeColor={percentage > 70 ? '#52c41a' : percentage > 40 ? '#faad14' : '#ff4d4f'}
            />
          </div>
        )
      },
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
      render: (record: ContactList) => (
        <Space>
          <Tooltip title="View Contacts">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewContacts(record)}
            />
          </Tooltip>
          
          <Tooltip title="Manage Contacts">
            <Button 
              type="text" 
              size="small" 
              icon={<UserAddOutlined />}
              onClick={() => handleManageContacts(record)}
            />
          </Tooltip>
          
          <Tooltip title="Edit List">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEditList(record)}
            />
          </Tooltip>
          
          <Popconfirm
            title="Delete Contact List"
            description="Are you sure you want to delete this contact list?"
            onConfirm={() => handleDeleteList(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete List">
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

  const handleCreateList = () => {
    setIsCreateModalVisible(true)
    form.resetFields()
  }

  const handleEditList = (list: ContactList) => {
    setSelectedList(list)
    form.setFieldsValue({
      name: list.name,
      description: list.description,
    })
    setIsEditModalVisible(true)
  }

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteContactList(listId)
      // Success message could be added here
    } catch (error) {
      console.error('Failed to delete contact list:', error)
    }
  }

  const handleViewContacts = (list: ContactList) => {
    setSelectedList(list)
    setIsManageContactsModalVisible(true)
  }

  const handleManageContacts = (list: ContactList) => {
    setSelectedList(list)
    setSelectedContactIds([])
    setIsManageContactsModalVisible(true)
  }

  const handleCreateSubmit = async (values: any) => {
    try {
      await createContactList({
        name: values.name,
        description: values.description,
        contacts: [],
        totalContacts: 0,
      })
      setIsCreateModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('Failed to create contact list:', error)
    }
  }

  const handleEditSubmit = async (values: any) => {
    if (!selectedList) return
    
    try {
      await updateContactList(selectedList._id, {
        name: values.name,
        description: values.description,
      })
      setIsEditModalVisible(false)
      setSelectedList(null)
      form.resetFields()
    } catch (error) {
      console.error('Failed to update contact list:', error)
    }
  }

  const handleAddContactsToList = async (contactIds: string[]) => {
    if (!selectedList) return
    
    try {
      await addContactsToList(selectedList._id, contactIds)
      // Success message could be added here
    } catch (error) {
      console.error('Failed to add contacts to list:', error)
    }
  }

  const getListStats = () => {
    const stats = {
      total: contactLists.length,
      totalContacts: contactLists.reduce((acc, list) => acc + list?.totalContacts, 0),
      avgContactsPerList: contactLists.length > 0 
        ? Math.round(contactLists.reduce((acc, list) => acc + list?.totalContacts, 0) / contactLists.length)
        : 0,
    }
    return stats
  }

  const listStats = getListStats()

  const renderListForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={isCreateModalVisible ? handleCreateSubmit : handleEditSubmit}
    >
      <Form.Item
        name="name"
        label="List Name"
        rules={[{ required: true, message: 'Please enter list name' }]}
      >
        <Input placeholder="Enter list name" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <TextArea 
          rows={3} 
          placeholder="Enter list description"
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            {isCreateModalVisible ? 'Create List' : 'Update List'}
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

  const renderManageContactsForm = () => {
    if (!selectedList) return null

    const availableContacts = contacts.filter(contact => 
      !selectedList.contacts.some(listContact => listContact._id === contact._id)
    )

    const handleAddContacts = async () => {
      if (selectedContactIds.length === 0) return
      
      try {
        await handleAddContactsToList(selectedContactIds)
        setSelectedContactIds([])
        // Refresh the list data
        // You might need to refetch the contact list data here
      } catch (error) {
        console.error('Failed to add contacts:', error)
      }
    }

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <Text strong>List: {selectedList.name}</Text>
          <div className="text-sm text-gray-600 mt-1">
            {selectedList.totalContacts} total contacts
          </div>
        </div>

        <div>
          <Text strong>Add Contacts to List:</Text>
          <Select
            mode="multiple"
            placeholder="Select contacts to add"
            style={{ width: '100%', marginTop: 8 }}
            loading={contactsLoading}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
            value={selectedContactIds}
            onChange={setSelectedContactIds}
          >
            {availableContacts.map(contact => (
              <Option key={contact._id} value={contact._id}>
                {contact.email} {contact.firstName && `(${contact.firstName} ${contact.lastName})`}
              </Option>
            ))}
          </Select>
          {selectedContactIds.length > 0 && (
            <Button 
              type="primary" 
              onClick={handleAddContacts}
              style={{ marginTop: 8 }}
            >
              Add {selectedContactIds.length} Contact{selectedContactIds.length > 1 ? 's' : ''} to List
            </Button>
          )}
        </div>

        <div>
          <Text strong>Current Contacts in List:</Text>
          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
            {selectedList.contacts.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No contacts in this list yet
              </div>
            ) : (
              selectedList.contacts.map(contact => (
                <div key={contact._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">
                      {contact.firstName && contact.lastName 
                        ? `${contact.firstName} ${contact.lastName}`
                        : contact.email
                      }
                    </div>
                    <div className="text-sm text-gray-500">{contact.email}</div>
                    <div className="text-xs text-gray-400">
                      Status: <Tag color={contact.status === 'active' ? 'green' : 'red'}>{contact.status}</Tag>
                    </div>
                  </div>
                  {/* Remove contact action not supported by API */}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">Contact Lists</Title>
          <Text type="secondary">Organize contacts into lists for targeted campaigns</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreateList}
          size="large"
        >
          Create List
        </Button>
      </div>

      {/* List Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Lists"
              value={listStats.total}
              prefix={<UnorderedListOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Contacts"
              value={listStats.totalContacts}
              prefix={<UserOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Avg Contacts/List"
              value={listStats.avgContactsPerList}
              prefix={<BarChartOutlined className="text-purple-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Contact Lists Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={contactLists}
          loading={contactListsLoading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} lists`,
          }}
        />
      </Card>

      {/* Create List Modal */}
      <Modal
        title="Create New Contact List"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        {renderListForm()}
      </Modal>

      {/* Edit List Modal */}
      <Modal
        title="Edit Contact List"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={600}
      >
        {renderListForm()}
      </Modal>

      {/* Manage Contacts Modal */}
      <Modal
        title="Manage List Contacts"
        open={isManageContactsModalVisible}
        onCancel={() => {
          setIsManageContactsModalVisible(false)
          setSelectedContactIds([])
        }}
        footer={null}
        width={800}
      >
        {renderManageContactsForm()}
      </Modal>
    </div>
  )
} 