import React from 'react';

interface StandardHeaderProps {
  pageTitle: string;
}

const StandardHeader: React.FC<StandardHeaderProps> = ({ pageTitle }) => {
  return (
    <>
      {/* Consistent Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <img 
              src="/DVK_updated_logo.png" 
              alt="D-MAK Logo" 
              className="h-16 object-contain mb-2"
            />
          </div>
          
          {/* Glenmark Logo */}
          <div className="">
            <img 
              src="/logo.png" 
              alt="Glenmark Logo" 
              className="w-32 h-16 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Blue Separator Line */}
      <div className="border-b-2 border-indigo-500 my-6"></div>

      {/* Page Title */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{pageTitle}</h2>
      </div>
    </>
  );
};

export default StandardHeader;