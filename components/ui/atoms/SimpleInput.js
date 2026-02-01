/**
 * Simple Input Component for Template Modal
 * Independent state management to avoid conflicts
 */

import React, { useState, useEffect } from 'react';

const SimpleInput = ({ 
  field, 
  type, 
  value, 
  onChange, 
  placeholder, 
  label 
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  
  // Generate unique IDs for accessibility
  const inputId = `input-${field}`;
  const inputName = field;

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (type === 'number') {
      onChange(field, parseInt(newValue) || 0);
    } else {
      onChange(field, newValue);
    }
  };

  if (type === 'number') {
    return (
      <div>
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-600 mb-1">
          {label}
        </label>
        <input
          id={inputId}
          name={inputName}
          type="number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
        />
      </div>
    );
  }

  if (type === 'boolean') {
    return (
      <div>
        <label htmlFor={inputId} className="flex items-center space-x-2 cursor-pointer">
          <input
            id={inputId}
            name={inputName}
            type="checkbox"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={inputValue || false}
            onChange={(e) => {
              const newValue = e.target.checked;
              setInputValue(newValue);
              onChange(field, newValue);
            }}
          />
          <span className="text-sm text-gray-600">{label}</span>
        </label>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        id={inputId}
        name={inputName}
        type="text"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export default SimpleInput;
