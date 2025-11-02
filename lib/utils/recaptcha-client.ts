/**
 * Client-side reCAPTCHA v3 integration utility
 * Loads Google reCAPTCHA v3 script and provides token generation functions
 */

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

  private constructor() {
    this.siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
    console.log('reCAPTCHA Site Key:', this.siteKey ? 'SET' : 'MISSING');
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
      console.warn('reCAPTCHA site key not configured');
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
   * Execute reCAPTCHA and get token for specific action
   */
  public async getToken(action: string): Promise<string | null> {
    if (!this.siteKey) {
      console.warn('reCAPTCHA not configured, skipping token generation');
      return null;
    }

    try {
      await this.loadScript();
      
      if (!window.grecaptcha) {
        console.warn('reCAPTCHA not available');
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
      console.error('reCAPTCHA token generation failed:', error);
      return null;
    }
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