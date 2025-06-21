import React from 'react';

type CardHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  icon?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
};

const CardHeader: React.FC<CardHeaderProps> = ({ 
  title, 
  subtitle, 
  right,
  icon,
  align = 'left', 
  className = '' 
}) => {
  const alignment = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }[align];

  return (
    <div className={`w-full relative ${className}`}>
      <div className={`flex flex-col ${alignment}`}>
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          {icon && <span className="inline-block w-5 h-5">{icon}</span>}
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-white/70">
            {subtitle}
          </p>
        )}
      </div>
      {right && (
        <div className="absolute right-0 top-0 sm:absolute flex items-center gap-2">
          {right}
        </div>
      )}
    </div>
  );
};

export default CardHeader;