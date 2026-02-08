# ElevenLabs Integration - Debugging Guide

## Summary of Changes

I've added comprehensive error logging and fixed critical bugs in the ElevenLabs integration. Here's what was fixed:

### Frontend Changes

#### 1. **DrawingBoard.tsx** - Text-to-Speech for Gemini Messages
- ✅ **FIXED INFINITE LOOP BUG** - Removed `isAudioPlaying` from useEffect dependency array
- ✅ Changed to use `useRef` instead of `useState` for audio playing state
- ✅ Added detailed console logging with `[TTS]` prefix
- ✅ Prevents overlapping audio by checking if audio is already playing
- ✅ Properly stops previous audio before starting new audio
- ✅ Added error handlers for audio element (onended, onerror)
- ✅ Detects browser autoplay restrictions (NotAllowedError)
- ✅ Logs all API responses and errors

#### 2. **QuestionWithElevenLabsAgent.tsx** - Conversational AI Agent
- ✅ Added detailed console logging with `[ElevenLabs Agent]` prefix
- ✅ Logs WebSocket connection lifecycle (open, close, error)
- ✅ Logs all WebSocket messages (ping/pong, audio chunks, agent responses)
- ✅ Logs audio playback in Web Audio API
- ✅ Improved error messages with actual HTTP status codes

### Backend Changes

#### 1. **voice_service.py** - Voice Service
- ✅ Added detailed logging with `[Voice Service]` prefix
- ✅ Logs SDK detection (legacy vs modern)
- ✅ Logs audio data size and file paths
- ✅ Full error stack traces for debugging
- ✅ Logs signed URL generation process

#### 2. **voice.py** - API Routes
- ✅ Added logging for all incoming requests
- ✅ Logs user information for authentication debugging
- ✅ Logs successful and failed operations

---

## How to Debug

### Step 1: Open Browser Console

1. Open your browser's Developer Tools (F12 or right-click → Inspect)
2. Go to the **Console** tab
3. Clear the console

### Step 2: Test the Welcome Questionnaire (ElevenLabs Agent)

1. Navigate through the app to the welcome questionnaire page
2. Watch the console for messages starting with `[ElevenLabs Agent]`

**Expected log sequence:**
```
[ElevenLabs Agent] Initializing agent connection...
[ElevenLabs Agent] Using auth token
[ElevenLabs Agent] Signed URL response status: 200
[ElevenLabs Agent] Received data: {signed_url: "wss://..."}
[ElevenLabs Agent] Audio context created
[ElevenLabs Agent] Connecting to WebSocket: wss://...
[ElevenLabs Agent] WebSocket connected successfully
[ElevenLabs Agent] Sending init message: {...}
[ElevenLabs Agent] Received message type: agent_response
[ElevenLabs Agent] Agent response: Hi! I'm Luna! What do you like to draw?
[ElevenLabs Agent] Received message type: audio
[ElevenLabs Agent] Received audio chunk
[ElevenLabs Agent] Audio chunk played successfully
```

**Common issues:**
- ❌ `Failed to get signed URL: 401` → Authentication problem
- ❌ `Failed to get signed URL: 500` → Backend configuration issue (missing ELEVENLABS_AGENT_ID)
- ❌ `WebSocket error` → Network or ElevenLabs API issue
- ❌ `Error playing audio chunk` → Browser audio restrictions

### Step 3: Test Drawing Board TTS (Gemini + ElevenLabs)

1. Navigate to the drawing board (buddy mode)
2. Watch the console for messages starting with `[TTS]`

**Expected log sequence:**
```
[TTS] Fetching audio for prompt description: Draw a friendly dinosaur...
[TTS] Response status: 200
[TTS] Received audio URL: /api/voice/audio/buddy_speech_xxx.mp3
[TTS] Audio playback started successfully
[TTS] Audio playback ended

(After 15 seconds, when AI asks a question)
[TTS] Fetching audio for AI message: What color is your dinosaur?
[TTS] Response status: 200
[TTS] Received audio URL: /api/voice/audio/buddy_speech_yyy.mp3
[TTS] Audio playback started successfully
```

**Common issues:**
- ❌ `Request failed: 401` → Authentication problem
- ❌ `Request failed: 500` → Backend ElevenLabs API issue
- ❌ `Playback error: NotAllowedError` → **BROWSER AUTOPLAY BLOCKED** (see solution below)
- ❌ `Audio element error` → File not found or CORS issue
- ❌ `Skipping - audio already playing` → Previous audio hasn't finished (working as intended)

### Step 4: Check Backend Logs

1. Look at the terminal where your backend server is running
2. You should see matching logs with `[Voice Service]` and `[Voice API]` prefixes

**Expected backend logs:**
```
[Voice API] TTS request from user: testuser
[Voice API] Text length: 45, Buddy: luna
[Voice Service] Generating speech for text (length: 45): Draw a friendly dinosaur with big eyes...
[Voice Service] Using voice ID: EXAVITQu4vr4xnSDxMaL, Model: eleven_multilingual_v2
[Voice Service] Using modern SDK
[Voice Service] Processing audio data...
[Voice Service] Received 52341 bytes directly
[Voice Service] Saving audio to: ./audio/buddy_speech_xxx.mp3
[Voice Service] Audio saved successfully. URL: /api/voice/audio/buddy_speech_xxx.mp3
[Voice API] TTS success - audio URL: /api/voice/audio/buddy_speech_xxx.mp3
```

**Common backend issues:**
- ❌ `ERROR: ELEVENLABS_API_KEY is not configured` → Missing .env variable
- ❌ `ERROR: ELEVENLABS_AGENT_ID is not configured` → Missing .env variable
- ❌ `ERROR generating speech: ...` → ElevenLabs API error (check API key, quota, etc.)

---

## Common Issues & Solutions

### 1. **Browser Blocks Audio (NotAllowedError)**

**Problem:** Modern browsers block autoplay audio unless the user has interacted with the page first.

**Console message:**
```
[TTS] Playback error: NotAllowedError: play() failed because the user didn't interact with the document first.
[TTS] Autoplay blocked by browser. User interaction required.
```

**Solutions:**
- User must click/tap anywhere on the page before audio will play
- Consider adding a "Start" button that users must click to enable audio
- Add a visual indicator asking users to "tap to enable sound"

### 2. **Missing Environment Variables**

**Problem:** ElevenLabs API key or Agent ID not configured.

**Check:** Run the health check:
```bash
curl http://localhost:8004/health
```

Should show:
```json
{
  "status": "healthy",
  "elevenlabs_configured": true
}
```

If `elevenlabs_configured: false`, add to your `.env` file:
```env
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
```

### 3. **Authentication Failures (401)**

**Problem:** Frontend not sending auth token or token is expired.

**Check frontend console:**
```
[ElevenLabs Agent] Using auth token
```

or

```
[ElevenLabs Agent] No auth token provided
```

**Solution:** Ensure user is logged in and token is being passed to components.

### 4. **Audio Files Not Found (404)**

**Problem:** Backend saved audio but frontend can't access it.

**Check:** Ensure the audio directory exists and is accessible:
```bash
ls -la ./audio/
```

**Check CORS:** The backend CORS middleware should allow the frontend origin.

### 5. **WebSocket Connection Fails**

**Problem:** Can't connect to ElevenLabs agent.

**Console message:**
```
[ElevenLabs Agent] WebSocket closed. Code: 1006 Reason:
```

**Possible causes:**
- Invalid ELEVENLABS_AGENT_ID
- Invalid ELEVENLABS_API_KEY
- Network firewall blocking WebSocket connections
- ElevenLabs service outage

### 6. **Audio Repeating Every Few Seconds (FIXED)**

**Problem:** ElevenLabs TTS was repeating the same message every 4-5 seconds.

**Root cause:** The `useEffect` had `isAudioPlaying` in its dependency array, causing it to re-trigger every time the audio state changed (creating an infinite loop).

**Solution:** Changed from `useState` to `useRef` for tracking audio playback state. This prevents the useEffect from re-running when audio finishes.

**Fixed in:** DrawingBoard.tsx - useEffect dependencies now only include `[aiMessage, authToken]`

---

## Testing Checklist

Use this checklist to verify everything is working:

### Backend Health
- [ ] Backend server is running (`ps aux | grep uvicorn`)
- [ ] Health endpoint returns success: `curl http://localhost:8004/health`
- [ ] `elevenlabs_configured: true` in health response
- [ ] Backend logs show `✅ Database initialized`

### Authentication
- [ ] Can login successfully
- [ ] Auth token is stored in browser
- [ ] Requests include `Authorization: Bearer <token>` header

### ElevenLabs Agent (Welcome Questionnaire)
- [ ] Page loads without errors
- [ ] Console shows: `[ElevenLabs Agent] WebSocket connected successfully`
- [ ] Can hold mic button and speak
- [ ] Speech recognition captures text
- [ ] Agent responds with text
- [ ] Agent response is spoken (audio plays)

### ElevenLabs TTS (Drawing Board)
- [ ] Page loads without errors
- [ ] Initial prompt description is spoken
- [ ] AI questions appear every 15 seconds
- [ ] AI questions are spoken via ElevenLabs
- [ ] No `NotAllowedError` (or user has clicked to enable audio)
- [ ] Audio doesn't overlap (one message at a time)

---

## Next Steps

1. **Run the application** and check the console logs
2. **Copy any error messages** you see
3. **Share the logs** with relevant `[TTS]` or `[ElevenLabs Agent]` messages
4. This will help identify exactly where the issue is occurring

The comprehensive logging will now show you exactly where ElevenLabs is failing, making it much easier to debug and fix the specific issue!
