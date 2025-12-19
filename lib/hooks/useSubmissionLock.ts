/**
 * useSubmissionLock Hook
 * Prevents duplicate form submissions with client-side synchronous lock
 * 
 * Usage:
 * const { isSubmitting, lock, unlock } = useSubmissionLock();
 * 
 * const handleSubmit = async (e) => {
 *   e.preventDefault();
 *   if (!lock()) return; // Exit immediately if locked
 *   try {
 *     await submitForm();
 *   } finally {
 *     unlock();
 *   }
 * };
 */

import { useRef, useState } from 'react';

export function useSubmissionLock() {
  const lockRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Attempt to acquire lock
   * @returns true if lock acquired, false if already locked
   */
  const lock = (): boolean => {
    if (lockRef.current) {
      return false; // Already locked
    }
    lockRef.current = true;
    setIsSubmitting(true);
    return true;
  };

  /**
   * Release the lock
   */
  const unlock = (): void => {
    lockRef.current = false;
    setIsSubmitting(false);
  };

  return {
    isSubmitting,
    lock,
    unlock,
  };
}
