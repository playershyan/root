/**
 * Client-side reCAPTCHA v3 integration utility
 * Loads Google reCAPTCHA v3 script and provides token generation functions
 */

import { logger } from './logger'

// Global interface for reCAPTCHA
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export class RecaptchaClient {
  private static instance: RecaptchaClient | null = null;
  private siteKey: string;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private readonly tokenTTL = 110_000; // ~110s to stay within 120s reCAPTCHA validity window
  private prefetchedTokens = new Map<string, { token: string; timestamp: number }>();
  private preloadPromises = new Map<string, Promise<void>>();

  private constructor() {
    this.siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
    logger.debug('reCAPTCHA Site Key:', { configured: !!this.siteKey });
  }

  public static getInstance(): RecaptchaClient {
    if (!RecaptchaClient.instance) {
      RecaptchaClient.instance = new RecaptchaClient();
    }
    return RecaptchaClient.instance;
  }

  /**
   * Load the reCAPTCHA v3 script if not already loaded
   */
  public async loadScript(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    if (!this.siteKey) {
      logger.warn('reCAPTCHA site key not configured', new Error('Missing site key'));
      return Promise.resolve();
    }

    this.isLoading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.querySelector('script[src*="recaptcha"]')) {
        this.isLoaded = true;
        this.isLoading = false;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.isLoaded = true;
        this.isLoading = false;
        resolve();
      };
      
      script.onerror = () => {
        this.isLoading = false;
        reject(new Error('Failed to load reCAPTCHA script'));
      };
      
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Execute reCAPTCHA and get token for specific action.
   * Consumes any prefetched token first. When a cached token is used,
   * the next token is prefetched in the background.
   * 
   * @param action - The reCAPTCHA action name
   * @param options - Options for token generation
   * @param options.skipPrefetch - Skip prefetching next token
   * @param options.forceFresh - Force a fresh token (skip cache) - use this for critical operations like login
   */
  public async getToken(action: string, options: { skipPrefetch?: boolean; forceFresh?: boolean } = {}): Promise<string | null> {
    if (!this.siteKey) {
      logger.warn('reCAPTCHA not configured, skipping token generation', new Error('Missing site key'));
      return null;
    }

    // If forceFresh is true, skip cache and always get a new token
    if (!options.forceFresh) {
      const cached = this.consumePrefetchedToken(action);
      if (cached) {
        if (!options.skipPrefetch) {
          this.preloadToken(action).catch(err => logger.debug('reCAPTCHA preload refresh failed', { action, error: err instanceof Error ? err.message : String(err) }));
        }
        return cached;
      }
    } else {
      // Clear any cached token for this action when forcing fresh
      this.prefetchedTokens.delete(action);
    }

    const token = await this.requestToken(action);
    if (!options.skipPrefetch) {
      this.preloadToken(action).catch(err => logger.debug('reCAPTCHA preload refresh failed', { action, error: err instanceof Error ? err.message : String(err) }));
    }
    return token;
  }

  /**
   * Preload a token for later consumption.
   * Ensures only one active preload request per action.
   */
  public async preloadToken(action: string): Promise<void> {
    if (!this.siteKey) {
      return;
    }

    const existing = this.prefetchedTokens.get(action);
    if (existing && this.isTokenValid(existing.timestamp)) {
      return;
    }

    if (this.preloadPromises.has(action)) {
      return this.preloadPromises.get(action)!;
    }

    const preload = (async () => {
      const token = await this.requestToken(action);
      if (token) {
        this.prefetchedTokens.set(action, { token, timestamp: Date.now() });
      }
    })().catch(err => {
      logger.debug('reCAPTCHA preload failed', { action, error: err instanceof Error ? err.message : String(err) });
    }).finally(() => {
      this.preloadPromises.delete(action);
    });

    this.preloadPromises.set(action, preload);
    await preload;
  }

  /**
   * Execute the reCAPTCHA flow to acquire a fresh token.
   */
  private async requestToken(action: string): Promise<string | null> {
    try {
      await this.loadScript();

      if (!window.grecaptcha) {
        logger.warn('reCAPTCHA not available', new Error('grecaptcha not loaded'));
        return null;
      }

      return new Promise<string>((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(this.siteKey, { action })
            .then(resolve)
            .catch(reject);
        });
      });
    } catch (error) {
      logger.error('reCAPTCHA token generation failed', error as Error);
      return null;
    }
  }

  /**
   * Consume and invalidate a prefetched token if it is still valid.
   */
  private consumePrefetchedToken(action: string): string | null {
    const entry = this.prefetchedTokens.get(action);
    if (!entry) {
      return null;
    }

    if (!this.isTokenValid(entry.timestamp)) {
      this.prefetchedTokens.delete(action);
      return null;
    }

    this.prefetchedTokens.delete(action);
    return entry.token;
  }

  private isTokenValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.tokenTTL;
  }

  /**
   * Get token for AI description requests
   */
  public async getAIToken(): Promise<string | null> {
    return this.getToken('ai_description');
  }

  /**
   * Get token for AI guide requests
   */
  public async getAIGuideToken(): Promise<string | null> {
    return this.getToken('ai_guide');
  }

  /**
   * Check if reCAPTCHA is enabled and configured
   */
  public isEnabled(): boolean {
    return !!this.siteKey;
  }
}

// Export singleton instance
export const recaptchaClient = RecaptchaClient.getInstance();