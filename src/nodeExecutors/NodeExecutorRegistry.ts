// Define the NodeExecutor interface
export interface NodeExecutionContext {
  node: any;
  inputs?: any;
  updateNodeOutput?: (nodeId: string, output: any) => void;
  [key: string]: any;
}

export interface NodeExecutor {
  execute: (context: NodeExecutionContext) => Promise<any>;
}

// Export the registry so it's accessible to the execution engine
export const nodeExecutorRegistry: Record<string, NodeExecutor> = {};

export const registerNodeExecutor = (nodeType: string, executor: NodeExecutor) => {
  if (nodeExecutorRegistry[nodeType]) {
    console.warn(`Overwriting existing executor for node type: ${nodeType}`);
  }
  console.log(`Registering executor for node type: ${nodeType}`);
  nodeExecutorRegistry[nodeType] = executor;
};

export const getRegisteredNodeTypes = () => {
  return Object.keys(nodeExecutorRegistry);
};