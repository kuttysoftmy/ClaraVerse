---
id: configuring-widgets
title: Configuring Specific Widgets
sidebar_label: Configuring Widgets
slug: /widgets/configuring-widgets
---

Several widgets in Clara require specific configuration to function correctly. When you select one of these widgets from the "Add Widget" modal, a configuration form will typically appear, allowing you to provide the necessary details.

`[Screenshot: Add Widget modal showing a configuration form for a selected widget]`

Below are common configurable widgets and their typical settings:

## 1. Quick Chat Widget

The Quick Chat widget allows you to have direct, quick conversations with an AI model (often via Ollama) without going into the full Clara Assistant interface.

`[Screenshot: Quick Chat widget preview or configuration section in modal]`

**Configuration Options:**

*   **Widget Name:**
    *   A display name for this Quick Chat widget instance (e.g., "My Llama3 Chat," "Code Helper Quick Chat").
*   **Ollama API URL (or Provider URL):**
    *   The URL of your Ollama API endpoint (e.g., `http://localhost:11434`).
    *   Ensure your Ollama service is running and accessible at this URL.
*   **Model:**
    *   Select the specific AI model you want this widget to use from the list of models available at the specified Ollama URL.
    *   The widget may attempt to fetch available models once you provide a valid URL.
*   **System Prompt (Optional):**
    *   A custom instruction that sets the behavior or persona of the AI for this widget. This prompt is sent to the AI behind the scenes.
    *   Example: "You are a helpful assistant that specializes in Python programming."
*   **Pre-Prompt (Optional):**
    *   Text that will be automatically prepended to every message you send through this widget.
    *   Example: "Provide a concise answer to the following: "

**To use:** After configuring and adding the widget, you can type messages directly into it and receive AI responses.

## 2. Custom Webhook Widget

The Custom Webhook widget displays data fetched from an external API or URL that returns JSON data.

`[Screenshot: Webhook widget preview or configuration section in modal]`

**Configuration Options:**

*   **Display Name:**
    *   A name for this widget instance (e.g., "Server Status," "Latest News Headlines").
*   **Webhook URL:**
    *   The full URL that Clara should query to get the data.
    *   This URL must return data in JSON format.
    *   The widget will periodically fetch data from this URL and display it. The exact display format might vary (e.g., raw JSON, a formatted table, or key-value pairs).

**To use:** Once configured, the widget will attempt to fetch and display data from the provided URL. It might have a refresh interval or a manual refresh button.

## 3. Email Inbox Widget

The Email Inbox widget provides a quick glance at your recent emails by connecting to an email API endpoint.

`[Screenshot: Email widget preview or configuration section in modal]`

**Configuration Options:**

*   **Widget Name:**
    *   A display name for this email widget (e.g., "My Work Inbox").
*   **Email API Endpoint:**
    *   The URL of an API that returns your email data in a structured JSON format.
    *   **Note:** This is not your direct email login. It requires a specific API that you or your email provider makes available for this purpose. Setting up such an API is outside the scope of Clara itself.
*   **Auto-Refresh Interval (minutes):**
    *   How often the widget should automatically fetch new email data (e.g., every 1, 5, 15 minutes).

**To use:** After correct configuration with a valid email API, the widget will display a summary of your recent emails.

## 4. App Widgets (from "Apps & Agents")

When you add an "App" from the "Apps & Agents" category (which you built using the **[App Creator](../app-creator/introduction.md)**), it generally doesn't require further configuration in the "Add Widget" modal itself.

*   The configuration for an App Widget is defined when you build the app in the App Creator (e.g., what prompts an LLM node uses, which APIs an API Call node targets).
*   Adding an App Widget simply makes that pre-built functionality available on your dashboard.

## Editing Widget Configurations

If you need to change the settings for a widget after you've added it:

*   Some widgets might have a settings icon (often a cogwheel) directly on them.
*   Alternatively, right-clicking on a widget might bring up a context menu with an "Edit Settings" or "Configure" option.
*   This will typically re-open the configuration form for that widget instance.

`[Screenshot: A widget on the dashboard with a settings icon or context menu option]`

By configuring these widgets, you can tailor your Clara dashboard to display relevant information and provide quick access to the tools and AI interactions you use most frequently.
