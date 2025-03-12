#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define base paths
const REPO_ROOT = path.resolve(__dirname, '..');
const NODES_DIR = path.join(REPO_ROOT, 'src/components/appcreator_components/nodes');
const EXECUTORS_DIR = path.join(REPO_ROOT, 'src/nodeExecutors');
const CONFIG_PATH = path.join(REPO_ROOT, 'node-cli-config.json');

// Setup CLI commands
const program = new Command();
program
  .version('1.0.0')
  .description('CLI tool for managing Clara-Ollama nodes');

program
  .command('create')
  .description('Create a new node')
  .option('-i, --interactive', 'Run in interactive mode')
  .option('-t, --type <type>', 'Node type (input, process, output, function)')
  .option('-n, --name <name>', 'Node name')
  .option('--inputs <inputs>', 'Comma-separated list of input types')
  .option('--outputs <outputs>', 'Comma-separated list of output types')
  .option('--icon <icon>', 'Icon name from Lucide icons')
  .option('--color <color>', 'Node color (hex)')
  .action(createNode);

program
  .command('delete <nodeName>')
  .description('Delete a custom node')
  .action(deleteNode);

program
  .command('list')
  .description('List all custom nodes')
  .action(listNodes);

// Initialize the config file if it doesn't exist
function initConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ customNodes: [] }, null, 2));
    console.log(chalk.green('✓ Initialized node configuration file'));
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

// Utility to convert name to camelCase and PascalCase
function formatNames(name) {
  // Remove spaces and special characters, keep only alphanumeric
  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '');
  
  // Convert to camelCase for node ID
  const camelCase = cleanName
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase())
    .replace(/\s+/g, '');
  
  // Convert to PascalCase for component name
  const pascalCase = cleanName
    .replace(/(?:^\w|\s+\w)/g, match => match.trim().toUpperCase())
    .replace(/\s+/g, '');
  
  return {
    camelCase: camelCase + 'Node',  // Append 'Node'
    pascalCase: pascalCase + 'Node' // Append 'Node'
  };
}

// Generate node component template
function generateNodeComponentTemplate(options) {
  return `
import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '../../../hooks/useTheme';
import { ${options.icon} } from 'lucide-react';

const ${options.componentName} = ({ data, isConnectable }: any) => {
  const { isDark } = useTheme();
  const [value, setValue] = useState(data.config?.value || '');
  
  // Update config when value changes
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (!data.config) data.config = {};
    data.config.value = e.target.value;
  };
  
  // Use capture phase to stop events at the earliest possible point
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };
  
  return (
    <div 
      className={\`p-3 rounded-lg border \${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-md w-64\`}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg" style={{ background: '${options.color}' }}>
          <${options.icon} className="w-5 h-5 text-white" />
        </div>
        <div className="font-medium text-sm">
          {data.label || '${options.displayName}'}
        </div>
      </div>
      
      <div className="mb-2">
        <label className={\`block text-xs mb-1 \${isDark ? 'text-gray-300' : 'text-gray-600'}\`}>
          Value
        </label>
        <input 
          type="text"
          value={value}
          onChange={handleValueChange}
          onClick={stopPropagation}
          onMouseDown={stopPropagation}
          placeholder="Enter value..."
          className={\`w-full p-2 rounded border \${
            isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
          } text-sm\`}
        />
      </div>
      
      ${generateHandles(options)}
    </div>
  );
};

export default ${options.componentName};
`;
}

// Generate handles based on inputs and outputs
function generateHandles(options) {
  let handleCode = "";
  
  // Add input handles
  if (options.inputs && options.inputs.length > 0) {
    if (options.inputs.length === 1) {
      handleCode += `
      <Handle
        type="target"
        position={Position.Top}
        id="${options.inputs[0]}-in"
        isConnectable={isConnectable}
        className="!bg-blue-500 !w-3 !h-3"
        style={{ top: -6 }}
      />`;
    } else {
      options.inputs.forEach((input, index) => {
        const leftPos = (index + 1) / (options.inputs.length + 1);
        handleCode += `
      <Handle
        type="target"
        position={Position.Top}
        id="${input}-in"
        isConnectable={isConnectable}
        className="!bg-blue-500 !w-3 !h-3"
        style={{ top: -6, left: '${leftPos * 100}%' }}
      />`;
      });
    }
  }
  
  // Add output handles
  if (options.outputs && options.outputs.length > 0) {
    if (options.outputs.length === 1) {
      handleCode += `
      <Handle
        type="source"
        position={Position.Bottom}
        id="${options.outputs[0]}-out"
        isConnectable={isConnectable}
        className="!bg-green-500 !w-3 !h-3"
        style={{ bottom: -6 }}
      />`;
    } else {
      options.outputs.forEach((output, index) => {
        const leftPos = (index + 1) / (options.outputs.length + 1);
        handleCode += `
      <Handle
        type="source"
        position={Position.Bottom}
        id="${output}-out"
        isConnectable={isConnectable}
        className="!bg-green-500 !w-3 !h-3"
        style={{ bottom: -6, left: '${leftPos * 100}%' }}
      />`;
      });
    }
  }
  
  return handleCode;
}

// Generate node executor template
function generateNodeExecutorTemplate(options) {
  return `
import { registerNodeExecutor, NodeExecutionContext } from './NodeExecutorRegistry';

const execute${options.executorName} = async (context: NodeExecutionContext) => {
  const { node, inputs, updateNodeOutput } = context;
  
  // Get the input from the first available input type
  const inputKeys = Object.keys(inputs);
  const input = inputKeys.length > 0 ? inputs[inputKeys[0]] : '';
  
  // Process the input with the node's configuration
  const config = node.data.config || {};
  const value = config.value || '';
  
  // Example processing logic - modify this for your node's behavior
  const output = \`\${input} \${value}\`.trim();
  
  if (updateNodeOutput) {
    updateNodeOutput(node.id, output);
  }
  
  return output;
};

registerNodeExecutor('${options.nodeId}', {
  execute: execute${options.executorName}
});
`;
}

// Update node registry function to handle file existence
function updateNodeRegistry(componentName, nodeId) {
  const registryPath = path.join(NODES_DIR, 'NodeRegistry.tsx');
  
  if (!fs.existsSync(registryPath)) {
    console.error(chalk.red(`Error: Node registry file not found at ${registryPath}`));
    process.exit(1);
  }
  
  let content = fs.readFileSync(registryPath, 'utf-8');
  
  // Check for duplicate imports to prevent issues
  const duplicateImportRegex = new RegExp(`import\\s+${componentName}\\s+from\\s+'./${componentName}';`, 'g');
  const duplicateImports = content.match(duplicateImportRegex);
  if (duplicateImports && duplicateImports.length > 0) {
    console.log(chalk.yellow(`Warning: Import for ${componentName} already exists in NodeRegistry.tsx`));
    // Continue anyway as we'll update the node type entry
  }
  
  // Check for duplicate node types
  const duplicateNodeRegex = new RegExp(`\\s*${nodeId}:\\s*${componentName},`, 'g');
  const duplicateNodes = content.match(duplicateNodeRegex);
  if (duplicateNodes && duplicateNodes.length > 0) {
    console.log(chalk.yellow(`Warning: Node type ${nodeId} already exists in NodeRegistry.tsx`));
    // Continue anyway as we'll update the entry
  }
  
  // Add import statement after the last import
  const importRegex = /import.*?from.*?;/g;
  const imports = content.match(importRegex) || [];
  const lastImport = imports[imports.length - 1];
  const importStatement = `import ${componentName} from './${componentName}';`;
  
  content = content.replace(lastImport, `${lastImport}\n${importStatement}`);
  
  // Add to NODE_TYPES object before the last closing brace
  const nodeTypesRegex = /const NODE_TYPES = {[\s\S]*?};/;
  const nodeTypesMatch = content.match(nodeTypesRegex);
  
  if (!nodeTypesMatch) {
    console.error(chalk.red('Error: Could not find NODE_TYPES object in NodeRegistry.tsx'));
    process.exit(1);
  }
  
  const updatedNodeTypes = nodeTypesMatch[0].replace(
    /};/,
    `  ${nodeId}: ${componentName},\n};`
  );
  
  content = content.replace(nodeTypesRegex, updatedNodeTypes);
  
  fs.writeFileSync(registryPath, content);
  console.log(chalk.green(`✓ Updated NodeRegistry.tsx with ${componentName}`));
}

// Create tools config entry for the new node
function addToNodeConfig(options) {
  const config = initConfig();
  
  // Add the new node to the config
  config.customNodes.push({
    id: options.nodeId,
    name: options.displayName,
    file: `src/components/appcreator_components/nodes/${options.componentName}.tsx`,
    executorFile: options.needsExecutor ? 
      `src/nodeExecutors/${options.executorName}.tsx` : undefined,
    type: options.type,
    inputs: options.inputs,
    outputs: options.outputs,
    icon: options.icon,
    color: options.color,
    category: options.category || options.type,
    description: options.description || `Custom ${options.type} node`,
    isCustom: true
  });
  
  // Write updated config
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(chalk.green(`✓ Added node to configuration`));
}

// Get node options via interactive CLI
async function getNodeOptionsInteractive() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Node name:',
      validate: input => input.trim() !== '' || 'Name is required'
    },
    {
      type: 'list',
      name: 'type',
      message: 'Node type:',
      choices: ['input', 'process', 'output', 'function'],
      default: 'process'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Node description:',
      default: (answers) => `Custom ${answers.name} node`
    },
    {
      type: 'checkbox',
      name: 'inputs',
      message: 'Input types:',
      choices: ['text', 'image', 'data'],
      default: ['text'],
      when: (answers) => answers.type !== 'input'
    },
    {
      type: 'checkbox',
      name: 'outputs',
      message: 'Output types:',
      choices: ['text', 'image', 'data'],
      default: ['text'],
      when: (answers) => answers.type !== 'output'
    },
    {
      type: 'input',
      name: 'icon',
      message: 'Icon name (from Lucide icons):',
      default: 'Activity'
    },
    {
      type: 'input',
      name: 'color',
      message: 'Color (hex):',
      default: '#3B82F6'
    }
  ]);
  
  // Format inputs and outputs
  if (answers.inputs) {
    answers.inputs = answers.inputs;
  } else if (answers.type === 'output') {
    answers.inputs = ['text'];
  }
  
  if (answers.outputs) {
    answers.outputs = answers.outputs;
  } else if (answers.type === 'input') {
    answers.outputs = ['text'];
  }
  
  return answers;
}

// Process node creation options
function processNodeOptions(options) {
  const names = formatNames(options.name);
  
  return {
    nodeId: names.camelCase,
    componentName: names.pascalCase,
    displayName: options.name,
    description: options.description,
    type: options.type,
    inputs: options.inputs,
    outputs: options.outputs,
    icon: options.icon,
    color: options.color,
    category: options.type,
    needsExecutor: options.type !== 'input',
    executorName: names.pascalCase.replace('Node', 'Executor')
  };
}

// Create node implementation
async function createNode(cmdOptions) {
  try {
    console.log(chalk.blue('Creating a new custom node...'));
    
    let options;
    
    // Get options either interactively or from command line
    if (cmdOptions.interactive) {
      options = await getNodeOptionsInteractive();
    } else {
      if (!cmdOptions.name) {
        console.error(chalk.red('Error: Node name is required. Use --name or -n option.'));
        process.exit(1);
      }
      
      options = {
        name: cmdOptions.name,
        type: cmdOptions.type || 'process',
        inputs: cmdOptions.inputs ? cmdOptions.inputs.split(',') : ['text'],
        outputs: cmdOptions.outputs ? cmdOptions.outputs.split(',') : ['text'],
        icon: cmdOptions.icon || 'Activity',
        color: cmdOptions.color || '#3B82F6'
      };
    }
    
    // Process the options
    const nodeOptions = processNodeOptions(options);
    
    // Create the node component file
    const componentPath = path.join(NODES_DIR, `${nodeOptions.componentName}.tsx`);
    const componentContent = generateNodeComponentTemplate(nodeOptions);
    fs.writeFileSync(componentPath, componentContent);
    console.log(chalk.green(`✓ Created node component: ${componentPath}`));
    
    // Create the executor if needed
    if (nodeOptions.needsExecutor) {
      const executorPath = path.join(EXECUTORS_DIR, `${nodeOptions.executorName}.tsx`);
      const executorContent = generateNodeExecutorTemplate(nodeOptions);
      fs.writeFileSync(executorPath, executorContent);
      console.log(chalk.green(`✓ Created node executor: ${executorPath}`));
      
      // Also update the executors index file
      updateExecutorsIndex(nodeOptions.executorName);
    }
    
    // Update the node registry
    updateNodeRegistry(nodeOptions.componentName, nodeOptions.nodeId);
    
    // Add to node configuration
    addToNodeConfig(nodeOptions);
    
    console.log(chalk.green.bold(`\n✓ Successfully created node: ${nodeOptions.displayName}`));
    console.log(chalk.blue(`Node ID: ${nodeOptions.nodeId}`));
    console.log(chalk.blue(`Component: ${nodeOptions.componentName}`));
    if (nodeOptions.needsExecutor) {
      console.log(chalk.blue(`Executor: ${nodeOptions.executorName}`));
    }
  } catch (error) {
    console.error(chalk.red(`Failed to create node: ${error.message}`));
    console.error(error);
    process.exit(1);
  }
}

// Add a function to update the executors index file
function updateExecutorsIndex(executorName) {
  const indexPath = path.join(EXECUTORS_DIR, 'index.tsx');
  
  if (!fs.existsSync(indexPath)) {
    console.error(chalk.red(`Error: Executors index file not found at ${indexPath}`));
    return;
  }
  
  let content = fs.readFileSync(indexPath, 'utf-8');
  
  // Check if this executor is already imported
  const importRegex = new RegExp(`import\\s+['"]\\.\\/${executorName}['"];`, 'g');
  if (importRegex.test(content)) {
    console.log(chalk.yellow(`Import for ${executorName} already exists in index.tsx`));
    return;
  }
  
  // Find the last import line
  const importLines = content.match(/import.*?['"].*?['"];/g) || [];
  if (importLines.length > 0) {
    const lastImport = importLines[importLines.length - 1];
    // Add new import after the last one
    content = content.replace(
      lastImport,
      `${lastImport}\nimport './${executorName}';`
    );
    
    fs.writeFileSync(indexPath, content);
    console.log(chalk.green(`✓ Updated nodeExecutors/index.tsx to import ${executorName}`));
  } else {
    console.error(chalk.red(`Could not locate import section in ${indexPath}`));
  }
}

// Enhanced delete node implementation with better file existence checks
function deleteNode(nodeName) {
  try {
    console.log(chalk.blue(`Deleting node: ${nodeName}`));
    
    // Get the node configuration
    const config = initConfig();
    const nodeIndex = config.customNodes.findIndex(node => 
      node.id === nodeName || node.name === nodeName);
    
    if (nodeIndex === -1) {
      console.error(chalk.red(`Node not found: ${nodeName}`));
      process.exit(1);
    }
    
    const node = config.customNodes[nodeIndex];
    
    // Delete the component file
    if (node.file) {
      const componentPath = path.join(REPO_ROOT, node.file);
      if (fs.existsSync(componentPath)) {
        fs.unlinkSync(componentPath);
        console.log(chalk.green(`✓ Deleted component file: ${componentPath}`));
      } else {
        console.log(chalk.yellow(`Warning: Component file ${componentPath} does not exist`));
      }
    }
    
    // Delete the executor file
    if (node.executorFile) {
      const executorPath = path.join(REPO_ROOT, node.executorFile);
      if (fs.existsSync(executorPath)) {
        fs.unlinkSync(executorPath);
        console.log(chalk.green(`✓ Deleted executor file: ${executorPath}`));
        
        // Also update nodeExecutors/index.tsx to remove the import
        const indexPath = path.join(EXECUTORS_DIR, 'index.tsx');
        if (fs.existsSync(indexPath)) {
          const executorFileName = path.basename(node.executorFile, '.tsx');
          let indexContent = fs.readFileSync(indexPath, 'utf-8');
          
          // Look for import statement with this executor (both commented and uncommented)
          const importRegex = new RegExp(`(?:import|\/\/\\s*import)\\s+["']\\.\\/[^"']*${executorFileName}["'];?\\n?`, 'g');
          const updatedContent = indexContent.replace(importRegex, '');
          
          fs.writeFileSync(indexPath, updatedContent);
          console.log(chalk.green(`✓ Updated nodeExecutors/index.tsx to remove import for ${executorFileName}`));
        } else {
          console.log(chalk.yellow(`Warning: Could not find ${indexPath} to update imports`));
        }
      } else {
        console.log(chalk.yellow(`Warning: Executor file ${executorPath} does not exist`));
      }
    }
    
    // Update the node registry to remove the node
    const registryPath = path.join(NODES_DIR, 'NodeRegistry.tsx');
    if (fs.existsSync(registryPath)) {
      let content = fs.readFileSync(registryPath, 'utf-8');
      
      // Get component name from file path
      const componentName = path.basename(node.file, '.tsx');
      
      // Remove the import line (handle both normal and commented imports)
      const importRegex = new RegExp(`(?:import|\/\/\\s*import)\\s+${componentName}\\s+from\\s+'./${componentName}';\\n?`);
      content = content.replace(importRegex, '');
      
      // Remove from NODE_TYPES object (handle both normal and commented entries)
      const nodeTypeRegex = new RegExp(`\\s*(?:\/\/\\s*)?${node.id}:\\s*${componentName},\\n?`);
      content = content.replace(nodeTypeRegex, '');
      
      fs.writeFileSync(registryPath, content);
      console.log(chalk.green(`✓ Updated NodeRegistry.tsx to remove ${node.id}`));
    } else {
      console.log(chalk.yellow(`Warning: NodeRegistry.tsx not found at ${registryPath}`));
    }
    
    // Remove from config
    config.customNodes.splice(nodeIndex, 1);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(chalk.green(`✓ Removed node from configuration`));
    
    console.log(chalk.green.bold(`\n✓ Successfully deleted node: ${nodeName}`));
  } catch (error) {
    console.error(chalk.red(`Failed to delete node: ${error.message}`));
    console.error(error);
    process.exit(1);
  }
}

// List nodes implementation
function listNodes() {
  try {
    const config = initConfig();
    
    if (config.customNodes.length === 0) {
      console.log(chalk.yellow('No custom nodes found.'));
      return;
    }
    
    console.log(chalk.blue.bold('\nCustom Nodes:'));
    console.log(chalk.blue('-------------------'));
    
    config.customNodes.forEach((node, index) => {
      console.log(chalk.green.bold(`${index + 1}. ${node.name}`));
      console.log(chalk.blue(`   ID: ${node.id}`));
      console.log(chalk.blue(`   Type: ${node.type}`));
      console.log(chalk.blue(`   Description: ${node.description}`));
      console.log(chalk.blue(`   Inputs: ${node.inputs.join(', ')}`));
      console.log(chalk.blue(`   Outputs: ${node.outputs.join(', ')}`));
      console.log(chalk.blue(`   Component: ${node.file}`));
      if (node.executorFile) {
        console.log(chalk.blue(`   Executor: ${node.executorFile}`));
      }
      console.log(chalk.blue('-------------------'));
    });
  } catch (error) {
    console.error(chalk.red(`Failed to list nodes: ${error.message}`));
    console.error(error);
    process.exit(1);
  }
}

// Add a new validate command to check node file integrity
program
  .command('validate')
  .description('Validate node configuration and files')
  .action(validateNodes);

// Validate all node files exist
async function validateNodes() {
  try {
    console.log(chalk.blue('Validating node configuration...'));
    
    const config = initConfig();
    let hasErrors = false;
    
    // Check NodeRegistry.tsx exists
    const registryPath = path.join(NODES_DIR, 'NodeRegistry.tsx');
    if (!fs.existsSync(registryPath)) {
      console.error(chalk.red(`Error: Node registry file not found at ${registryPath}`));
      hasErrors = true;
    } else {
      console.log(chalk.green(`✓ Node registry file exists`));
    }
    
    // Check executors/index.tsx exists
    const executorsIndexPath = path.join(EXECUTORS_DIR, 'index.tsx');
    if (!fs.existsSync(executorsIndexPath)) {
      console.error(chalk.red(`Error: Node executors index not found at ${executorsIndexPath}`));
      hasErrors = true;
    } else {
      console.log(chalk.green(`✓ Node executors index exists`));
    }
    
    // Validate each custom node
    if (config.customNodes.length === 0) {
      console.log(chalk.yellow('No custom nodes to validate.'));
    } else {
      console.log(chalk.blue('\nValidating custom nodes:'));
      
      for (const node of config.customNodes) {
        console.log(chalk.blue(`\nChecking node: ${node.name} (${node.id})`));
        
        // Check component file
        if (node.file) {
          const componentPath = path.join(REPO_ROOT, node.file);
          if (!fs.existsSync(componentPath)) {
            console.error(chalk.red(`Error: Component file not found: ${componentPath}`));
            hasErrors = true;
          } else {
            console.log(chalk.green(`✓ Component file exists: ${node.file}`));
          }
        }
        
        // Check executor file
        if (node.executorFile) {
          const executorPath = path.join(REPO_ROOT, node.executorFile);
          if (!fs.existsSync(executorPath)) {
            console.error(chalk.red(`Error: Executor file not found: ${executorPath}`));
            hasErrors = true;
          } else {
            console.log(chalk.green(`✓ Executor file exists: ${node.executorFile}`));
          }
          
          // Check executor is imported in index.tsx
          const executorFileName = path.basename(node.executorFile, '.tsx');
          const indexContent = fs.readFileSync(executorsIndexPath, 'utf-8');
          const importRegex = new RegExp(`import\\s+["']\\.\\/[^"']*${executorFileName}["'];`, 'g');
          
          if (!importRegex.test(indexContent)) {
            console.error(chalk.red(`Error: Executor not imported in index.tsx: ${executorFileName}`));
            hasErrors = true;
          } else {
            console.log(chalk.green(`✓ Executor properly imported in index.tsx`));
          }
        }
        
        // Check if node is registered in NodeRegistry.tsx
        const componentName = path.basename(node.file, '.tsx');
        const registryContent = fs.readFileSync(registryPath, 'utf-8');
        
        const importRegex = new RegExp(`import\\s+${componentName}\\s+from\\s+'./${componentName}';`);
        if (!importRegex.test(registryContent)) {
          console.error(chalk.red(`Error: Node not imported in registry: ${componentName}`));
          hasErrors = true;
        } else {
          console.log(chalk.green(`✓ Node imported in registry`));
        }
        
        const nodeTypeRegex = new RegExp(`\\s*${node.id}:\\s*${componentName},`);
        if (!nodeTypeRegex.test(registryContent)) {
          console.error(chalk.red(`Error: Node not registered in NODE_TYPES: ${node.id}`));
          hasErrors = true;
        } else {
          console.log(chalk.green(`✓ Node registered in NODE_TYPES`));
        }
      }
    }
    
    if (hasErrors) {
      console.log(chalk.red.bold('\n✗ Validation found issues that need to be fixed'));
    } else {
      console.log(chalk.green.bold('\n✓ All nodes validation passed successfully'));
    }
  } catch (error) {
    console.error(chalk.red(`Failed to validate nodes: ${error.message}`));
    console.error(error);
    process.exit(1);
  }
}

program.parse(process.argv);
