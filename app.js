// N8N CONFIG

const CONFIG = {
  N8N_WEBHOOK_URL: "https://ranjeet22.app.n8n.cloud/webhook/smartbox/voice",
  MERCHANT_ID: "merchant_demo_001",
  LANGUAGE: "hi-IN",
  CHANNEL: "web",
  PLAY_AUDIO_RESPONSE: true
};


// DOM

const waitIndicator = document.getElementById("waitIndicator");
const speakIndicator = document.getElementById("speakIndicator");
const conversation = document.getElementById("conversation");
const textInput = document.getElementById("textInput");
const sendText = document.getElementById("sendText");
const liveStatus = document.getElementById("liveStatus");
const responseAudio = document.getElementById("responseAudio");


// STATE

let mediaRecorder = null;
let mediaStream = null;
let recordedChunks = [];
let isRecording = false;


// UI STATE

function setBoxState() {
  waitIndicator.classList.add("active");
  speakIndicator.classList.remove("active");
  liveStatus.textContent = "SmartBox is responding…";
}

function setUserState() {
  speakIndicator.classList.add("active");
  waitIndicator.classList.remove("active");
  liveStatus.textContent = "Listening… release to send";
}

function setReadyState() {
  speakIndicator.classList.add("active");
  waitIndicator.classList.remove("active");
  liveStatus.textContent = "Ready";
}


// CHAT

function addMessage(text, sender) {
  if (!text) return;

  const row = document.createElement("div");
  row.className = `message-row ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = `message ${sender}`;
  bubble.textContent = String(text);

  row.appendChild(bubble);
  conversation.appendChild(row);

  conversation.scrollTop = conversation.scrollHeight;
}

function addUserMessage(text) {
  addMessage(text, "user");
}

function addBoxMessage(text) {
  addMessage(text, "box");
}


// N8N RESPONSE NORMALIZER

function normalizeN8nResponse(data) {
  if (Array.isArray(data)) {
    return data[0] || {};
  }

  if (data && data.data && typeof data.data === "object") {
    return data.data;
  }

  return data || {};
}


// AUDIO RESPONSE

function playAudioResponse(result) {
  if (!CONFIG.PLAY_AUDIO_RESPONSE) return;

  try {
    if (result.audio_url) {
      responseAudio.src = result.audio_url;
      responseAudio.play().catch(() => { });
    } else if (result.audio_base64) {
      const mime = result.audio_mime || "audio/wav";
      responseAudio.src = `data:${mime};base64,${result.audio_base64}`;
      responseAudio.play().catch(() => { });
    }
  } catch (error) {
    console.warn("Could not play n8n audio response:", error);
  }
}


// SEND TO N8N

async function sendToN8n(payload, options = {}) {
  const isFormData = payload instanceof FormData;

  setBoxState();

  try {
    const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
      method: "POST",
      body: isFormData ? payload : JSON.stringify(payload),
      headers: isFormData
        ? {}
        : {
          "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
      throw new Error(`n8n returned HTTP ${response.status}`);
    }

    const raw = await response.json();
    const result = normalizeN8nResponse(raw);

    if (result.transcript && !options.userAlreadyDisplayed) {
      addUserMessage(result.transcript);
    }

    const answer =
      result.response ??
      result.message ??
      result.answer ??
      result.text ??
      "Request completed.";

    addBoxMessage(answer);

    playAudioResponse(result);

    setReadyState();
    return result;

  } catch (error) {
    console.error("SmartBox → n8n error:", error);

    addBoxMessage(
      "I couldn't connect to SmartBox. Please check that n8n is running and the webhook URL is correct."
    );

    waitIndicator.classList.remove("active");
    speakIndicator.classList.remove("active");
    liveStatus.textContent = "Connection error";

    return null;
  }
}


// TEXT TEST MODE

async function sendTextCommand() {
  const query = textInput.value.trim();
  if (!query) return;

  textInput.value = "";
  addUserMessage(query);

  await sendToN8n(
    {
      query: query,
      merchant_id: CONFIG.MERCHANT_ID,
      language: CONFIG.LANGUAGE,
      channel: CONFIG.CHANNEL
    },
    {
      userAlreadyDisplayed: true
    }
  );
}

sendText.addEventListener("click", sendTextCommand);

textInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendTextCommand();
  }
});


// VOICE RECORDING

function getSupportedMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus"
  ];

  for (const type of types) {
    if (window.MediaRecorder &&
      MediaRecorder.isTypeSupported &&
      MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}

async function startRecording() {
  if (isRecording) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    addBoxMessage("Microphone recording is not supported in this browser.");
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    recordedChunks = [];

    const mimeType = getSupportedMimeType();

    mediaRecorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream);

    isRecording = true;
    setUserState();

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    });

    mediaRecorder.addEventListener("stop", async () => {
      const finalMimeType =
        mediaRecorder.mimeType || mimeType || "audio/webm";

      const audioBlob = new Blob(recordedChunks, {
        type: finalMimeType
      });

      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }

      mediaStream = null;
      isRecording = false;

      const form = new FormData();

      form.append(
        "audio",
        audioBlob,
        `smartbox-${Date.now()}.webm`
      );

      form.append("merchant_id", CONFIG.MERCHANT_ID);
      form.append("language", CONFIG.LANGUAGE);
      form.append("channel", CONFIG.CHANNEL);

      await sendToN8n(form);
    });

    mediaRecorder.start();

  } catch (error) {
    console.error("Microphone error:", error);

    isRecording = false;

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    mediaStream = null;

    waitIndicator.classList.remove("active");
    speakIndicator.classList.remove("active");
    liveStatus.textContent = "Microphone permission required";

    addBoxMessage(
      "Please allow microphone access and try again."
    );
  }
}

function stopRecording() {
  if (!mediaRecorder || !isRecording) return;

  if (mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
}


// HOLD-TO-SPEAK

function pressSpeak(event) {
  if (event) event.preventDefault();
  startRecording();
}

function releaseSpeak(event) {
  if (event) event.preventDefault();
  stopRecording();
}

[
  "pointerup",
  "pointercancel",
  "pointerleave"
].forEach((eventName) => {
  speakIndicator.addEventListener(eventName, releaseSpeak);
});

speakIndicator.addEventListener("pointerdown", pressSpeak);

speakIndicator.addEventListener("mousedown", pressSpeak);
speakIndicator.addEventListener("mouseup", releaseSpeak);

speakIndicator.addEventListener("keydown", (event) => {
  if (
    (event.code === "Space" || event.code === "Enter") &&
    !event.repeat
  ) {
    event.preventDefault();
    startRecording();
  }
});

speakIndicator.addEventListener("keyup", (event) => {
  if (event.code === "Space" || event.code === "Enter") {
    event.preventDefault();
    stopRecording();
  }
});


// INITIAL STATE

setReadyState();
