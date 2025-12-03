# Bulk Import Listings Guide

## Overview

The bulk import feature allows privileged users to import multiple vehicle listings at once from CSV or JSON format. This bypasses all validation requirements and automatically publishes listings.

## Access

- **URL**: `/admin/bulk-import`
- **Restriction**: Only user with UID `9b288153-3836-45ff-8f0b-8a196e423477` can access
- **API Endpoint**: `POST /api/admin/bulk-import-listings`

## Features

✅ **No validation required** - Import with any combination of fields
✅ **Auto-publish** - All imports go live immediately (status='active')
✅ **AI description generation** - Descriptions auto-generated from available data
✅ **Image upload** - Images uploaded to Cloudinary from URLs (preserves order)
✅ **Null price support** - Empty price displays "Price on Request"
✅ **Phone normalization** - Automatic Sri Lankan phone format
✅ **Error handling** - Detailed error reports per row

## CSV Format

### Required Headers

At minimum, include identifying information (at least one):
- `make` - Vehicle manufacturer
- `model` - Vehicle model

### All Available Fields

```csv
title,make,customMake,model,customModel,year,mileage,price,condition,fuelType,transmission,city,district,phone,whatsapp,email,imageUrls,vehicleType,engineCapacity,color,trim,negotiable,pricingType,financeType,outstandingBalance,monthlyPayment,remainingTerm,askingPrice
```

### Example CSV

```csv
title,make,model,year,mileage,price,condition,fuelType,transmission,city,district,phone,imageUrls,vehicleType
2015 Honda Civic,Honda,Civic,2015,85000,2500000,Used,Petrol,Automatic,Colombo,Colombo,0771234567,https://example.com/img1.jpg|https://example.com/img2.jpg,Car
2018 Toyota Aqua,Toyota,Aqua,2018,45000,,Used,Hybrid,Automatic,Kandy,Kandy,0772345678,https://example.com/img.jpg,Car
Mercedes Benz C200,Mercedes Benz,,2016,75000,3500000,Used,Petrol,Automatic,Galle,Galle,0773456789,,Car
```

**Note**: Leave price empty for "Price on Request" listings.

## JSON Format

### Option 1: Array of Objects

```json
[
  {
    "title": "2015 Honda Civic",
    "make": "Honda",
    "model": "Civic",
    "year": 2015,
    "mileage": 85000,
    "price": 2500000,
    "condition": "Used",
    "fuelType": "Petrol",
    "transmission": "Automatic",
    "city": "Colombo",
    "district": "Colombo",
    "phone": "0771234567",
    "imageUrls": "https://example.com/img1.jpg,https://example.com/img2.jpg",
    "vehicleType": "Car"
  },
  {
    "title": "2018 Toyota Aqua",
    "make": "Toyota",
    "model": "Aqua",
    "year": 2018,
    "mileage": 45000,
    "price": null,
    "condition": "Used",
    "fuelType": "Hybrid",
    "transmission": "Automatic",
    "city": "Kandy",
    "district": "Kandy",
    "phone": "0772345678",
    "imageUrls": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
    "vehicleType": "Car"
  }
]
```

### Option 2: Wrapper Object

```json
{
  "listings": [
    { /* listing data */ },
    { /* listing data */ }
  ]
}
```

### Option 3: CSV String in JSON

```json
{
  "csv": "title,make,model,year,price\n2015 Honda Civic,Honda,Civic,2015,2500000"
}
```

## Image URLs

**Supported Formats:**

1. **Comma-separated string:**
   ```
   "https://example.com/img1.jpg,https://example.com/img2.jpg,https://example.com/img3.jpg"
   ```

2. **Pipe-separated string:**
   ```
   "https://example.com/img1.jpg|https://example.com/img2.jpg"
   ```

3. **JSON array:**
   ```json
   ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
   ```

**Important:**
- Images are uploaded **in the order provided**
- First image becomes the primary listing image
- Failed image uploads don't fail the entire import
- Images must be publicly accessible URLs

## Using the Web Interface

1. Navigate to `/admin/bulk-import`
2. Choose CSV or JSON mode
3. Paste your data or load sample data
4. Click "Start Import"
5. View results:
   - Green: Successfully imported listings
   - Red: Failed imports with error details
   - Links to view imported listings

## Using the API Directly

### CSV Upload

```bash
curl -X POST http://localhost:3000/api/admin/bulk-import-listings \
  -H "Content-Type: text/csv" \
  -H "Cookie: your-auth-cookie" \
  --data-binary @listings.csv
```

### JSON Upload

```bash
curl -X POST http://localhost:3000/api/admin/bulk-import-listings \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "listings": [
      {
        "make": "Honda",
        "model": "Civic",
        "year": 2015,
        "price": 2500000
      }
    ]
  }'
```

## Response Format

```json
{
  "success": true,
  "imported": 45,
  "failed": 2,
  "message": "Import completed: 45 imported, 2 failed",
  "duration": "12534ms",
  "listings": [
    {
      "id": "uuid-1",
      "title": "2015 Honda Civic"
    }
  ],
  "errors": [
    {
      "row": 3,
      "error": "Image upload failed",
      "data": { /* row data */ }
    }
  ]
}
```

## Field Details

### Vehicle Type
Options: `Car`, `Van`, `Bus`, `Lorry`, `Motorcycle`, `Three-Wheeler`, `Bicycle`, `Tractor`, `Plant Machinery`, `Boat`

### Condition
Options: `New`, `Used`, `Refurbished`

### Fuel Type
Options: `Petrol`, `Diesel`, `Hybrid`, `Electric`

### Transmission
Options: `Automatic`, `Manual`

### Pricing Type
- `cash` (default) - Standard cash sale
- `finance` - Lease/finance takeover (requires `financeType`, `outstandingBalance`, `askingPrice`, etc.)

### Phone Numbers
- Automatically normalized to Sri Lankan format
- Accepts: `0771234567`, `771234567`, `+94771234567`
- Stored as: `+94771234567`

### Price
- Number in LKR (e.g., `2500000`)
- Leave empty or `null` for "Price on Request"
- Supports decimal values: `2500000.50`

## Best Practices

1. **Test with small batches first** - Import 5-10 listings to verify format
2. **Use valid image URLs** - Ensure images are publicly accessible
3. **Provide phone numbers** - Contact info is important for buyers
4. **Include location data** - City and district improve searchability
5. **Check error reports** - Fix issues in failed rows and re-import
6. **Keep backups** - Save your CSV/JSON before importing

## Troubleshooting

### "Unauthorized" Error
- Ensure you're logged in as the privileged user
- Check cookies/session

### "No listings to import"
- Verify CSV format (headers match field names)
- Check JSON syntax is valid
- Ensure at least one row/object provided

### Image Upload Failures
- Verify URLs are publicly accessible
- Check image format (JPG, PNG supported)
- Large images may timeout - resize before uploading

### Partial Imports
- Check error details for specific rows
- Common issues: invalid phone format, missing required fields for vehicle type
- Fix errors and re-import failed rows only

## Limitations

- Maximum 100 listings per batch (recommended)
- Image URL timeout: 30 seconds per image
- CSV parser is basic - complex CSV with quotes/escapes may need pre-processing
- No duplicate detection - same listing can be imported multiple times

## Notes

- All imports are associated with the privileged user account
- Listings are auto-approved (status='active')
- No OTP verification required for phone numbers
- No field validation applied (privileged user bypass)
- Descriptions auto-generated based on available fields
- Empty descriptions won't cause errors
