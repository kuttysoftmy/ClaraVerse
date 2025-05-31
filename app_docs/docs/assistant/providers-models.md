---
id: providers-models
title: Configuring AI Providers & Models
sidebar_label: Providers & Models
slug: /assistant/providers-models
---

Clara's intelligence comes from underlying AI models, which are accessed through "AI Providers." Properly configuring these is key to using Clara effectively. This guide explains how to manage providers and models.

## Understanding Providers and Models

*   **AI Providers:** These are the services or platforms that host and run AI models. Clara acts as a client to these providers. Examples include:
    *   **Ollama:** For running models locally on your machine.
    *   **Clara's Pocket:** A built-in, native LLM service for easy local use.
    *   **(Potentially) External API Services:** Connections to commercial or private AI model APIs.
*   **AI Models:** These are the specific "brains" that perform tasks like generating text, understanding images, or writing code. Each provider offers a range of models with different capabilities, sizes, and specializations.

You need to configure at least one provider and select/download appropriate models to use Clara Assistant.

## Accessing the Model Manager

Provider and model configuration is typically done in the **Model Manager** section of Clara's **Settings**.

1.  Click on the **Settings** icon (usually in the main sidebar).
2.  Navigate to the **Model Manager** or a similarly named section (e.g., "AI/Model Settings," "Providers").

`[Screenshot: Navigating to Model Manager within Settings]`

## Managing AI Providers

The Model Manager will list available and configured AI providers.

### Adding a New Provider (e.g., Ollama)

If you're using a local service like Ollama:

1.  **Ensure the Provider Service is Running:**
    *   For Ollama, make sure the Ollama application is installed and running on your computer. You can download it from [https://ollama.com/](https://ollama.com/).
2.  **Add Provider in Clara:**
    *   In Clara's Model Manager, look for an "Add Provider" or similar button.
    *   Select the provider type (e.g., "Ollama").
    *   You'll likely need to provide:
        *   **Name:** A descriptive name for this provider setup (e.g., "My Local Ollama").
        *   **API URL / Endpoint:** For Ollama, this is usually `http://localhost:11434` by default.
    *   Save the provider configuration.
    `[Screenshot: Adding a new Ollama provider with URL input]`

### Clara's Pocket LLM Service

*   Clara may include a built-in "Clara's Pocket" LLM service. If you select this provider, Clara might attempt to start its native LLM service automatically.
*   This option simplifies local AI usage as it doesn't require a separate Ollama installation.

### Switching Between Providers

*   If you have multiple providers configured, you can usually select which one Clara Assistant should use.
*   Clara may perform a health check when you switch to a provider to ensure it's accessible.
*   Configuration settings (like selected models, parameters) are often saved per-provider. So, when you switch, Clara will try to load your last used settings for that specific provider.

## Managing AI Models

Once a provider is selected and active, you can manage the AI models associated with it.

1.  **Listing Available Models:**
    *   The Model Manager should display a list of models available from the currently active provider.
    *   For services like Ollama, this list reflects the models you have already pulled/downloaded through Ollama.
    `[Screenshot: List of available/downloaded models for a provider]`

2.  **Downloading New Models (e.g., for Ollama):**
    *   If you're using Ollama and need a new model, you typically download it directly through Ollama's command-line interface (e.g., `ollama pull llama3`).
    *   After downloading, you might need to **refresh** the model list in Clara's Model Manager for the new model to appear.
    *   Some providers might allow downloading models directly through Clara's interface.

3.  **Selecting Models for Use:**
    *   Clara Assistant often uses different models for different tasks. You might need to select models for:
        *   **Text Model:** Used for general chat, text generation, and when specific code or vision models aren't selected or applicable.
        *   **Vision Model:** A multimodal model capable of processing images along with text. Required for features like describing an image or answering questions about it.
        *   **Code Model:** A model specialized in understanding and generating programming code.
    *   These selections are usually made within the **Advanced Options** panel of the Clara Assistant input area, or sometimes within the Model Manager itself.
    `[Screenshot: Model selection dropdowns in Advanced Options or Model Manager]`

4.  **"No Models Available" Modal:**
    *   If Clara detects that no models are available or selected for the current provider, it may display a pop-up prompting you to go to the Model Manager to configure them.
    `[Screenshot: 'No Models Available' modal]`

## Provider and Model Configuration Persistence

*   Clara typically saves your configuration for each provider (selected models, parameters).
*   When you switch between providers, Clara attempts to load the last known configuration for the newly selected provider.
*   If a saved model is no longer available from a provider, Clara will try to select a default or clear the invalid selection.

## Troubleshooting

*   **Provider Connection Failed:**
    *   Ensure the provider service (like Ollama) is running on your machine.
    *   Verify the API URL is correct in Clara's provider settings.
    *   Check your firewall or network settings if the provider is on a different machine or in a container.
*   **Models Not Appearing:**
    *   For Ollama, ensure you've pulled the models using the Ollama CLI.
    *   Try refreshing the model list in Clara's Model Manager.
*   **Health Check Fails:**
    *   Indicates Clara can't communicate with the provider. Double-check the provider service and URL.

Properly configuring your AI providers and models is the first step to unlocking Clara's full potential. Refer to the documentation for your specific AI provider (like Ollama) for more details on managing their services and models.
