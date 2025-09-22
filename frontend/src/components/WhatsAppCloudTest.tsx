import React, { useState } from 'react';
import { Send, MessageSquare, FileText, Image, Users, TestTube } from 'lucide-react';
import whatsappCloudAPI from '../api/whatsapp-cloud';
import toast from 'react-hot-toast';

const WhatsAppCloudTest: React.FC = () => {
  const [testPhone, setTestPhone] = useState('919876543210');
  const [testMessage, setTestMessage] = useState('Hello from WhatsApp Cloud API!');
  const [templateName, setTemplateName] = useState('hello_world');
  const [templateParams, setTemplateParams] = useState('["John", "Doe"]');
  const [imageUrl, setImageUrl] = useState('https://example.com/image.jpg');
  const [imageCaption, setImageCaption] = useState('Check out this image!');
  const [loading, setLoading] = useState(false);

  const handleSendTextMessage = async () => {
    if (!testPhone || !testMessage) {
      toast.error('Please enter phone number and message');
      return;
    }

    try {
      setLoading(true);
      const result = await whatsappCloudAPI.sendMessage({
        to: testPhone,
        message: testMessage
      });
      toast.success(`Message sent successfully! Message ID: ${result.data.messageId}`);
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTemplateMessage = async () => {
    if (!testPhone || !templateName) {
      toast.error('Please enter phone number and template name');
      return;
    }

    try {
      setLoading(true);
      let parameters: string[] = [];
      try {
        parameters = JSON.parse(templateParams);
      } catch (e) {
        toast.error('Invalid JSON format for template parameters');
        return;
      }

      const result = await whatsappCloudAPI.sendTemplate({
        to: testPhone,
        templateName,
        parameters,
        languageCode: 'en_US'
      });
      toast.success(`Template message sent successfully! Message ID: ${result.data.messageId}`);
    } catch (error: any) {
      toast.error(`Failed to send template message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendImageMessage = async () => {
    if (!testPhone || !imageUrl) {
      toast.error('Please enter phone number and image URL');
      return;
    }

    try {
      setLoading(true);
      const result = await whatsappCloudAPI.sendImage({
        to: testPhone,
        imageUrl,
        caption: imageCaption
      });
      toast.success(`Image message sent successfully! Message ID: ${result.data.messageId}`);
    } catch (error: any) {
      toast.error(`Failed to send image message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildMessage = async () => {
    try {
      setLoading(true);
      const templateContent = 'Hello {{firstName}}, your order {{orderId}} has been {{status}}.';
      const parameters = {
        firstName: 'John',
        orderId: 'ORD-12345',
        status: 'shipped'
      };

      const result = await whatsappCloudAPI.buildMessage({
        templateContent,
        parameters
      });
      
      toast.success('Message built successfully!', {
        duration: 5000
      });
      
      // Show the built message
      alert(`Built Message:\n\n${result.data.builtMessage}`);
    } catch (error: any) {
      toast.error(`Failed to build message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestBulk = async () => {
    try {
      setLoading(true);
      const recipients = [
        { phone: '919876543210', firstName: 'John', lastName: 'Doe' },
        { phone: '919876543211', firstName: 'Jane', lastName: 'Smith' }
      ];

      const result = await whatsappCloudAPI.sendBulk({
        recipients,
        message: 'This is a bulk test message from WhatsApp Cloud API!'
      });
      
      toast.success(`Bulk messages processed: ${result.data.success}/${result.data.total} sent successfully`);
    } catch (error: any) {
      toast.error(`Failed to send bulk messages: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">WhatsApp Cloud API Test</h1>
        <p className="text-gray-600">Test the new WhatsApp Cloud API implementation</p>
      </div>

      {/* Phone Number Input */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Phone Number
            </label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="919876543210"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a valid WhatsApp number for testing (include country code)
            </p>
          </div>
        </div>
      </div>

      {/* Text Message Test */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Text Message Test</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your test message..."
            />
          </div>
          <button
            onClick={handleSendTextMessage}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Sending...' : 'Send Text Message'}
          </button>
        </div>
      </div>

      {/* Template Message Test */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Template Message Test</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="hello_world"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Parameters (JSON Array)
            </label>
            <input
              type="text"
              value={templateParams}
              onChange={(e) => setTemplateParams(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder='["John", "Doe"]'
            />
          </div>
          <button
            onClick={handleSendTemplateMessage}
            disabled={loading}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Sending...' : 'Send Template Message'}
          </button>
        </div>
      </div>

      {/* Image Message Test */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Image className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Image Message Test</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption (Optional)
            </label>
            <input
              type="text"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Check out this image!"
            />
          </div>
          <button
            onClick={handleSendImageMessage}
            disabled={loading}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Sending...' : 'Send Image Message'}
          </button>
        </div>
      </div>

      {/* Message Builder Test */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Send className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">Message Builder Test</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Test the message builder with a sample template and parameters.
        </p>
        <button
          onClick={handleBuildMessage}
          disabled={loading}
          className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Building...' : 'Build Sample Message'}
        </button>
      </div>

      {/* Bulk Message Test */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Bulk Message Test</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Test sending messages to multiple recipients (demo with sample numbers).
        </p>
        <button
          onClick={handleTestBulk}
          disabled={loading}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Sending...' : 'Send Bulk Test Messages'}
        </button>
      </div>

      {/* API Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TestTube className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">API Configuration</h3>
        </div>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Phone Number ID:</strong> 715904891617490</p>
          <p><strong>Business Account ID:</strong> 1176186791172596</p>
          <p><strong>API Version:</strong> v18.0</p>
          <p><strong>Base URL:</strong> https://graph.facebook.com/v18.0/715904891617490</p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppCloudTest;
