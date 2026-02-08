# 🎙️ ElevenLabs Conversational AI Agent Integration

## Overview

Replace the pre-written conversation script with **real ElevenLabs Conversational AI** for dynamic, natural conversations.

---

## 🎯 What Changed

### Before (❌ Simulated)
- Pre-written responses in backend
- Static conversation flow
- Fake conversation ID
- No real AI understanding

### After (✅ Real AI Agent)
- Real-time ElevenLabs Conversational AI
- Dynamic, natural conversations
- Actual conversation with context
- AI understands and responds naturally

---

## 📁 New Files Created

### 1. **QuestionWithElevenLabsAgent.tsx**
Location: [src/components/QuestionWithElevenLabsAgent.tsx](src/components/QuestionWithElevenLabsAgent.tsx)

**Features:**
- ✅ WebSocket connection to ElevenLabs agent
- ✅ Real-time audio streaming
- ✅ Text-based conversation (type instead of voice)
- ✅ Connection status indicator
- ✅ Conversation transcript
- ✅ No pre-written scripts

**How It Works:**
1. Gets signed URL from backend
2. Connects to ElevenLabs via WebSocket
3. Sends user messages
4. Receives AI responses (text + audio)
5. Plays audio in real-time
6. Tracks full conversation

---

## 🚀 Quick Setup

### Option A: Replace Current Question Component

```bash
# Backup current Question.tsx
cp src/components/Question.tsx src/components/Question.backup.tsx

# Replace with new version
cp src/components/QuestionWithElevenLabsAgent.tsx src/components/Question.tsx
```

### Option B: Use Side-by-Side (Testing)

In your app router, import the new component:
```typescript
import Question from './components/QuestionWithElevenLabsAgent';
```

---

## 🔧 How to Use

### User Experience

1. **Page loads** → "⏳ Connecting..." appears
2. **Connected** → "🎤 Connected to Luna" (green dot)
3. **User types** → "Tell Luna what you like to draw..."
4. **Press Enter** or click **"send"**
5. **Luna responds** → Text appears + audio plays
6. **Conversation continues** → Natural back-and-forth
7. **After 2+ turns** → "continue" button enables

### Example Conversation

```
User: I like dinosaurs
Luna: Wow, dinosaurs are so cool! What's your favorite dinosaur?

User: T-Rex!
Luna: T-Rex is awesome! They're so big and strong! Would you like to draw one?

User: Yes!
Luna: Let's do it! What color will your T-Rex be?
```

---

## 🎨 UI Features

### Connection Indicator
```typescript
<div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
<p>🎤 Connected to Luna</p>
```

- Green dot = Connected
- Red dot = Disconnected
- Yellow pulse = Luna speaking

### Conversation Transcript
Shows full conversation history:
```
User: I like dinosaurs
AI: Wow, dinosaurs are so cool! What's your favorite dinosaur?
User: T-Rex!
AI: T-Rex is awesome! Would you like to draw one?
```

### Send Button
- Disabled when not connected
- Disabled when input empty
- Yellow (#ffd000) to match theme

---

## 🔌 WebSocket Message Types

### From Client → Agent

**1. Initialize Conversation**
```json
{
  "type": "conversation_initiation_client_data",
  "conversation_config_override": {
    "agent": {
      "prompt": {
        "prompt": "You are Luna, a friendly AI art buddy..."
      }
    }
  }
}
```

**2. Send User Message**
```json
{
  "type": "user_text_message",
  "text": "I like dinosaurs"
}
```

**3. Keep-Alive Pong**
```json
{
  "type": "pong",
  "event_id": "..."
}
```

### From Agent → Client

**1. Conversation Started**
```json
{
  "type": "conversation_initiation_metadata",
  "conversation_id": "conv_abc123"
}
```

**2. Text Response**
```json
{
  "type": "agent_response",
  "response": "Wow, dinosaurs are so cool!"
}
```

**3. Audio Chunk**
```json
{
  "type": "audio",
  "audio_event": {
    "audio_base_64": "..."
  }
}
```

**4. Audio Ended**
```json
{
  "type": "audio_end"
}
```

---

## 🎯 Key Implementation Details

### 1. Audio Playback

Uses Web Audio API for real-time streaming:

```typescript
const audioContextRef = useRef<AudioContext | null>(null);

// Initialize
audioContextRef.current = new AudioContext();

// Play audio chunk
const playAudioChunk = async (base64Audio: string) => {
  // Decode base64
  const bytes = new Uint8Array(atob(base64Audio).length);

  // Decode audio
  const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);

  // Play
  const source = audioContextRef.current.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContextRef.current.destination);
  source.start(0);
};
```

### 2. WebSocket Connection

```typescript
// Get signed URL
const response = await fetch(`${API_BASE}/api/voice/agent/signed-url`);
const data = await response.json();

// Connect
const ws = new WebSocket(data.signed_url);

ws.onopen = () => {
  // Initialize conversation with custom prompt
  ws.send(JSON.stringify({
    type: 'conversation_initiation_client_data',
    conversation_config_override: {
      agent: {
        prompt: {
          prompt: 'You are Luna, a friendly AI art buddy for 4-6 year old children...'
        }
      }
    }
  }));
};
```

### 3. Message Handling

```typescript
ws.onmessage = async (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'agent_response':
      setAiText(data.response);
      setFullTranscript(prev => [...prev, `AI: ${data.response}`]);
      break;

    case 'audio':
      await playAudioChunk(data.audio_event.audio_base_64);
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', event_id: data.event_id }));
      break;
  }
};
```

---

## 🎤 Voice Input (Optional Enhancement)

To add voice input back:

```typescript
// When user holds mic button
const startRecording = () => {
  // Use Web Speech API to transcribe
  recognitionRef.current?.start();
};

// When speech detected
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;

  // Send to agent
  wsRef.current.send(JSON.stringify({
    type: 'user_text_message',
    text: transcript
  }));
};
```

---

## ✅ Benefits of Real Agent

1. **Natural Conversations**
   - No pre-written scripts
   - AI understands context
   - Adapts to child's responses

2. **Better Engagement**
   - More authentic interactions
   - Personalized responses
   - Natural follow-up questions

3. **Scalable**
   - No need to write conversation trees
   - AI handles edge cases
   - Easy to update personality via prompt

4. **Real-Time Audio**
   - Instant responses
   - Natural voice
   - No audio file caching needed

---

## 🔧 Backend Endpoint

Already configured! ✅

```
GET /api/voice/agent/signed-url
```

Returns:
```json
{
  "signed_url": "wss://api.elevenlabs.io/...",
  "agent_id": "agent_2701..."
}
```

---

## 🎨 Customizing Luna's Personality

Update the prompt in the connection initialization:

```typescript
ws.send(JSON.stringify({
  type: 'conversation_initiation_client_data',
  conversation_config_override: {
    agent: {
      prompt: {
        prompt: `You are Luna, a friendly AI art buddy for 4-6 year old children.

        Guidelines:
        - Keep responses VERY short (1-2 sentences max)
        - Use simple, age-appropriate language
        - Be enthusiastic and encouraging
        - Ask open-ended questions about their art
        - Example: "Wow, dinosaurs! What's your favorite dinosaur?"

        Your goal: Ask what they like to draw and encourage their creativity.`
      }
    }
  }
}));
```

---

## 🚨 Troubleshooting

### Connection Issues

**Problem**: Red dot, not connecting
**Solution**:
1. Check agent ID in `.env`
2. Verify ElevenLabs API key
3. Check console for errors

### Audio Not Playing

**Problem**: Text appears but no audio
**Solution**:
1. Check browser audio permissions
2. Look for "audio_event" in console
3. Verify audio decoding errors

### Responses Too Long

**Problem**: Luna talks too much
**Solution**: Update prompt to emphasize brevity:
```typescript
prompt: 'Be VERY brief. Max 10 words per response. You are Luna...'
```

---

## 📊 Monitoring

### Console Logs

```javascript
// Connection
✅ Connected to ElevenLabs agent!
Conversation started: conv_abc123

// Messages
Message from agent: agent_response
Agent says: Wow, dinosaurs are so cool!

// Audio
Message from agent: audio
Message from agent: audio_end
```

### Network Tab

Look for:
- WebSocket connection to `api.elevenlabs.io`
- Status: 101 Switching Protocols
- Messages: Sent/Received

---

## 🎉 Result

### Before
```typescript
// Hardcoded in backend
if "start" in user_message:
    return "Hello! What do you like to draw?"
```

### After
```typescript
// Real AI conversation
User: "hi"
Luna: "Hey there! I'm Luna! What do you love to draw?"

User: "dinosaurs and space"
Luna: "Wow, dinosaurs AND space?! That's so cool! Want to draw a space dinosaur?"
```

**Pure, unscripted AI conversation!** 🚀

---

## 🔄 Switching Back to Old Version

If needed:
```bash
cp src/components/Question.backup.tsx src/components/Question.tsx
```

---

## 📚 Resources

- [ElevenLabs Conversational AI Docs](https://elevenlabs.io/docs/conversational-ai)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## ✨ Next Steps

1. **Test the Connection**
   - Load the page
   - Watch for green dot
   - Type a message
   - See Luna respond!

2. **Customize Luna**
   - Update the prompt
   - Adjust personality
   - Set response length

3. **Add Voice Input** (Optional)
   - Re-integrate Web Speech API
   - Send transcripts to agent
   - Full voice conversation

**Your AI buddy is now truly intelligent!** 🎨🤖
