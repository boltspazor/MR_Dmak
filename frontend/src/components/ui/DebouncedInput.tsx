// components/ui/DebouncedInput.tsx
import React, { useEffect, useState } from 'react';

type Props = {
  value?: string;
  onDebouncedChange: (v: string) => void;
  delay?: number;
  placeholder?: string;
  className?: string;
};

export const DebouncedInput: React.FC<Props> = ({ value = '', onDebouncedChange, delay = 300, placeholder, className }) => {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    const t = setTimeout(() => onDebouncedChange(local.trim()), delay);
    return () => clearTimeout(t);
  }, [local, delay, onDebouncedChange]);

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
};
