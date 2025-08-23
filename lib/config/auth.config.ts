/**
 * Authentication Configuration
 * Centralizes all authentication provider settings and configurations
 */

export interface AuthProviderConfig {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  additionalConfig?: Record<string, any>;
}

export interface AuthConfig {
  google: AuthProviderConfig;
  facebook: AuthProviderConfig;
  email: AuthProviderConfig;
  phone: AuthProviderConfig;
  redirectUrls: {
    afterLogin: string;
    afterLogout: string;
    afterRegistration: string;
  };
  features: {
    oneClickSignIn: boolean;
    rememberMe: boolean;
    socialRegistration: boolean;
  };
}

export const authConfig: AuthConfig = {
  google: {
    enabled: true,
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    additionalConfig: {
      scope: 'openid email profile',
      prompt: 'consent',
      access_type: 'offline',
    }
  },
  facebook: {
    enabled: false, // Will enable when configured
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
  },
  email: {
    enabled: true,
  },
  phone: {
    enabled: true,
  },
  redirectUrls: {
    afterLogin: '/profile',
    afterLogout: '/',
    afterRegistration: '/profile',
  },
  features: {
    oneClickSignIn: true,
    rememberMe: true,
    socialRegistration: true,
  },
};

export const validateAuthConfig = (): boolean => {
  const errors: string[] = [];

  if (authConfig.google.enabled && !authConfig.google.clientId) {
    errors.push('Google Client ID is required when Google auth is enabled');
  }

  if (authConfig.facebook.enabled && !authConfig.facebook.clientId) {
    errors.push('Facebook App ID is required when Facebook auth is enabled');
  }

  if (errors.length > 0) {
    console.error('Auth Configuration Errors:', errors);
    return false;
  }

  return true;
};