import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ConsentForm from '../components/ConsentForm';
import OptOutForm from '../components/OptOutForm';
import ConsentStatusChecker from '../components/ConsentStatusChecker';
import Header from '../components/Header';

const ConsentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'consent' | 'optout' | 'status'>('consent');
  const [consentData, setConsentData] = useState<any>(null);
  const [optOutData, setOptOutData] = useState<any>(null);

  const handleConsentSuccess = (data: any) => {
    setConsentData(data);
    console.log('Consent recorded:', data);
  };

  const handleConsentError = (error: string) => {
    console.error('Consent error:', error);
  };

  const handleOptOutSuccess = (data: any) => {
    setOptOutData(data);
    console.log('Opt-out processed:', data);
  };

  const handleOptOutError = (error: string) => {
    console.error('Opt-out error:', error);
  };

  const handleStatusFound = (data: any) => {
    console.log('Status found:', data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" p-10">
        <Header 
          title="Consent Management"
          subtitle="Manage your communication preferences with D-MAK Medical Representatives"
          showExportButtons={false}
        />
        <div className="py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setActiveTab('consent')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === 'consent'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Give Consent
                </button>
                <button
                  onClick={() => setActiveTab('optout')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === 'optout'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Opt Out
                </button>
                <button
                  onClick={() => setActiveTab('status')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === 'status'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Check Status
                </button>
              </div>
            </div>

            {/* Success Messages */}
            {consentData && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Consent Recorded Successfully
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Your consent has been recorded for phone number: {consentData.phone_e164}</p>
                      <p>Consent ID: {consentData.consent_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {optOutData && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Opt-out Processed Successfully
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>You have been opted out from all communications for phone number: {optOutData.phone_e164}</p>
                      <p>Opt-out timestamp: {new Date(optOutData.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Content */}
            <div className="flex justify-center">
              {activeTab === 'consent' && (
                <ConsentForm
                  businessName="D-MAK Medical Representatives"
                  onSuccess={handleConsentSuccess}
                  onError={handleConsentError}
                />
              )}
              {activeTab === 'optout' && (
                <OptOutForm
                  businessName="D-MAK Medical Representatives"
                  onSuccess={handleOptOutSuccess}
                  onError={handleOptOutError}
                />
              )}
              {activeTab === 'status' && (
                <ConsentStatusChecker
                  onStatusFound={handleStatusFound}
                />
              )}
            </div>

            {/* Information Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  About Consent
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• You can give consent for specific types of communications</li>
                  <li>• Your consent is recorded with a timestamp and unique ID</li>
                  <li>• You can update your preferences at any time</li>
                  <li>• Your data is stored securely and used only for the purposes you've selected</li>
                  <li>• You can opt out at any time using the opt-out form</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  About Opt-out
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Opting out stops all future communications immediately</li>
                  <li>• You can provide a reason for opting out (optional)</li>
                  <li>• Your opt-out request is recorded with a timestamp</li>
                  <li>• You can re-subscribe at any time by giving consent again</li>
                  <li>• Your phone number is required to process the opt-out</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Check Status
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Verify your current consent status anytime</li>
                  <li>• View your communication preferences</li>
                  <li>• See when you gave or withdrew consent</li>
                  <li>• Check which business has your consent</li>
                  <li>• Review your opt-out status if applicable</li>
                </ul>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-8 text-center">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Need Help?
                </h3>
                <p className="text-gray-600 mb-4">
                  If you have any questions about consent management or need assistance, please contact us:
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Email: support@dmak-medical.com</p>
                  <p>Phone: +1-800-DMAK-HELP</p>
                  <p>Business Hours: Monday - Friday, 9 AM - 5 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentFormPage;