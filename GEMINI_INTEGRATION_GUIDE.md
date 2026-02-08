# 🤖 Gemini AI Integration Guide

Your Gemini AI is now fully integrated with 3 powerful roles! Here's how to use them from the frontend.

## ✅ Backend Setup Complete

- **Gemini API Key**: Configured in `.env`
- **Model**: `gemini-2.5-flash` (text + vision)
- **Service**: `/backend/services/gemini_service.py`
- **Routes**: `/backend/routes/ai.py`
- **Base URL**: `http://localhost:8004/api/ai`

---

## Role 1: Interest Extraction Agent 🎨

**When to use**: After voice conversations OR when user clicks "Update from conversations"

### API Endpoint
```
POST /api/ai/gemini/extract-interests
```

### Request Example (Frontend)
```typescript
const extractInterests = async (conversations: string[]) => {
  const response = await fetch(`${API_BASE}/api/ai/gemini/extract-interests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      conversation_transcripts: conversations,
      child_name: "Emma",
      child_age: 5
    })
  });

  const data = await response.json();
  return data;
};

// Example conversations array
const conversations = [
  "User: I like dinosaurs\nAI: That's cool!\nUser: T-Rex is my favorite!",
  "User: Can we draw unicorns?\nAI: Sure!\nUser: Pink and purple ones!"
];

const interests = await extractInterests(conversations);
```

### Response Format
```json
{
  "success": true,
  "interests": ["unicorns", "dinosaurs", "Power Rangers"],
  "name": "Emma",
  "themes": ["fantasy", "adventure"],
  "favorite_colors": ["pink", "purple", "blue"],
  "summary": "Emma loves magical creatures and prehistoric adventures. She's especially interested in unicorns and T-Rex dinosaurs..."
}
```

### Where to Store
```typescript
// Update user profile with extracted interests
interface UserProfile {
  interests: string[];
  themes: string[];
  favoriteColors: string[];
  interestSummary: string;
}
```

---

## Role 2: Buddy Mode Prompt Generator ✨

**When to use**: When child selects "Buddy Mode" on the Question page

### API Endpoint
```
POST /api/ai/gemini/generate-buddy-prompt
```

### Request Example (Frontend)
```typescript
const generateBuddyPrompt = async (interests: string[], age: number) => {
  const response = await fetch(`${API_BASE}/api/ai/gemini/generate-buddy-prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      interests: interests,
      age: age,
      previous_prompts: ["Draw a rainbow unicorn"] // Optional
    })
  });

  const data = await response.json();
  return data;
};

// Usage
const prompt = await generateBuddyPrompt(
  ["unicorns", "Power Rangers", "space"],
  5
);
```

### Response Format
```json
{
  "success": true,
  "mainPrompt": "Draw a Power Ranger riding a unicorn through space!",
  "description": "Let's draw an amazing space adventure with your favorite things!",
  "guideQuestions": [
    "Which Power Ranger is riding the unicorn?",
    "What color is the unicorn?",
    "What planets do you see?",
    "Are there any stars or comets?"
  ],
  "theme": "Space Unicorn Rangers"
}
```

### Integration with Drawing Board
```typescript
// In your BuddyMode component
const [buddyPrompt, setBuddyPrompt] = useState<BuddyPrompt | null>(null);

useEffect(() => {
  const loadPrompt = async () => {
    const interests = userProfile.interests;
    const prompt = await generateBuddyPrompt(interests, userProfile.age);
    setBuddyPrompt(prompt);
  };

  loadPrompt();
}, []);

// Display the prompt
<div>
  <h1>{buddyPrompt.mainPrompt}</h1>
  <p>{buddyPrompt.description}</p>
  <ul>
    {buddyPrompt.guideQuestions.map(q => <li key={q}>{q}</li>)}
  </ul>
</div>
```

---

## Role 3: Real-Time Canvas Analysis 👁️

**When to use**:
- Every 30 seconds during drawing (auto-check)
- When child clicks "Talk to me!"
- When checking if drawing is complete

### API Endpoint
```
POST /api/ai/gemini/analyze-canvas
```

### Request Example (Frontend)
```typescript
const analyzeCanvas = async (
  canvasImageBase64: string,
  mode: 'freestyle' | 'buddy',
  prompt?: string,
  sessionTimeMinutes?: number
) => {
  const response = await fetch(`${API_BASE}/api/ai/gemini/analyze-canvas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      image_base64: canvasImageBase64,
      mode: mode,
      prompt: prompt,
      session_time_minutes: sessionTimeMinutes
    })
  });

  const data = await response.json();
  return data;
};

// Get canvas image as base64
const getCanvasImage = () => {
  const canvas = canvasRef.current;
  return canvas.toDataURL('image/png');
};

// Usage
const analysis = await analyzeCanvas(
  getCanvasImage(),
  'buddy',
  'Draw a Power Rangers birthday party',
  8 // 8 minutes into drawing session
);
```

### Response Format
```json
{
  "success": true,
  "objects": ["person in red costume", "birthday cake", "balloons"],
  "colors": ["red", "blue", "yellow", "pink"],
  "complexity": 65,
  "skillLevel": "intermediate",
  "matchesPrompt": true,
  "missingElements": ["presents", "other Power Rangers"],
  "encouragement": "Wow! I love your Red Ranger and that colorful birthday cake!",
  "nextSuggestion": "What about the other Power Rangers? Are they at the party too?"
}
```

### Auto-Analysis Pattern
```typescript
// In your drawing board component
const [sessionStartTime] = useState(Date.now());
const [lastAnalysis, setLastAnalysis] = useState<Analysis | null>(null);

useEffect(() => {
  const analyzeInterval = setInterval(async () => {
    const sessionMinutes = Math.floor((Date.now() - sessionStartTime) / 60000);

    const analysis = await analyzeCanvas(
      getCanvasImage(),
      drawingMode,
      buddyPrompt?.mainPrompt,
      sessionMinutes
    );

    setLastAnalysis(analysis);

    // Show encouragement to user
    showEncouragement(analysis.encouragement);

  }, 30000); // Every 30 seconds

  return () => clearInterval(analyzeInterval);
}, [drawingMode, buddyPrompt]);
```

### Displaying Analysis Results
```typescript
// Encouragement popup
{lastAnalysis && (
  <div className="encouragement-bubble">
    <p>{lastAnalysis.encouragement}</p>
    {lastAnalysis.nextSuggestion && (
      <p className="suggestion">💡 {lastAnalysis.nextSuggestion}</p>
    )}
  </div>
)}

// Progress indicator
<div className="progress-info">
  <span>Complexity: {lastAnalysis?.complexity}/100</span>
  <span>Skill: {lastAnalysis?.skillLevel}</span>
</div>

// Buddy mode progress
{mode === 'buddy' && lastAnalysis?.missingElements.length > 0 && (
  <div className="missing-elements">
    <p>Still to add:</p>
    <ul>
      {lastAnalysis.missingElements.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
)}
```

---

## Complete Flow Example

### 1. After Conversation Phase
```typescript
// After Question.tsx conversation ends
const handleConversationComplete = async (transcript: string) => {
  // Extract interests
  const interests = await extractInterests([transcript]);

  // Save to profile
  updateUserProfile({
    interests: interests.interests,
    themes: interests.themes,
    favoriteColors: interests.favorite_colors,
    interestSummary: interests.summary
  });

  // Navigate to mode selection
  navigate('/choose-mode');
};
```

### 2. Starting Buddy Mode
```typescript
// In BuddyMode selection
const startBuddyMode = async () => {
  const profile = getUserProfile();

  // Generate personalized prompt
  const prompt = await generateBuddyPrompt(
    profile.interests,
    profile.age || 5
  );

  // Navigate to drawing board with prompt
  navigate('/draw', { state: { prompt, mode: 'buddy' } });
};
```

### 3. During Drawing Session
```typescript
// In DrawingBoard.tsx
const DrawingBoard = () => {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [sessionStart] = useState(Date.now());

  // Auto-analyze every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const minutes = Math.floor((Date.now() - sessionStart) / 60000);
      const result = await analyzeCanvas(
        getCanvasImage(),
        'buddy',
        prompt.mainPrompt,
        minutes
      );
      setAnalysis(result);

      // Speak encouragement via TTS
      speakText(result.encouragement);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Canvas ref={canvasRef} />
      {analysis && (
        <EncouragementBubble
          text={analysis.encouragement}
          suggestion={analysis.nextSuggestion}
        />
      )}
    </div>
  );
};
```

---

## Testing Your Integration

1. **Run the test script**:
```bash
cd noodle-backend/backend
.venv/bin/python ../test_gemini.py
```

2. **Test from frontend console**:
```javascript
// Test interest extraction
fetch('http://localhost:8004/api/ai/gemini/extract-interests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversation_transcripts: ["User: I like unicorns"],
    child_name: "Test",
    child_age: 5
  })
}).then(r => r.json()).then(console.log);
```

3. **Monitor backend logs**:
```bash
tail -f /tmp/backend.log
```

---

## Error Handling

```typescript
const safeGeminiCall = async <T,>(
  apiCall: () => Promise<T>,
  fallback: T
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error('Gemini API error:', error);
    return fallback;
  }
};

// Usage
const interests = await safeGeminiCall(
  () => extractInterests(conversations),
  {
    interests: ['drawing', 'creativity'],
    themes: ['art'],
    favorite_colors: ['rainbow'],
    summary: 'This child loves to create!'
  }
);
```

---

## 🎉 You're Ready!

Your Gemini AI is fully integrated and ready to power your app's intelligence. All three roles are working:

✅ **Interest Extraction** - Understanding what kids love
✅ **Buddy Prompts** - Creating personalized drawing challenges
✅ **Canvas Analysis** - Real-time feedback and encouragement

Happy coding! 🚀
