import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-5 h-5',
  size,
  color,
}) => {
  // Try exact match or fallback
  const IconComponent = (Icons as any)[name] || Icons.CircleDot || Icons.Tag;

  return (
    <IconComponent
      className={className}
      size={size}
      style={color ? { color } : undefined}
    />
  );
};
