import React from 'react';

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = 'border-navy' }) => {
  return (
    <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${className}`}></div>
  );
};

export default Spinner;
