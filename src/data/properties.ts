export interface Property {
  id: string;
  name: string;
  price: number;
  priceType: 'sale' | 'rent';
  type: 'House' | 'Apartment' | 'Villa' | 'Townhouse' | 'Studio';
  location: string;
  neighborhood: string;
  address: string;
  coordinates: [number, number];
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  image: string;
  images: string[];
  description: string;
  amenities: string[];
  badge?: 'Best Deal' | 'New' | 'Verified';
  rating: number;
  reviewCount: number;
  areaIntelligence: {
    commuteScore: number;
    commuteTime: string;
    waterReliability: number;
    securityLevel: number;
    lifestyleScore: {
      nightlife: number;
      restaurants: number;
      parks: number;
    };
  };
  agent: {
    name: string;
    photo: string;
    responseTime: string;
  };
}

export const properties: Property[] = [
{
  id: '1',
  name: 'Sunset Heights Villa',
  price: 1250000,
  priceType: 'sale',
  type: 'Villa',
  location: 'Pacific Heights',
  neighborhood: 'Pacific Heights',
  address: '2847 Pacific Avenue, San Francisco, CA',
  coordinates: [37.7919, -122.4389],
  bedrooms: 4,
  bathrooms: 3,
  sqft: 3200,
  image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  images: [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],

  description:
  'Stunning villa with panoramic city views, modern architecture, and luxurious finishes throughout. Perfect for families seeking elegance and comfort.',
  amenities: [
  'Parking',
  'Swimming Pool',
  'Garden',
  'Gym',
  'Security',
  'Smart Home'],

  badge: 'Verified',
  rating: 4.8,
  reviewCount: 24,
  areaIntelligence: {
    commuteScore: 85,
    commuteTime: '12 min to downtown',
    waterReliability: 95,
    securityLevel: 92,
    lifestyleScore: {
      nightlife: 78,
      restaurants: 88,
      parks: 85
    }
  },
  agent: {
    name: 'Sarah Mitchell',
    photo: 'https://i.pravatar.cc/150?img=5',
    responseTime: 'Within 2 hours'
  }
},
{
  id: '2',
  name: 'Marina Bay Apartment',
  price: 3200,
  priceType: 'rent',
  type: 'Apartment',
  location: 'Marina District',
  neighborhood: 'Marina District',
  address: '1523 Marina Boulevard, San Francisco, CA',
  coordinates: [37.8044, -122.4324],
  bedrooms: 2,
  bathrooms: 2,
  sqft: 1400,
  image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  images: [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'],

  description:
  'Modern waterfront apartment with stunning bay views, high-end appliances, and access to premium building amenities.',
  amenities: ['Parking', 'Gym', 'Concierge', 'Rooftop Deck', 'Pet Friendly'],
  badge: 'Best Deal',
  rating: 4.6,
  reviewCount: 18,
  areaIntelligence: {
    commuteScore: 78,
    commuteTime: '18 min to downtown',
    waterReliability: 92,
    securityLevel: 88,
    lifestyleScore: {
      nightlife: 92,
      restaurants: 90,
      parks: 82
    }
  },
  agent: {
    name: 'Michael Chen',
    photo: 'https://i.pravatar.cc/150?img=12',
    responseTime: 'Within 1 hour'
  }
},
{
  id: '3',
  name: 'Victorian Charm House',
  price: 875000,
  priceType: 'sale',
  type: 'House',
  location: 'Noe Valley',
  neighborhood: 'Noe Valley',
  address: '645 Sanchez Street, San Francisco, CA',
  coordinates: [37.7499, -122.4312],
  bedrooms: 3,
  bathrooms: 2,
  sqft: 2100,
  image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  images: [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'],

  description:
  'Classic Victorian home with original details, updated kitchen, and charming backyard. Located in a family-friendly neighborhood.',
  amenities: [
  'Parking',
  'Garden',
  'Fireplace',
  'Hardwood Floors',
  'Updated Kitchen'],

  badge: 'New',
  rating: 4.7,
  reviewCount: 15,
  areaIntelligence: {
    commuteScore: 72,
    commuteTime: '22 min to downtown',
    waterReliability: 90,
    securityLevel: 85,
    lifestyleScore: {
      nightlife: 65,
      restaurants: 82,
      parks: 90
    }
  },
  agent: {
    name: 'Emily Rodriguez',
    photo: 'https://i.pravatar.cc/150?img=9',
    responseTime: 'Within 3 hours'
  }
},
{
  id: '4',
  name: 'Mission District Loft',
  price: 2800,
  priceType: 'rent',
  type: 'Apartment',
  location: 'Mission District',
  neighborhood: 'Mission District',
  address: '3421 Mission Street, San Francisco, CA',
  coordinates: [37.7456, -122.4194],
  bedrooms: 1,
  bathrooms: 1,
  sqft: 950,
  image: "/RRDH6hqL_9YoPFmPz_WLoKK8RNYJwfheXXykIw_OPSBV-9y3nA67ntCekkbHNP5LnWirpMi46s0vD_OoDAf3pGSw5ZW9yocE47R7-wGLiBHKE1TBaPs15kCc4LQH3tqNqEwD1s08rNSOpuP_HFgKGneyA7DftWsPpoEubQ0lHM4U7knqeFwLoG8EZrRRgTFj.jpg",

  images: ["/RRDH6hqL_9YoPFmPz_WLoKK8RNYJwfheXXykIw_OPSBV-9y3nA67ntCekkbHNP5LnWirpMi46s0vD_OoDAf3pGSw5ZW9yocE47R7-wGLiBHKE1TBaPs15kCc4LQH3tqNqEwD1s08rNSOpuP_HFgKGneyA7DftWsPpoEubQ0lHM4U7knqeFwLoG8EZrRRgTFj.jpg"],


  description:
  'Industrial-chic loft with exposed brick, high ceilings, and natural light. Heart of the vibrant Mission District.',
  amenities: ['Parking', 'Pet Friendly', 'Bike Storage', 'Laundry'],
  rating: 4.5,
  reviewCount: 22,
  areaIntelligence: {
    commuteScore: 88,
    commuteTime: '8 min to downtown',
    waterReliability: 88,
    securityLevel: 75,
    lifestyleScore: {
      nightlife: 95,
      restaurants: 98,
      parks: 70
    }
  },
  agent: {
    name: 'David Park',
    photo: 'https://i.pravatar.cc/150?img=13',
    responseTime: 'Within 2 hours'
  }
},
{
  id: '5',
  name: 'Hayes Valley Townhouse',
  price: 1450000,
  priceType: 'sale',
  type: 'Townhouse',
  location: 'Hayes Valley',
  neighborhood: 'Hayes Valley',
  address: '567 Hayes Street, San Francisco, CA',
  coordinates: [37.7756, -122.4244],
  bedrooms: 3,
  bathrooms: 3,
  sqft: 2400,
  image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
  images: [
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],

  description:
  'Contemporary townhouse with rooftop deck, designer finishes, and smart home technology. Walk to shops and restaurants.',
  amenities: [
  'Parking',
  'Rooftop Deck',
  'Smart Home',
  'Storage',
  'EV Charging'],

  badge: 'Best Deal',
  rating: 4.9,
  reviewCount: 31,
  areaIntelligence: {
    commuteScore: 90,
    commuteTime: '6 min to downtown',
    waterReliability: 93,
    securityLevel: 87,
    lifestyleScore: {
      nightlife: 88,
      restaurants: 95,
      parks: 75
    }
  },
  agent: {
    name: 'Jessica Taylor',
    photo: 'https://i.pravatar.cc/150?img=10',
    responseTime: 'Within 1 hour'
  }
},
{
  id: '6',
  name: 'Russian Hill Studio',
  price: 2200,
  priceType: 'rent',
  type: 'Studio',
  location: 'Russian Hill',
  neighborhood: 'Russian Hill',
  address: '1234 Hyde Street, San Francisco, CA',
  coordinates: [37.8008, -122.4186],
  bedrooms: 0,
  bathrooms: 1,
  sqft: 650,
  image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  images: [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'],

  description:
  'Cozy studio with efficient layout, updated bathroom, and beautiful city views. Perfect for young professionals.',
  amenities: ['Laundry', 'Cable Ready', 'Hardwood Floors'],
  rating: 4.3,
  reviewCount: 12,
  areaIntelligence: {
    commuteScore: 82,
    commuteTime: '15 min to downtown',
    waterReliability: 91,
    securityLevel: 90,
    lifestyleScore: {
      nightlife: 85,
      restaurants: 88,
      parks: 78
    }
  },
  agent: {
    name: 'Robert Kim',
    photo: 'https://i.pravatar.cc/150?img=14',
    responseTime: 'Within 4 hours'
  }
},
{
  id: '7',
  name: 'Presidio Heights Estate',
  price: 3500000,
  priceType: 'sale',
  type: 'House',
  location: 'Presidio Heights',
  neighborhood: 'Presidio Heights',
  address: '3890 Washington Street, San Francisco, CA',
  coordinates: [37.7886, -122.4544],
  bedrooms: 5,
  bathrooms: 4,
  sqft: 4500,
  image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  images: [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],

  description:
  'Magnificent estate with grand entertaining spaces, gourmet kitchen, wine cellar, and manicured gardens. Ultimate luxury living.',
  amenities: [
  'Parking',
  'Swimming Pool',
  'Wine Cellar',
  'Home Theater',
  'Garden',
  'Security',
  'Smart Home'],

  badge: 'Verified',
  rating: 5.0,
  reviewCount: 8,
  areaIntelligence: {
    commuteScore: 75,
    commuteTime: '20 min to downtown',
    waterReliability: 96,
    securityLevel: 98,
    lifestyleScore: {
      nightlife: 70,
      restaurants: 85,
      parks: 95
    }
  },
  agent: {
    name: 'Amanda Foster',
    photo: 'https://i.pravatar.cc/150?img=16',
    responseTime: 'Within 1 hour'
  }
},
{
  id: '8',
  name: 'SoMa Modern Apartment',
  price: 4200,
  priceType: 'rent',
  type: 'Apartment',
  location: 'SoMa',
  neighborhood: 'SoMa',
  address: '789 Folsom Street, San Francisco, CA',
  coordinates: [37.7825, -122.4014],
  bedrooms: 2,
  bathrooms: 2,
  sqft: 1600,
  image: "/H65UPkNO6IP-t9KMT_Z4jE6xOfoWboBVGZjG8JmOi-zMwoW7pgaWkxYXTvTco7V_XYv0uC5YSylS4c0w196U31_mVTQ2qBq_DJ9Bu_hB0_-zfUeHC5VultS8GQ9kV8qE-d7zefr8Eoq0iyh1mrFyNERnDahDTqJUv0vG-5eBQPU3FNLTwaThZMWDElu7-3v8.jpg",

  images: ["/H65UPkNO6IP-t9KMT_Z4jE6xOfoWboBVGZjG8JmOi-zMwoW7pgaWkxYXTvTco7V_XYv0uC5YSylS4c0w196U31_mVTQ2qBq_DJ9Bu_hB0_-zfUeHC5VultS8GQ9kV8qE-d7zefr8Eoq0iyh1mrFyNERnDahDTqJUv0vG-5eBQPU3FNLTwaThZMWDElu7-3v8.jpg"],


  description:
  'Sleek apartment in a luxury building with floor-to-ceiling windows, premium finishes, and full amenity package.',
  amenities: [
  'Parking',
  'Gym',
  'Concierge',
  'Pool',
  'Rooftop Lounge',
  'Pet Friendly',
  'EV Charging'],

  badge: 'New',
  rating: 4.7,
  reviewCount: 19,
  areaIntelligence: {
    commuteScore: 95,
    commuteTime: '3 min to downtown',
    waterReliability: 89,
    securityLevel: 86,
    lifestyleScore: {
      nightlife: 90,
      restaurants: 92,
      parks: 68
    }
  },
  agent: {
    name: 'Chris Anderson',
    photo: 'https://i.pravatar.cc/150?img=15',
    responseTime: 'Within 2 hours'
  }
}];