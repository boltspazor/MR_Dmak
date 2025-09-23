import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: ''
  };

  const style = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height })
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        variant="text"
        height={16}
        width={index === lines - 1 ? '75%' : '100%'}
        className="animate-pulse"
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg border p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <SkeletonLoader variant="text" height={20} width="40%" className="animate-pulse" />
      <SkeletonLoader variant="circular" width={24} height={24} className="animate-pulse" />
    </div>
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
    {/* Table Header */}
    <div className="bg-indigo-50 px-6 py-3 border-b">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonLoader
            key={index}
            variant="text"
            height={16}
            width={index === columns - 1 ? '20%' : '25%'}
            className="animate-pulse"
          />
        ))}
      </div>
    </div>
    
    {/* Table Rows */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="flex space-x-4 items-center">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <SkeletonLoader
                key={colIndex}
                variant="text"
                height={16}
                width={colIndex === columns - 1 ? '15%' : '20%'}
                className="animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonStats: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <SkeletonLoader variant="text" height={14} width="60%" className="animate-pulse mb-2" />
            <SkeletonLoader variant="text" height={32} width="40%" className="animate-pulse" />
          </div>
          <SkeletonLoader variant="circular" width={48} height={48} className="animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <SkeletonLoader 
    variant="rounded" 
    height={40} 
    width={120} 
    className={`animate-pulse ${className}`} 
  />
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className = '' 
}) => (
  <SkeletonLoader 
    variant="circular" 
    width={size} 
    height={size} 
    className={`animate-pulse ${className}`} 
  />
);

export const SkeletonImage: React.FC<{ width?: number; height?: number; className?: string }> = ({ 
  width = 200, 
  height = 150, 
  className = '' 
}) => (
  <SkeletonLoader 
    variant="rounded" 
    width={width} 
    height={height} 
    className={`animate-pulse ${className}`} 
  />
);

export { SkeletonLoader };
export default SkeletonLoader;
