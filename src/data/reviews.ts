export interface Review {
  id: string;
  propertyId: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  verified: boolean;
  tenureYears?: number;
  text: string;
  helpful: number;
  pros: string[];
  cons: string[];
}

export const reviews: Review[] = [
{
  id: 'r1',
  propertyId: '1',
  author: 'Jennifer Martinez',
  avatar: 'https://i.pravatar.cc/150?img=20',
  rating: 5,
  date: '2 months ago',
  verified: true,
  tenureYears: 3,
  text: 'Absolutely love living here! The views are spectacular and the neighborhood is perfect for families. The property manager is responsive and the building is well-maintained.',
  helpful: 24,
  pros: [
  'Amazing views',
  'Great location',
  'Responsive management',
  'Safe neighborhood'],

  cons: ['Parking can be tight during events']
},
{
  id: 'r2',
  propertyId: '1',
  author: 'Thomas Lee',
  avatar: 'https://i.pravatar.cc/150?img=21',
  rating: 4,
  date: '4 months ago',
  verified: true,
  tenureYears: 1,
  text: 'Beautiful property with modern amenities. The pool area is fantastic and the gym is well-equipped. Only minor issue is occasional noise from nearby construction.',
  helpful: 18,
  pros: ['Modern amenities', 'Beautiful pool', 'Well-equipped gym'],
  cons: ['Some construction noise', 'HOA fees are high']
},
{
  id: 'r3',
  propertyId: '2',
  author: 'Sarah Johnson',
  avatar: 'https://i.pravatar.cc/150?img=22',
  rating: 5,
  date: '1 month ago',
  verified: true,
  text: 'Perfect location for young professionals! Walking distance to everything you need. The bay views from the rooftop are incredible.',
  helpful: 31,
  pros: [
  'Unbeatable location',
  'Stunning views',
  'Great amenities',
  'Pet friendly'],

  cons: ['Can be noisy on weekends']
},
{
  id: 'r4',
  propertyId: '3',
  author: 'Michael Brown',
  avatar: 'https://i.pravatar.cc/150?img=23',
  rating: 5,
  date: '3 weeks ago',
  verified: true,
  tenureYears: 2,
  text: 'This Victorian gem has so much character! The updated kitchen is gorgeous and the backyard is perfect for our kids. Noe Valley is such a wonderful community.',
  helpful: 27,
  pros: [
  'Beautiful character',
  'Updated kitchen',
  'Great backyard',
  'Family-friendly area'],

  cons: ['Older home means occasional maintenance']
},
{
  id: 'r5',
  propertyId: '4',
  author: 'Alex Rivera',
  avatar: 'https://i.pravatar.cc/150?img=24',
  rating: 4,
  date: '2 months ago',
  verified: true,
  text: 'Love the industrial vibe and the Mission location is unbeatable for food and nightlife. Great value for the area.',
  helpful: 22,
  pros: [
  'Great location',
  'Unique character',
  'Good value',
  'Vibrant neighborhood'],

  cons: ['Limited storage', 'Street parking only']
},
{
  id: 'r6',
  propertyId: '5',
  author: 'Lisa Chen',
  avatar: 'https://i.pravatar.cc/150?img=25',
  rating: 5,
  date: '1 week ago',
  verified: true,
  text: 'The rooftop deck is a game-changer! Smart home features work flawlessly and the location is perfect - walkable to everything.',
  helpful: 35,
  pros: [
  'Amazing rooftop',
  'Smart home tech',
  'Perfect location',
  'Modern design'],

  cons: ['Price is on the higher end']
}];