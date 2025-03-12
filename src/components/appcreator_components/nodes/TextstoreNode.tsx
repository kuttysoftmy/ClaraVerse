import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '../../../hooks/useTheme';
import { Database } from 'lucide-react';

const TextstoreNode = ({ data, isConnectable }: any) => {
  const { isDark } = useTheme();
  const [storedText, setStoredText] = useState(data.config?.storedText || '');
  
  // Update config when text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStoredText(e.target.value);
    if (!data.config) data.config = {};
    data.config.storedText = e.target.value;
  };
  
  // Use capture phase to stop events at the earliest possible point
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };
  
  return (
    <div 
      className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-md w-64`}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg" style={{ background: '#10B981' }}>
          <Database className="w-5 h-5 text-white" />
        </div>
        <div className="font-medium text-sm">
          {data.label || 'Text Store'}
        </div>
      </div>
      
      <div className="mb-2">
        <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Stored Text
        </label>
        <textarea 
          value={storedText}
          onChange={handleTextChange}
          onClick={stopPropagation}
          onMouseDown={stopPropagation}
          placeholder="Enter text to store..."
          rows={3}
          className={`w-full p-2 rounded border resize-none ${
            isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
          } text-sm`}
        />
      </div>
      
      {/* Only output handle, no input handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="text-out"
        isConnectable={isConnectable}
        className="!bg-green-500 !w-3 !h-3"
        style={{ bottom: -6 }}
      />
    </div>
  );
};

export default TextstoreNode;
