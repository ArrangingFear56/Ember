import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-ember-card rounded-2xl p-6 shadow-2xl border border-white/5 ${className}`}>
      {title && (
        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 text-center">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};