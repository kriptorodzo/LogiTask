import { CaseStatus, TaskStatus, CompletionResult } from './case-aggregation.service';

interface TaskMock {
  status: TaskStatus;
  completionResult?: CompletionResult;
  isRequiredForCase?: boolean;
}

/**
 * Logic from determineCaseStatus() extracted for testing
 * Priority order:
 * 1. FAILED - any required task failed
 * 2. DONE - all required tasks done with FULL
 * 3. PARTIAL - all required terminal, at least one partial
 * 4. IN_PROGRESS - at least one required in progress
 * 5. APPROVED - all required at least approved, none proposed
 * 6. PROPOSED - at least one required proposed
 * 7. CANCELLED - all required cancelled
 * 8. NEW - otherwise
 */
function determineCaseStatus(tasks: TaskMock[]): CaseStatus {
  const requiredTasks = tasks.filter(t => t.isRequiredForCase !== false);
  
  // No tasks at all
  if (tasks.length === 0) {
    return CaseStatus.NEW;
  }

  // No required tasks - use all tasks
  if (requiredTasks.length === 0) {
    const nonCancelledTasks = tasks.filter(t => t.status !== TaskStatus.CANCELLED);
    if (nonCancelledTasks.length === 0) {
      return CaseStatus.NEW;
    }
    return determineStatusSimple(nonCancelledTasks);
  }

  // CANCELLED: all required tasks cancelled
  const allRequiredCancelled = requiredTasks.every(t => t.status === TaskStatus.CANCELLED);
  if (allRequiredCancelled) {
    return CaseStatus.CANCELLED;
  }

  // FAILED: any required task with FAILED
  if (requiredTasks.some(t => t.completionResult === CompletionResult.FAILED)) {
    return CaseStatus.FAILED;
  }

  // DONE: all required tasks DONE with FULL
  const allRequiredDoneFull = requiredTasks.every(t => 
    t.status === TaskStatus.DONE && t.completionResult === CompletionResult.FULL
  );
  if (allRequiredDoneFull) {
    return CaseStatus.DONE;
  }

  // PARTIAL: all required terminal, at least one PARTIAL
  const allRequiredTerminal = requiredTasks.every(t => 
    [TaskStatus.DONE, TaskStatus.CANCELLED].includes(t.status)
  );
  if (allRequiredTerminal && requiredTasks.some(t => t.completionResult === CompletionResult.PARTIAL)) {
    return CaseStatus.PARTIAL;
  }

  // IN_PROGRESS: at least one required task IN_PROGRESS
  if (requiredTasks.some(t => t.status === TaskStatus.IN_PROGRESS)) {
    return CaseStatus.IN_PROGRESS;
  }

  // APPROVED: all required at least APPROVED, none PROPOSED
  const allRequiredApprovedOrBetter = requiredTasks.every(t => 
    [TaskStatus.APPROVED, TaskStatus.IN_PROGRESS, TaskStatus.DONE].includes(t.status)
  );
  const hasRequiredProposed = requiredTasks.some(t => t.status === TaskStatus.PROPOSED);
  
  if (allRequiredApprovedOrBetter && !hasRequiredProposed) {
    return CaseStatus.APPROVED;
  }

  // PROPOSED: at least one required PROPOSED
  if (hasRequiredProposed) {
    return CaseStatus.PROPOSED;
  }

  return CaseStatus.NEW;
}

function determineStatusSimple(tasks: TaskMock[]): CaseStatus {
  if (tasks.length === 0) return CaseStatus.NEW;
  
  const hasProposed = tasks.some(t => t.status === TaskStatus.PROPOSED);
  const hasApproved = tasks.some(t => t.status === TaskStatus.APPROVED);
  const hasInProgress = tasks.some(t => t.status === TaskStatus.IN_PROGRESS);
  const hasCancelled = tasks.every(t => t.status === TaskStatus.CANCELLED);
  const hasFailed = tasks.some(t => t.completionResult === CompletionResult.FAILED);
  const hasPartial = tasks.some(t => t.completionResult === CompletionResult.PARTIAL);
  const allFullDone = tasks.every(t => t.status === TaskStatus.DONE && t.completionResult === CompletionResult.FULL);

  if (hasFailed) return CaseStatus.FAILED;
  if (allFullDone) return CaseStatus.DONE;
  if (hasPartial && !hasInProgress) return CaseStatus.PARTIAL;
  if (hasInProgress) return CaseStatus.IN_PROGRESS;
  if (hasApproved && !hasProposed) return CaseStatus.APPROVED;
  if (hasProposed) return CaseStatus.PROPOSED;
  if (hasCancelled) return CaseStatus.CANCELLED;
  return CaseStatus.NEW;
}

// Test cases - using same priority order as in the service
const testCases: { name: string; tasks: TaskMock[]; expected: CaseStatus }[] = [
  {
    name: '1. All proposed (required)',
    tasks: [
      { status: TaskStatus.PROPOSED, isRequiredForCase: true },
      { status: TaskStatus.PROPOSED, isRequiredForCase: true },
    ],
    expected: CaseStatus.PROPOSED,
  },
  {
    name: '2. All approved (required)',
    tasks: [
      { status: TaskStatus.APPROVED, isRequiredForCase: true },
      { status: TaskStatus.APPROVED, isRequiredForCase: true },
    ],
    expected: CaseStatus.APPROVED,
  },
  {
    name: '3. One in progress (required)',
    tasks: [
      { status: TaskStatus.IN_PROGRESS, isRequiredForCase: true },
      { status: TaskStatus.APPROVED, isRequiredForCase: true },
    ],
    expected: CaseStatus.IN_PROGRESS,
  },
  {
    name: '4. All done with FULL (required)',
    tasks: [
      { status: TaskStatus.DONE, completionResult: CompletionResult.FULL, isRequiredForCase: true },
      { status: TaskStatus.DONE, completionResult: CompletionResult.FULL, isRequiredForCase: true },
    ],
    expected: CaseStatus.DONE,
  },
  {
    name: '5. One partial (all required terminal)',
    tasks: [
      { status: TaskStatus.DONE, completionResult: CompletionResult.PARTIAL, isRequiredForCase: true },
      { status: TaskStatus.DONE, completionResult: CompletionResult.FULL, isRequiredForCase: true },
    ],
    expected: CaseStatus.PARTIAL,
  },
  {
    name: '6. One failed (required)',
    tasks: [
      { status: TaskStatus.DONE, completionResult: CompletionResult.FAILED, isRequiredForCase: true },
      { status: TaskStatus.DONE, completionResult: CompletionResult.FULL, isRequiredForCase: true },
    ],
    expected: CaseStatus.FAILED,
  },
  {
    name: '7. All cancelled (required)',
    tasks: [
      { status: TaskStatus.CANCELLED, isRequiredForCase: true },
      { status: TaskStatus.CANCELLED, isRequiredForCase: true },
    ],
    expected: CaseStatus.CANCELLED,
  },
  {
    name: '8. Required done/full + optional proposed',
    tasks: [
      { status: TaskStatus.DONE, completionResult: CompletionResult.FULL, isRequiredForCase: true },
      { status: TaskStatus.PROPOSED, isRequiredForCase: false },
    ],
    expected: CaseStatus.DONE, // all required are DONE/FULL
  },
  {
    name: '9. No tasks',
    tasks: [],
    expected: CaseStatus.NEW,
  },
  {
    name: '10. Required full + partial (all terminal)',
    tasks: [
      { status: TaskStatus.DONE, completionResult: CompletionResult.FULL, isRequiredForCase: true },
      { status: TaskStatus.DONE, completionResult: CompletionResult.PARTIAL, isRequiredForCase: true },
    ],
    expected: CaseStatus.PARTIAL,
  },
  {
    name: '11. Required partial + optional in progress',
    tasks: [
      { status: TaskStatus.DONE, completionResult: CompletionResult.PARTIAL, isRequiredForCase: true },
      { status: TaskStatus.IN_PROGRESS, isRequiredForCase: false }, // optional - shouldn't affect status
    ],
    expected: CaseStatus.PARTIAL, // required tasks determine status, all are terminal
  },
  {
    name: '12. Required partial + required approved (not all terminal)',
    tasks: [
      { status: TaskStatus.DONE, completionResult: CompletionResult.PARTIAL, isRequiredForCase: true },
      { status: TaskStatus.APPROVED, isRequiredForCase: true },
    ],
    expected: CaseStatus.APPROVED, // not all required terminal, none proposed
  },
  {
    name: '13. One failed, one partial (FAILED has priority)',
    tasks: [
      { status: TaskStatus.DONE, completionResult: CompletionResult.FAILED, isRequiredForCase: true },
      { status: TaskStatus.DONE, completionResult: CompletionResult.PARTIAL, isRequiredForCase: true },
    ],
    expected: CaseStatus.FAILED,
  },
  {
    name: '14. Required cancelled + required partial',
    tasks: [
      { status: TaskStatus.CANCELLED, isRequiredForCase: true },
      { status: TaskStatus.DONE, completionResult: CompletionResult.PARTIAL, isRequiredForCase: true },
    ],
    expected: CaseStatus.PARTIAL,
  },
  {
    name: '15. Required approved + required proposed',
    tasks: [
      { status: TaskStatus.APPROVED, isRequiredForCase: true },
      { status: TaskStatus.PROPOSED, isRequiredForCase: true },
    ],
    expected: CaseStatus.PROPOSED, // at least one required is proposed
  },
  {
    name: '16. Required done/full + optional approved',
    tasks: [
      { status: TaskStatus.DONE, completionResult: CompletionResult.FULL, isRequiredForCase: true },
      { status: TaskStatus.APPROVED, isRequiredForCase: false },
    ],
    expected: CaseStatus.DONE,
  },
  {
    name: '17. Required approved + optional proposed (should be APPROVED)',
    tasks: [
      { status: TaskStatus.APPROVED, isRequiredForCase: true },
      { status: TaskStatus.PROPOSED, isRequiredForCase: false },
    ],
    expected: CaseStatus.APPROVED, // all required at least approved, none proposed
  },
  {
    name: '18. Required in progress + optional cancelled',
    tasks: [
      { status: TaskStatus.IN_PROGRESS, isRequiredForCase: true },
      { status: TaskStatus.CANCELLED, isRequiredForCase: false },
    ],
    expected: CaseStatus.IN_PROGRESS,
  },
  {
    name: '19. Required approved + required in progress',
    tasks: [
      { status: TaskStatus.APPROVED, isRequiredForCase: true },
      { status: TaskStatus.IN_PROGRESS, isRequiredForCase: true },
    ],
    expected: CaseStatus.IN_PROGRESS, // in progress has priority
  },
  {
    name: '20. Required done/full + required in progress',
    tasks: [
      { status: TaskStatus.DONE, completionResult: CompletionResult.FULL, isRequiredForCase: true },
      { status: TaskStatus.IN_PROGRESS, isRequiredForCase: true },
    ],
    expected: CaseStatus.IN_PROGRESS, // not all done yet
  },
];

// Run tests
console.log('🧪 Running Case Status Tests\n');
let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = determineCaseStatus(tc.tasks);
  const success = result === tc.expected;
  
  if (success) {
    console.log(`✅ ${tc.name}: ${result}`);
    passed++;
  } else {
    console.log(`❌ ${tc.name}: expected ${tc.expected}, got ${result}`);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);