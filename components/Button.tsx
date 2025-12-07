import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "py-4 px-6 rounded-xl font-bold transition-all active:scale-95 text-lg tracking-wide shadow-lg";
  
  const variants = {
    primary: "bg-ember-accent text-white hover:bg-violet-500 shadow-violet-900/20",
    secondary: "bg-ember-secondary text-white hover:bg-orange-400 shadow-orange-900/20",
    outline: "border-2 border-ember-card bg-transparent text-gray-300 hover:border-ember-accent hover:text-white",
    danger: "bg-red-500 text-white hover:bg-red-400"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};