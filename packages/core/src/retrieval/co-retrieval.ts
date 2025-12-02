/**
 * Lens Service v3 - Co-Retrieval Learning
 *
 * Implements learnable usage vectors that adapt based on:
 * 1. Which documents are retrieved together
 * 2. Which documents are actually used/clicked by users
 * 3. Which documents the agent selects for responses
 *
 * The system maintains a co-retrieval matrix and periodically
 * updates usage vectors based on accumulated feedback.
 */

import type {
  FeedbackEvent,
  FeedbackSource,
  CoRetrievalMatrixEntry,
  UsageVectorUpdateJob,
} from '@lens-service/shared';
import {
  DEFAULT_USAGE_VECTOR_LEARNING_RATE,
  DEFAULT_USAGE_VECTOR_BATCH_SIZE,
  MIN_FEEDBACK_FOR_UPDATE,
} from '@lens-service/shared';
import { DatabaseService } from '../services/database-service';
import { EmbeddingService } from '../services/embedding-service';
import { generateId, normalizeVector, addVectors, scaleVector } from '@lens-service/shared';

export interface CoRetrievalConfig {
  learningRate?: number;
  batchSize?: number;
  minFeedbackForUpdate?: number;
  updateIntervalMs?: number;
  tableName: string;  // Table to update (e.g., 'products', 'manual_indexes')
}

export class CoRetrievalLearning {
  private db: DatabaseService;
  private embedding: EmbeddingService;
  private config: Required<CoRetrievalConfig>;
  private feedbackBuffer: FeedbackEvent[] = [];
  private updateTimer: NodeJS.Timeout | null = null;

  constructor(
    db: DatabaseService,
    embedding: EmbeddingService,
    config: CoRetrievalConfig
  ) {
    this.db = db;
    this.embedding = embedding;
    this.config = {
      learningRate: config.learningRate ?? DEFAULT_USAGE_VECTOR_LEARNING_RATE,
      batchSize: config.batchSize ?? DEFAULT_USAGE_VECTOR_BATCH_SIZE,
      minFeedbackForUpdate: config.minFeedbackForUpdate ?? MIN_FEEDBACK_FOR_UPDATE,
      updateIntervalMs: config.updateIntervalMs ?? 3600000, // 1 hour
      tableName: config.tableName,
    };
  }

  /**
   * Record a feedback event
   */
  async recordFeedback(event: Omit<FeedbackEvent, 'timestamp'>): Promise<void> {
    const feedback: FeedbackEvent = {
      ...event,
      tableName: this.config.tableName,
      timestamp: new Date(),
    };

    // Add to buffer
    this.feedbackBuffer.push(feedback);

    // Store in database for persistence
    await this.persistFeedback(feedback);

    // Update co-retrieval matrix
    await this.updateCoRetrievalMatrix(feedback);

    // Check if we should trigger an update
    if (this.feedbackBuffer.length >= this.config.minFeedbackForUpdate) {
      this.scheduleUsageVectorUpdate();
    }
  }

  /**
   * Record that an agent selected certain documents for its response
   */
  async recordAgentSelection(
    queryVector: number[],
    retrievedDocIds: string[],
    selectedDocIds: string[],
    sessionId?: string,
    userId?: string
  ): Promise<void> {
    const skippedDocs = retrievedDocIds.filter((id) => !selectedDocIds.includes(id));

    await this.recordFeedback({
      queryVector,
      retrievedDocs: retrievedDocIds,
      usedDocs: selectedDocIds,
      skippedDocs,
      source: 'agent_selection',
      tableName: this.config.tableName,
      sessionId,
      userId,
    });
  }

  /**
   * Record a user click on a document
   */
  async recordUserClick(
    queryVector: number[],
    retrievedDocIds: string[],
    clickedDocId: string,
    sessionId?: string,
    userId?: string
  ): Promise<void> {
    await this.recordFeedback({
      queryVector,
      retrievedDocs: retrievedDocIds,
      usedDocs: [clickedDocId],
      skippedDocs: retrievedDocIds.filter((id) => id !== clickedDocId),
      source: 'user_click',
      tableName: this.config.tableName,
      sessionId,
      userId,
    });
  }

  /**
   * Record a purchase conversion
   */
  async recordPurchase(
    queryVector: number[],
    retrievedDocIds: string[],
    purchasedDocIds: string[],
    sessionId?: string,
    userId?: string
  ): Promise<void> {
    await this.recordFeedback({
      queryVector,
      retrievedDocs: retrievedDocIds,
      usedDocs: purchasedDocIds,
      skippedDocs: retrievedDocIds.filter((id) => !purchasedDocIds.includes(id)),
      source: 'purchase',
      tableName: this.config.tableName,
      sessionId,
      userId,
    });
  }

  /**
   * Persist feedback event to database
   */
  private async persistFeedback(feedback: FeedbackEvent): Promise<void> {
    await this.db.insert({
      tableName: 'co_retrieval_feedback',
      data: {
        id: generateId('fb'),
        query_vector: JSON.stringify(feedback.queryVector),
        retrieved_docs: feedback.retrievedDocs,
        used_docs: feedback.usedDocs,
        skipped_docs: feedback.skippedDocs,
        source: feedback.source,
        table_name: feedback.tableName,
        session_id: feedback.sessionId,
        user_id: feedback.userId,
        created_at: feedback.timestamp,
      },
    });
  }

  /**
   * Update co-retrieval matrix with new feedback
   */
  private async updateCoRetrievalMatrix(feedback: FeedbackEvent): Promise<void> {
    const { usedDocs, skippedDocs, tableName } = feedback;

    // Update co-occurrence counts for used docs (positive signal)
    for (let i = 0; i < usedDocs.length; i++) {
      for (let j = i + 1; j < usedDocs.length; j++) {
        await this.updateMatrixEntry(usedDocs[i], usedDocs[j], tableName, true);
      }
    }

    // Update negative signal for used vs skipped pairs
    for (const usedDoc of usedDocs) {
      for (const skippedDoc of skippedDocs) {
        await this.updateMatrixEntry(usedDoc, skippedDoc, tableName, false);
      }
    }
  }

  /**
   * Update a single entry in the co-retrieval matrix
   */
  private async updateMatrixEntry(
    docA: string,
    docB: string,
    tableName: string,
    isPositive: boolean
  ): Promise<void> {
    // Ensure consistent ordering (smaller ID first)
    const [first, second] = docA < docB ? [docA, docB] : [docB, docA];

    // Upsert the matrix entry
    const sql = `
      INSERT INTO co_retrieval_matrix (doc_a, doc_b, table_name, co_occurrence, positive, negative, affinity)
      VALUES ($1, $2, $3, 1, $4, $5, $6)
      ON CONFLICT (doc_a, doc_b, table_name)
      DO UPDATE SET
        co_occurrence = co_retrieval_matrix.co_occurrence + 1,
        positive = co_retrieval_matrix.positive + $4,
        negative = co_retrieval_matrix.negative + $5,
        affinity = CASE
          WHEN co_retrieval_matrix.co_occurrence + 1 > 0
          THEN (co_retrieval_matrix.positive + $4 - co_retrieval_matrix.negative - $5)::float
               / (co_retrieval_matrix.co_occurrence + 1)
          ELSE 0
        END,
        updated_at = NOW()
    `;

    await this.db.query(sql, [
      first,
      second,
      tableName,
      isPositive ? 1 : 0,
      isPositive ? 0 : 1,
      isPositive ? 1 : -1,
    ]);
  }

  /**
   * Schedule usage vector update
   */
  private scheduleUsageVectorUpdate(): void {
    if (this.updateTimer) {
      return; // Already scheduled
    }

    // Run update after a short delay to batch multiple feedbacks
    this.updateTimer = setTimeout(() => {
      this.processUsageVectorUpdates().catch((err) => {
        console.error('[CoRetrieval] Error processing usage vector updates:', err);
      });
      this.updateTimer = null;
    }, 5000); // 5 second delay
  }

  /**
   * Process accumulated feedback and update usage vectors
   */
  async processUsageVectorUpdates(): Promise<void> {
    console.log(`[CoRetrieval] Processing ${this.feedbackBuffer.length} feedback events`);

    // Get documents that need updates
    const docIds = new Set<string>();
    for (const feedback of this.feedbackBuffer) {
      feedback.usedDocs.forEach((id) => docIds.add(id));
      feedback.skippedDocs.forEach((id) => docIds.add(id));
    }

    // Process in batches
    const docIdArray = Array.from(docIds);
    for (let i = 0; i < docIdArray.length; i += this.config.batchSize) {
      const batch = docIdArray.slice(i, i + this.config.batchSize);
      await this.updateUsageVectorsForDocs(batch);
    }

    // Clear buffer
    this.feedbackBuffer = [];

    console.log(`[CoRetrieval] Updated usage vectors for ${docIds.size} documents`);
  }

  /**
   * Update usage vectors for a batch of documents
   */
  private async updateUsageVectorsForDocs(docIds: string[]): Promise<void> {
    for (const docId of docIds) {
      try {
        await this.updateSingleUsageVector(docId);
      } catch (error) {
        console.error(`[CoRetrieval] Failed to update usage vector for ${docId}:`, error);
      }
    }
  }

  /**
   * Update the usage vector for a single document
   */
  private async updateSingleUsageVector(docId: string): Promise<void> {
    // Get current vectors
    const docResult = await this.db.query(
      `SELECT content_vector, usage_vector FROM ${this.config.tableName} WHERE id = $1`,
      [docId]
    );

    if (docResult.data.length === 0) return;

    const doc = docResult.data[0];
    const contentVector = doc.content_vector as number[];
    let usageVector = doc.usage_vector as number[] | null;

    // Initialize usage vector from content vector if not exists
    if (!usageVector) {
      usageVector = [...contentVector];
    }

    // Get co-retrieval affinities for this document
    const affinityResult = await this.db.query(
      `SELECT doc_b as related_doc, affinity
       FROM co_retrieval_matrix
       WHERE doc_a = $1 AND table_name = $2 AND affinity > 0
       UNION
       SELECT doc_a as related_doc, affinity
       FROM co_retrieval_matrix
       WHERE doc_b = $1 AND table_name = $2 AND affinity > 0
       ORDER BY affinity DESC
       LIMIT 20`,
      [docId, this.config.tableName]
    );

    if (affinityResult.data.length === 0) return;

    // Get content vectors of related documents
    const relatedIds = affinityResult.data.map((r) => r.related_doc);
    const relatedResult = await this.db.query(
      `SELECT id, content_vector FROM ${this.config.tableName} WHERE id = ANY($1)`,
      [relatedIds]
    );

    // Build affinity map
    const affinityMap = new Map<string, number>();
    affinityResult.data.forEach((r) => {
      affinityMap.set(r.related_doc as string, r.affinity as number);
    });

    // Calculate gradient: weighted sum of related document vectors
    let gradient = new Array(usageVector.length).fill(0);
    let totalWeight = 0;

    for (const related of relatedResult.data) {
      const relatedVector = related.content_vector as number[];
      const affinity = affinityMap.get(related.id as string) ?? 0;

      gradient = addVectors(gradient, scaleVector(relatedVector, affinity));
      totalWeight += Math.abs(affinity);
    }

    if (totalWeight > 0) {
      gradient = scaleVector(gradient, 1 / totalWeight);
    }

    // Update usage vector with gradient descent
    const newUsageVector = normalizeVector(
      addVectors(usageVector, scaleVector(gradient, this.config.learningRate))
    );

    // Save updated usage vector
    await this.db.query(
      `UPDATE ${this.config.tableName}
       SET usage_vector = $1, usage_vector_updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(newUsageVector), docId]
    );
  }

  /**
   * Get co-retrieval statistics for a document
   */
  async getDocumentStats(docId: string): Promise<{
    totalCoOccurrences: number;
    positiveSignals: number;
    negativeSignals: number;
    topRelatedDocs: Array<{ id: string; affinity: number }>;
  }> {
    const result = await this.db.query(
      `SELECT
         SUM(co_occurrence) as total_co_occurrences,
         SUM(positive) as positive_signals,
         SUM(negative) as negative_signals
       FROM co_retrieval_matrix
       WHERE (doc_a = $1 OR doc_b = $1) AND table_name = $2`,
      [docId, this.config.tableName]
    );

    const topRelatedResult = await this.db.query(
      `SELECT
         CASE WHEN doc_a = $1 THEN doc_b ELSE doc_a END as related_id,
         affinity
       FROM co_retrieval_matrix
       WHERE (doc_a = $1 OR doc_b = $1) AND table_name = $2
       ORDER BY affinity DESC
       LIMIT 10`,
      [docId, this.config.tableName]
    );

    const stats = result.data[0] || {};

    return {
      totalCoOccurrences: (stats.total_co_occurrences as number) || 0,
      positiveSignals: (stats.positive_signals as number) || 0,
      negativeSignals: (stats.negative_signals as number) || 0,
      topRelatedDocs: topRelatedResult.data.map((r) => ({
        id: r.related_id as string,
        affinity: r.affinity as number,
      })),
    };
  }

  /**
   * Start periodic usage vector updates
   */
  startPeriodicUpdates(): void {
    setInterval(() => {
      if (this.feedbackBuffer.length > 0) {
        this.processUsageVectorUpdates().catch((err) => {
          console.error('[CoRetrieval] Periodic update error:', err);
        });
      }
    }, this.config.updateIntervalMs);

    console.log(`[CoRetrieval] Started periodic updates every ${this.config.updateIntervalMs}ms`);
  }

  /**
   * Initialize database tables for co-retrieval learning
   */
  async initializeTables(): Promise<void> {
    // Create feedback table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS co_retrieval_feedback (
        id VARCHAR(50) PRIMARY KEY,
        query_vector JSONB NOT NULL,
        retrieved_docs TEXT[] NOT NULL,
        used_docs TEXT[] NOT NULL,
        skipped_docs TEXT[] NOT NULL,
        source VARCHAR(50) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        session_id VARCHAR(100),
        user_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create co-retrieval matrix table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS co_retrieval_matrix (
        doc_a VARCHAR(100) NOT NULL,
        doc_b VARCHAR(100) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        co_occurrence INTEGER DEFAULT 0,
        positive INTEGER DEFAULT 0,
        negative INTEGER DEFAULT 0,
        affinity FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (doc_a, doc_b, table_name)
      )
    `);

    // Create index for efficient lookups
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_co_retrieval_matrix_doc_a
      ON co_retrieval_matrix (doc_a, table_name)
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_co_retrieval_matrix_doc_b
      ON co_retrieval_matrix (doc_b, table_name)
    `);

    console.log('[CoRetrieval] Initialized database tables');
  }
}
