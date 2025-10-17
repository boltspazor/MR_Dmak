import React from 'react';
import { FileText } from 'lucide-react';

interface Parameter {
  name: string;
  type: 'text' | 'number';
}

interface TemplateParametersListProps {
  parameters: Parameter[];
}

const TemplateParametersList: React.FC<TemplateParametersListProps> = ({ parameters }) => {
  if (parameters.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">No parameters found in this template</p>
        <p className="text-xs text-gray-400 mt-1">
          Use {'{{'}ParameterName{'}}'} in your template content to create dynamic parameters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-3">
        The following parameters were found in the template content:
      </p>
      <div className="flex flex-wrap gap-2">
        {parameters.map((param, index) => (
          <span
            key={index}
            className={`px-3 py-2 text-sm rounded-lg font-medium ${
              param.type === 'number'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
            title={`Parameter type: ${param.type}`}
          >
            {`{{${param.name}}}`}
            <span className="ml-1 text-xs opacity-75">({param.type})</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TemplateParametersList;
