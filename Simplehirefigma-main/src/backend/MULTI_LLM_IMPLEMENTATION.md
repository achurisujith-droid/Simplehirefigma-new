# Multi-LLM Arbiter Implementation

## Overview

This implementation replaces the weighted-average arbitration with the exact multi-LLM arbiter logic from the `elevenlabsgitcopilot` repository. The system makes **three LLM calls** for comprehensive interview evaluation:

1. **GPT-4o Evaluation** - First independent assessment
2. **Claude Opus 4.5 Evaluation** - Second independent assessment  
3. **GPT-4o Arbiter** - Analyzes both evaluations and selects the better one

## Architecture

### Three-Stage Evaluation Process

```
Interview Data
    ↓
    ├─→ GPT-4o Evaluator ──────┐
    │                           │
    └─→ Claude Opus Evaluator ──┤
                                ↓
                          GPT-4o Arbiter
                                ↓
                          Final Result
```

### Key Components

#### 1. Configuration (`config/llm_config.json`)

Centralized configuration for:
- Provider settings (OpenAI, Anthropic)
- Model configurations (GPT-4o, Claude Opus 4.5)
- Evaluation prompts
- Arbiter prompts
- Scoring rubric with weights

#### 2. Multi-LLM Arbiter Service (`multi-llm-arbiter.service.ts`)

Core service that:
- Makes parallel LLM evaluation calls
- Implements true arbiter logic (third LLM call)
- Loads prompts from configuration
- Handles evaluation parsing and error recovery

#### 3. Interview Evaluator Service (`interview-evaluator.service.ts`)

High-level service that:
- Transforms interview data to evaluation format
- Calls multi-LLM arbiter
- Returns comprehensive evaluation results

## Scoring Rubric

The scoring rubric from `elevenlabsgitcopilot` uses four categories with specific weights:

| Category | Weight | Description |
|----------|--------|-------------|
| **Technical Accuracy** | 35% | Correctness and depth of technical knowledge |
| **Communication Clarity** | 20% | Clarity and articulation of responses |
| **Problem Solving** | 25% | Analytical thinking and approach to problems |
| **Experience Alignment** | 20% | Alignment between resume and demonstrated knowledge |

Each category is scored 0-10, then weighted to calculate the final score (0-100).

## Arbiter Logic

### When to Use Arbiter

- **Multiple Evaluations**: Arbiter runs when 2+ evaluations are available
- **Single Evaluation**: Arbiter skipped, evaluation used directly

### Arbiter Decision Process

The arbiter (third GPT-4o call) analyzes both evaluations and:

1. **Selects** which evaluation is more accurate and fair
2. **Provides rationale** explaining the selection
3. **Synthesizes insights** from both evaluations
4. **Determines confidence** level (high/medium/low)
5. **Describes agreement** between the two evaluations

### Output Format

```typescript
interface ArbitratedResult {
  // Selection
  selectedEvaluationIndex: number;      // 0 or 1
  selectedProvider: string;             // "openai" or "anthropic"
  rationale: string;                    // Why this evaluation was chosen
  
  // Final Scores
  finalScore: number;                   // 0-100
  categoryScores: {
    technicalAccuracy: number;          // 0-10
    communicationClarity: number;       // 0-10
    problemSolving: number;             // 0-10
    experienceAlignment: number;        // 0-10
  };
  
  // Feedback
  strengths: string[];
  improvements: string[];
  summary: string;
  recommendation: 'strong_hire' | 'hire' | 'maybe_hire' | 'no_hire';
  
  // Arbiter Metadata
  confidenceLevel: 'high' | 'medium' | 'low';
  evaluationAgreement: string;
  arbiterSkipped: boolean;
  arbitrationMethod: 'arbiter_selection' | 'consensus';
  
  // Provider Results
  providerResults: LLMEvaluationResult[];
  arbiterProvider?: string;
  arbiterModel?: string;
  arbiterLatencyMs?: number;
}
```

## Prompts

### Evaluation Prompt

The evaluation system prompt from `llm_config.json`:

```
You are an expert interviewer. Evaluate the candidate's interview performance 
based on the provided transcript and resume. Provide detailed scoring and feedback.
```

The evaluator receives:
- Candidate profile and resume
- Voice interview responses
- MCQ test results
- Coding challenge submissions
- Scoring rubric

Expected output: JSON with scores, strengths, improvements, and recommendation.

### Arbiter Prompt

The arbiter system prompt from `llm_config.json`:

```
You are a senior hiring manager reviewing evaluations from multiple AI systems. 
Analyze both evaluations, select the most accurate and fair assessment, provide 
your rationale, and synthesize the best insights from both.
```

The arbiter receives:
- Original interview data
- Both LLM evaluations with full context
- Scoring rubric used
- Latency metrics

Expected output: JSON with selection, rationale, synthesized scores, and agreement analysis.

## Configuration

### Environment Variables

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-key

# Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Multi-LLM Configuration
LLM_PROVIDERS=gpt-4o,claude-opus-4-5-20251101
ENABLE_MULTI_LLM_ARBITER=true
```

### Model Settings

Both models use consistent settings:
- **Temperature**: 0.3 (for consistent, factual outputs)
- **Max Tokens**: 4096 (sufficient for detailed evaluations)

## Usage Example

```typescript
import { evaluateWithMultiLLM } from './multi-llm-arbiter.service';

const interviewData = {
  candidateProfile: 'John Doe - 5 years experience...',
  voiceAnswers: [
    { question: 'Explain React hooks', answer: 'React hooks are...' }
  ],
  mcqAnswers: [
    { question: 'What is closure?', selected: 'A', correct: true }
  ],
  codeAnswers: [
    { question: 'Implement binary search', code: '...', language: 'javascript' }
  ]
};

const result = await evaluateWithMultiLLM(interviewData);

console.log(`Selected: ${result.selectedProvider}`);
console.log(`Score: ${result.finalScore}`);
console.log(`Recommendation: ${result.recommendation}`);
console.log(`Confidence: ${result.confidenceLevel}`);
console.log(`Agreement: ${result.evaluationAgreement}`);
```

## Error Handling

### Graceful Degradation

1. **Anthropic API Fails**: Falls back to GPT-4o only (single evaluation)
2. **Arbiter Fails**: Uses first evaluation with low confidence
3. **Both Evaluators Fail**: Throws error for upstream handling

### Logging

All stages are logged with:
- Start/completion times
- Latency metrics
- Error details
- Decision rationale

## Testing

### Test Coverage

The test suite (`multi-llm-arbiter.test.ts`) validates:

1. **Category Score Mapping**: Correct names and weights
2. **Result Structure**: All required fields present
3. **Recommendations**: All types supported
4. **Confidence Levels**: All levels supported
5. **Single Evaluation**: Arbiter correctly skipped
6. **Two Evaluations**: Arbiter correctly invoked
7. **Provider Results**: All evaluations included in output

### Running Tests

```bash
cd src/backend
npm test -- multi-llm-arbiter.test.ts
```

## Differences from Weighted Average

### Previous Approach ❌

- Mathematical weighted average of scores
- No third arbiter LLM call
- Different category scoring
- Used Claude 3.5 Sonnet (not Opus 4.5)
- Custom prompts

### Current Approach ✅

- **Three LLM calls**: GPT-4o + Claude Opus + GPT-4o arbiter
- Arbiter **selects** better evaluation (not averaging)
- Config-driven prompts from `llm_config.json`
- Exact elevenlabs rubric: technicalAccuracy (35%), communicationClarity (20%), problemSolving (25%), experienceAlignment (20%)
- Output includes `selectedEvaluationIndex`, `evaluationAgreement`, `confidenceLevel`

## Performance Considerations

### Latency

- **Parallel Evaluations**: GPT-4o and Claude Opus run simultaneously
- **Typical Times**:
  - GPT-4o evaluation: ~2-3 seconds
  - Claude Opus evaluation: ~2-4 seconds
  - Arbiter call: ~1-2 seconds
- **Total**: ~4-6 seconds for complete evaluation

### Cost

- 3 LLM API calls per evaluation (2 evaluators + 1 arbiter)
- Consider implementing caching for repeated evaluations
- Monitor API usage and costs

## Future Enhancements

1. **Caching**: Cache evaluations for identical interview data
2. **Streaming**: Stream arbiter decision for faster perceived performance
3. **Additional Models**: Support more LLM providers
4. **A/B Testing**: Compare arbiter vs. weighted average approaches
5. **Feedback Loop**: Collect human feedback on arbiter decisions

## References

- Original implementation: `achurisujith-droid/elevenlabsgitcopilot`
  - `multi-llm-service.js` (lines 269-481)
  - `config/llm_config.json`
- OpenAI API: https://platform.openai.com/docs
- Anthropic API: https://docs.anthropic.com/

## Support

For issues or questions:
1. Check logs for detailed error messages
2. Verify API keys are valid
3. Ensure network connectivity to OpenAI/Anthropic
4. Review `llm_config.json` for prompt/config issues

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: ✅ Production Ready
