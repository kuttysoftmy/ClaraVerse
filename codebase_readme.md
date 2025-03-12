# Clara AI Assistant - Code Documentation

## Project Overview

Clara is a modern AI assistant web application built with React, TypeScript, and Tailwind CSS. It provides a chat interface for interacting with various AI models through the Ollama API, with support for both text and image inputs.

## Core Components

### 1. Main Application Structure

- `src/App.tsx`: Main application component that handles routing between different views (Dashboard, Assistant, Settings, Debug)
- `src/main.tsx`: Application entry point
- `src/index.css`: Global styles and Tailwind CSS configuration

### 2. Database Layer (`src/db/index.ts`)

Local storage-based database implementation with the following key features:

- Chat management (create, read, update)
- Message storage
- Usage statistics
- Settings storage
- Model usage tracking

Key interfaces:
```typescript
interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_starred: boolean;
  is_deleted: boolean;
}

interface Message {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  tokens: number;
  images?: string[];
}
```

### 3. Assistant Component (`src/components/Assistant.tsx`)

The main chat interface component that handles:

- Chat session management
- Message streaming
- Image handling
- Model selection
- Context management

Key features:
- Maximum context window of 20 messages
- Support for image uploads (max 10MB per image)
- Streaming and non-streaming response modes
- Automatic model selection for image processing

### 4. Chat Components

#### AssistantHeader (`src/components/assistant_components/AssistantHeader.tsx`)
- Model selection dropdown
- Connection status indicator
- Theme toggle
- Navigation controls

#### ChatInput (`src/components/assistant_components/ChatInput.tsx`)
- Text input with auto-resize
- Image upload support
- Voice input placeholder
- File attachment placeholder
- Send button with loading state

#### ChatWindow (`src/components/assistant_components/ChatWindow.tsx`)
- Message display
- Auto-scroll functionality
- Empty state handling
- Scroll-to-bottom button

#### ChatMessage (`src/components/assistant_components/ChatMessage.tsx`)
- Message rendering with Markdown support
- Code block handling with syntax highlighting
- Image gallery for uploaded images
- Thinking process expansion
- Message copying
- Token count display

### 5. Settings Management

#### AssistantSettings (`src/components/assistant_components/AssistantSettings.tsx`)
- Streaming toggle
- Model image support configuration
- Model search functionality

#### ImageWarning (`src/components/assistant_components/ImageWarning.tsx`)
- Warning display for image processing capabilities

#### ModelWarning (`src/components/assistant_components/ModelWarning.tsx`)
- Model compatibility warning for image processing

### 6. Utility Components

#### Debug Console (`src/components/Debug.tsx`)
- API testing interface
- Model testing
- Response streaming testing
- Troubleshooting guides

#### Dashboard (`src/components/Dashboard.tsx`)
- Usage statistics display
- API configuration status
- Recent activity tracking

### 7. Ollama Integration (`src/utils/OllamaClient.ts`)

API client for Ollama with support for:
- Chat completions
- Image processing
- Model management
- Response streaming

## Chat Flow

1. **Message Sending**:
   ```typescript
   const handleSend = async () => {
     // Create chat if none exists
     const chatId = activeChat || await db.createChat(input.slice(0, 30));
     
     // Create user message
     const userMessage = {
       id: crypto.randomUUID(),
       chat_id: chatId,
       content: input,
       role: 'user',
       timestamp: new Date().toISOString(),
       tokens: 0,
       images: images.map(img => img.preview)
     };

     // Get context messages
     const contextMessages = getContextMessages([...messages, userMessage]);
     
     // Generate response
     if (images.length > 0) {
       // Handle image generation
       const response = await client.generateWithImages(
         selectedModel,
         input,
         images.map(img => img.base64)
       );
     } else if (isStreaming) {
       // Handle streaming response
       for await (const chunk of client.streamChat(selectedModel, formattedMessages)) {
         // Update UI with chunks
       }
     } else {
       // Handle regular response
       const response = await client.sendChat(selectedModel, formattedMessages);
     }

     // Save messages to database
     await db.addMessage(chatId, userMessage.content, userMessage.role, tokens, images);
     await db.addMessage(chatId, response, 'assistant', tokens);
   };
   ```

2. **Response Processing**:
   - Streaming responses are displayed chunk by chunk
   - Non-streaming responses are displayed all at once
   - Images are processed using image-capable models (llava, bakllava)
   - Thinking process is separated using `<think>` tags

3. **Context Management**:
   - Maximum of 20 messages kept in context
   - Messages are formatted for model consumption
   - Images are converted to base64 for API requests

## Database Operations

1. **Chat Management**:
   ```typescript
   // Create chat
   const chatId = await db.createChat(title);
   
   // Update chat
   await db.updateChat(chatId, { title: 'New Title' });
   
   // Get recent chats
   const chats = await db.getRecentChats();
   ```

2. **Message Management**:
   ```typescript
   // Add message
   await db.addMessage(chatId, content, role, tokens, images);
   
   // Get chat messages
   const messages = await db.getChatMessages(chatId);
   ```

3. **Usage Tracking**:
   ```typescript
   // Update model usage
   await db.updateModelUsage(model, duration);
   
   // Get usage statistics
   const tokensUsed = await db.getTokensUsed();
   const avgResponseTime = await db.getAverageResponseTime();
   ```

## Hooks

### useDatabase (`src/hooks/useDatabase.ts`)
- Manages database statistics
- Formats numbers and bytes
- Provides real-time updates

### useTheme (`src/hooks/useTheme.tsx`)
- Manages theme state (light/dark)
- Syncs with localStorage
- Handles system preference

## Node System Architecture

### 1. Node Architecture Overview

The node system in Clara allows for creating workflows that process data through a series of connected steps:

- **Node Components**: Visual UI representation (`/src/components/appcreator_components/nodes/`)
- **Node Executors**: Logic for executing nodes (`/src/nodeExecutors/`)
- **Node Registry**: Central registry of available nodes (`/src/components/appcreator_components/nodes/NodeRegistry.tsx`)
- **Execution Engine**: System that runs workflows (`/src/ExecutionEngine.ts`)
- **Node CLI Tool**: Command-line tool for creating and managing nodes (`/tools/node-cli.js`)

### 2. Built-in Node Types

- **TextInputNode**: Entry point for text input
- **ImageInputNode**: Entry point for image input
- **LLMPromptNode**: Process text with AI models
- **TextOutputNode**: Display text output
- **ConditionalNode**: Branch flow based on conditions
- **ApiCallNode**: Make external HTTP calls
- **TextCombinerNode**: Combine text from multiple sources
- **TextstoreNode**: Store and provide text without input
- **ImageTextLlmNode**: Process images and text with multimodal models

### 3. Custom Node Creation

Clara includes a CLI tool for creating, listing, and deleting custom nodes:

```javascript
// Create a node interactively
node tools/node-cli.js create --interactive

// Create specific node
node tools/node-cli.js create -n "My Node" -t process

// List all custom nodes
node tools/node-cli.js list

// Delete a node
node tools/node-cli.js delete myNodeNode

// Validate node integrity
node tools/node-cli.js validate
```

### 4. Node Executor Registry

The system uses a registry pattern to manage node executors:

```typescript
// Register a node executor
registerNodeExecutor('myNodeType', {
  execute: async (context) => {
    // Implementation
  }
});

// Get registered node types
const nodeTypes = getRegisteredNodeTypes();
```

### 5. Execution Flow

When a workflow runs, the execution engine:

1. Builds an execution plan from nodes and edges
2. Identifies nodes ready to execute (no pending inputs)
3. Executes ready nodes and stores outputs
4. Passes outputs to connected nodes
5. Repeats until all nodes have executed or reached a deadlock

## Styling

The application uses Tailwind CSS with a custom color scheme:
```css
:root {
  --sakura-50: #fef6f9;
  --sakura-100: #fee3ec;
  --sakura-200: #ffc6da;
  --sakura-300: #ff9dc1;
  --sakura-400: #ff669d;
  --sakura-500: #ff1a75;
}
```

Common utility classes:
- `glassmorphic`: Glass-like effect with backdrop blur
- `scrollbar-thin`: Custom scrollbar styling
- `animate-fadeIn`: Smooth fade-in animation

## Troubleshooting Common Issues

### Node Creation Issues
- **Node not appearing in sidebar**: Ensure the node is properly registered in NodeRegistry.tsx
- **Executor not running**: Check that the executor is imported in nodeExecutors/index.tsx
- **Missing executor error**: Run `npm run node-cli validate` to check node integrity

### Node Execution Issues
- **"Unsupported node type" error**: Make sure the executor is properly registered
- **Missing node outputs**: Check that the executor correctly calls `updateNodeOutput`
- **Flow execution fails**: Use the debug panel to inspect the execution plan

### Image Processing Issues
- **Images not loading**: Check that image data is properly encoded as base64
- **Model compatibility**: Ensure you're using a model that supports image processing (like llava)
- **Large image issues**: Consider resizing or compressing images before processing

## Best Practices

1. **Error Handling**:
   - All API calls are wrapped in try-catch blocks
   - User-friendly error messages
   - Fallback UI states

2. **Performance**:
   - Message streaming for faster responses
   - Efficient context management
   - Optimized image handling

3. **Security**:
   - Input sanitization
   - Image size limits
   - Secure API communication

4. **Accessibility**:
   - ARIA labels
   - Keyboard navigation
   - Color contrast compliance

## Configuration

Key configuration options:
- `MAX_CONTEXT_MESSAGES`: 20 messages
- `MAX_IMAGE_SIZE`: 10MB
- `NODE_CLI_CONFIG`: Located at project root in node-cli-config.json