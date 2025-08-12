import { Card, Form, Input, Button, Alert, Divider, notification } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useState } from 'react';

type FormValues = {
  name?: string;
  email: string;
  password?: string;
  confirm?: string
};

type AuthCardProps = {
  type: 'login' | 'register' | 'forgot';
};

const AuthCard = ({ type }: AuthCardProps) => {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

 const onFinish = async (values: FormValues) => {
  setLoading(true);
  try {
    // Simulate API call with the form values
    console.log('Submitting form values:', values); // Log values for demonstration
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    notification.success({
      message: type === 'login' ? 'Login Successful' : 
              type === 'register' ? 'Registration Complete' : 'Reset Link Sent',
      description: type === 'login' ? 'Redirecting to dashboard...' : 
                  `A confirmation has been sent to ${values.email}`
    });
  } catch (error: unknown) {
    notification.error({ 
      message: 'Error', 
      description: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  } finally {
    setLoading(false);
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
              {type === 'login' ? 'Merchandiser Login' : 
               type === 'register' ? 'Create Account' : 'Reset Password'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {type === 'login' ? 'Access your merchandising dashboard' : 
               'Get started with your merchandising account'}
            </p>
          </div>
        }
        className="w-full max-w-md border-0 shadow-lg rounded-xl overflow-hidden"
        headStyle={{ border: 'none', padding: '24px 24px 0' }}
        bodyStyle={{ padding: '24px' }}
      >
        {type === 'forgot' && (
          <Alert
            message="Enter your email to receive reset instructions"
            type="info"
            showIcon
            className="mb-6"
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="space-y-4"
        >
          {type !== 'login' && (
            <Form.Item
              name="name"
              rules={[{ required: type === 'register', message: 'Please input your name' }]}
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400" />} 
                placeholder="Full Name" 
                size="large"
              />
            </Form.Item>
          )}

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

          {type !== 'forgot' && (
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
          )}

          {type === 'register' && (
            <Form.Item
              name="confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Confirm Password"
                size="large"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              className="bg-black hover:bg-gray-800 border-none font-medium h-12"
            >
              {type === 'login' ? 'Login' : 
               type === 'register' ? 'Register' : 'Send Reset Link'}
            </Button>
          </Form.Item>
        </Form>

        <Divider className="text-xs text-gray-400">or</Divider>

        <div className="flex justify-between text-sm">
          {type === 'login' ? (
            <>
              <a href="#forgot" className="text-gray-600 hover:text-black">
                Forgot password?
              </a>
              <a href="#register" className="text-gray-600 hover:text-black">
                Create new account
              </a>
            </>
          ) : (
            <a href="#login" className="text-gray-600 hover:text-black mx-auto">
              Back to login
            </a>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default AuthCard;