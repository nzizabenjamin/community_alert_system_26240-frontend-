import React from 'react';

export const Textarea = ({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  error,
  className = '',
  disabled = false,
  name,
  id,
  rows = 4
}) => {
  const textareaId = id || name;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`
          w-full px-4 py-2 border rounded-lg 
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};