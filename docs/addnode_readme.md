# Adding New Nodes to Clara-Ollama

This document provides a comprehensive guide on how to add new node types to the Clara-Ollama application.

## Table of Contents
1. [Introduction](#introduction)
2. [Node Architecture](#node-architecture)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Using the Node CLI Tool](#using-the-node-cli-tool)
5. [Testing and Debugging](#testing-and-debugging)
6. [Example: Adding a Text Store Node](#example-adding-a-text-store-node)
7. [Working with Images](#working-with-images)
8. [Common Pitfalls](#common-pitfalls)
9. [Troubleshooting](#troubleshooting)

## Introduction

Nodes are the fundamental building blocks of workflows in Clara-Ollama. Each node represents a specific operation or functionality, such as input handling, AI processing, or output display. Adding new node types allows you to extend the application's capabilities with custom functionality.

## Node Architecture

The node system in Clara-Ollama consists of three main components:

1. **Visual Component**: React component that renders the node UI in the flow editor
2. **Node Executor**: Logic that handles the node's execution during workflow runs
3. **Registration**: System that connects the component to the application

Key concepts:
- **Node Types**: Unique identifiers for each kind of node (e.g., `textInputNode`, `imageTextLlmNode`)
- **Tools**: UI representation of nodes in the sidebar
- **Executors**: Backend logic for processing node operations

## Step-by-Step Guide

### 1. Create the Node Visual Component

Create a new file in `/src/components/appcreator_components/nodes/` named after your node (e.g., `MyCustomNode.tsx`):

```tsx
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '../../../hooks/useTheme';

const MyCustomNode = ({ data, isConnectable }: any) => {
  const { isDark } = useTheme();
  const tool = data.tool;
  const Icon = tool.icon;
  const nodeColor = isDark ? tool.darkColor : tool.lightColor;
  
  // Your node-specific state and handlers
  const [someState, setSomeState] = useState('');
  
  // Event propagation handling
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };
  
  return (
    <div 
      className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-md w-64`}
      onClick={stopPropagation}
    >
      {/* Node header with icon and title */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg" style={{ background: nodeColor }}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="font-medium text-sm">
          {data.label}
        </div>
      </div>
      
      {/* Node content - inputs, configuration, etc. */}
      <div className="mb-2">
        {/* Your node-specific UI elements */}
      </div>
      
      {/* Input and output handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="input-1"
        isConnectable={isConnectable}
        className="!bg-blue-500 !w-3 !h-3"
        style={{ top: -6 }}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-1"
        isConnectable={isConnectable}
        className="!bg-purple-500 !w-3 !h-3"
        style={{ bottom: -6 }}
      />
    </div>
  );
};

export default MyCustomNode;
```

### 2. Create the Node Executor

Create a new file in `/src/nodeExecutors/` named after your node (e.g., `MyCustomExecutor.tsx`):

```tsx
import { registerNodeExecutor, NodeExecutionContext } from './NodeExecutorRegistry';

const executeMyCustomNode = async (context: NodeExecutionContext) => {
  const { node, inputs, updateNodeOutput } = context;
  
  try {
    // Get input from connected nodes
    const input = inputs.text || inputs['text-in'] || inputs.default || '';
    
    // Read node configuration
    const config = node.data.config || {};
    const someConfig = config.someConfig || 'default';
    
    // Process the input
    const output = `Processed: ${input} with ${someConfig}`;
    
    // Update the node's visual output if needed
    if (updateNodeOutput) {
      updateNodeOutput(node.id, output);
    }
    
    // Return the result for downstream nodes
    return output;
  } catch (error) {
    console.error("Error in MyCustomNode execution:", error);
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
};

// Register the executor with the unique node type ID
registerNodeExecutor('myCustomNode', {
  execute: executeMyCustomNode
});
```

### 3. Register the Node Component

Update the `/src/components/appcreator_components/nodes/NodeRegistry.tsx` file:

```tsx
import MyCustomNode from './MyCustomNode';

// Add to the NODE_TYPES object
const NODE_TYPES = {
  // ...existing node types
  myCustomNode: MyCustomNode
};
```

### 4. Register the Node Executor

Update the `/src/nodeExecutors/index.tsx` file:

```tsx
// Import all executors so they self-register
import './MyCustomExecutor';
// ...other imports
```

## Using the Node CLI Tool

Clara now includes a powerful CLI tool that automates most of the work of creating, listing, and deleting custom nodes. This is now the recommended approach for managing nodes.

### Creating a Node

```bash
# Create a node interactively (recommended for beginners)
npm run node-cli create --interactive

# Create a specific node with all details provided
npm run node-cli create -n "Text Store" -t output --inputs "" --outputs text --icon Database --color "#10B981"
```

During interactive creation, you'll be asked for:
- Node name
- Type (input, process, output, function)
- Description
- Input types
- Output types
- Icon (from Lucide icons)
- Color (hex color code)

### Listing Nodes

```bash
npm run node-cli list
```

This displays all custom nodes with their configurations, file paths, and properties.

### Deleting a Node

```bash
npm run node-cli delete textstoreNode
```

This will:
- Delete the node component and executor files
- Update NodeRegistry.tsx to remove the node
- Update nodeExecutors/index.tsx to remove the import
- Remove the node from the configuration file

### Validating Nodes

```bash
npm run node-cli validate
```

This command checks:
- Node file existence
- Proper registration in NodeRegistry.tsx
- Proper import in nodeExecutors/index.tsx
- Configuration integrity

## Example: Adding a Text Store Node

Let's walk through an example of creating a useful TextStore node.

### 1. Create via CLI

```bash
npm run node-cli create -n "Text Store" -t output --outputs text --icon Database --color "#10B981"
```

### 2. Define the TextstoreNode Component

```tsx
// filepath: /src/components/appcreator_components/nodes/TextstoreNode.tsx
import React, { useState } from 'react';
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
  
  return (
    <div className="p-3 rounded-lg border shadow-md w-64">
      {/* Node header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg" style={{ background: '#10B981' }}>
          <Database className="w-5 h-5 text-white" />
        </div>
        <div className="font-medium text-sm">Text Store</div>
      </div>
      
      {/* Text input area */}
      <textarea 
        value={storedText}
        onChange={handleTextChange}
        placeholder="Enter text to store..."
        rows={3}
        className="w-full p-2 rounded border resize-none text-sm"
      />
      
      {/* Output handle only */}
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
```

### 3. Define the TextstoreExecutor

```tsx
// filepath: /src/nodeExecutors/TextstoreExecutor.tsx
import { registerNodeExecutor, NodeExecutionContext } from './NodeExecutorRegistry';

const executeTextstoreExecutor = async (context: NodeExecutionContext) => {
  const { node, updateNodeOutput } = context;
  
  // Get the stored text
  const config = node.data.config || {};
  const storedText = config.storedText || '';
  
  // Output the stored text
  if (updateNodeOutput) {
    updateNodeOutput(node.id, storedText);
  }
  
  return storedText;
};

registerNodeExecutor('textstoreNode', {
  execute: executeTextstoreExecutor
});
```

## Testing and Debugging

1. **Visual Testing**: Verify your node appears in the sidebar and can be dragged onto the canvas
2. **Configuration Testing**: Test that configuration options work correctly
3. **Connection Testing**: Verify input and output connections work with other nodes
4. **Execution Testing**: Test the node in a workflow to ensure it performs its function

Debugging tools:
- Use the built-in debug panel
- Run `npm run node-cli validate` to check node integrity
- Add these logging statements to your executor:

```tsx
console.log('Node inputs:', inputs);
console.log('Node config:', node.data.config);
console.log('Executor output:', output);
```

## Working with Images

When creating nodes that work with images, there are several important considerations:

### Design-time vs. Runtime Image Handling

For nodes that handle images, you need to distinguish between design-time configuration (when building the app) and runtime user inputs:

1. **Design-time**: Images are stored in the node's `data.config.image` property
2. **Runtime**: Images should be stored in `data.runtimeImage` to allow users to replace them

Example pattern for image input nodes:

```tsx
const ImageInputNode = ({ data, isConnectable, isRunnerMode = false }) => {
  // Use runtime image if available, otherwise use config image
  const [image, setImage] = useState(data.runtimeImage || data.config?.image || null);
  
  const handleImageUpload = (e) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        
        // Store in the appropriate location based on mode
        if (isRunnerMode) {
          data.runtimeImage = imageData; // For runtime
        } else {
          data.config.image = imageData; // For design-time
        }
        
        setImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Rest of the node implementation...
};
```

### Base64 Image Processing

When working with images, you'll often need to process base64 data:

1. **Handling Prefixes**: Images may include data URL prefixes (`data:image/jpeg;base64,`) 
   which need to be removed for API calls:

```typescript
// Remove data URL prefix if present
if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
  imageData = imageData.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
}
```

2. **Size Considerations**: Be aware of size limitations with base64-encoded images
   - Large images may cause performance issues
   - Consider adding compression options for large images

### ExecutionEngine Integration

In the execution engine, ensure your node properly handles image data:

```typescript
case 'imageInputNode': {
  // First check for a runtime image, then fall back to the configured image
  return node.data.runtimeImage || node.data.config.image || null;
}
```

## Common Pitfalls

When developing custom nodes, be aware of these common issues:

### 1. Configuration Storage Issues

**Problem**: Node configuration not being properly saved or restored.

**Solution**: Save configuration in multiple locations:

```typescript
// Store configuration in multiple places to ensure robustness
if (!data.config) data.config = {};
data.config.yourSetting = value;

// Also store at root level for direct access (useful for critical data)
data.yourSetting = value;
```

### 2. Event Propagation Issues

**Problem**: Clicking on node inputs triggers node selection or dragging.

**Solution**: Use comprehensive event stopping:

```typescript
const stopPropagation = (e: React.SyntheticEvent) => {
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
};

// Apply to interactive elements
<input onClick={stopPropagation} onMouseDown={stopPropagation} />
```

### 3. Hardcoded URLs or Configuration

**Problem**: Using hardcoded values instead of configuration data.

**Solution**: Always use configuration with graceful fallbacks:

```typescript
// Avoid hardcoded fallbacks for critical configuration
const serverUrl = config.serverUrl; 
if (!serverUrl) {
  return "Error: No server URL configured. Please set the URL in settings.";
}

// Only use hardcoded defaults for non-critical styling or text
const labelText = config.label || "Default Label";
```

### 4. Image Node Runtime Issues

**Problem**: Image inputs can't be replaced at runtime.

**Solution**: Implement runtime image handling:

```typescript
// In AppRunner.tsx
const handleImageUpload = (nodeId, file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    // Update app data with runtime image
    setAppData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId 
          ? {...node, data: {...node.data, runtimeImage: event.target.result}} 
          : node
      )
    }));
  };
  reader.readAsDataURL(file);
};
```

## Troubleshooting

### Node Creation Issues

1. **Node not appearing in Tools sidebar:**
   - Run `npm run node-cli validate` to check the configuration
   - Ensure the node has `isCustom: true` in the configuration
   - Check that the node is properly registered in NodeRegistry.tsx

2. **"Unsupported node type" error:**
   - Ensure the executor is properly registered
   - Check that the executor is imported in nodeExecutors/index.tsx
   - Verify node type names match between component, registry, and executor
   - Make sure the executor logic has been added to the ExecutionEngine

3. **Node appears but can't be placed on canvas:**
   - Check for JavaScript errors in console
   - Ensure the node is properly handled in the onDrop function
   - Verify the node type is consistent across all files

4. **Node executor not running:**
   - Check that the executor is imported correctly in index.tsx
   - Run with browser developer tools open to check for errors
   - Ensure the ExecutionEngine can find the executor

### Integration Issues

1. **Connections between nodes don't work:**
   - Check that input/output handle IDs are specified correctly
   - Verify input/output types match between connected nodes
   - Inspect the isValidConnection function in AppCreator.tsx

2. **Data not flowing between nodes:**
   - Ensure the executor is returning data in the expected format
   - Check if the updateNodeOutput function is being called
   - Verify the node is properly handling passed inputs

3. **State management issues:**
   - Make sure you're updating both React state and node.data.config
   - Verify event propagation is properly stopped to prevent canvas events
   - Use the React DevTools to inspect component state

### Node CLI Tool Issues

1. **CLI command not found:**
   - Use `npm run node-cli <command>` to run through npm scripts
   - Ensure you're running from the project root directory

2. **Node creation fails:**
   - Check file permissions in the target directories 
   - Ensure Node.js and npm versions are compatible
   - Run with the --interactive flag for more guidance

3. **Validation shows errors:**
   - Fix each reported error one by one
   - Check for file path issues or missing files
   - Ensure imports and exports are correctly specified

By addressing these common issues, you should be able to successfully create and integrate custom nodes into the Clara-Ollama application.
