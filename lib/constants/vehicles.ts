export const SRI_LANKA_LOCATIONS = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle', 
    'Matara', 'Negombo', 'Kurunegala', 'Anuradhapura', 'Jaffna',
    'Hambantota', 'Batticaloa', 'Trincomalee', 'Ratnapura', 'Badulla',
    'Kegalle', 'Polonnaruwa', 'Nuwara Eliya', 'Ampara', 'Monaragala',
    'Puttalam', 'Vavuniya', 'Mannar', 'Mullativu', 'Kilinochchi'
  ]
  
  export const VEHICLE_MAKES = [
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Suzuki', 
    'Mitsubishi', 'Hyundai', 'Kia', 'BMW', 'Mercedes-Benz',
    'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Isuzu',
    'Daihatsu', 'Subaru', 'Lexus', 'Peugeot', 'Land Rover'
  ]
  
  export const MAKE_MODEL_MAP: Record<string, string[]> = {
    toyota: ['Prius', 'Camry', 'Corolla', 'Vitz', 'Aqua', 'CHR', 'Highlander', 'Land Cruiser', 'Land Cruiser Prado', 'Hiace', 'Hilux', 'RAV4', 'Fortuner', 'Alphard', 'Vellfire'],
    honda: ['Civic', 'Accord', 'Fit', 'Vezel', 'CR-V', 'Insight', 'City', 'Jazz', 'Pilot', 'Ridgeline', 'HR-V', 'BR-V', 'Freed', 'Odyssey'],
    nissan: ['March', 'Tiida', 'Sylphy', 'Teana', 'X-Trail', 'Murano', 'Navara', 'Juke', 'Qashqai', 'Leaf', 'Note', 'Serena', 'Elgrand', 'Patrol'],
    mazda: ['Demio', 'Axela', 'Atenza', 'CX-3', 'CX-5', 'CX-9', 'BT-50', 'Premacy', 'Biante', 'Roadster', 'CX-30', 'MX-5'],
    suzuki: ['Alto', 'Swift', 'Wagon R', 'Baleno', 'Vitara', 'Jimny', 'Ertiga', 'S-Cross', 'Ignis', 'Ciaz', 'Celerio', 'Hustler', 'Every'],
    mitsubishi: ['Lancer', 'Outlander', 'Pajero', 'Montero', 'ASX', 'Mirage', 'Triton', 'Galant', 'Colt', 'Eclipse', 'Delica', 'L200'],
    hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'i10', 'i20', 'i30', 'Accent', 'Genesis', 'Kona', 'Creta', 'Venue', 'Palisade'],
    kia: ['Cerato', 'Optima', 'Sportage', 'Sorento', 'Picanto', 'Rio', 'Soul', 'Stinger', 'Carnival', 'Seltos', 'Telluride', 'Niro'],
    bmw: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'Z4', 'i3', 'i8', '2 Series', '4 Series', '6 Series', 'X2', 'X4', 'X6'],
    'mercedes-benz': ['C-Class', 'E-Class', 'S-Class', 'A-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'CLA', 'CLS', 'G-Class', 'B-Class', 'GLA', 'GLB']
  }
  
  export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'] as const
  export const TRANSMISSION_TYPES = ['Automatic', 'Manual'] as const
  export const URGENCY_LEVELS = ['high', 'medium', 'low'] as const