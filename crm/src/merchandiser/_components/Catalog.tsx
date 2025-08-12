import { Table, Tag, Button, Upload, Input, Popconfirm, message, Space, Card } from 'antd';
import { SearchOutlined, UploadOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'antd/es/table/interface';

interface CatalogItem {
  key: string;
  name: string;
  category: string;
  fileType: string;
  size: string;
  status: string;
  uploadDate: string;
  downloads: number;
}

const CatalogManager = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');

  const catalogData: CatalogItem[] = [
    {
      key: '1',
      name: 'Summer Collection 2023',
      category: 'Apparel',
      fileType: 'PDF',
      size: '12.4 MB',
      status: 'Active',
      uploadDate: '2023-05-15',
      downloads: 142,
    },
    // More data...
  ];

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleDelete = () => {
    message.success(`Deleted ${selectedRowKeys.length} catalogs`);
    setSelectedRowKeys([]);
  };

  const handleSend = () => {
    message.success(`Sent ${selectedRowKeys.length} catalogs to customers`);
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  const columns: ColumnsType<CatalogItem> = [
    {
      title: 'Catalog Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>,
      filteredValue: [searchText],
      onFilter: (value: string | number | boolean | Key, record: CatalogItem) => {
        return record.name.toLowerCase().includes(value.toString().toLowerCase());
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Type',
      dataIndex: 'fileType',
      key: 'fileType',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Downloads',
      dataIndex: 'downloads',
      key: 'downloads',
      sorter: (a: CatalogItem, b: CatalogItem) => a.downloads - b.downloads,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: CatalogItem) => (
        <Space>
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            size="small"
            className="bg-blue-500 border-blue-500"
            onClick={() => message.success(`Sent ${record.name}`)}
          >
            Send
          </Button>
          <Button size="small">Preview</Button>
          <Popconfirm
            title="Are you sure to delete this catalog?"
            onConfirm={() => message.success(`Deleted ${record.name}`)}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Catalog Management"
      headStyle={{ fontSize: '18px', fontWeight: 'bold', border: 'none' }}
      bodyStyle={{ padding: 0 }}
      className="rounded-xl shadow"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Input
            placeholder="Search catalogs..."
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => handleSearch(e.target.value)}
            className="w-64"
          />
          <Space>
            {selectedRowKeys.length > 0 && (
              <>
                <Popconfirm
                  title="Are you sure to delete selected catalogs?"
                  onConfirm={handleDelete}
                >
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                  >
                    Delete ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  className="bg-blue-500 border-blue-500"
                >
                  Send ({selectedRowKeys.length})
                </Button>
              </>
            )}
            <Upload {...uploadProps}>
              <Button 
                icon={<UploadOutlined />}
                type="primary"
                className="bg-black border-black"
              >
                Upload Catalog
              </Button>
            </Upload>
          </Space>
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={catalogData}
          pagination={{
            position: ['bottomRight'],
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
          className="rounded-lg"
          rowClassName="hover:bg-gray-50"
        />
      </div>
    </Card>
  );
};

export default CatalogManager;