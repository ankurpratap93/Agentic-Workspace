# Debugging Scoring Issues

## Backend Status: ✅ WORKING

Both endpoints are working correctly:
- POST /jobs/{job_id}/rescore - Returns success, updates scores
- POST /jobs/{job_id}/rescore_llm - Returns success, updates scores differently

## Frontend Debugging

### 1. Open Browser Console
- Press F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)
- Go to Console tab

### 2. Click Scoring Buttons
- Click "Score (JD)" button
- Look for console messages:
  - `[rescoreJob] Calling...`
  - `[rescoreJob] Response status: 200`
  - `[rescoreJob] Response data: {...}`
  - `[fetchCandidates] Fetching...`
  - `[fetchCandidates] Score range: X - Y`

### 3. Check Network Tab
- Go to Network tab in DevTools
- Click "Score (JD)" button
- Look for POST request to `/jobs/{job_id}/rescore`
- Check:
  - Status: Should be 200
  - Response: Should show `{"status":"success",...}`
- Click "AI Score (LLM)" button
- Look for POST request to `/jobs/{job_id}/rescore_llm`
- Check:
  - Status: Should be 200
  - Response: Should show `{"updated":22,...}`

### 4. Verify API Base URL
- Check console for `API_BASE` value
- Should be: `http://127.0.0.1:8000` or your configured URL
- If wrong, check `.env` file or `vite.config.ts`

### 5. Force Refresh
- After clicking buttons, wait 5-10 seconds
- Check if scores change
- If not, manually click "Refresh" button
- Or hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

## Common Issues

1. **CORS Error**: Backend not allowing frontend origin
2. **Wrong API URL**: Frontend calling wrong endpoint
3. **Caching**: Browser caching old responses
4. **Timing**: Not waiting long enough for processing

## Test Commands

```bash
# Test keyword scoring
curl -X POST "http://localhost:8000/jobs/{job_id}/rescore"

# Test AI scoring  
curl -X POST "http://localhost:8000/jobs/{job_id}/rescore_llm"

# Get candidates
curl "http://localhost:8000/jobs/{job_id}/candidates"
```

## Expected Behavior

1. Click "Score (JD)" → Wait 2-3s → Scores should change
2. Click "AI Score (LLM)" → Wait 5-7s → Scores should change differently
3. Console should show refresh messages
4. Network tab should show successful API calls
