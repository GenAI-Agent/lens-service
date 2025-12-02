# Supervisor Agent - Implementation Documentation

## Overview

The Supervisor Agent is the core decision-making component of Lens Service v3. Unlike a traditional plan generator that creates a one-time plan, the Supervisor Agent implements a **continuous decision loop** where every action returns to the supervisor for the next decision.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPERVISOR AGENT                          │
│                                                              │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ State Manager  │  │ Memory Manager  │  │ Agent Core   │ │
│  │                │  │                 │  │              │ │
│  │ • Token Mgmt   │  │ • Stratification│  │ • Decision   │ │
│  │ • Context Trim │  │ • Prompt Build  │  │   Loop       │ │
│  │ • Persistence  │  │ • Summarization │  │ • Streaming  │ │
│  └────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. SupervisorAgent (`agent.ts`)

The main orchestrator that implements the continuous decision loop.

**Features:**
- ✅ Continuous agentic flow (not one-time planning)
- ✅ Every action returns to supervisor for next decision
- ✅ Real-time streaming of all events
- ✅ Tool execution with error handling
- ✅ Iteration limit protection

**Usage:**
```typescript
import { SupervisorAgent, StateManager, MemoryManager } from './supervisor';

const agent = new SupervisorAgent(
  llmService,
  toolExecutor,
  stateManager,
  memoryManager,
  {
    defaultSystemPrompt: 'You are a helpful customer service agent...',
    model: 'gpt-4o',
    temperature: 0.7,
    maxIterations: 10,
  }
);

// Run agent with streaming
for await (const event of agent.run(sessionId, userId, userQuery)) {
  switch (event.type) {
    case 'thinking':
      console.log('Agent is thinking:', event.content);
      break;
    case 'tool_call_start':
      console.log('Tool call started:', event.tool);
      break;
    case 'tool_call_end':
      console.log('Tool call ended:', event.result);
      break;
    case 'response_chunk':
      process.stdout.write(event.content);
      break;
    case 'response_complete':
      console.log('\nFinal response:', event.content);
      break;
    case 'error':
      console.error('Error:', event.error);
      break;
  }
}
```

### 2. StateManager (`state-manager.ts`)

Manages the supervisor's state with precise token control.

**Features:**
- ✅ LangChain state initialization and updates
- ✅ Token usage tracking and estimation
- ✅ Context window management
- ✅ Automatic trimming when approaching limits
- ✅ Long-term memory persistence (user-visible only)

**Trimming Strategy:**
1. Remove old execution trace (keep recent N steps)
2. Summarize old conversations (TODO: LLM-based)
3. Remove oldest conversations if still over limit

**Configuration:**
```typescript
const stateManager = new StateManager(databaseService, {
  maxTokens: 8000,           // Context window limit
  trimThreshold: 0.8,        // Trim at 80% usage
  keepRecentSteps: 5,        // Keep 5 recent execution steps
});
```

### 3. MemoryManager (`memory-manager.ts`)

Implements memory stratification to prevent token explosion.

**Features:**
- ✅ Separates long-term (user-visible) from short-term (execution trace)
- ✅ Builds optimized decision prompts
- ✅ Execution trace summarization
- ✅ Conversation summarization (LLM-based, optional)

**Memory Layers:**

| Layer | Content | Persistence | Purpose |
|-------|---------|-------------|---------|
| **Long-term** | User queries + Final responses | Saved to DB | Conversation continuity |
| **Short-term** | Tool calls + Results | Memory only | Current task context |

**Prompt Building:**
```typescript
const messages = memoryManager.buildDecisionPrompt(state, systemPrompt);
// Result:
// 1. System prompt (skill or default)
// 2. Recent user-visible messages (last N)
// 3. Current user query
// 4. Execution trace summary (condensed)
```

## Design Decisions

### Why Continuous Loop vs. One-Time Plan?

**Traditional Approach (Plan Generator):**
```
User Query → Generate Plan → Execute All Steps → Return Result
              ↓
          [Plan]
          1. Do A
          2. Do B
          3. Do C
```

**Supervisor Agent Approach:**
```
User Query → Decide → Execute A → Decide → Execute B → Decide → Respond
             ↑_____________________↓         ↑_______↓
                Continuous Loop
```

**Benefits:**
- ✅ Adapts to tool results dynamically
- ✅ Can change strategy mid-execution
- ✅ Better error recovery
- ✅ More natural conversation flow

### Why Memory Stratification?

**Problem:**
Without stratification, the context grows unbounded:
```
Context = System + History + Tools
        = 500    + 50*200 + 10*500
        = 500    + 10,000 + 5,000
        = 15,500 tokens ❌ EXPLODES
```

**Solution:**
With stratification:
```
Long-term:  User Q/A only    = 50 * 100 = 5,000 tokens
Short-term: Recent 5 steps   = 5 * 200  = 1,000 tokens
System:     Prompt           =           500 tokens
                             ____________
Total:                       = 6,500 tokens ✅ Controlled
```

### Why Stream All Events?

**User Experience:**
- See agent's thinking process in real-time
- Understand what tools are being called
- Know when execution is progressing vs. stuck

**Developer Experience:**
- Debug agent behavior easily
- Monitor token usage live
- Track execution performance

## Token Management

### Estimation

Simple heuristic: **1 token ≈ 4 characters**

```typescript
estimateTokens(data: unknown): number {
  return Math.ceil(JSON.stringify(data).length / 4);
}
```

**TODO:** Use `tiktoken` for accurate counting.

### Trimming Triggers

| Usage | Action |
|-------|--------|
| < 80% | Normal operation |
| > 80% | Trigger context trimming |
| > 95% | Force aggressive trimming |

### What Gets Trimmed?

1. **Execution Trace:** Keep only recent N steps (default: 5)
2. **Old Conversations:** Remove oldest Q/A pairs
3. **Future:** Summarize old conversations with LLM

### What NEVER Gets Trimmed?

- Current user query
- System prompt
- Recent 5 conversation turns (minimum)

## Persistence Strategy

### What Gets Saved to DB?

✅ **Long-term Memory:**
- User queries
- Final assistant responses
- Session metadata (token usage, timestamps)

❌ **NOT Saved:**
- Execution trace (tool calls/results)
- Thinking process
- Intermediate states

**Rationale:** Tool execution details are only relevant during the current task. Storing them would:
- Waste database space
- Pollute future context windows
- Expose internal implementation details to users

### Reconnection Support

The `AgentExecutionState` table allows pausing and resuming agent execution:

```typescript
interface AgentExecutionState {
  sessionId: string;
  taskId: string;
  supervisorState: SupervisorState;  // Full state snapshot
  isActive: boolean;
  lastHeartbeat: Date;
}
```

This enables:
- Agent survival across page navigation
- Recovery from connection loss
- Multi-tab support (future)

## Performance Considerations

### Token Efficiency

| Component | Tokens | Optimization |
|-----------|--------|--------------|
| System Prompt | ~500 | Cache in memory |
| User-visible History | ~5,000 | Keep last 20 messages |
| Execution Trace | ~1,000 | Summarize to 1-line per step |
| Tool Results | ~2,000 | Internal LLM processing |

**Total:** ~8,500 tokens (within GPT-4 limits)

### Execution Speed

- **Decision Making:** 2-4 seconds (LLM latency)
- **Tool Execution:** Varies by tool (0.5-10s)
- **State Updates:** < 100ms (in-memory)
- **Streaming:** Real-time (SSE)

### Cost Optimization

1. **Use faster models for decisions:** GPT-4o-mini for simple tasks
2. **Cache tool results:** Web analysis, page parsing
3. **Batch similar operations:** Multiple database queries
4. **Limit max iterations:** Prevent runaway loops

## Testing

### Unit Tests

```bash
cd packages/core
pnpm test src/supervisor
```

### Integration Tests

```typescript
// Example: Test full decision loop
const agent = new SupervisorAgent(/* ... */);
const events = [];

for await (const event of agent.run(sessionId, userId, 'Test query')) {
  events.push(event);
}

expect(events).toContainEventType('tool_call_start');
expect(events).toContainEventType('response_complete');
```

## Future Enhancements

### Phase 2: LLM-Based Summarization

Replace simple truncation with intelligent summarization:

```typescript
async summarizeOldConversations(messages: UserMessage[]): Promise<string> {
  const summary = await llm.chat([
    { role: 'system', content: 'Summarize this conversation...' },
    { role: 'user', content: JSON.stringify(messages) },
  ]);
  return summary;
}
```

### Phase 3: Multi-Agent Coordination

Allow Supervisor to delegate to specialized sub-agents:

```typescript
if (decision.action === 'delegate') {
  const subAgent = getSpecializedAgent(decision.task);
  const result = await subAgent.execute(decision.params);
  // ... merge results back into main flow
}
```

### Phase 4: Learning from Feedback

Store successful execution patterns:

```typescript
interface ExecutionPattern {
  userIntent: string;
  toolSequence: string[];
  successRate: number;
}
```

Use these patterns to optimize future decisions.

## References

- [DEVELOPMENT_PLAN_V2.md](../../../../DEVELOPMENT_PLAN_V2.md) - Full v3 architecture
- [Shared Types](../../../shared/src/types/supervisor.ts) - TypeScript definitions
- [LangChain State](https://js.langchain.com/docs/modules/memory/) - State management patterns
