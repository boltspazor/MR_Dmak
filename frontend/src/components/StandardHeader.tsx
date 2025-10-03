import React from 'react';

interface StandardHeaderProps {
  pageTitle: string;
}

const StandardHeader: React.FC<StandardHeaderProps> = ({ pageTitle }) => {
  return (
    <>
      {/* Consistent Header Section */}
      <div className="mb-3">
        <div className="flex justify-between items-start">
          {pageTitle ? 
            <div className="text-3xl font-semibold tracking-tight mt-4 mb-2 text-gray-800">
            {pageTitle}
          </div>
          
            : 
            <div>
            </div>
              }
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
      <div className="border-b-2 border-indigo-500 mb-6"></div>
    </>
  );
};

export default StandardHeader;