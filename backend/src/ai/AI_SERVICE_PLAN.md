# AI Service Implementation Plan

## Overview
AI acts as **proposal/copilot layer** - suggests but does NOT execute.

## Architecture

### Module: `src/ai/`
```
ai/
├── ai-proposal.types.ts     # DTOs and interfaces (COMPLETED)
├── ai.service.ts          # Main AI service
├── ai.controller.ts       # REST endpoints
├── ai.module.ts          # NestJS module
└── prompts/
    ├── system-prompt.md   # System instructions
    └── classification-prompt.md
```

## Service Methods

### 1. `generateProposal(inboundItemId: string): Promise<AiProposalDto>`

**Input:** 
- `inboundItemId`: ID of item to analyze

**Process:**
1. Load InboundItem with emails, ERP docs
2. Extract text content (subject, body, sender)
3. Determine request type from keywords/content
4. Detect supplier, location, due dates using NLP/patterns
5. Map request type → coordinator type
6. Score confidence (based on pattern matching quality)
7. Generate task suggestions

**Output:** `AiProposalDto` with all proposal fields

### 2. `generateBatchProposals(inboundItemIds: string[]): Promise<AiProposalDto[]>`

Parallel generation with rate limiting.

### 3. `recordFeedback(feedback: ProposalFeedback): Promise<void>`

Store manager corrections for learning:
```prisma
model AiProposalFeedback {
  id              String   @id @default(uuid())
  proposalId      String
  inboundItemId   String
  
  // AI suggestions vs actual
  suggestedRequestType String?
  actualRequestType    String?
  
  suggestedPriority   String?
  actualPriority      String?
  
  // Feedback metadata
  suggestionQuality  String?  // HIGH, MEDIUM, LOW
  feedback          String?
  createdAt         DateTime @default(now())
}
```

### 4. `getProposalStats(): Promise<ProposalStats>`

- Total proposals generated
- Average confidence score
- Acceptance rate (manager accepted without changes)
- Top rejected reasons
- Coordinator match accuracy

## Prompt Engineering

### System Prompt
```
You are a logistics copilot for a fulfillment center.
Your role is to PROPOSE classifications and assignments.
You must NOT execute - only suggest.
Always provide confidence scores.
Flag missing or ambiguous data.
```

### Classification Prompt
```
Analyze this inbound item:
- Subject: {subject}
- Body: {body}
- Source: {sourceType}
- Supplier: {supplierName}

Determine:
1. Request Type (INBOUND_RECEIPT, OUTBOUND_DELIVERY, etc)
2. Priority (HIGH for rush/urgent)
3. Suggested coordinator type
4. Missing data flags
5. Confidence score (0.0-1.0)
```

## LLM Integration

### Provider Options
1. **OpenAI** (GPT-4) - Primary
2. **Anthropic** (Claude) - Alternative
3. **Local** (Llama) - Future

### Configuration
```typescript
// config/ai.config.ts
export const aiConfig = {
  provider: process.env.AI_PROVIDER || 'openai',
  model: process.env.AI_MODEL || 'gpt-4',
  temperature: 0.3,  // Low for consistent classification
  maxTokens: 2000,
};
```

## Error Handling

- **LLM unavailable:** Return error, suggest manual classification
- **Low confidence (<0.3):** Flag for required manager review
- **Timeout:** 30s max, return partial proposal with error flag

## Testing Strategy

1. Unit test: prompt generation
2. Integration test: mock LLM, verify proposal structure
3. E2E test: full flow with real LLM (if available)

## Implementation Priority

| Phase | Description | Effort |
|-------|------------|--------|
| 1 | Types + basic service | 2h |
| 2 | Prompt templates | 1h |
| 3 | Controller + endpoints | 1h |
| 4 | Feedback storage | 1h |
| 5 | Stats endpoint | 1h |

**Total estimated: 6 hours**