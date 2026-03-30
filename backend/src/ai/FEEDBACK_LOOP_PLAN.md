# Feedback Loop Plan

## Overview
Capture manager corrections → Improve AI suggestions over time.

## Data Captured

### At Time of Classification

| Field | AI Suggested | Manager Selected | Override? |
|-------|--------------|----------------|-----------|
| requestType | INBOUND_RECEIPT | OUTBOUND_DELIVERY | YES |
| priority | MEDIUM | HIGH | YES |
| supplierName | Гас | null | YES |
| locationName | Скопје | Битола | YES |
| dueDate | 2026-04-15 | 2026-04-10 | YES |
| coordinatorId | user-123 | user-456 | YES |

### Feedback Metadata

```typescript
interface FeedbackEntry {
  // Identifying info
  proposalId: string;
  inboundItemId: string;
  timestamp: Date;
  
  // Manager action type
  actionType: 'APPLIED' | 'MODIFIED' | 'REJECTED';
  
  // Changes from AI
  changes: FieldChange[];
  
  // Manager feedback quality
  aiQualityRating?: 'EXCELLENT' | 'GOOD' | 'POOR';
  managerFeedback?: string;
}
```

## Capture Points

### 1. On "Apply AI Suggestions"
```typescript
// When manager clicks "Apply Suggestions"
const feedback = {
  actionType: 'APPLIED',
  proposalId: proposal.id,
  changes: [],  // No changes = perfect match
  aiQualityRating: 'EXCELLENT',
};
```

### 2. On Manual Edit After AI
```typescript
// When manager modifies any field after AI
const feedback = {
  actionType: 'MODIFIED',
  proposalId: proposal.id,
  changes: [
    { field: 'requestType', ai: 'INBOUND_RECEIPT', actual: 'OUTBOUND_DELIVERY' },
    { field: 'priority', ai: 'MEDIUM', actual: 'HIGH' },
  ],
};
```

### 3. On Manual Classification (No AI)
```typescript
// When manager manually classifies without AI
const feedback = {
  actionType: 'REJECTED',
  proposalId: null,  // No proposal used
  changes: [
    { field: 'requestType', ai: null, actual: 'TRANSFER_DISTRIBUTION' },
  ],
  aiQualityRating: 'POOR',  // Bad enough to reject entirely
  managerFeedback: 'AI completely misunderstood',
};
```

## Storage Schema

```prisma
model AiProposalFeedback {
  id              String   @id @default(uuid())
  proposalId       String?  // Null if no proposal was generated
  inboundItemId    String
  
  // What AI suggested
  suggestedRequestType  String?
  suggestedPriority   String?
  suggestedSupplier   String?
  suggestedLocation  String?
  suggestedCoordinator String?
  
  // What manager chose
  actualRequestType    String
  actualPriority     String?
  actualSupplier     String?
  actualLocation    String?
  actualCoordinator  String?
  
  // Feedback metadata
  actionType        String   // APPLIED, MODIFIED, REJECTED
  aiQualityRating   String?  // EXCELLENT, GOOD, POOR
  aiConfidenceScore Float?   // The AI confidence when generated
  managerFeedback  String?
  
  // Timestamps
  createdAt         DateTime @default(now())
}
```

## Learning Opportunities

### 1. Pattern Recognition
```
Manager consistently changes INBOUND_RECEIPT → OUTBOUND_PREPARATION for supplier "Ероглу"
→ Add supplier → requestType mapping to AI
```

### 2. Confidence Calibration
```
AI: "95% confident" → Manager changes 80% of time
→ Lower confidence scores for this pattern
```

### 3. New Keywords
```
Manager classifies item with: "испорака до 10"
AI doesn't recognize the term
→ Add to keyword dictionary
```

## Analytics Dashboard

### Metrics to Track

| Metric | Description |
|-------|-------------|
| **Acceptance Rate** | % proposals applied without changes |
| **Modification Rate** | % proposals modified |
| **Rejection Rate** | % manually classified instead |
| **Avg Confidence** | Overall confidence score |
| **Confidence Accuracy** | Confidence vs actual match rate |
| **Per-Type Accuracy** | Accuracy per requestType |
| **Per-Coordinator Match** | Coordinator assignment accuracy |

### Reports

1. **Weekly AI Performance**
   - Total proposals generated
   - Acceptance/mododification/rejection rates
   - Top modification patterns

2. **Monthly Supplier Patterns**
   - Which suppliers get reclassified
   - Coordinator assignment patterns

3. **Quarterly Model Tuning**
   - Overall accuracy trends
   - Areas for prompt improvement

## Implementation

### Step 1: Capture at API
```typescript
// In inbound.controller.ts process()
async processInboundItem(id: string, data: ProcessDto) {
  const proposal = await this.aiService.getProposal(id);
  
  // Check if AI was used
  if (data.usedAiProposal) {
    await this.feedbackService.recordApplied(proposal.id);
  }
  
  // Check for overrides
  if (hasOverrides(data, proposal)) {
    await this.feedbackService.recordModified(proposal.id, changes);
  }
}
```

### Step 2: Feedback UI
```typescript
// In suggestion panel component
const handleFieldChange = (field, value) => {
  if (aiProposal?.suggested[field] !== value) {
    logChange(field, aiProposal.suggested[field], value);
  }
};
```

### Step 3: Analytics Endpoint
```typescript
// GET /ai/feedback-stats
// Returns all the metrics above
```

## Success Criteria

- [ ] Acceptance rate > 50%
- [ ] Confidence Accurate to within 10%
- [ ] Weekly report shows improvement over time
- [ ] Manager can see AI performance