# Pilot Scenarios

## Overview

This document defines the daily operational scenarios for the LogiTask pilot phase.

## Pilot Configuration

- **Mailbox**: logistics@company.com
- **Users**: 1 Manager + 3 Coordinators
- **Duration**: 2 weeks (1 week shadow + 1 week controlled)

---

## Daily Scenarios

### Scenario 1: Morning Email Batch Processing
**Time**: 8:00 - 9:00 AM

**Steps**:
1. Check for new emails in logistics@company.com
2. Verify emails are being processed automatically
3. Review any emails that failed classification
4. Assign to appropriate coordinator if manual intervention needed

**Success Criteria**:
- New emails processed within 5 minutes
- Classification accuracy > 90%
- No emails stuck in "pending" status

**Review Points**:
- How many emails received?
- Classification accuracy?
- Any issues requiring attention?

---

### Scenario 2: Task Assignment & Execution
**Time**: 2:00 - 3:00 PM

**Steps**:
1. Coordinators review assigned tasks
2. Execute tasks according to request type
3. Update task status as work progresses
4. Document completion results (full/partial/failed)

**Success Criteria**:
- All pending tasks reviewed
- Status updates reflected in real-time
- Completion results properly recorded

**Review Points**:
- Tasks completed vs pending
- Any blockers or delays?
- Completion rate by coordinator

---

### Scenario 3: End-of-Day Status Review
**Time**: 5:00 - 6:00 PM

**Steps**:
1. Review day's case outcomes
2. Check OTIF metrics for the day
3. Identify any cases needing follow-up
4. Verify case calculations are correct

**Success Criteria**:
- OTIF rate calculated correctly
- All cases have proper status
- No pending "incomplete" cases

**Review Points**:
- Daily OTIF rate
- Cases by completion result
- Any exceptions or anomalies

---

### Scenario 4: Weekly Report Generation
**Time**: Friday afternoon

**Steps**:
1. Generate weekly reports
2. Export data for analysis
3. Review trends vs previous weeks
4. Prepare summary for stakeholders

**Success Criteria**:
- Reports generated without errors
- Export functionality works
- Data matches manual calculations

**Review Points**:
- Week-over-week trends
- Coordinator performance comparison
- Any data discrepancies

---

## Pilot Timeline

### Week 1: Shadow Mode
| Day | Focus |
|-----|-------|
| Mon | Setup, baseline |
| Tue | Morning processing |
| Wed | Task execution |
| Thu | End-of-day review |
| Fri | Weekly reports |

### Week 2: Controlled Pilot
| Day | Focus |
|-----|-------|
| Mon | Full operations |
| Tue | Full operations |
| Wed | Mid-week review |
| Thu | Full operations |
| Fri | Week 2 review |

---

## Issue Tracking

During pilot, document:
- Classification errors
- Webhook failures
- Performance issues
- UX problems
- Missing features

Use: `docs/pilot-issues.md`

---

## Success Metrics

- **Email Processing**: 95% automated classification
- **Task Completion**: 90% same-day completion
- **OTIF Accuracy**: < 2% discrepancy from manual calculation
- **System Availability**: 99% uptime
- **User Satisfaction**: > 4/5 from pilot users