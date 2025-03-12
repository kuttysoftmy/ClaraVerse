import { registerNodeExecutor, NodeExecutionContext } from './NodeExecutorRegistry';

console.log('Loading TextstoreExecutor');

const executeTextstoreExecutor = async (context: NodeExecutionContext) => {
  const { node, updateNodeOutput } = context;
  
  // Get the stored text from config
  const config = node.data.config || {};
  const storedText = config.storedText || '';
  
  console.log(`TextstoreExecutor executing with stored text: ${storedText}`);
  
  // Simply output the stored text
  if (updateNodeOutput) {
    updateNodeOutput(node.id, storedText);
  }
  
  return storedText;
};

// Register the executor
registerNodeExecutor('textstoreNode', {
  execute: executeTextstoreExecutor
});

// Log confirmation
console.log('TextstoreExecutor registered successfully');
