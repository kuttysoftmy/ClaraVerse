import React, { useState, useMemo } from 'react';
import { ToolItem } from '../AppCreator';

interface ToolsSidebarProps {
  toolItems: ToolItem[];
  isDark: boolean;
  selectedTool: ToolItem | null;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, tool: ToolItem) => void;
  onDragEnd: () => void;
}

// Add a new "custom" category to the filter options
const ToolsSidebar: React.FC<ToolsSidebarProps> = ({
  toolItems,
  isDark,
  selectedTool,
  onDragStart,
  onDragEnd
}) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Filter tools by category and search
  const filteredTools = useMemo(() => {
    return toolItems.filter(tool => {
      // Match category filter
      const categoryMatch = filter === 'all' || 
                           (filter === 'custom' && tool.isCustom) ||
                           tool.category === filter;
      
      // Match search query
      const searchMatch = search === '' || 
                         tool.name.toLowerCase().includes(search.toLowerCase()) ||
                         tool.description.toLowerCase().includes(search.toLowerCase());
      
      return categoryMatch && searchMatch;
    });
  }, [toolItems, filter, search]);
  
  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full p-2 rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
          }`}
        />
      </div>
      
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'input', 'process', 'output', 'function', 'custom'].map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-3 py-1 rounded-lg ${
              filter === category
                ? isDark 
                  ? 'bg-sakura-700 text-white' 
                  : 'bg-sakura-500 text-white'
                : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
            {category === 'custom' && (
              <span className="ml-1 bg-blue-500 text-white rounded-full text-xs px-1.5">
                {toolItems.filter(t => t.isCustom).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tools list */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
          {filter === 'all' ? 'All Tools' : 
           filter === 'custom' ? 'Custom Nodes' :
           `${filter.charAt(0).toUpperCase() + filter.slice(1)} Tools`}
        </h3>
        
        {filteredTools.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No tools found
          </div>
        ) : (
          filteredTools.map((tool) => (
            <div
              key={tool.id}
              draggable
              onDragStart={(e) => onDragStart(e, tool)}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                isDark ? 'bg-gray-800 shadow-sm border-gray-700' : 'bg-white shadow-sm border-gray-200'
              } border cursor-grab transition-all hover:shadow-md ${
                tool.isCustom ? 'ring-2 ring-blue-400 dark:ring-blue-600 ring-opacity-50' : ''
              }`}
            >
              <div className={`p-2 rounded-lg ${tool.color} text-white`}>
                <tool.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {tool.name}
                  </h4>
                  {tool.isCustom && (
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded">
                      Custom
                    </span>
                  )}
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {tool.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Custom nodes info */}
      {filter === 'custom' && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm">
          <p className="text-blue-800 dark:text-blue-200">
            Create custom nodes using the node-cli tool:
          </p>
          <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono text-xs overflow-x-auto whitespace-nowrap">
            node tools/node-cli.js create --interactive
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsSidebar;
