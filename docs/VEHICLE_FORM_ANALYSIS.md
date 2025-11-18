# Vehicle Category Form Fields Analysis

## Executive Summary

This document provides a comprehensive analysis of all vehicle categories and how form fields vary based on the selected vehicle category in the ad listing form. The form system uses a factory pattern with category-specific form components that configure a shared `BaseVehicleForm` component.

## Vehicle Categories

The system supports **10 vehicle categories**:

1. **Car** (`car`)
2. **Van** (`van`)
3. **Bus** (`bus`)
4. **Lorry/Truck** (`lorry`)
5. **Motorcycle** (`motorcycle`)
6. **Three Wheeler** (`three-wheeler`)
7. **Bicycle** (`bicycle`)
8. **Plant & Machinery** (`plant-machinery`)
9. **Tractor** (`tractor`)
10. **Boat** (`boat`)

## Form Field Configuration Matrix

### Core Fields (Always Visible)

| Field | Car | Van | Bus | Lorry | Motorcycle | Three-Wheeler | Bicycle | Plant-Machinery | Tractor | Boat |
|-------|-----|-----|-----|-------|------------|----------------|--------|-----------------|---------|------|
| **Title** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| **Make** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| **Condition** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |

### Variable Fields

| Field | Car | Van | Bus | Lorry | Motorcycle | Three-Wheeler | Bicycle | Plant-Machinery | Tractor | Boat |
|-------|-----|-----|-----|-------|------------|----------------|--------|-----------------|---------|------|
| **Model** | ✅ Required | ⚪ Optional | ⚪ Optional | ⚪ Optional | ⚪ Optional | ⚪ Optional | ❌ Hidden | ⚪ Optional | ⚪ Optional | ⚪ Optional |
| **Year** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Hidden | ✅ Required | ✅ Required | ✅ Required |
| **Mileage** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Hidden | ⚪ Optional | ⚪ Optional | ⚪ Optional |
| **Trim/Grade** | ✅ Required | ⚪ Optional | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| **Engine Capacity** | ⚪ Optional | ⚪ Optional | ⚪ Optional | ⚪ Optional | ⚪ Optional | ⚪ Optional | ❌ Hidden | ⚪ Optional | ⚪ Optional | ⚪ Optional |
| **Fuel Type** | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible | ❌ Hidden | ✅ Visible | ✅ Visible | ✅ Visible |
| **Transmission** | ⚪ Optional | ⚪ Optional | ⚪ Optional | ⚪ Optional | ❌ Hidden | ⚪ Optional | ❌ Hidden | ⚪ Optional | ⚪ Optional | ❌ Hidden |
| **Color** | ✅ Visible | ✅ Visible | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden |

**Legend:**
- ✅ Required = Field is visible and required
- ⚪ Optional = Field is visible but optional
- ❌ Hidden = Field is not shown for this category

## Detailed Category Analysis

### 1. Car (`car`)
**Most comprehensive form configuration**

**Visible Fields:**
- Model: ✅ **Required**
- Year: ✅ **Required**
- Mileage: ✅ **Required**
- Trim/Grade: ✅ **Required**
- Engine Capacity: ⚪ Optional
- Fuel Type: ✅ Visible (Petrol, Diesel, Hybrid, Electric, Plug-in Hybrid, Other)
- Transmission: ⚪ Optional (Manual, Automatic, CVT, Tiptronic)
- Color: ✅ Visible

**Special Features:**
- Shows Pricing Type section
- Shows Features section
- Shows Additional Information section (only for cars and vans)

**Fuel Types Available:**
- Petrol, Diesel, Hybrid, Electric, Plug-in Hybrid, Other

---

### 2. Van (`van`)
**Similar to cars but with relaxed requirements**

**Visible Fields:**
- Model: ⚪ **Optional** (relaxed from cars)
- Year: ✅ **Required**
- Mileage: ✅ **Required**
- Trim/Grade: ⚪ **Optional** (relaxed from cars)
- Engine Capacity: ⚪ Optional
- Fuel Type: ✅ Visible (Petrol, Diesel, Hybrid, Electric, Other)
- Transmission: ⚪ Optional
- Color: ✅ Visible

**Special Features:**
- Shows Pricing Type section
- Shows Features section
- Shows Additional Information section (only for cars and vans)

**Fuel Types Available:**
- Petrol, Diesel, Hybrid, Electric, Other

---

### 3. Bus (`bus`)
**Commercial vehicle configuration**

**Visible Fields:**
- Model: ⚪ **Optional**
- Year: ✅ **Required**
- Mileage: ✅ **Required**
- Trim/Grade: ❌ **Hidden** (not applicable)
- Engine Capacity: ⚪ Optional
- Fuel Type: ✅ Visible (Diesel, Petrol, Electric, CNG, LPG)
- Transmission: ⚪ Optional
- Color: ❌ **Hidden** (not typically relevant)

**Special Features:**
- Shows Pricing Type section
- Shows Features section
- Does NOT show Additional Information section

**Fuel Types Available:**
- Diesel, Petrol, Electric, CNG, LPG

---

### 4. Lorry/Truck (`lorry`)
**Commercial vehicle with no trim/color**

**Visible Fields:**
- Model: ⚪ **Optional**
- Year: ✅ **Required**
- Mileage: ✅ **Required**
- Trim/Grade: ❌ **Hidden** (not applicable)
- Engine Capacity: ⚪ Optional
- Fuel Type: ✅ Visible (Diesel, Petrol, Electric, CNG, LPG)
- Transmission: ⚪ Optional
- Color: ❌ **Hidden** (not typically relevant)

**Special Features:**
- Shows Pricing Type section
- Shows Features section
- Does NOT show Additional Information section

**Fuel Types Available:**
- Diesel, Petrol, Electric, CNG, LPG

---

### 5. Motorcycle (`motorcycle`)
**Two-wheeled vehicle with limited fields**

**Visible Fields:**
- Model: ⚪ **Optional**
- Year: ✅ **Required**
- Mileage: ✅ **Required**
- Trim/Grade: ❌ **Hidden** (not applicable)
- Engine Capacity: ⚪ Optional
- Fuel Type: ✅ Visible (Petrol, Electric)
- Transmission: ❌ **Hidden** (motorcycles typically don't have transmission types)
- Color: ❌ **Hidden** (not typically shown)

**Special Features:**
- Shows Pricing Type section
- Does NOT show Features section
- Does NOT show Additional Information section

**Fuel Types Available:**
- Petrol, Electric

---

### 6. Three Wheeler (`three-wheeler`)
**Tuk-tuks and auto rickshaws**

**Visible Fields:**
- Model: ⚪ **Optional**
- Year: ✅ **Required**
- Mileage: ✅ **Required**
- Trim/Grade: ❌ **Hidden**
- Engine Capacity: ⚪ Optional
- Fuel Type: ✅ Visible (Petrol, Electric)
- Transmission: ⚪ Optional
- Color: ❌ **Hidden**

**Special Features:**
- Shows Pricing Type section
- Does NOT show Features section
- Does NOT show Additional Information section

**Fuel Types Available:**
- Petrol, Electric

---

### 7. Bicycle (`bicycle`)
**Minimal form - only essential fields**

**Visible Fields:**
- Model: ❌ **Hidden**
- Year: ❌ **Hidden**
- Mileage: ❌ **Hidden**
- Trim/Grade: ❌ **Hidden**
- Engine Capacity: ❌ **Hidden**
- Fuel Type: ❌ **Hidden**
- Transmission: ❌ **Hidden**
- Color: ❌ **Hidden**

**Special Features:**
- Does NOT show Pricing Type section
- Does NOT show Features section
- Does NOT show Additional Information section
- Only shows: Title, Make, Condition, Location, Price, Description, Images, Contact Info

**Fuel Types Available:**
- N/A (field is hidden)

---

### 8. Plant & Machinery (`plant-machinery`)
**Construction equipment**

**Visible Fields:**
- Model: ⚪ **Optional**
- Year: ✅ **Required**
- Mileage: ⚪ **Optional** (hours may be more relevant)
- Trim/Grade: ❌ **Hidden**
- Engine Capacity: ⚪ Optional
- Fuel Type: ✅ Visible (Diesel, Petrol, CNG, LPG)
- Transmission: ⚪ Optional
- Color: ❌ **Hidden**

**Special Features:**
- Shows Pricing Type section
- Does NOT show Features section
- Does NOT show Additional Information section

**Fuel Types Available:**
- Diesel, Petrol, CNG, LPG

---

### 9. Tractor (`tractor`)
**Agricultural equipment**

**Visible Fields:**
- Model: ⚪ **Optional**
- Year: ✅ **Required**
- Mileage: ⚪ **Optional** (hours may be more relevant)
- Trim/Grade: ❌ **Hidden**
- Engine Capacity: ⚪ Optional
- Fuel Type: ✅ Visible (Diesel, Petrol, CNG, LPG)
- Transmission: ⚪ Optional
- Color: ❌ **Hidden**

**Special Features:**
- Shows Pricing Type section
- Does NOT show Features section
- Does NOT show Additional Information section

**Fuel Types Available:**
- Diesel, Petrol, CNG, LPG

---

### 10. Boat (`boat`)
**Watercraft**

**Visible Fields:**
- Model: ⚪ **Optional**
- Year: ✅ **Required**
- Mileage: ⚪ **Optional** (hours may be more relevant)
- Trim/Grade: ❌ **Hidden**
- Engine Capacity: ⚪ Optional
- Fuel Type: ✅ Visible (Petrol, Diesel, Electric, CNG, LPG)
- Transmission: ❌ **Hidden** (boats typically don't have transmission types)
- Color: ❌ **Hidden**

**Special Features:**
- Shows Pricing Type section
- Does NOT show Features section
- Does NOT show Additional Information section

**Fuel Types Available:**
- Petrol, Diesel, Electric, CNG, LPG

---

## Section Visibility Logic

### Pricing Type Section
**Shown for:** All categories EXCEPT `bicycle`
**Hidden for:** `bicycle`

### Features Section
**Shown for:** `car`, `van`, `bus`, `lorry`
**Hidden for:** `motorcycle`, `three-wheeler`, `bicycle`, `plant-machinery`, `tractor`, `boat`

### Additional Information Section
**Shown for:** `car`, `van` only
**Hidden for:** All other categories

**Note:** Currently, the AdditionalInformationSection component is deprecated and renders nothing, but the logic remains in place.

---

## Required Field Logic Summary

### Always Required (All Categories)
1. **Title** - Listing title
2. **Make** - Vehicle manufacturer
3. **Condition** - New, Used, or Reconditioned

### Category-Specific Required Fields

| Category | Required Fields |
|----------|----------------|
| **Car** | Title, Make, Condition, Model, Year, Mileage, Trim |
| **Van** | Title, Make, Condition, Year, Mileage |
| **Bus** | Title, Make, Condition, Year, Mileage |
| **Lorry** | Title, Make, Condition, Year, Mileage |
| **Motorcycle** | Title, Make, Condition, Year, Mileage |
| **Three-Wheeler** | Title, Make, Condition, Year, Mileage |
| **Bicycle** | Title, Make, Condition (minimal form) |
| **Plant-Machinery** | Title, Make, Condition, Year |
| **Tractor** | Title, Make, Condition, Year |
| **Boat** | Title, Make, Condition, Year |

---

## Fuel Type Variations by Category

The `getFuelTypesByVehicleType()` function in `types.ts` provides category-specific fuel type options:

| Category | Available Fuel Types |
|----------|---------------------|
| **Car** | Petrol, Diesel, Hybrid, Electric, Plug-in Hybrid, Other |
| **Van** | Petrol, Diesel, Hybrid, Electric, Other |
| **Bus** | Diesel, Petrol, Electric, CNG, LPG |
| **Lorry** | Diesel, Petrol, Electric, CNG, LPG |
| **Motorcycle** | Petrol, Electric |
| **Three-Wheeler** | Petrol, Electric |
| **Bicycle** | Electric (field hidden, but if shown would only have Electric) |
| **Plant-Machinery** | Diesel, Petrol, CNG, LPG |
| **Tractor** | Diesel, Petrol, CNG, LPG |
| **Boat** | Petrol, Diesel, Electric, CNG, LPG |

---

## Implementation Architecture

### Form Component Structure

```
VehicleFormFactory
  ├── Category-specific Form Component (CarForm, VanForm, etc.)
  │     └── BaseVehicleForm (with category-specific config)
  ├── AdditionalInformationSection (only for car/van)
  └── PricingSection (all except bicycle)
```

### Configuration Pattern

Each category-specific form component (e.g., `CarForm.tsx`) defines a `config` object that controls:
- Field visibility (`showModel`, `showYear`, etc.)
- Field requirements (`modelRequired`, `mileageRequired`, etc.)

The `BaseVehicleForm` component uses this config to conditionally render fields and apply required validation.

### Key Files

- **Factory:** `app/components/vehicle-forms/VehicleFormFactory.tsx`
- **Base Form:** `app/components/vehicle-forms/BaseVehicleForm.tsx`
- **Category Forms:** `app/components/vehicle-forms/{Category}Form.tsx`
- **Types:** `app/components/vehicle-forms/types.ts`
- **Vehicle Data:** `data/vehicles.json`
- **Constants:** `lib/constants/vehicleData.ts`

---

## Recommendations

1. **Bicycle Form:** Consider if the minimal form is sufficient or if additional fields (like frame size, type, etc.) would be useful.

2. **Mileage vs Hours:** For `plant-machinery`, `tractor`, and `boat`, consider if "Hours" would be more appropriate than "Mileage".

3. **Additional Information Section:** Currently deprecated but still referenced. Consider removing the logic or implementing it properly.

4. **Color Field:** Only shown for cars and vans. Consider if this should be expanded to other categories where color is relevant (motorcycles, boats).

5. **Transmission Field:** Hidden for motorcycles and boats. This seems appropriate, but verify with business requirements.

6. **Fuel Type Validation:** The system automatically clears invalid fuel types when vehicle type changes, which is good UX.

---

## Summary Statistics

- **Total Categories:** 10
- **Categories with Full Form:** 2 (Car, Van)
- **Categories with Minimal Form:** 1 (Bicycle)
- **Categories with Commercial Vehicle Form:** 4 (Bus, Lorry, Plant-Machinery, Tractor)
- **Categories with Two-Wheeled Form:** 2 (Motorcycle, Three-Wheeler)
- **Categories with Watercraft Form:** 1 (Boat)

**Field Visibility:**
- Always visible: 3 fields (Title, Make, Condition)
- Conditionally visible: 8 fields (Model, Year, Mileage, Trim, Engine Capacity, Fuel Type, Transmission, Color)
- Always hidden for some categories: 2 fields (Trim, Color)

**Required Field Variations:**
- Minimum required fields: 3 (Bicycle)
- Maximum required fields: 7 (Car)
- Average required fields: ~5

