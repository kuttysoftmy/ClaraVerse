---
id: advanced-options
title: Advanced AI Configuration
sidebar_label: Advanced Options
slug: /assistant/advanced-options
---

Clara Assistant provides a suite of advanced options that allow you to fine-tune the AI's behavior, manage its capabilities, and optimize its performance for specific tasks. These settings are typically found in an "Advanced Options" panel, often accessible from the chat input area.

`[Screenshot: Advanced Options panel in Clara Assistant]`

## Accessing Advanced Options

Look for a settings icon (often a cogwheel or sliders) or a button labeled "Advanced" or "Options" near the chat input field. Clicking this will usually toggle the visibility of the advanced configuration panel.

## Key Configuration Areas

The advanced options are generally grouped into several categories:

### 1. AI Model Selection

While primary model management might be in the Model Manager (see [Providers & Models](./providers-models.md)), the Advanced Options panel often provides quick access to select the specific models to be used for the current session or provider.

*   **Text Model:** The primary model for generating text-based responses.
*   **Vision Model:** A multimodal model used when you need Clara to process or understand images. This model is activated when image attachments are present or if `Enable Vision` is toggled.
*   **Code Model:** A model specialized for generating and understanding programming code. This might be automatically selected if Clara detects you're asking for code, or you can choose it explicitly.

`[Screenshot: Model selection dropdowns (text, vision, code) in Advanced Options]`

### 2. AI Parameters

These settings directly influence how the AI generates responses:

*   **Temperature:**
    *   Controls the randomness of the AI's output.
    *   Higher values (e.g., 0.8 - 1.0) result in more creative, diverse, and sometimes less predictable responses.
    *   Lower values (e.g., 0.2 - 0.5) make the output more focused, deterministic, and conservative.
    *   Default is often around 0.7.
*   **Max Tokens (Max Output Length):**
    *   Sets the maximum number of tokens (words or parts of words) the AI can generate in a single response.
    *   Helps control response length and prevent overly verbose outputs.
*   **Top-P (Nucleus Sampling):**
    *   An alternative to temperature for controlling randomness. It considers only the smallest set of most probable tokens whose cumulative probability exceeds `P`.
    *   A value of `1.0` means all tokens are considered. A lower value (e.g., `0.9`) restricts the choices, leading to less random output.
*   **Top-K:**
    *   Restricts the AI to choosing from the `K` most probable next tokens.
    *   A higher `K` allows for more diversity.

`[Screenshot: AI parameter sliders/inputs (Temperature, Max Tokens, Top-P, Top-K)]`

### 3. AI Features

Toggle various AI capabilities on or off:

*   **Enable Tools (or "Tools Mode"):**
    *   When enabled, Clara can use external tools and capabilities defined via the Multi-Capability Provider (MCP). See [MCP & Tools](./mcp-tools.md).
    *   This allows Clara to perform actions, access live data, or interact with other services.
    *   When disabled, Clara operates more like a standard chatbot, relying only on its internal knowledge.
*   **Enable RAG (Retrieval Augmented Generation):**
    *   Allows Clara to access and incorporate information from a knowledge base or a set of documents you provide, leading to more informed and contextually relevant answers.
    *   (The documentation should ideally point to where users manage the RAG document sources if applicable).
*   **Enable Streaming:**
    *   When enabled, Clara sends back its response token by token, allowing you to see the text appear progressively. This generally provides a smoother user experience for text generation.
    *   **Important:** Enabling streaming mode often automatically disables `Enable Tools` and `Autonomous Agent` features to ensure uninterrupted streaming.
*   **Enable Vision:**
    *   Allows Clara to process and understand images attached to your messages. Requires a capable Vision Model to be selected.
*   **Auto Model Selection:**
    *   If enabled, Clara might try to automatically choose the best model (text, vision, or code) based on your prompt or attachments.
*   **Enable MCP (Multi-Capability Provider):**
    *   Globally enables or disables Clara's ability to use the MCP framework for tool access. This is often linked with `Enable Tools`.

`[Screenshot: Feature toggles (Enable Tools, RAG, Streaming, Vision, etc.)]`

### 4. Context Window

*   **Context Window (Message History):**
    *   Determines how many previous messages from the current conversation are sent back to the AI with your new prompt.
    *   A larger context window helps the AI maintain conversation flow and remember earlier parts of the discussion but can consume more resources and potentially increase processing time.
    *   A common default is around 50 messages.

### 5. System Prompt (Advanced)

*   Some interfaces might allow you to define a **System Prompt**. This is a high-level instruction given to the AI that sets its persona, role, or overall behavior for the conversation (e.g., "You are a helpful assistant that speaks like a pirate," or "You are an expert Python programmer. Only provide code solutions.").
*   This is a powerful feature for customizing AI interactions. If not directly in Advanced Options, it might be in session settings or general settings.

`[Screenshot: System Prompt input field, if available in Advanced Options]`

## Autonomous Agent Configuration

If Clara has autonomous capabilities, these settings will also be in the Advanced Options or a dedicated section. These are covered in detail in the **[Autonomous Agent](./autonomous-agent.md)** section.

## Saving Configurations

*   Changes made in the Advanced Options panel are usually applied to the current session.
*   Clara often saves these configurations on a per-provider basis. So, if you switch to a different AI provider, the settings might change to what you last used for that provider.
*   Some settings might be global, while others are session-specific or provider-specific.

Experimenting with these advanced options can significantly tailor Clara's performance and capabilities to your specific needs. Always start with small adjustments and observe the impact on Clara's responses.
