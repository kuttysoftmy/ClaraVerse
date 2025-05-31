---
id: getting-started
title: 🚀 Getting Started with Clara
sidebar_label: Getting Started
slug: /
---

Welcome to Clara, your versatile AI assistant designed to run locally on your machine, integrate with various AI providers, and extend its capabilities through custom apps and desktop widgets. This guide will walk you through the initial setup and basic usage of Clara.

## 1. First Launch and Initial Setup

When you first launch Clara, you might be greeted by the main interface. Before you can start chatting, you'll need to configure an AI provider and ensure you have the necessary AI models.

### Checking AI Providers and Models

Clara needs to connect to an AI service (a "provider") and use specific AI models to understand and generate responses.

1.  **Navigate to Settings:**
    *   Look for a **Settings** icon or menu item, usually accessible from the main sidebar or a top bar.
    *   If you see a "No Models Available" pop-up, this will often have a button to take you directly to the Model Manager in Settings.
    `[Screenshot: Settings icon or 'No Models Available' pop-up]`

2.  **Access Model Manager:**
    *   Within Settings, find the **Model Manager** section. This is where you'll configure AI providers and download/manage your models.
    `[Screenshot: Model Manager interface]`

3.  **Configure a Provider:**
    *   Clara can work with different providers. A common local provider is **Ollama**.
    *   If you're using Ollama, you'll typically need to:
        *   Ensure Ollama is installed and running on your system. You can download it from [https://ollama.com/](https://ollama.com/).
        *   Add or select the Ollama provider in Clara's Model Manager and provide its API URL (usually `http://localhost:11434` by default).
    *   Other providers might require API keys or different setup steps.
    `[Screenshot: Provider configuration in Model Manager, e.g., adding Ollama URL]`

4.  **Download/Select AI Models:**
    *   Once a provider is configured, you'll see a list of available models or be able to download new ones.
    *   Models are often specialized (e.g., for general chat, code generation, vision capabilities).
    *   You'll typically need to select or download models for:
        *   **Text Generation:** For standard chat.
        *   **Vision:** If you want to use multimodal features (e.g., ask questions about images).
        *   **Code Generation:** If you need Clara to help with programming tasks.
    *   Ensure you have at least one text generation model selected to start chatting.
    `[Screenshot: Model list in Model Manager, showing download/selection options]`

5.  **Return to Clara Assistant:**
    *   Once your provider is set up and models are selected/downloaded, navigate back to the main Clara Assistant chat interface.

## 2. Your First Conversation

With the setup complete, you're ready to start chatting!

1.  **The Chat Interface:**
    *   You'll see a chat input field at the bottom and a chat window where the conversation appears.
    `[Screenshot: Clara Assistant main chat interface]`

2.  **Send a Message:**
    *   Type a message into the input field (e.g., "Hello, Clara!").
    *   Press Enter or click the send button.

3.  **Receive a Response:**
    *   Clara will process your message using the configured AI model and provider, and you'll see its response in the chat window.

4.  **Chat Sessions:**
    *   Each conversation you have is typically stored as a "session."
    *   You can usually find a list of your recent sessions in a sidebar, allowing you to switch between conversations or start new ones. The current session might be automatically named based on your first message.
    `[Screenshot: Chat session list in the sidebar]`

## What's Next?

You've successfully set up Clara and had your first conversation! From here, you can explore:

*   **[Clara Assistant Overview](./assistant/overview.md):** Learn more about the chat interface and its features.
*   **[Desktop Widgets](./widgets/adding-widgets.md):** Customize your workspace with helpful widgets.
*   **[App Creator (Agents)](./app-creator/introduction.md):** Build your own custom AI-powered apps and workflows.

Happy chatting!
