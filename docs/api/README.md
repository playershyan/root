# Vera.lk API Documentation

Welcome to the Vera.lk API documentation. This API provides programmatic access to Sri Lanka's leading vehicle marketplace platform.

## 🚀 Quick Start

### Base URLs

- **Production**: `https://vera.lk/api`
- **Staging**: `https://vera-lk-staging.vercel.app/api`  
- **Development**: `http://localhost:3000/api`

### Interactive Documentation

Visit our interactive API documentation:
- [Swagger UI Documentation](https://vera.lk/api/docs)
- [OpenAPI Specification](https://vera.lk/api/docs/openapi.json)

## 🔐 Authentication

Most endpoints require authentication using JWT tokens provided by Supabase Auth.

### Getting Started

1. Sign up or log in through our web interface or OAuth endpoints
2. Use the returned JWT token in the `Authorization` header:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

### Admin Endpoints

Admin endpoints require elevated permissions and are only accessible to authorized admin users.

## 📋 API Categories

### System Endpoints
- **Health Check**: Monitor system status and dependencies
- **Documentation**: Access API specifications and interactive docs

### Authentication
- **Google OAuth**: Sign in with Google credentials
- **Session Management**: Handle user sessions and tokens

### Listings Management
- **Create Listings**: Post new vehicle advertisements
- **Update Listings**: Modify existing listings
- **Delete Listings**: Soft delete (move to bin) listings
- **Mark as Sold**: Update listing status to sold
- **Pause/Resume**: Temporarily disable/enable listings
- **Renew**: Refresh listing visibility

### Wanted Requests
- **Create Requests**: Post vehicle wanted requests
- **Update Requests**: Modify existing requests
- **Close Requests**: Mark requests as fulfilled
- **Pause/Resume**: Temporarily disable/enable requests

### Admin Operations
- **Moderation**: Approve, reject, or review listings
- **User Management**: Handle user accounts and permissions
- **Analytics**: Access system metrics and reports

## 🔧 Rate Limiting

Our API implements rate limiting to ensure fair usage:

- **General API**: 100 requests per minute
- **Authentication**: 5 requests per 15 minutes
- **Search**: 30 requests per minute
- **Admin**: 200 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## 📝 Request/Response Format

### Request Format
- **Content-Type**: `application/json`
- **Body**: JSON formatted data
- **Headers**: Include authentication tokens where required

### Response Format
All API responses follow a consistent structure:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": "Additional error information"
}
```

## 🚨 Error Handling

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Internal server error |

## 💡 Best Practices

### 1. Authentication
- Always include proper authorization headers
- Handle token expiration gracefully
- Store tokens securely

### 2. Error Handling
- Check response status codes
- Handle rate limiting with exponential backoff
- Log errors appropriately

### 3. Pagination
- Use pagination parameters for large datasets
- Cache results when appropriate
- Respect pagination limits

### 4. Performance
- Use appropriate query parameters to filter data
- Implement client-side caching
- Minimize unnecessary requests

## 🔧 SDKs and Tools

### Postman Collection
Import our Postman collection for easy API testing:
- [Download Postman Collection](./postman-collection.json)

### Code Examples

#### JavaScript/Node.js
```javascript
const response = await fetch('https://vera.lk/api/listings', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

#### Python
```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get('https://vera.lk/api/listings', headers=headers)
data = response.json()
```

#### cURL
```bash
curl -X GET "https://vera.lk/api/listings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 🆘 Support

### Documentation
- [Interactive API Docs](https://vera.lk/api/docs)
- [OpenAPI Specification](https://vera.lk/api/docs/openapi.json)
- [GitHub Issues](https://github.com/vera-lk/api/issues)

### Contact
- **Email**: api@vera.lk
- **Support Portal**: https://support.vera.lk
- **Status Page**: https://status.vera.lk

### Community
- [Developer Forum](https://forum.vera.lk)
- [Discord Channel](https://discord.gg/vera-lk)

## 📄 License

This API documentation is proprietary to Vera.lk. Unauthorized use is prohibited.

## 🔄 Changelog

### v1.0.0 (Current)
- Initial API release
- Core listings and authentication endpoints
- Admin moderation capabilities
- Rate limiting implementation
- Comprehensive documentation

---

*Last updated: 2025-09-06*
*API Version: 1.0.0*