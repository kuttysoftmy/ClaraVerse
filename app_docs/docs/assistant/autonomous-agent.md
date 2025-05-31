---
id: autonomous-agent
title: Autonomous Agent Capabilities
sidebar_label: Autonomous Agent
slug: /assistant/autonomous-agent
---

Beyond simple question-answering, Clara can operate as an **Autonomous Agent**, tackling complex goals by planning, executing steps, using tools, and even attempting self-correction. This feature allows Clara to handle more sophisticated tasks that might require multiple interactions or access to external information.

## What is an Autonomous Agent?

When Clara's autonomous agent capabilities are enabled, it can:

*   **Deconstruct Goals:** Break down a complex user request into smaller, manageable steps.
*   **Plan Execution:** Decide on a sequence of actions to achieve the goal.
*   **Utilize Tools:** Dynamically choose and use available [MCP Tools](./mcp-tools.md) to gather information or perform actions.
*   **Track Progress:** Monitor its own progress towards the goal.
*   **Self-Correct:** If a step fails or an approach isn't working, the agent might try to re-plan or use a different tool.
*   **Learn from Errors (Potentially):** Some configurations might allow the agent to learn from previous errors to improve future attempts.

This mode transforms Clara from a reactive assistant into a proactive problem-solver.

## Enabling the Autonomous Agent

The autonomous agent features are typically configured within the **[Advanced Options](./advanced-options.md)** panel of the Clara Assistant.

1.  **Navigate to Advanced Options:** Open the advanced settings panel from the chat input area.
2.  **Enable Autonomous Mode:**
    *   Look for a toggle or checkbox labeled "Autonomous Agent Enabled," "Enable Autonomous Mode," or similar.
    *   **Important:** Autonomous agent capabilities usually require **"Enable Tools" / "Tools Mode"** to be active and **"Streaming Mode"** to be disabled. The interface might enforce this automatically.
    `[Screenshot: Autonomous Agent 'enabled' toggle in Advanced Options]`

## Key Configuration Settings

Once enabled, you can often fine-tune the agent's behavior with several parameters:

*   **Max Retries:**
    *   The maximum number of times the agent will retry a failed step or a particular approach before giving up.
*   **Retry Delay:**
    *   The time (in milliseconds or seconds) the agent will wait before attempting a retry.
*   **Enable Self-Correction:**
    *   Allows the agent to analyze failures and try to modify its plan or parameters to overcome obstacles.
*   **Enable Tool Guidance:**
    *   The agent might receive or infer guidance on which tools are best suited for certain sub-tasks.
*   **Enable Progress Tracking:**
    *   The agent (and potentially the UI) will provide updates on the current task or step being performed.
*   **Max Tool Calls:**
    *   The maximum number of times the agent can call tools (in total or per step) while working on a single goal. This prevents infinite loops or excessive tool usage.
*   **Confidence Threshold:**
    *   A value (e.g., 0.0 to 1.0) indicating how confident the agent needs to be in its chosen action or tool before proceeding.
*   **Enable Chain of Thought:**
    *   Allows the agent to "think step-by-step" or verbalize its reasoning process, which can improve performance on complex tasks and provide transparency.
*   **Enable Error Learning:**
    *   If enabled, the agent might store information about failed tool calls or strategies to avoid repeating mistakes for similar tasks in the future.

`[Screenshot: Detailed Autonomous Agent configuration parameters in Advanced Options]`

## How to Use the Autonomous Agent

1.  **Ensure it's Enabled:** Verify the settings in Advanced Options.
2.  **Provide a Clear, Actionable Goal:** Instead of simple questions, give Clara a task that might require multiple steps. Examples:
    *   "Research the current trends in renewable energy, summarize the key findings, and list three promising companies in the sector."
    *   "Plan a three-day trip to Paris, including finding potential flights from New York, suggesting three mid-range hotels, and listing five must-see attractions."
    *   "Read the attached document, extract all email addresses, and then draft a follow-up email to each asking for feedback on the document."
3.  **Observe and Monitor:**
    *   Clara might indicate that it's operating in autonomous mode.
    *   You may see progress updates, indications of tool usage, or "thoughts" if Chain of Thought is enabled.
4.  **Be Patient:** Autonomous tasks can take longer than simple responses as Clara plans and executes multiple steps.
5.  **Review the Output:** Once Clara completes the task (or gives up), review the results.

## Considerations and Best Practices

*   **Complexity vs. Performance:** Very complex goals might be challenging even for an autonomous agent. Start with moderately complex tasks.
*   **Tool Availability:** The agent's effectiveness heavily depends on the availability and reliability of relevant [MCP Tools](./mcp-tools.md).
*   **Clarity of Instructions:** The clearer and more specific your goal, the better the agent can plan and execute.
*   **Iterative Refinement:** If a task doesn't succeed, try rephrasing the goal, breaking it down further, or adjusting the autonomous agent parameters.
*   **Resource Usage:** Autonomous operations, especially those involving multiple tool calls or complex planning, can be more resource-intensive.

Clara's autonomous agent capabilities represent a significant step towards more intelligent and independent task handling. By understanding and configuring these features, you can delegate more complex workflows to your AI assistant.
