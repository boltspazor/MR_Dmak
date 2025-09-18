import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  showExportButtons?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  onExportCSV, 
  onExportPDF, 
  showExportButtons = false 
}) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-start">
        <div>
          {title === "D-MAK" ? (
            <img 
              src="/qwerty.jpg" 
              alt="D-MAK Logo" 
              className="h-12 object-contain mb-2"
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          )}
          <p className="text-lg text-gray-600">{subtitle}</p>
        </div>
        
        {/* Glenmark Logo */}
        <div className="absolute top-4 right-4">
          <img 
            src="/logo.png" 
            alt="Glenmark Logo" 
            className="w-32 h-18 object-contain"
          />
        </div>
      </div>
      
      {/* Export Buttons */}
      {showExportButtons && onExportCSV && onExportPDF && (
        <div className="flex justify-end mt-4">
          <div className="flex space-x-2">
            <button
              onClick={onExportCSV}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
            >
              Export CSV
            </button>
            <button
              onClick={onExportPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
            >
              Export PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
