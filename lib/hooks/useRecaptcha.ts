import { useEffect, useState } from 'react';
import { recaptchaClient } from '@/lib/utils/recaptcha-client';
import { logger } from '@/lib/utils/logger';

/**
 * React hook for using reCAPTCHA v3
 * Automatically loads the script and provides token generation functions
 */
export function useRecaptcha() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recaptchaClient.isEnabled()) {
      return;
    }

    const loadRecaptcha = async () => {
      if (isLoaded) return;
      
      setIsLoading(true);
      setError(null);

      try {
        await recaptchaClient.loadScript();
        setIsLoaded(true);
        recaptchaClient.preloadToken('ai_description').catch(err => {
          logger.debug('Initial reCAPTCHA preload failed', { error: err instanceof Error ? err.message : String(err) });
        });
      } catch (err) {
        setError('Failed to load reCAPTCHA');
        logger.error('reCAPTCHA loading error', err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecaptcha();
  }, [isLoaded]);

  /**
   * Get reCAPTCHA token for a specific action
   */
  const getToken = async (action: string): Promise<string | null> => {
    if (!recaptchaClient.isEnabled()) {
      return null;
    }

    try {
      return await recaptchaClient.getToken(action);
    } catch (err) {
      logger.error(`reCAPTCHA token generation failed for action "${action}"`, err as Error);
      return null;
    }
  };

  /**
   * Get token specifically for AI requests
   */
  const getAIToken = async (): Promise<string | null> => {
    return getToken('ai_description');
  };

  return {
    isLoaded,
    isLoading,
    error,
    isEnabled: recaptchaClient.isEnabled(),
    getToken,
    getAIToken,
  };
}