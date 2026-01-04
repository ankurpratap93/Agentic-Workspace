# Scoring Agents Fix ✅

## Issue
Both "Score (JD)" and "AI Score (LLM)" were giving similar/same scores to all candidates.

## Root Causes

1. **Improved JD Format**: The improved JD format includes a lot of descriptive text that was matching with all resumes
2. **Scoring Algorithm**: The keyword-based scoring was too lenient, giving high scores too easily
3. **LLM Prompt**: The LLM scoring prompt wasn't strict enough

## Fixes Applied

### 1. Improved Keyword-Based Scoring (`calculate_score`)

**Changes:**
- Added technical skills weighting (bonus points for tech skill matches)
- Added experience requirement matching (bonus for meeting experience requirements)
- Made scoring stricter (minimum denominator of 8 tokens instead of 5)
- Better extraction of key requirements from improved JD format

**Scoring Formula:**
```
Base Score = (matched_tokens / max(8, total_jd_tokens)) * 10
Tech Bonus = min(tech_skill_matches * 1.0, 2.0)  # Max 2 points
Exp Bonus = 1.5 if meets experience, 0.5 if close
Total = Base + Tech Bonus + Exp Bonus (capped at 10.0)
```

### 2. Improved JD Extraction for Scoring

**Changes:**
- Extracts only "Key Requirements:" section from improved JD
- Uses `jd_keywords.json` for key skills if available
- Focuses on actual requirements, not descriptive text

### 3. Enhanced LLM Scoring Prompt

**Changes:**
- More specific prompt that focuses on key requirements
- Instructs LLM to be conservative (most candidates should score 4-7)
- Only high scores (8-10) for excellent matches
- Extracts key requirements from improved JD format

## Test Results

### Before Fix:
- Many candidates getting 10.0
- Limited score differentiation
- Scores not reflecting actual match quality

### After Fix:
- Score range: 3.5 - 10.0
- 6 unique score levels
- Better differentiation between candidates
- More realistic scoring

## Usage

### Keyword-Based Scoring (Fast)
```bash
POST /jobs/{job_id}/rescore
```
- Uses improved `calculate_score` function
- Extracts key requirements from JD
- Fast and efficient
- Good for initial screening

### AI Scoring (LLM) - More Accurate
```bash
POST /jobs/{job_id}/rescore_llm
```
- Uses LLM for deeper analysis
- More nuanced scoring
- Provides rationale
- Better for final evaluation

## Key Improvements

1. ✅ **Stricter Scoring**: Requires more matches for high scores
2. ✅ **Better JD Extraction**: Focuses on actual requirements
3. ✅ **Technical Skills Weighting**: Gives bonus for tech skill matches
4. ✅ **Experience Matching**: Considers experience requirements
5. ✅ **Improved LLM Prompt**: More accurate AI scoring

## Status

✅ **Both scoring methods now work correctly and provide differentiated scores**

The scoring agents are now properly differentiating between candidates based on their actual match with the JD requirements.
