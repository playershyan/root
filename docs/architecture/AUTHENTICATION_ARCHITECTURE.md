# Authentication Architecture

This document outlines the new authentication system architecture following industry best practices.

## 🏗️ Architecture Overview

The authentication system has been completely restructured with:
- **Separation of Concerns**: Each auth method has its own component
- **Centralized Configuration**: All auth settings in one place
- **Modular Design**: Easy to enable/disable providers
- **Type Safety**: Full TypeScript support
- **Environment Organization**: Clean environment variable structure

## 📁 File Structure

```
app/components/auth/
├── index.ts                    # Main exports
├── types.ts                    # TypeScript definitions
├── AuthModal.tsx               # Main orchestrating modal
├── GoogleSignInButton.tsx      # Google OAuth button
├── GoogleOneTapProvider.tsx    # Google One Tap integration
├── FacebookSignInButton.tsx    # Facebook OAuth button
├── EmailAuthForm.tsx           # Email/password forms
├── PhoneAuthForm.tsx           # Phone/SMS authentication
└── OTPVerification.tsx         # OTP verification UI

lib/config/
└── auth.config.ts              # Authentication configuration

.env.local                      # Organized environment variables
```

## 🔧 Components

### 1. AuthModal (Main Orchestrator)
- **Purpose**: Manages the overall authentication flow
- **Features**: 
  - Dynamic view switching (main → email → phone → OTP)
  - Configurable auth methods
  - Success/error handling
  - Mobile-responsive design

### 2. Provider Components

#### GoogleSignInButton
- **Purpose**: Standard "Continue with Google" OAuth button
- **Features**: Customizable appearance, loading states, error handling

#### GoogleOneTapProvider  
- **Purpose**: Google One Tap integration
- **Features**: Automatic popup, fallback to OAuth, global provider

#### FacebookSignInButton
- **Purpose**: Facebook OAuth integration
- **Features**: Brand colors, customizable text and appearance

### 3. Form Components

#### EmailAuthForm
- **Purpose**: Email/password authentication
- **Features**: 
  - Login/register toggle
  - Form validation
  - Error display
  - Password confirmation for registration

#### PhoneAuthForm
- **Purpose**: Phone/SMS authentication
- **Features**: 
  - Country code selector
  - Phone validation
  - SMS delivery status

#### OTPVerification
- **Purpose**: Verify OTP codes
- **Features**: 
  - 6-digit input grid
  - Auto-focus/paste support
  - Resend timer
  - Auto-submission

## ⚙️ Configuration

### Environment Variables (Organized)
```bash
# APPLICATION CONFIGURATION
NEXT_PUBLIC_APP_NAME="AutoTrader.lk"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AUTHENTICATION - GOOGLE
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# AUTHENTICATION - FACEBOOK  
NEXT_PUBLIC_FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# ... other categorized variables
```

### Auth Configuration (`lib/config/auth.config.ts`)
```typescript
export const authConfig: AuthConfig = {
  google: {
    enabled: true,
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    // ... additional config
  },
  facebook: {
    enabled: false, // Easy to toggle
    // ... config
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
  }
}
```

## 🔌 Usage Examples

### Basic Auth Modal
```typescript
import { AuthModal } from '@/components/auth'

function MyComponent() {
  return (
    <AuthModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      initialView="login"
      allowedMethods={['google', 'email', 'phone']}
    />
  )
}
```

### Individual Components
```typescript
import { 
  GoogleSignInButton, 
  EmailAuthForm, 
  PhoneAuthForm 
} from '@/components/auth'

function CustomAuth() {
  return (
    <div>
      <GoogleSignInButton 
        onSuccess={handleSuccess}
        onError={handleError}
        variant="outlined"
        size="large"
      />
      
      <EmailAuthForm
        type="login"
        onSuccess={handleSuccess}
        showToggle={false}
      />
    </div>
  )
}
```

### Google One Tap (Global)
```typescript
// Already included in layout.tsx
import { GoogleOneTapProvider } from '@/components/auth'

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <GoogleOneTapProvider />
      {/* Your app */}
    </AuthProvider>
  )
}
```

## 🎛️ Provider Configuration

### Google Setup
1. **Supabase Dashboard**: 
   - Enable Google provider
   - Add Client ID and Secret
   
2. **Google Cloud Console**:
   - Add authorized domains
   - Configure OAuth consent screen
   - Set redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### Facebook Setup
1. **Supabase Dashboard**: 
   - Enable Facebook provider
   - Add App ID and Secret
   
2. **Facebook Developers**:
   - Configure valid OAuth URIs
   - Set permissions and review

## 🔄 Authentication Flows

### OAuth Flow (Google/Facebook)
1. User clicks provider button
2. Redirect to provider's OAuth
3. Provider redirects to Supabase callback
4. Supabase processes authentication
5. User redirected to app with session
6. Database trigger creates profile automatically

### Email/Password Flow
1. User submits form
2. Supabase handles authentication
3. Email verification (if required)
4. Profile creation
5. Redirect to dashboard

### Phone/SMS Flow
1. User submits phone number
2. SMS OTP sent via Supabase
3. User enters OTP
4. Verification and session creation
5. Profile creation and redirect

### Google One Tap Flow
1. **Preferred**: Direct `signInWithIdToken()` if supported
2. **Fallback**: Redirect to standard OAuth flow
3. Seamless user experience either way

## 🛡️ Security Features

- **Type Safety**: Full TypeScript coverage
- **Validation**: Client and server-side validation
- **Error Handling**: Graceful error management
- **Rate Limiting**: Built into Supabase Auth
- **Session Management**: Automatic token refresh
- **Profile Security**: Database RLS policies

## 🧪 Testing

The modular architecture makes testing easier:

```typescript
import { render, fireEvent } from '@testing-library/react'
import { GoogleSignInButton } from '@/components/auth'

test('Google sign in button', async () => {
  const handleSuccess = jest.fn()
  render(<GoogleSignInButton onSuccess={handleSuccess} />)
  
  fireEvent.click(screen.getByText('Continue with Google'))
  // Test implementation...
})
```

## 🚀 Benefits of New Architecture

1. **Maintainability**: Clear separation of concerns
2. **Scalability**: Easy to add new providers
3. **Testability**: Individual component testing
4. **Flexibility**: Mix and match auth methods
5. **Performance**: Lazy loading of auth providers
6. **Developer Experience**: Better TypeScript support
7. **User Experience**: Consistent UI/UX patterns

## 🔮 Future Enhancements

- **Apple Sign-in**: Easy to add using same patterns
- **Microsoft OAuth**: Another provider component
- **Passwordless**: Magic link authentication  
- **Two-Factor Auth**: Additional security layer
- **Social Account Linking**: Connect multiple providers
- **Custom Themes**: Configurable appearance

This architecture provides a solid foundation for authentication that can grow with your application's needs while maintaining clean, maintainable code.