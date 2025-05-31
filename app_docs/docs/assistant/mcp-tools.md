---
id: mcp-tools
title: MCP & External Tools
sidebar_label: MCP & Tools
slug: /assistant/mcp-tools
---

Clara can extend its capabilities beyond standard AI responses by using **external tools** and services. This is made possible through the **Multi-Capability Provider (MCP)** framework. Understanding MCP allows you to leverage Clara for tasks like accessing live data, interacting with other applications, or performing specialized actions.

## What is MCP (Multi-Capability Provider)?

MCP is a system within Clara that acts as a bridge between the AI and various "tool servers" or "resource providers." These servers expose specific functionalities (tools) that Clara's AI can learn to use.

*   **Tool Servers:** These are services (potentially running locally or remotely) that offer one or more tools. For example, a GitHub tool server might offer tools to "create an issue," "fetch repository details," etc.
*   **Tools:** Specific functions or actions that Clara can invoke. Each tool typically has a defined input and output.
*   **Auto-Discovery:** MCP might be able to automatically discover available tools from configured servers.

## Enabling Tool Usage

To allow Clara to use tools:

1.  **Enable MCP:** In the **[Advanced Options](./advanced-options.md)**, ensure that "Enable MCP" (or a similar global toggle for the MCP framework) is turned on.
2.  **Enable Tools Mode:** Also in Advanced Options, make sure "Enable Tools" (or "Tools Mode") is active.
    *   **Note:** Enabling "Streaming Mode" will typically disable tool usage. You need to be in a non-streaming or "tools-enabled" mode.

`[Screenshot: Advanced Options highlighting 'Enable MCP' and 'Enable Tools']`

## How Clara Uses Tools

When tool usage is enabled and Clara determines that a user's request can be best addressed by an external tool, the following generally happens:

1.  **Intent Recognition:** Clara's AI analyzes your prompt to understand if a tool is needed.
2.  **Tool Selection:** If a tool is deemed necessary, the AI selects the most appropriate tool from the available MCP resources. This might involve considering the tool's description and capabilities.
3.  **Parameter Extraction:** The AI extracts the necessary information (parameters) from your prompt to feed into the selected tool.
4.  **Tool Execution:** Clara, through MCP, calls the selected tool with the extracted parameters.
5.  **Response Integration:** Clara receives the output from the tool and integrates this information into its response to you.

For example, if you ask, "What's the weather in London?", Clara might:
*   Recognize the need for a weather tool.
*   Select a "get_weather" tool.
*   Extract "London" as the location parameter.
*   Call the tool, get the weather data.
*   Formulate a response like, "The current weather in London is..."

## Configuring MCP

Advanced configuration for MCP might be available, potentially in a dedicated section within Settings or within the Advanced Options panel itself. This could include:

*   **Managing Tool Servers:** Adding, removing, or enabling/disabling specific tool servers that Clara can connect to.
*   **Enabled Servers:** A list of tool servers that are currently active for MCP.
*   **Auto-Discover Tools:** A toggle to allow Clara to automatically find and register tools from active servers.
*   **Max Tool Calls:** A limit on how many tools Clara can call in a single turn or for a single task, to prevent loops or excessive usage.

`[Screenshot: MCP configuration interface, if available, showing server list or tool discovery options]`

## Autonomous Agent and Tools

Tool usage is a fundamental part of Clara's **[Autonomous Agent](./autonomous-agent.md)** capabilities. When operating autonomously, Clara can decide to use one or more tools in sequence to achieve a complex goal you've set.

## For Developers: Creating Custom Tools

(This section might be brief or point to more detailed developer documentation if it exists elsewhere.)

If you are a developer, you might be able to create your own tool servers and integrate them with Clara's MCP. This typically involves:

*   Developing a service that exposes functions as tools.
*   Adhering to a specific API contract or schema that MCP understands so Clara can discover and use your tools.

## Troubleshooting Tool Usage

*   **Tool Not Working:**
    *   Ensure "Enable MCP" and "Enable Tools" are active and "Streaming Mode" is off.
    *   Verify that the relevant tool server is running and accessible to Clara.
    *   Check if the specific tool is enabled or if there are any restrictions in the MCP configuration.
*   **Clara Doesn't Use a Tool When Expected:**
    *   The AI might not have understood the intent clearly enough to select a tool. Try rephrasing your prompt.
    *   The tool might not be described well enough for the AI to recognize its utility.
    *   The AI might have a higher confidence in answering without a tool.

The MCP framework and external tools significantly expand what Clara can do. As you become more familiar with Clara, you'll discover more ways to leverage these powerful features.
