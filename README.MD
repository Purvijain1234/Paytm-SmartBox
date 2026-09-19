<div align="center">

# SmartBox

### Your Paytm Soundbox, now with an AI teammate.

**A voice-first AI teammate for Paytm merchants that understands requests, remembers business context, automates repetitive work, and executes approved actions.**

[Demo Video](ADD_LINK) · [Live Prototype](ADD_LINK) · [Presentation](ADD_LINK)

</div>

---

## Problem

Merchants generate valuable business data every day, but accessing and acting on it often requires switching between dashboards, spreadsheets, and messaging tools.

A traditional Soundbox announces payments. SmartBox turns that interaction into a conversational business assistant.

---

## Solution

A merchant can simply speak:

> "Aaj ki sale kitni hui?"

> "Roz raat 9 baje mujhe sales report bhejna."

> "Mere regular customers ko monthly offer bhejo."

SmartBox understands the request and routes it to the right workflow.

| Capability | Purpose | Example |
|---|---|---|
| **ASK** | Answer business questions | "Aaj ki sale kitni hui?" |
| **AUTOMATE** | Create recurring workflows | "Roz raat 9 baje sales report bhejna." |
| **ACT** | Prepare and execute approved actions | "Regular customers ko monthly offer bhejo." |

---

## Architecture

```mermaid
flowchart LR
    M["Merchant"] --> UI["SmartBox UI"]
    UI --> N["n8n Webhook"]
    N --> S1["Sarvam AI<br/>Speech to Text"]
    S1 --> G["Gemini<br/>Intent Classification"]
    G --> R{"Router"}
    R -->|ASK| A["Sales Agent"]
    R -->|AUTOMATE| B["Automation"]
    R -->|ACT| C["Promotion Agent"]
    A <--> MEM["Cognee<br/>Memory"]
    B <--> MEM
    C <--> MEM
    A --> S2["Sarvam AI<br/>Text to Speech"]
    B --> S2
    C --> S2
    S2 --> UI
```

### n8n Workflow

![n8n Workflow](assets/n8n-workflow.png)

---

## Tech Stack

| Technology | Role |
|---|---|
| **n8n** | Workflow orchestration, routing, scheduling and execution |
| **Google Gemini** | Natural-language understanding and ASK / AUTOMATE / ACT classification |
| **Sarvam AI** | Indian-language speech-to-text and text-to-speech |
| **Cognee** | Long-term merchant and customer memory |
| **HTML / CSS / JavaScript** | Voice-first merchant interface |
| **WhatsApp / API Adapter** | Customer communication |
| **Business Data Adapter** | Transaction and merchant data |

### How the stack works

```text
Sarvam       → Hear and speak
Gemini       → Understand and classify
Cognee       → Remember
n8n          → Execute and automate
SmartBox UI  → Interact with merchant
```

---

## Core Workflow

### ASK

```text
Voice
  ↓
Sarvam STT
  ↓
Gemini → ASK
  ↓
Sales Agent
  ↓
Business Data
  ↓
Sarvam TTS
  ↓
Voice Response
```

### AUTOMATE

```text
Voice
  ↓
Gemini → AUTOMATE
  ↓
Extract task + schedule
  ↓
n8n scheduled workflow
  ↓
Execute recurring task
```

### ACT

```text
Voice
  ↓
Gemini → ACT
  ↓
Cognee memory
  ↓
Customer / business context
  ↓
Prepare action
  ↓
Merchant approval
  ↓
Execute
```

---

## Memory

SmartBox uses Cognee to retain relevant business context.

Example:

> "Customers ko Hindi mein message karna aur discount 10% se zyada mat dena."

This preference can be retrieved later when SmartBox prepares a promotion.

Memory areas include:

- Merchant preferences
- Customer history
- Business context
- Previous interactions

---

## Human-in-the-Loop

Read-only requests can be handled automatically.

Consequential actions use merchant approval before execution.

```text
READ
  → Automatic

ACT
  → Prepare
  → Merchant Approval
  → Execute
  → Verify
```

---

## Demo

### ASK

**"Aaj ki sale kitni hui?"**

SmartBox retrieves sales information and responds through voice.

### AUTOMATE

**"Roz raat 9 baje mujhe sales report bhejna."**

SmartBox converts the request into a scheduled n8n workflow.

### ACT

**"Mere regular customers ko monthly offer bhejo."**

SmartBox uses memory and customer context to prepare the action and requests merchant approval before execution.

---

## Run Locally

```bash
git clone https://github.com/Purvijain1234/Paytm-SmartBox.git
cd Paytm-SmartBox
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

### n8n Setup

1. Import the SmartBox workflow into n8n.
2. Add Google Gemini, Sarvam AI and Cognee credentials.
3. Configure the Cognee datasets.
4. Activate the n8n webhook.
5. Update the webhook URL in `app.js`.

---

## Team

| Name | GitHub |
|---|---|
| **Purvi Jain** | [@Purvijain1234](https://github.com/Purvijain1234) |
| **Ranjeet Singh** | [@ranjeet22](https://github.com/ranjeet22) |

---

<div align="center">

**SmartBox — Voice → Understand → Remember → Automate → Act**

Built for the Paytm AI Hackathon.

</div>
