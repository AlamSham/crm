import { Card, Form, Input, Button, notification } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useMerchAuthStore, { type MerchUser } from '@/store/useMerchAuthStore';
import merchAxios from '@/lib/merchAxios';

type FormValues = {
  email: string;
  password?: string;
};

const AuthCard = () => {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useMerchAuthStore((s) => s.setAuth);

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      const { data } = await merchAxios.post('/login', {
        email: values.email,
        password: values.password,
      })

      const u = data?.user
      const accessToken: string | undefined = data?.accessToken
      const refreshToken: string | undefined = data?.refreshToken
      if (!u || !accessToken) throw new Error('Invalid server response')

      const merchUser: MerchUser = {
        id: u._id,
        email: u.email,
        isActive: !!u.active,
        permissions: {
          catalog: !!u.isCatalogAccess,
          lead: !!u.isLeadAccess,
          template: !!u.isTemplateAccess,
          email: !!u.isEmailAccess,
          followUp: !!u.isFollowUpAccess,
          customerEnquiry: !!u.isCustomerEnquiry,
          customerProfiling: !!u.isCustomerProfiling,
        },
      }

      if (!merchUser.isActive) {
        notification.error({ message: 'Account Inactive', description: 'Please contact admin.' })
        return
      }

      if (refreshToken) {
        localStorage.setItem('merchRefreshToken', refreshToken)
      }
      setAuth(accessToken, merchUser)
      notification.success({ message: 'Login Successful', description: 'Redirecting to dashboard...' })
      navigate('/merchandiser/merchandiserDashboard', { replace: true })
    } catch (error: unknown) {
      notification.error({
        message: 'Error',
        description: error instanceof Error ? error.message : 'Invalid email or password',
      })
    } finally {
      setLoading(false)
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        title={
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Merchandiser Login
            </h2>
            <p className="mt-1 text-sm text-gray-500">Access your merchandising dashboard</p>
          </div>
        }
        className="w-full max-w-md border-0 shadow-lg rounded-xl overflow-hidden"
        headStyle={{ border: 'none', padding: '24px 24px 0' }}
        bodyStyle={{ padding: '24px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="space-y-4"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined className="text-gray-400" />} 
              placeholder="Email Address" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              className="bg-black hover:bg-gray-800 border-none font-medium h-12"
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </motion.div>
  );
};

export default AuthCard;