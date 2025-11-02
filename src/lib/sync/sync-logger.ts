/**
 * Structured Logging for Sync Operations
 *
 * Provides detailed, structured logging for sync phases with metrics tracking.
 * Designed for production observability and debugging.
 */

export type SyncPhase =
  | 'init'
  | 'fetching'
  | 'location'
  | 'enriching'
  | 'storing'
  | 'calculating'
  | 'achievements'
  | 'background'
  | 'complete';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface SyncLogContext {
  userId: string;
  phase: SyncPhase;
  timestamp?: Date;
  duration?: number;
  [key: string]: any;
}

export interface SyncMetrics {
  userId: string;
  startTime: number;
  phases: Map<SyncPhase, PhaseMetrics>;
  totalDuration?: number;
  success: boolean;
  errorCode?: string;
}

export interface PhaseMetrics {
  phase: SyncPhase;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, any>;
}

/**
 * Sync Logger
 *
 * Provides structured logging with automatic metric tracking
 */
export class SyncLogger {
  private metrics: SyncMetrics;

  constructor(userId: string) {
    this.metrics = {
      userId,
      startTime: Date.now(),
      phases: new Map(),
      success: false,
    };
  }

  /**
   * Log a structured message
   */
  private log(level: LogLevel, event: string, context: SyncLogContext) {
    const logData = {
      level,
      event,
      timestamp: new Date().toISOString(),
      ...context,
    };

    // Use structured console logging (JSON in production, readable in dev)
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logData));
    } else {
      const emoji = {
        info: '📊',
        warn: '⚠️',
        error: '❌',
        debug: '🔍',
      }[level];

      console.log(
        `${emoji} [${context.phase}] ${event}`,
        context.duration ? `(${context.duration}ms)` : '',
        context
      );
    }
  }

  /**
   * Start tracking a phase
   */
  startPhase(phase: SyncPhase, metadata?: Record<string, any>) {
    const phaseMetrics: PhaseMetrics = {
      phase,
      startTime: Date.now(),
      success: false,
      metadata,
    };

    this.metrics.phases.set(phase, phaseMetrics);

    this.log('info', `sync.phase.${phase}.start`, {
      userId: this.metrics.userId,
      phase,
      ...metadata,
    });
  }

  /**
   * Complete a phase successfully
   */
  completePhase(phase: SyncPhase, metadata?: Record<string, any>) {
    const phaseMetrics = this.metrics.phases.get(phase);
    if (!phaseMetrics) {
      this.log('warn', `sync.phase.${phase}.not_started`, {
        userId: this.metrics.userId,
        phase,
      });
      return;
    }

    phaseMetrics.endTime = Date.now();
    phaseMetrics.duration = phaseMetrics.endTime - phaseMetrics.startTime;
    phaseMetrics.success = true;
    if (metadata) {
      phaseMetrics.metadata = { ...phaseMetrics.metadata, ...metadata };
    }

    this.log('info', `sync.phase.${phase}.complete`, {
      userId: this.metrics.userId,
      phase,
      duration: phaseMetrics.duration,
      ...metadata,
    });
  }

  /**
   * Mark a phase as failed
   */
  failPhase(phase: SyncPhase, errorCode: string, metadata?: Record<string, any>) {
    const phaseMetrics = this.metrics.phases.get(phase);
    if (phaseMetrics) {
      phaseMetrics.endTime = Date.now();
      phaseMetrics.duration = phaseMetrics.endTime - phaseMetrics.startTime;
      phaseMetrics.success = false;
      phaseMetrics.errorCode = errorCode;
      if (metadata) {
        phaseMetrics.metadata = { ...phaseMetrics.metadata, ...metadata };
      }
    }

    this.log('error', `sync.phase.${phase}.failed`, {
      userId: this.metrics.userId,
      phase,
      errorCode,
      duration: phaseMetrics?.duration,
      ...metadata,
    });
  }

  /**
   * Log info message
   */
  info(event: string, context: Partial<SyncLogContext>) {
    this.log('info', event, {
      userId: this.metrics.userId,
      phase: 'init',
      ...context,
    } as SyncLogContext);
  }

  /**
   * Log warning message
   */
  warn(event: string, context: Partial<SyncLogContext>) {
    this.log('warn', event, {
      userId: this.metrics.userId,
      phase: 'init',
      ...context,
    } as SyncLogContext);
  }

  /**
   * Log error message
   */
  error(event: string, context: Partial<SyncLogContext>) {
    this.log('error', event, {
      userId: this.metrics.userId,
      phase: 'init',
      ...context,
    } as SyncLogContext);
  }

  /**
   * Log debug message (only in development)
   */
  debug(event: string, context: Partial<SyncLogContext>) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', event, {
        userId: this.metrics.userId,
        phase: 'init',
        ...context,
      } as SyncLogContext);
    }
  }

  /**
   * Mark sync as complete and log final metrics
   */
  complete(success: boolean, errorCode?: string) {
    this.metrics.totalDuration = Date.now() - this.metrics.startTime;
    this.metrics.success = success;
    if (errorCode) {
      this.metrics.errorCode = errorCode;
    }

    // Calculate phase breakdown
    const phaseBreakdown: Record<string, number> = {};
    let totalPhaseTime = 0;

    this.metrics.phases.forEach((phase, name) => {
      if (phase.duration) {
        phaseBreakdown[name] = phase.duration;
        totalPhaseTime += phase.duration;
      }
    });

    this.log('info', 'sync.complete', {
      userId: this.metrics.userId,
      phase: 'complete',
      duration: this.metrics.totalDuration,
      success,
      errorCode,
      phaseCount: this.metrics.phases.size,
      phaseBreakdown,
      totalPhaseTime,
      overhead: this.metrics.totalDuration - totalPhaseTime,
    });
  }

  /**
   * Get metrics for external tracking/storage
   */
  getMetrics(): SyncMetrics {
    return {
      ...this.metrics,
      totalDuration: this.metrics.totalDuration || Date.now() - this.metrics.startTime,
    };
  }

  /**
   * Get metrics summary for display
   */
  getSummary() {
    const metrics = this.getMetrics();
    const phaseStats = Array.from(metrics.phases.values()).map(phase => ({
      phase: phase.phase,
      duration: phase.duration,
      success: phase.success,
      errorCode: phase.errorCode,
    }));

    return {
      userId: metrics.userId,
      totalDuration: metrics.totalDuration,
      success: metrics.success,
      errorCode: metrics.errorCode,
      phases: phaseStats,
      phaseCount: phaseStats.length,
      successfulPhases: phaseStats.filter(p => p.success).length,
      failedPhases: phaseStats.filter(p => !p.success).length,
    };
  }
}

/**
 * Create a new sync logger instance
 */
export function createSyncLogger(userId: string): SyncLogger {
  return new SyncLogger(userId);
}
