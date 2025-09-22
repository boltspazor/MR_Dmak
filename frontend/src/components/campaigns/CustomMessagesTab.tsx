import React from 'react';
import { Send, Upload, X, FileText } from 'lucide-react';

interface CustomMessagesTabProps {
  campaignName: string;
  setCampaignName: (name: string) => void;
  messageContent: string;
  setMessageContent: (content: string) => void;
  selectedImage: File | null;
  setSelectedImage: (file: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  footerImage: File | null;
  setFooterImage: (file: File | null) => void;
  footerImagePreview: string | null;
  setFooterImagePreview: (preview: string | null) => void;
  mrs: any[];
  selectedMrs: string[];
  setSelectedMrs: (mrs: string[]) => void;
  mrSearchTerm: string;
  setMrSearchTerm: (term: string) => void;
  mrSortField: 'mrId' | 'firstName' | 'phone' | 'group';
  setMrSortField: (field: 'mrId' | 'firstName' | 'phone' | 'group') => void;
  mrSortDirection: 'asc' | 'desc';
  setMrSortDirection: (direction: 'asc' | 'desc') => void;
  onSubmit: () => void;
}

const CustomMessagesTab: React.FC<CustomMessagesTabProps> = ({
  campaignName,
  setCampaignName,
  messageContent,
  setMessageContent,
  selectedImage: _selectedImage,
  setSelectedImage,
  imagePreview,
  setImagePreview,
  footerImage: _footerImage,
  setFooterImage,
  footerImagePreview,
  setFooterImagePreview,
  mrs,
  selectedMrs,
  setSelectedMrs,
  mrSearchTerm,
  setMrSearchTerm,
  mrSortField,
  setMrSortField,
  mrSortDirection,
  setMrSortDirection,
  onSubmit
}) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFooterImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFooterImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFooterImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const removeFooterImage = () => {
    setFooterImage(null);
    setFooterImagePreview('');
  };

  const handleMrSelection = (mrId: string) => {
    if (selectedMrs.includes(mrId)) {
      setSelectedMrs(selectedMrs.filter((id: string) => id !== mrId));
    } else {
      setSelectedMrs([...selectedMrs, mrId]);
    }
  };

  const handleMrSort = (field: 'mrId' | 'firstName' | 'phone' | 'group') => {
    if (mrSortField === field) {
      setMrSortDirection(mrSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setMrSortField(field);
      setMrSortDirection('asc');
    }
  };


  // Handle case when mrs is undefined or empty
  const safeMrs = mrs || [];
  const safeFilteredMrs = safeMrs.filter(mr =>
    mr.firstName?.toLowerCase().includes(mrSearchTerm.toLowerCase()) ||
    mr.lastName?.toLowerCase().includes(mrSearchTerm.toLowerCase()) ||
    mr.mrId?.toLowerCase().includes(mrSearchTerm.toLowerCase()) ||
    mr.phone?.includes(mrSearchTerm)
  ).sort((a, b) => {
    const aValue = a[mrSortField] || '';
    const bValue = b[mrSortField] || '';
    
    if (aValue < bValue) return mrSortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return mrSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Campaign Name */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Name</h3>
        <input
          type="text"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="Enter campaign name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* MR Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select MRs</h3>
            <div className="bg-indigo-100 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-indigo-700">
                {selectedMrs.length} of {safeFilteredMrs.length} selected
              </span>
            </div>
          </div>

          {/* Search Controls */}
          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search MRs by name, ID, phone, or group..."
                value={mrSearchTerm}
                onChange={(e) => setMrSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedMrs.length === safeFilteredMrs.length && safeFilteredMrs.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMrs(safeFilteredMrs.map(mr => mr._id || mr.id));
                      } else {
                        setSelectedMrs([]);
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th 
                  className="text-left py-4 px-6 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => handleMrSort('mrId')}
                >
                  <div className="flex items-center space-x-2">
                    <span>MR ID</span>
                    {mrSortField === 'mrId' && (
                      <span className="text-indigo-600">
                        {mrSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-4 px-6 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => handleMrSort('firstName')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Name</span>
                    {mrSortField === 'firstName' && (
                      <span className="text-indigo-600">
                        {mrSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-4 px-6 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => handleMrSort('phone')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Phone</span>
                    {mrSortField === 'phone' && (
                      <span className="text-indigo-600">
                        {mrSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-4 px-6 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => handleMrSort('group')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Group</span>
                    {mrSortField === 'group' && (
                      <span className="text-indigo-600">
                        {mrSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {safeFilteredMrs.length > 0 ? (
                safeFilteredMrs.map((mr) => (
                  <tr key={mr._id || mr.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm text-left">
                      <input
                        type="checkbox"
                        checked={selectedMrs.includes(mr._id || mr.id)}
                        onChange={() => handleMrSelection(mr._id || mr.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900 text-left font-medium">{mr.mrId}</td>
                    <td className="py-4 px-6 text-sm text-gray-900 text-left">
                      {mr.firstName} {mr.lastName}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900 text-left">{mr.phone}</td>
                    <td className="py-4 px-6 text-sm text-gray-900 text-left">{mr.group || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <FileText className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        No MRs Found
                      </h3>
                      <p className="text-gray-600 max-w-md">
                        {safeMrs.length === 0 
                          ? "No MRs are available. Please contact your administrator to add MRs to the system."
                          : "No MRs match your search criteria. Try adjusting your search terms."
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Selected MRs Display */}
        {selectedMrs.length > 0 && (
          <div className="p-6 bg-gray-50 border-t space-y-3">
            <p className="text-sm font-medium text-gray-700">Selected MRs ({selectedMrs.length}):</p>
            <div className="flex flex-wrap gap-2">
              {selectedMrs.map(mrId => {
                const mr = safeMrs.find(m => (m._id || m.id) === mrId);
                return (
                  <div key={mrId} className="flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-3 py-2 rounded-full text-sm">
                    <span>{mr?.firstName} {mr?.lastName}</span>
                    <button
                      onClick={() => handleMrSelection(mrId)}
                      className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-200 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Message Composition */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input Fields */}
          <div className="space-y-6">
            {/* Header Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Header Image (Optional)
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="header-image-upload"
                />
                <label
                  htmlFor="header-image-upload"
                  className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                >
                  <Upload className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Click to upload header image</span>
                </label>

                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Header preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Text *</label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Enter message content with parameters like {{FirstName}}, {{LastName}}, {{Month}}, {{Target}}..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Use {`{{ParameterName}}`} for dynamic parameters (e.g., {`{{FirstName}}`}, {`{{LastName}}`}, {`{{Month}}`}, {`{{Target}}`})
              </p>
            </div>

            {/* Footer Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Footer Image (Optional)
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFooterImageUpload}
                  className="hidden"
                  id="footer-image-upload"
                />
                <label
                  htmlFor="footer-image-upload"
                  className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                >
                  <Upload className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Click to upload footer image</span>
                </label>

                {footerImagePreview && (
                  <div className="relative">
                    <img
                      src={footerImagePreview}
                      alt="Footer preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeFooterImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Live Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Live Preview
            </label>
            <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
              <div className="bg-white rounded-2xl rounded-tl-md shadow-sm max-w-xs mx-auto">
                {imagePreview && (
                  <div className="w-full">
                    <img
                      src={imagePreview}
                      alt="Header"
                      className="w-full h-24 object-cover rounded-t-2xl"
                    />
                  </div>
                )}
                <div className="p-3">
                  <div className="text-gray-800 text-xs leading-relaxed whitespace-pre-wrap">
                    {(() => {
                      if (!messageContent) return 'Start typing your message...';

                      let processedContent = messageContent;

                      // Sample parameter values for live preview
                      const sampleParams = {
                        'FN': 'John',
                        'LN': 'Doe',
                        'FirstName': 'John',
                        'LastName': 'Doe',
                        'MRId': 'MR001',
                        'GroupName': 'North Zone',
                        'PhoneNumber': '+919876543210',
                        'Name': 'John Doe',
                        'Company': 'D-MAK',
                        'Product': 'New Product',
                        'Date': new Date().toLocaleDateString(),
                        'Time': new Date().toLocaleTimeString(),
                        'Month': new Date().toLocaleDateString('en-US', { month: 'long' }),
                        'Year': new Date().getFullYear().toString(),
                        'Target': '100',
                        'Achievement': '85',
                        'Location': 'Mumbai',
                        'City': 'Mumbai',
                        'State': 'Maharashtra',
                        'Country': 'India'
                      };

                      // Replace parameters with sample values
                      for (const [param, value] of Object.entries(sampleParams)) {
                        const regex = new RegExp(`\\{\\{${param}\\}\\}`, 'g');
                        processedContent = processedContent.replace(regex, value);
                      }

                      // Replace any remaining parameters with [Sample Value]
                      processedContent = processedContent.replace(/\{\{[A-Za-z0-9_]+\}\}/g, '[Sample Value]');

                      return processedContent;
                    })()}
                  </div>
                </div>
                {footerImagePreview && (
                  <div className="px-3 pb-3">
                    <img
                      src={footerImagePreview}
                      alt="Footer"
                      className="w-full h-16 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onSubmit}
          disabled={!messageContent.trim() || selectedMrs.length === 0 || !campaignName.trim()}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          <Send className="h-5 w-5" />
          <span>Send Campaign</span>
        </button>
      </div>
    </div>
  );
};

export default CustomMessagesTab;
