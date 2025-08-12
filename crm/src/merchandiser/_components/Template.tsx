import { Table, Tag, Button, Space, Upload, message, Popconfirm } from 'antd';
import { InboxOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useState, useRef, createContext, useContext } from 'react';
import type { DropTargetMonitor } from 'react-dnd';

interface TemplateItem {
  key: string;
  name: string;
  type: string;
  created: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  version: string;
}

interface DragItem {
  index: number;
  type: string;
}

interface DropResult {
  index: number;
}

interface TableContextProps {
  moveRow: (dragIndex: number, hoverIndex: number) => void;
}

const TableContext = createContext<TableContextProps>({
  moveRow: () => {},
});

const DraggableRow = ({ className, style, ...restProps }: { className?: string; style?: React.CSSProperties; [key: string]: any }) => {
  const { moveRow } = useContext(TableContext);
  const ref = useRef<HTMLTableRowElement>(null);
  const index = restProps['data-row-index'];

  const [{ isOver, dropClassName }, drop] = useDrop<DragItem, DropResult, { isOver: boolean; dropClassName: string }>({
    accept: 'row',
    collect: (monitor) => {
      const { index: dragIndex } = monitor.getItem() || {};
      if (dragIndex === index) {
        return { isOver: false, dropClassName: '' };
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: dragIndex < index ? 'drop-over-downward' : 'drop-over-upward',
      };
    },
    drop: (item: DragItem, monitor: DropTargetMonitor<DragItem, DropResult>) => {
      if (!monitor.didDrop()) {
        moveRow(item.index, index);
      }
      return { index };
    },
  });

  const [, drag] = useDrag({
    type: 'row',
    item: { index, type: 'row' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drop(drag(ref));

  return (
    <tr
      ref={ref}
      className={`${className}${isOver ? ` ${dropClassName}` : ''}`}
      style={{ cursor: 'move', ...style }}
      {...restProps}
    />
  );
};

const TemplateApproval = () => {
  const [templates, setTemplates] = useState<TemplateItem[]>([
    {
      key: '1',
      name: 'Summer Sale Promo',
      type: 'Promotional',
      created: '2023-05-01',
      status: 'Pending',
      version: '1.0',
    },
    {
      key: '2',
      name: 'Winter Collection',
      type: 'Catalog',
      created: '2023-06-15',
      status: 'Pending',
      version: '1.2',
    },
    {
      key: '3',
      name: 'Spring Specials',
      type: 'Promotional',
      created: '2023-03-10',
      status: 'Approved',
      version: '2.0',
    },
  ]);

  const moveRow = (dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;
    
    const dragRow = templates[dragIndex];
    setTemplates((prev) => {
      const newTemplates = [...prev];
      newTemplates.splice(dragIndex, 1);
      newTemplates.splice(hoverIndex, 0, dragRow);
      return newTemplates;
    });
  };

  const handleApprove = (key: string) => {
    setTemplates(prev => 
      prev.map(t => t.key === key ? { ...t, status: 'Approved' } : t)
    );
    message.success('Template approved successfully');
  };

  const handleReject = (key: string) => {
    setTemplates(prev => 
      prev.map(t => t.key === key ? { ...t, status: 'Rejected' } : t)
    );
    message.warning('Template rejected');
  };

  const columns = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: TemplateItem['status']) => (
        <Tag color={status === 'Approved' ? 'green' : status === 'Rejected' ? 'red' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: TemplateItem) => (
        <Space>
          {record.status === 'Pending' && (
            <>
              <Button 
                icon={<CheckOutlined />} 
                onClick={() => handleApprove(record.key)}
                className="bg-green-500 text-white border-green-500 hover:bg-green-600"
              >
                Approve
              </Button>
              <Popconfirm
                title="Are you sure to reject this template?"
                onConfirm={() => handleReject(record.key)}
                okText="Yes"
                cancelText="No"
              >
                <Button 
                  icon={<CloseOutlined />} 
                  danger
                >
                  Reject
                </Button>
              </Popconfirm>
            </>
          )}
          <Button type="link">Preview</Button>
        </Space>
      ),
    },
  ];

  const uploadProps = {
    name: 'file',
    multiple: false,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange(info: any) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        setTemplates(prev => [
          {
            key: Date.now().toString(),
            name: info.file.name.replace(/\.[^/.]+$/, ""),
            type: 'New Upload',
            created: new Date().toISOString().split('T')[0],
            status: 'Pending',
            version: '1.0',
          },
          ...prev
        ]);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <TableContext.Provider value={{ moveRow }}>
        <div className="p-6 bg-white rounded-xl shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Template Approval</h2>
            <Upload.Dragger 
              {...uploadProps}
              className="w-64 p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400"
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="text-blue-400" />
              </p>
              <p className="ant-upload-text">Click or drag file to upload</p>
            </Upload.Dragger>
          </div>

          <Table
            columns={columns}
            dataSource={templates}
            rowKey="key"
            components={{
              body: {
                row: DraggableRow,
              },
            }}
            onRow={(record, index) => ({
              key: record.key,
              'data-row-key': record.key,
              'data-row-index': index,
            } as React.HTMLAttributes<HTMLElement> & { 'data-row-key': string; 'data-row-index': number | undefined })}
            pagination={false}
            className="rounded-lg"
            rowClassName={(record) => 
              record.status === 'Pending' ? 'bg-yellow-50' : 
              record.status === 'Approved' ? 'bg-green-50' : 'bg-red-50'
            }
          />
        </div>
      </TableContext.Provider>
    </DndProvider>
  );
};

export default TemplateApproval;