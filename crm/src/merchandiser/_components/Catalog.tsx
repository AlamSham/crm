"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  Table,
  Button,
  message,
  Card,
  Modal,
  Form,
  Radio,
  Upload,
  Tooltip,
  Input,
  Popconfirm,
  Empty,
  Avatar,
  Typography,
  Badge,
  Tag,
  Space,
  Flex,
  Divider
} from "antd"
import { 
  SearchOutlined, 
  DeleteOutlined, 
  UploadOutlined, 
  EditOutlined, 
  PlusOutlined,
  PictureOutlined,
  FilePdfOutlined
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import useMerchAuthStore from "@/store/useMerchAuthStore"

const { Text, Title } = Typography

interface CatalogItem {
  key: string
  name: string
  price?: number
  status?: 'active' | 'pending' | 'rejected' | string
  uploadDate?: string
  imagesCount: number
  filesCount: number
  thumbUrl?: string
}

const API_BASE = "http://localhost:5000"
const listUrl = (userId: string) => `${API_BASE}/api/catalog/items?userId=${encodeURIComponent(userId)}&role=merch`
const createUrl = listUrl
const updateUrl = (id: string, userId: string) =>
  `${API_BASE}/api/catalog/items/${id}?userId=${encodeURIComponent(userId)}&role=merch`
const deleteUrl = updateUrl
const uploadImageUrl = (userId: string) =>
  `${API_BASE}/api/catalog/upload/image?userId=${encodeURIComponent(userId)}&role=merch`
const uploadFileUrl = (userId: string) =>
  `${API_BASE}/api/catalog/upload/file?userId=${encodeURIComponent(userId)}&role=merch`

const statusColorMap = {
  active: 'green',
  pending: 'orange',
  rejected: 'red'
}

const CatalogManager = () => {
  // State
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchText, setSearchText] = useState("")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CatalogItem[]>([])
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Forms
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [uploadType, setUploadType] = useState<'image' | 'pdf'>('image')
  
  // Upload states
  const [createImageUploaded, setCreateImageUploaded] = useState<any>(null)
  const [createFileUploaded, setCreateFileUploaded] = useState<any>(null)
  const [editImageUploaded, setEditImageUploaded] = useState<any>(null)
  const [editUploadUrl, setEditUploadUrl] = useState<string | null>(null)
  
  // Current item
  const [currentItem, setCurrentItem] = useState<CatalogItem | null>(null)
  
  // User
  const merchUser = useMerchAuthStore((s) => s.user)
  const userId = useMemo(() => (merchUser as any)?.id || (merchUser as any)?._id || "", [merchUser])

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(listUrl(userId), { credentials: "include" })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || "Failed to load")
      
      const items = (json.data?.items || json.data || json.items || []).map((it: any) => ({
        key: it._id,
        name: it.title || it.name || "Untitled",
        price: typeof it.price === "number" ? it.price : it.price ? Number(it.price) : undefined,
        status: it.status || "",
        uploadDate: it.createdAt ? new Date(it.createdAt).toLocaleDateString() : "",
        imagesCount: Array.isArray(it.images) ? it.images.length : 0,
        filesCount: Array.isArray(it.files) ? it.files.length : 0,
        thumbUrl: Array.isArray(it.images) && it.images[0] ? it.images[0].secure_url || it.images[0].url : undefined,
      }))
      
      setData(items)
    } catch (error: any) {
      message.error(error?.message || "Failed to load catalog items")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(item =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchText.toLowerCase()))
  }, [data, searchText])

  // Handlers
  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      const payload: any = {
        title: values.title,
        price: values.price ? Number(values.price) : undefined,
        createdBy: userId,
        createdByRole: "merch",
        images: createImageUploaded ? [createImageUploaded] : [],
        ...(createFileUploaded ? { files: [createFileUploaded] } : {}),
        status: "pending",
      }
      
      const res = await fetch(createUrl(userId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || "Create failed")
      
      message.success("Catalog item created (pending approval)")
      setIsCreateModalOpen(false)
      setCreateImageUploaded(null)
      setCreateFileUploaded(null)
      fetchData()
    } catch (error: any) {
      message.error(error?.message || "Create failed")
    }
  }

  const handleUpdate = async () => {
    try {
      const values = await editForm.validateFields()
      if (!currentItem) return
      
      const payload: any = {
        title: values.title,
        price: values.price ? Number(values.price) : undefined,
        ...(editImageUploaded ? { images: [editImageUploaded] } : {}),
        ...(editUploadUrl ? { files: [{ url: editUploadUrl }] } : {}),
      }
      
      const res = await fetch(updateUrl(currentItem.key, userId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || "Update failed")
      
      message.success("Catalog item updated")
      setIsEditModalOpen(false)
      setCurrentItem(null)
      fetchData()
    } catch (error: any) {
      message.error(error?.message || "Update failed")
    }
  }

  const handleDelete = async (id?: string) => {
    try {
      if (id) {
        const res = await fetch(deleteUrl(id, userId), { 
          method: "DELETE", 
          credentials: "include" 
        })
        const json = await res.json()
        if (!json?.success) throw new Error(json?.message || "Delete failed")
      } else {
        // Bulk delete
        await Promise.all(
          selectedRowKeys.map(async (k) => {
            const res = await fetch(deleteUrl(String(k), userId), { 
              method: "DELETE", 
              credentials: "include" 
            })
            const json = await res.json()
            if (!json?.success) throw new Error(json?.message || "Delete failed")
          })
        )
      }
      
      message.success("Deleted successfully")
      setSelectedRowKeys([])
      fetchData()
    } catch (error: any) {
      message.error(error?.message || "Delete failed")
    }
  }

  // Columns
  const columns: ColumnsType<CatalogItem> = [
    {
      title: 'PRODUCT',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Flex align="center" gap={12}>
          <Avatar 
            src={record.thumbUrl} 
            size={48} 
            shape="square"
            icon={<PictureOutlined />}
            className="bg-gray-100"
          />
          <div>
            <Text strong className="block">{text}</Text>
            {record.price && (
              <Text className="text-gray-600">₹{record.price.toLocaleString()}</Text>
            )}
          </div>
        </Flex>
      )
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => (
        <Tag color={statusColorMap[status as keyof typeof statusColorMap] || 'default'}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      )
    },
    {
      title: 'FILES',
      key: 'files',
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Images">
            <Badge count={record.imagesCount} showZero={false}>
              <PictureOutlined className="text-blue-500" />
            </Badge>
          </Tooltip>
          <Tooltip title="Documents">
            <Badge count={record.filesCount} showZero={false}>
              <FilePdfOutlined className="text-red-500" />
            </Badge>
          </Tooltip>
        </Space>
      )
    },
    {
      title: 'DATE',
      dataIndex: 'uploadDate',
      key: 'date',
      align: 'center',
      render: (date) => date || '-'
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              setCurrentItem(record)
              editForm.setFieldsValue({
                title: record.name,
                price: record.price
              })
              setIsEditModalOpen(true)
            }}
          />
          <Popconfirm
            title="Delete this item?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.key)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
    }
  ]

  // Stats
  const stats = useMemo(() => {
    return {
      total: data.length,
      active: data.filter(item => item.status === 'active').length,
      pending: data.filter(item => item.status === 'pending').length,
      filtered: filteredData.length
    }
  }, [data, filteredData])

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Title level={3} className="!mb-2">Product Catalog</Title>
          <Text type="secondary">Manage your product listings and inventory</Text>
        </div>

        {/* Toolbar */}
        <Card className="mb-6 shadow-sm" bodyStyle={{ padding: 16 }}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
            <Input
              placeholder="Search products..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
            />
            
            <Space>
              {selectedRowKeys.length > 0 && (
                <Popconfirm
                  title={`Delete ${selectedRowKeys.length} selected items?`}
                  onConfirm={() => handleDelete()}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Delete Selected
                  </Button>
                </Popconfirm>
              )}
              
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Add Product
              </Button>
            </Space>
          </Flex>

          <Divider className="my-4" />

          <Flex gap={24} wrap="wrap">
            <div className="flex items-center gap-2">
              <Text type="secondary">Total:</Text>
              <Text strong>{stats.total}</Text>
            </div>
            <div className="flex items-center gap-2">
              <Text type="secondary">Active:</Text>
              <Text strong style={{ color: '#52c41a' }}>{stats.active}</Text>
            </div>
            <div className="flex items-center gap-2">
              <Text type="secondary">Pending:</Text>
              <Text strong style={{ color: '#fa8c16' }}>{stats.pending}</Text>
            </div>
            {searchText && (
              <div className="flex items-center gap-2">
                <Text type="secondary">Filtered:</Text>
                <Text strong style={{ color: '#1890ff' }}>{stats.filtered}</Text>
              </div>
            )}
          </Flex>
        </Card>

        {/* Data Table */}
        <Card bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            loading={loading}
            scroll={{ x: true }}
            pagination={{
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text type="secondary">
                      {searchText ? 'No matching products found' : 'No products in your catalog yet'}
                    </Text>
                  }
                >
                  {!searchText && (
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Add Your First Product
                    </Button>
                  )}
                </Empty>
              )
            }}
            rowClassName="cursor-pointer hover:bg-gray-50"
            onRow={(record) => ({
              onClick: () => {
                setCurrentItem(record)
                editForm.setFieldsValue({
                  title: record.name,
                  price: record.price
                })
                setIsEditModalOpen(true)
              }
            })}
          />
        </Card>

        {/* Create Modal */}
        <Modal
          title="Add New Product"
          open={isCreateModalOpen}
          onOk={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          okText="Create"
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="title"
              label="Product Name"
              rules={[{ required: true, message: 'Please enter product name' }]}
            >
              <Input placeholder="e.g. Premium Cotton T-Shirt" />
            </Form.Item>
            
            <Form.Item
              name="price"
              label="Price (₹)"
              rules={[{ pattern: /^\d+$/, message: 'Please enter a valid price' }]}
            >
              <Input type="number" placeholder="e.g. 1299" />
            </Form.Item>
            
            <Form.Item label="Upload Type">
              <Radio.Group 
                value={uploadType} 
                onChange={(e) => setUploadType(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="image">Image</Radio.Button>
                <Radio.Button value="pdf">PDF</Radio.Button>
              </Radio.Group>
            </Form.Item>
            
            {uploadType === 'image' ? (
              <Form.Item label="Product Image">
                <Upload.Dragger
                  name="image"
                  accept="image/*"
                  action={uploadImageUrl(userId)}
                  withCredentials
                  maxCount={1}
                  onChange={(info) => {
                    if (info.file.status === 'done') {
                      setCreateImageUploaded(info.file.response?.data)
                      setCreateFileUploaded(null)
                      message.success(`${info.file.name} uploaded successfully`)
                    } else if (info.file.status === 'error') {
                      message.error(`${info.file.name} upload failed`)
                    }
                  }}
                  beforeUpload={() => {
                    if (!userId) {
                      message.error("Please login again")
                      return Upload.LIST_IGNORE
                    }
                    return true
                  }}
                >
                  <div className="p-4">
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag image to upload</p>
                    <p className="ant-upload-hint">Supports JPG, PNG, etc.</p>
                  </div>
                </Upload.Dragger>
              </Form.Item>
            ) : (
              <Form.Item label="Product PDF">
                <Upload.Dragger
                  name="file"
                  accept="application/pdf"
                  action={uploadFileUrl(userId)}
                  withCredentials
                  maxCount={1}
                  onChange={(info) => {
                    if (info.file.status === 'done') {
                      setCreateFileUploaded(info.file.response?.data)
                      setCreateImageUploaded(null)
                      message.success(`${info.file.name} uploaded successfully`)
                    } else if (info.file.status === 'error') {
                      message.error(`${info.file.name} upload failed`)
                    }
                  }}
                  beforeUpload={() => {
                    if (!userId) {
                      message.error("Please login again")
                      return Upload.LIST_IGNORE
                    }
                    return true
                  }}
                >
                  <div className="p-4">
                    <p className="ant-upload-drag-icon">
                      <FilePdfOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag PDF to upload</p>
                    <p className="ant-upload-hint">Supports PDF documents</p>
                  </div>
                </Upload.Dragger>
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title={`Edit ${currentItem?.name || 'Product'}`}
          open={isEditModalOpen}
          onOk={handleUpdate}
          onCancel={() => {
            setIsEditModalOpen(false)
            setCurrentItem(null)
          }}
          okText="Save Changes"
          width={600}
        >
          <Form form={editForm} layout="vertical">
            <Form.Item
              name="title"
              label="Product Name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="price"
              label="Price (₹)"
            >
              <Input type="number" />
            </Form.Item>
            
            <Form.Item label="Current Status">
              <Tag color={statusColorMap[currentItem?.status as keyof typeof statusColorMap] || 'default'}>
                {currentItem?.status?.toUpperCase() || 'UNKNOWN'}
              </Tag>
            </Form.Item>
            
            <Form.Item label="Replace Image">
              <Upload.Dragger
                name="image"
                accept="image/*"
                action={uploadImageUrl(userId)}
                withCredentials
                maxCount={1}
                onChange={(info) => {
                  if (info.file.status === 'done') {
                    setEditImageUploaded(info.file.response?.data)
                    message.success(`${info.file.name} uploaded successfully`)
                  } else if (info.file.status === 'error') {
                    message.error(`${info.file.name} upload failed`)
                  }
                }}
              >
                <div className="p-4">
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag image to upload</p>
                  <p className="ant-upload-hint">Supports JPG, PNG, etc.</p>
                </div>
              </Upload.Dragger>
            </Form.Item>
            
            <Form.Item label="Replace PDF">
              <Upload.Dragger
                name="file"
                accept="application/pdf"
                action={uploadFileUrl(userId)}
                withCredentials
                maxCount={1}
                onChange={(info) => {
                  if (info.file.status === 'done') {
                    const url = info.file.response?.data?.secure_url || info.file.response?.data?.url
                    setEditUploadUrl(url)
                    message.success(`${info.file.name} uploaded successfully`)
                  } else if (info.file.status === 'error') {
                    message.error(`${info.file.name} upload failed`)
                  }
                }}
              >
                <div className="p-4">
                  <p className="ant-upload-drag-icon">
                    <FilePdfOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag PDF to upload</p>
                  <p className="ant-upload-hint">Supports PDF documents</p>
                </div>
              </Upload.Dragger>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}

export default CatalogManager;