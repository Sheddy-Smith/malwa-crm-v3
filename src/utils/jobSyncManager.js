/**
 * Job Module Sync Manager
 * Handles offline operations queue processing per JOB_MODULE_RELATION.md
 */

import { dbOperations } from '@/lib/db';

class JobSyncManager {
  constructor() {
    this.isProcessing = false;
    this.maxRetries = 3;
    this.processingInterval = null;
  }

  /**
   * Start automatic sync processing
   */
  startAutoSync(intervalMs = 30000) {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);

    // Process immediately on start
    this.processQueue();
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Process offline operations queue
   * Per spec: FIFO with priority rules
   */
  async processQueue() {
    if (this.isProcessing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending operations
      const operations = await dbOperations.getByIndex('offline_operations', 'status', 'pending');
      
      if (operations.length === 0) {
        console.log('No pending operations to sync');
        this.isProcessing = false;
        return;
      }

      // Sort by priority (high first) and then by createdAt (FIFO)
      const sortedOps = operations.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal'];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      console.log(`Processing ${sortedOps.length} offline operations...`);

      for (const op of sortedOps) {
        try {
          await this.processOperation(op);
        } catch (error) {
          console.error(`Failed to process operation ${op.id}:`, error);
          await this.handleOperationError(op, error);
        }
      }

      console.log('Sync queue processing completed');
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single operation
   */
  async processOperation(operation) {
    console.log(`Processing operation: ${operation.id} (${operation.opType})`);

    // In a real implementation, this would sync with a remote server
    // For now, we'll simulate successful processing
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check for conflicts (simulated)
    const hasConflict = Math.random() < 0.05; // 5% chance of conflict for demo

    if (hasConflict) {
      await this.handleConflict(operation);
      return;
    }

    // Mark as synced
    await this.markOperationComplete(operation);
  }

  /**
   * Mark operation as complete and update related records
   */
  async markOperationComplete(operation) {
    try {
      // Update the operation status
      await dbOperations.update('offline_operations', operation.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // Update related records with server version (simulated)
      const serverVersion = Date.now();
      
      if (operation.stores && operation.payload) {
        for (const storeName of operation.stores) {
          const storeData = operation.payload[storeName] || operation.payload[storeName.replace('_', '')];
          
          if (storeData) {
            if (Array.isArray(storeData)) {
              // Handle array of records
              for (const record of storeData) {
                if (record.id) {
                  try {
                    await dbOperations.update(storeName, record.id, {
                      syncStatus: 'synced',
                      serverVersion
                    });
                  } catch (err) {
                    console.warn(`Could not update ${storeName} record ${record.id}:`, err);
                  }
                }
              }
            } else if (storeData.id) {
              // Handle single record
              try {
                await dbOperations.update(storeName, storeData.id, {
                  syncStatus: 'synced',
                  serverVersion
                });
              } catch (err) {
                console.warn(`Could not update ${storeName} record ${storeData.id}:`, err);
              }
            }
          }
        }
      }

      console.log(`Operation ${operation.id} completed successfully`);
    } catch (error) {
      console.error(`Failed to mark operation complete:`, error);
      throw error;
    }
  }

  /**
   * Handle operation processing error
   */
  async handleOperationError(operation, error) {
    const retryCount = (operation.retryCount || 0) + 1;

    if (retryCount >= this.maxRetries) {
      // Mark as failed after max retries
      await dbOperations.update('offline_operations', operation.id, {
        status: 'failed',
        retryCount,
        lastError: error.message,
        failedAt: new Date().toISOString()
      });

      console.error(`Operation ${operation.id} failed after ${retryCount} retries`);
    } else {
      // Increment retry count
      await dbOperations.update('offline_operations', operation.id, {
        retryCount,
        lastError: error.message,
        lastAttemptAt: new Date().toISOString()
      });

      console.log(`Operation ${operation.id} will retry (attempt ${retryCount}/${this.maxRetries})`);
    }
  }

  /**
   * Handle sync conflict
   */
  async handleConflict(operation) {
    console.warn(`Conflict detected for operation ${operation.id}`);

    // Create conflict record
    const conflict = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operationId: operation.id,
      stores: operation.stores,
      localData: operation.payload,
      serverData: null, // Would be fetched from server
      createdAt: new Date().toISOString(),
      resolved: false
    };

    await dbOperations.insert('conflicts', conflict);

    // Mark operation as conflicted
    await dbOperations.update('offline_operations', operation.id, {
      status: 'conflict',
      conflictId: conflict.id,
      conflictedAt: new Date().toISOString()
    });

    console.log(`Conflict created: ${conflict.id} for operation ${operation.id}`);
  }

  /**
   * Retry failed operations
   */
  async retryFailedOperations() {
    const failedOps = await dbOperations.getByIndex('offline_operations', 'status', 'failed');
    
    for (const op of failedOps) {
      // Reset status to pending
      await dbOperations.update('offline_operations', op.id, {
        status: 'pending',
        retryCount: 0,
        lastError: null
      });
    }

    console.log(`Reset ${failedOps.length} failed operations for retry`);
    
    // Process queue
    await this.processQueue();
  }

  /**
   * Clear completed operations (cleanup)
   */
  async clearCompletedOperations(olderThanDays = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const allOps = await dbOperations.getAll('offline_operations');
    const completedOps = allOps.filter(op => 
      op.status === 'completed' && 
      new Date(op.completedAt) < cutoffDate
    );

    for (const op of completedOps) {
      await dbOperations.delete('offline_operations', op.id);
    }

    console.log(`Cleaned up ${completedOps.length} old completed operations`);
  }

  /**
   * Get sync status summary
   */
  async getSyncStatus() {
    const allOps = await dbOperations.getAll('offline_operations');
    
    const status = {
      total: allOps.length,
      pending: allOps.filter(op => op.status === 'pending').length,
      completed: allOps.filter(op => op.status === 'completed').length,
      failed: allOps.filter(op => op.status === 'failed').length,
      conflict: allOps.filter(op => op.status === 'conflict').length,
      isProcessing: this.isProcessing
    };

    return status;
  }
}

// Export singleton instance
export const syncManager = new JobSyncManager();

export default JobSyncManager;
