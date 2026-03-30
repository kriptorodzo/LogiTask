# UI Integration Plan for AI Proposals

## Pages to Integrate AI

### 1. `/inbound` (List Page)
```
┌─────────────────────────────────────────────────────────────┐
│ InboundItems                              [🔮 AI Assist]     │
├─────────────────────────────────────────────────────────────┤
│ □  Select items for AI classification                     │
│                                                     │
│ Selected: 3 items  [Generate Proposals]              │
│                                                     │
│ ┌──────────────────────────────────────────────┐       │
│ │ Item  subject | Supplier | # AI Suggestions   │       │
│ │ □  Потврда 2044  | Гас    │ ✓ 95% HIGH    │       │
│ │ □  Нарачка 2031  | МакПетрол│ ✓ 88% MEDIUM │       │
│ │ ...                                        │       │
│ └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Checkbox to select items
- "AI Assist" button selects all RECLAIMED items
- Show AI confidence badge per item
- Batch "Generate Proposals" button

### 2. `/inbound/[id]` (Detail Page)
```
┌─────────────────────────────────────────────────────────────┐
│ │ Потврда за нарачка 2044                    [AI]       │
├─────────────────────────────────────────────────────────────┤
│  CURRENT CLASSIFICATION         AI SUGGESTIONS            │
│  ─────────────────────        ─────────────────           │
│  Request Type:    [▼ INBOUND_RECEIPT]  → INBOUND_RECEIPT │
│  Confidence:                        ───────────────       │
│  Priority:      [▼ HIGH]          → HIGH    [95%]       │
│  Supplier:      [Гас]             → Гас     [92%]       │
│  Location:     [Скопје]          → Скопје  [88%]       │
│  Due Date:     [📅 2026-04-15]  → ✓ Same           │
│                                                     │
│  COORDINATOR                                            │
│  ─────────                                            │
│  Assigned:    [▼ Координатор]    → Коста Т.  [90%]    │
│                                                     │
│  [Apply AI Suggestions]  [Reset]                     │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Right panel: AI suggestions with confidence scores
- "Apply AI Suggestions" - applies all suggestions with >80% confidence
- Per-field apply buttons
- Edit override logs for feedback

### 3. Manager Dashboard Summary
```
┌─────────────────────────────────────────────────────┐
│  AI ASSIST STATS                                     │
│  ─────────────────                                 │
│  Proposals Today:    45                            │
│  Avg Confidence:    78%                            │
│  Auto-Applied:     23 (51%)                       │
│  Manager Changes:  12 (27%)                      │
│  Review Needed:    10 (22%)                       │
└─────────────────────────────────────────────────────┘
```

## API Endpoints

### `POST /ai/proposal`
Generate proposal for single item.

### `POST /ai/propose-batch`
Generate proposals for multiple items.

### `POST /ai/feedback`
Record manager feedback.

### `GET /ai/stats`
Get AI statistics.

## Component Structure

```typescript
// components/ai/
// AiProposalBadge      - Shows confidence level
// AiSuggestionPanel  - Side panel with suggestions
// AiApplyButton     - Applysuggestions button
// AiConfidenceBar  - Visual confidence meter
```

## State Management

```typescript
// stores/ai-proposal.ts
interface AiProposalState {
  proposals: Map<string, AiProposalDto>;
  loading: Set<string>;
  errors: Map<string, string>;
  
  // Actions
  generateProposal(itemId: string): Promise<void>;
  applySuggestions(itemId: string): void;
  recordFeedback(itemId: string, overrides: Partial<InboundItem>): void;
}
```

## Acceptance Criteria

1. ✓ Selected items show AI confidence badges
2. ✓ Detail page shows suggestion side panel
3. ✓ "Apply" applies high-confidence suggestions
4. ✓ Manager changes are logged for feedback
5. ✓ Stats visible on dashboard