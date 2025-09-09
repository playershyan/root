# SMS Service Setup for Production

## Option 1: Twilio (Recommended)

### 1. Install Twilio
```bash
npm install twilio
```

### 2. Get Twilio Credentials
- Sign up at [twilio.com](https://twilio.com)
- Get Account SID, Auth Token, and phone number
- Add to `.env.local`:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Replace the sendSMS function in `/app/api/auth/send-phone-otp/route.ts`:

```typescript
import twilio from 'twilio'

async function sendSMS(phoneNumber: string, otp: string): Promise<boolean> {
  try {
    // For development, log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`SMS to ${phoneNumber}: Your verification code is ${otp}. Valid for 10 minutes.`)
      return true
    }

    // For production, send actual SMS
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )
    
    await client.messages.create({
      body: `Your verification code is ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: phoneNumber
    })
    
    return true
  } catch (error) {
    console.error('SMS sending failed:', error)
    return false
  }
}
```

## Option 2: AWS SNS

### 1. Install AWS SDK
```bash
npm install @aws-sdk/client-sns
```

### 2. Setup AWS credentials in `.env.local`:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

### 3. Replace sendSMS function:
```typescript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

async function sendSMS(phoneNumber: string, otp: string): Promise<boolean> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`SMS to ${phoneNumber}: Your verification code is ${otp}. Valid for 10 minutes.`)
      return true
    }

    const snsClient = new SNSClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })

    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: `Your verification code is ${otp}. Valid for 10 minutes.`
    })

    await snsClient.send(command)
    return true
  } catch (error) {
    console.error('SMS sending failed:', error)
    return false
  }
}
```

## Testing Steps

### Development Testing (Current):
1. Change phone number in profile
2. Check terminal output for OTP code
3. Enter code in verification popup

### Production Testing:
1. Deploy with SMS service configured
2. Change phone number in profile
3. Receive actual SMS on your phone
4. Enter code in verification popup

## Cost Estimates

### Twilio:
- ~$0.0075 per SMS (varies by country)
- ~100 SMS = $0.75

### AWS SNS:
- ~$0.00645 per SMS (varies by country)
- ~100 SMS = $0.65

## Security Best Practices

1. **Rate Limiting**: Already implemented (3 OTPs per hour per user)
2. **OTP Expiry**: Set to 10 minutes
3. **Attempt Limits**: Max 3 attempts per OTP
4. **Environment Variables**: Store credentials securely
5. **HTTPS Only**: Ensure all SMS endpoints use HTTPS in production