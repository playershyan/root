import { useEffect, useState } from 'react';
import { recaptchaClient } from '@/lib/utils/recaptcha-client';

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
      } catch (err) {
        setError('Failed to load reCAPTCHA');
        console.error('reCAPTCHA loading error:', err);
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
      console.error(`reCAPTCHA token generation failed for action "${action}":`, err);
      return null;
    }
  };

  /**
   * Get token specifically for AI requests
   */
  const getAIToken = async (): Promise<string | null> => {
    return getToken('ai');
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