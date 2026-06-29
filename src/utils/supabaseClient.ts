import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isRealSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const SUPERADMIN_EMAILS = ['propknocks@gmail.com'];

// Mock DB initial seed data
const DEFAULT_REALTOR = {
  id: 'd8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8',
  name: 'Walt Wensel',
  email: 'walt@retiretopa.com',
  phone: '(717) 555-0199',
  target_subdomain: 'york',
  default_area: 'York, PA',
  facebook_pixel_id: '',
  ref_id: 1,
  created_at: new Date().toISOString()
};

const TAMPA_REALTOR = {
  id: 'e9b8c71a-0e7f-5d4a-013f-9db6e7f3f6d9',
  name: 'Frank Miller',
  email: 'frank@55plushomesearch.com',
  phone: '(813) 555-0188',
  target_subdomain: 'tampa',
  default_area: 'Tampa Bay',
  facebook_pixel_id: '',
  ref_id: 2,
  created_at: new Date().toISOString()
};

const DEFAULT_COMMUNITIES = [
  {
    "id": "c-seed-alden-place",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Alden Place",
    "region": "Lebanon County",
    "price_min": 320000,
    "price_max": 480000,
    "hoa_fee": 135,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool",
      "Pickleball Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Alden Place offers a peaceful environment for downsizers. Grounds are kept in top-tier shape year-round. Walt's tip: Homes here feature very well-designed single-story layouts.",
    "community_url": "https://www.retiretopa.com/alden-place/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1778634923/42/42_PALN2024956_01.jpg",
    "latitude": 40.3411,
    "longitude": -76.428,
    "created_at": "2026-05-30T12:56:41.876Z"
  },
  {
    "id": "c-seed-amblebrook",
    "name": "Amblebrook",
    "region": "Adams County",
    "price_min": 349900,
    "price_max": 759900,
    "hoa_fee": 150,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Extensive amenity maintenance",
      "Security patrolling"
    ],
    "amenities": [
      "Luxury 24,000 sq ft Clubhouse",
      "Indoor & Outdoor Pools",
      "Wellness & Fitness Center",
      "Sports Courts (Pickleball/Tennis)",
      "Art & Culinary Studios"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Amblebrook in Gettysburg is one of the premier resort-style 55+ active-adult communities in the entire region. The clubhouses, indoor and outdoor pools, fitness facilities, and sports courts are absolutely state-of-the-art. Walt's tip: This is perfect for the highly active buyer looking for a luxury lifestyle.",
    "community_url": "https://www.retiretopa.com/amblebrook-gettysburg/",
    "image_url": "https://sierra-public.azureedge.net/4ed04487-584c-41ea-bd12-63dbbc1df415.jpeg",
    "latitude": 39.885,
    "longitude": -77.228,
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-bloomfields",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Bloomfields",
    "region": "Maryland",
    "price_min": 340000,
    "price_max": 500000,
    "hoa_fee": 185,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Pickleball Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Bloomfields offers a peaceful environment for downsizers. Grounds are kept in top-tier shape year-round. Walt's tip: Homes here feature very well-designed single-story layouts.",
    "community_url": "https://www.retiretopa.com/bloomfields/",
    "image_url": "https://sierra-public.azureedge.net/e79ae834-1e54-4fab-b4cd-f3d1ea3c66ea.jpg",
    "latitude": 39.4260,
    "longitude": -77.4200,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-brookshire-lancaster",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Brookshire",
    "region": "Lancaster County",
    "price_min": 320000,
    "price_max": 640000,
    "hoa_fee": 195,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Brookshire is a fantastic 55+ neighborhood in the Lancaster County area. Offering beautiful homes and highly quiet environments. Walt's tip: Perfect for buyers wanting peaceful surroundings.",
    "community_url": "https://www.retiretopa.com/brookshire-lancaster/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1782311306/42/42_PALA2089294_01.jpg",
    "latitude": 40.1650,
    "longitude": -76.3860,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-carmella",
    "name": "Carmella",
    "region": "Cumberland County",
    "price_min": 499000,
    "price_max": 599000,
    "hoa_fee": 150,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Exterior building maintenance",
      "Roof replacement & repair"
    ],
    "amenities": [
      "Community Clubhouse",
      "Heated Outdoor Pool",
      "Fitness Room",
      "Library & Lounge"
    ],
    "home_types": [
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Carmella is an upscale active-adult community in Mechanicsburg, PA. Offering beautifully appointed homes with custom details. Walt's tip: The clubhouse and pool serve as the social hub, and the low-maintenance setup is ideal for snowbirds.",
    "community_url": "https://www.retiretopa.com/carmella-mechanicsburg/",
    "image_url": "https://sierra-public.azureedge.net/cd4611f2-f500-4d94-bf67-da81f5b6a58d.jpg",
    "latitude": 40.218,
    "longitude": -77.018,
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-cherry-tree",
    "name": "Cherry Tree",
    "region": "York County",
    "price_min": 318000,
    "price_max": 359900,
    "hoa_fee": 175,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Lawn treatment"
    ],
    "amenities": [
      "Community Park & Gazebo",
      "Social Spaces",
      "Walking Paths"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Cherry Tree is a lovely 55+ neighborhood in Hanover, PA. Features ranch-style homes and single-floor living. Walt's tip: The community is close to local shopping centers, supermarkets, and dining options, making everyday errands incredibly easy.",
    "community_url": "https://www.retiretopa.com/cherry-tree-hanover/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1781763424/42/42_PAYK2101888_01.jpg",
    "latitude": 39.795,
    "longitude": -76.975,
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-clearview-gardens-north",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Clearview Gardens North",
    "region": "York County",
    "price_min": 280000,
    "price_max": 460000,
    "hoa_fee": 245,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Clearview Gardens North features modern low-maintenance floorplans. Residents love the convenient access to local retail and dining. Walt's tip: Great community if you travel frequently since exterior upkeep is fully covered!",
    "community_url": "https://www.retiretopa.com/clearview-gardens-north/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1781183529/42/42_PALA2089324_01.jpg",
    "latitude": 39.8016,
    "longitude": -76.9811,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-cortland-park-winding-hills",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Cortland Park",
    "region": "Cumberland County",
    "price_min": 240000,
    "price_max": 460000,
    "hoa_fee": 135,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool",
      "Pickleball Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Cortland Park is a charming, highly established active-adult community. The social committee organizes fantastic dinners and get-togethers. Walt's tip: Be sure to tour the clubhouse and meet the neighbors.",
    "community_url": "https://www.retiretopa.com/cortland-park-winding-hills/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1779887851/42/42_PACB2054390_01.jpg",
    "latitude": 40.229,
    "longitude": -77.0308,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-country-manor",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Country Manor",
    "region": "Franklin County",
    "price_min": 340000,
    "price_max": 600000,
    "hoa_fee": 265,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Country Manor is a charming, highly established active-adult community. The social committee organizes fantastic dinners and get-togethers. Walt's tip: Be sure to tour the clubhouse and meet the neighbors.",
    "community_url": "https://www.retiretopa.com/country-manor/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1781923024/42/42_PACB2050102_01.jpg",
    "latitude": 39.8492,
    "longitude": -77.5049,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-cumberland-village-gettysburg",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Cumberland Village -",
    "region": "Adams County",
    "price_min": 300000,
    "price_max": 460000,
    "hoa_fee": 305,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Cumberland Village - offers a peaceful environment for downsizers. Grounds are kept in top-tier shape year-round. Walt's tip: Homes here feature very well-designed single-story layouts.",
    "community_url": "https://www.retiretopa.com/cumberland-village-gettysburg/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1777494303/42/42_PAAD2022280_01.jpg",
    "latitude": 39.8136,
    "longitude": -77.2773,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-deatrick-village-gettysburg",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Deatrick Village",
    "region": "Adams County",
    "price_min": 340000,
    "price_max": 580000,
    "hoa_fee": 315,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Deatrick Village is a charming, highly established active-adult community. The social committee organizes fantastic dinners and get-togethers. Walt's tip: Be sure to tour the clubhouse and meet the neighbors.",
    "community_url": "https://www.retiretopa.com/deatrick-village-gettysburg/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1779111849/42/42_PAAD2023124_01.jpg",
    "latitude": 39.8227,
    "longitude": -77.2111,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-equine-meadows",
    "name": "Equine Meadows",
    "region": "York County",
    "price_min": 230000,
    "price_max": 330000,
    "hoa_fee": 150,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Exterior upkeep",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse & Activity Center",
      "Fitness Room",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Equine Meadows in Red Lion features cozy, ranch-style homes. An excellent mid-sized neighborhood focusing on comfortable, quiet, one-floor living. Walt's tip: The community association keeps the grounds in pristine condition, and snow removal is famously quick.",
    "community_url": "https://www.retiretopa.com/equine-meadows-red-lion/",
    "image_url": "https://sierra-public.azureedge.net/d3bf6d8e-80b1-4d37-8e68-0c9b00594541.jpg",
    "latitude": 39.897,
    "longitude": -76.598,
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-four-seasons-elmtree",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Four Seasons @ Elmtree",
    "region": "Lancaster County",
    "price_min": 300000,
    "price_max": 620000,
    "hoa_fee": 195,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Four Seasons @ Elmtree is a charming, highly established active-adult community. The social committee organizes fantastic dinners and get-togethers. Walt's tip: Be sure to tour the clubhouse and meet the neighbors.",
    "community_url": "https://www.retiretopa.com/four-seasons-elmtree/",
    "image_url": "https://sierra-public.azureedge.net/85b696a1-86f2-45b1-aaa1-12b2f90e2294.jpg",
    "latitude": 40.003,
    "longitude": -76.2761,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-heritage-strasburg",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Heritage",
    "region": "Lancaster County",
    "price_min": 300000,
    "price_max": 640000,
    "hoa_fee": 205,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Heritage features modern low-maintenance floorplans. Residents love the convenient access to local retail and dining. Walt's tip: Great community if you travel frequently since exterior upkeep is fully covered!",
    "community_url": "https://www.retiretopa.com/heritage-strasburg/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1781934140/42/42_PALA2085012_01.jpg",
    "latitude": 39.9593,
    "longitude": -76.3353,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-hillview",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "HILLVIEW",
    "region": "York County",
    "price_min": 340000,
    "price_max": 620000,
    "hoa_fee": 265,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool",
      "Pickleball Courts",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "HILLVIEW offers a peaceful environment for downsizers. Grounds are kept in top-tier shape year-round. Walt's tip: Homes here feature very well-designed single-story layouts.",
    "community_url": "https://www.retiretopa.com/hillview/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1780841823/42/42_PACT2126270_01.jpg",
    "latitude": 39.9576,
    "longitude": -76.7495,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-home-towne-square-ephrata",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Home Towne Square",
    "region": "Lancaster County",
    "price_min": 340000,
    "price_max": 480000,
    "hoa_fee": 315,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Home Towne Square is a charming, highly established active-adult community. The social committee organizes fantastic dinners and get-togethers. Walt's tip: Be sure to tour the clubhouse and meet the neighbors.",
    "community_url": "https://www.retiretopa.com/home-towne-square-ephrata/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1782307781/42/42_PALA2090730_01.jpg",
    "latitude": 40.1740,
    "longitude": -76.2080,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-honeycroft-village",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Honeycroft Village",
    "region": "Chester County",
    "price_min": 320000,
    "price_max": 680000,
    "hoa_fee": 225,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Honeycroft Village is a charming, highly established active-adult community. The social committee organizes fantastic dinners and get-togethers. Walt's tip: Be sure to tour the clubhouse and meet the neighbors.",
    "community_url": "https://www.retiretopa.com/honeycroft-village/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1782566568/42/42_PACT2129104_01.jpg",
    "latitude": 39.9160,
    "longitude": -75.9550,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-jackson-heights",
    "name": "Jackson Heights",
    "region": "York County",
    "price_min": 250000,
    "price_max": 450000,
    "hoa_fee": 150,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Exterior building maintenance",
      "Roof insurance"
    ],
    "amenities": [
      "Modern Clubhouse",
      "Indoor Heated Pool",
      "Fitness Facility & Classes",
      "Pickleball Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Jackson Heights is a gorgeous active adult community in York, PA. Known for its convenient location and excellent quality construction, it offers single-floor ranch-style living. Walt's tip: Residents love the tight-knit social vibe here.",
    "community_url": "https://www.retiretopa.com/jackson-heights-york/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1779285924/42/42_PAYK2101704_01.jpg",
    "latitude": 39.9570,
    "longitude": -76.8450,
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-lake-heritage",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Lake Heritage",
    "region": "Adams County",
    "price_min": 320000,
    "price_max": 480000,
    "hoa_fee": 165,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Lake Heritage offers a peaceful environment for downsizers. Grounds are kept in top-tier shape year-round. Walt's tip: Homes here feature very well-designed single-story layouts.",
    "community_url": "https://www.retiretopa.com/lake-heritage/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1782463169/42/42_PAAD2024344_01.jpg",
    "latitude": 39.8573,
    "longitude": -77.2177,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-lake-meade",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Lake Meade Berlin",
    "region": "Adams County",
    "price_min": 300000,
    "price_max": 480000,
    "hoa_fee": 175,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Pickleball Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Lake Meade Berlin is a fantastic 55+ neighborhood in the East Berlin area. Offering beautiful homes and highly quiet environments. Walt's tip: Perfect for buyers wanting peaceful surroundings.",
    "community_url": "https://www.retiretopa.com/lake-meade/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1782498057/42/42_PAAD2024230_01.jpg",
    "latitude": 39.9850,
    "longitude": -77.0467,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-lilyfield-berks",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Lilyfield Berks",
    "region": "Berks County",
    "price_min": 300000,
    "price_max": 540000,
    "hoa_fee": 175,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Pickleball Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Lilyfield Berks features modern low-maintenance floorplans. Residents love the convenient access to local retail and dining. Walt's tip: Great community if you travel frequently since exterior upkeep is fully covered!",
    "community_url": "https://www.retiretopa.com/lilyfield-berks/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1776449299/42/42_PABK2069808_01.jpg",
    "latitude": 40.3751,
    "longitude": -76.0287,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-longstown-village",
    "name": "Longstown Village",
    "region": "York County",
    "price_min": 219750,
    "price_max": 289900,
    "hoa_fee": 150,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area upkeep"
    ],
    "amenities": [
      "Cozy Clubhouse",
      "Social Hall",
      "Walking Paths"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Longstown Village is a fantastic option for buyers seeking low-maintenance living in the York area. Known for its quiet streets and friendly neighbors. Walt's tip: Perfect for downsizers who want a cozy but spacious villa.",
    "community_url": "https://www.retiretopa.com/longstown-village-york/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1774886528/42/42_PAYK2100266_01.jpg",
    "latitude": 39.957,
    "longitude": -76.657,
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-meadow-view-farms",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Meadow View Farms",
    "region": "Berks County",
    "price_min": 300000,
    "price_max": 640000,
    "hoa_fee": 255,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Meadow View Farms is a fantastic 55+ neighborhood in the York County area. Offering beautiful homes and highly quiet environments. Walt's tip: Perfect for buyers wanting peaceful surroundings.",
    "community_url": "https://www.retiretopa.com/meadow-view-farms/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1773364707/42/42_PABK2069088_01.jpg",
    "latitude": 40.3815,
    "longitude": -75.7978,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-featured-listings",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "New You Need To Know",
    "region": "York County",
    "price_min": 360000,
    "price_max": 500000,
    "hoa_fee": 195,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Pickleball Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "New You Need To Know features modern low-maintenance floorplans. Residents love the convenient access to local retail and dining. Walt's tip: Great community if you travel frequently since exterior upkeep is fully covered!",
    "community_url": "https://www.retiretopa.com/featured-listings/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1782393917/42/42_PAYK2106362_01.jpg",
    "latitude": 39.9389,
    "longitude": -76.7137,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-penn-national-fayetteville",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Penn National",
    "region": "Franklin County",
    "price_min": 260000,
    "price_max": 560000,
    "hoa_fee": 195,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Penn National features modern low-maintenance floorplans. Residents love the convenient access to local retail and dining. Walt's tip: Great community if you travel frequently since exterior upkeep is fully covered!",
    "community_url": "https://www.retiretopa.com/penn-national-fayetteville/",
    "image_url": "https://sierra-public.azureedge.net/4edae7ff-6948-489b-8429-986a20412144.jpg",
    "latitude": 39.7984,
    "longitude": -77.5446,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-roth-church-farm",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Roth Church Farm",
    "region": "York County",
    "price_min": 220000,
    "price_max": 400000,
    "hoa_fee": 225,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Pickleball Courts",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Roth Church Farm is a fantastic 55+ neighborhood in the York County area. Offering beautiful homes and highly quiet environments. Walt's tip: Perfect for buyers wanting peaceful surroundings.",
    "community_url": "https://www.retiretopa.com/roth-church-farm/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1780454631/42/42_PAYK2103950_01.jpg",
    "latitude": 39.8656,
    "longitude": -76.8667,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-sinclair-park",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Sinclair Park",
    "region": "Cumberland County",
    "price_min": 280000,
    "price_max": 460000,
    "hoa_fee": 165,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool",
      "Pickleball Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Sinclair Park offers a peaceful environment for downsizers. Grounds are kept in top-tier shape year-round. Walt's tip: Homes here feature very well-designed single-story layouts.",
    "community_url": "https://www.retiretopa.com/sinclair-park/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1782486897/42/42_PACB2054646_01.jpg",
    "latitude": 40.2223,
    "longitude": -77.0108,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-spring-valley-estates-waynesboro",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Spring Valley Estates",
    "region": "Franklin County",
    "price_min": 300000,
    "price_max": 520000,
    "hoa_fee": 185,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Spring Valley Estates offers a peaceful environment for downsizers. Grounds are kept in top-tier shape year-round. Walt's tip: Homes here feature very well-designed single-story layouts.",
    "community_url": "https://www.retiretopa.com/spring-valley-estates-waynesboro/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1777471836/42/42_PAFL2033398_01.jpg",
    "latitude": 39.787,
    "longitude": -77.5005,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-stone",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Stone Hill York",
    "region": "York County",
    "price_min": 360000,
    "price_max": 720000,
    "hoa_fee": 275,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Stone Hill York is a charming, highly established active-adult community. The social committee organizes fantastic dinners and get-togethers. Walt's tip: Be sure to tour the clubhouse and meet the neighbors.",
    "community_url": "https://www.retiretopa.com/stone/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1778462065/42/42_PAYK2101656_01.jpg",
    "latitude": 39.9452,
    "longitude": -76.7341,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-stonecroft-village",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Stonecroft Village",
    "region": "Berks County",
    "price_min": 340000,
    "price_max": 700000,
    "hoa_fee": 165,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Stonecroft Village offers a peaceful environment for downsizers. Grounds are kept in top-tier shape year-round. Walt's tip: Homes here feature very well-designed single-story layouts.",
    "community_url": "https://www.retiretopa.com/stonecroft-village/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1774759785/42/42_PABK2069800_01.jpg",
    "latitude": 40.3530,
    "longitude": -76.1730,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-stoner-farm-littlestown",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Stoner Farm",
    "region": "Adams County",
    "price_min": 240000,
    "price_max": 500000,
    "hoa_fee": 205,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Stoner Farm is a fantastic 55+ neighborhood in the Adams County area. Offering beautiful homes and highly quiet environments. Walt's tip: Perfect for buyers wanting peaceful surroundings.",
    "community_url": "https://www.retiretopa.com/stoner-farm-littlestown/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1779562075/42/42_PAAD2022092_01.jpg",
    "latitude": 39.8696,
    "longitude": -77.1892,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-the-links",
    "name": "The Links at Gettysburg",
    "region": "Adams County",
    "price_min": 344900,
    "price_max": 675000,
    "hoa_fee": 150,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area upkeep",
      "Gated community security"
    ],
    "amenities": [
      "Championship Golf Course",
      "Luxury Clubhouse",
      "Swimming Pool & Tennis",
      "Sports Bar & Restaurant",
      "Scenic Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "The Links at Gettysburg is an award-winning active-adult golf course community. Offers stunning scenic views and luxury amenities. Walt's tip: If you want championship golf at your doorstep and gorgeous sunset views over the greens, look no further.",
    "community_url": "https://www.retiretopa.com/the-links-gettysburg/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1782482828/42/42_PAAD2024144_01.jpg",
    "latitude": 39.805,
    "longitude": -77.218,
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-the-paddock-red-lion",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "The Paddock",
    "region": "York County",
    "price_min": 300000,
    "price_max": 600000,
    "hoa_fee": 165,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool",
      "Pickleball Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "The Paddock is a charming, highly established active-adult community. The social committee organizes fantastic dinners and get-togethers. Walt's tip: Be sure to tour the clubhouse and meet the neighbors.",
    "community_url": "https://www.retiretopa.com/the-paddock-red-lion/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1782473069/42/42_PAYK2103680_01.jpg",
    "latitude": 39.8926,
    "longitude": -76.6033,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-the-porches-of-allenberry",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "The Porches of Allenberry",
    "region": "Cumberland County",
    "price_min": 280000,
    "price_max": 620000,
    "hoa_fee": 175,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "The Porches of Allenberry offers a peaceful environment for downsizers. Grounds are kept in top-tier shape year-round. Walt's tip: Homes here feature very well-designed single-story layouts.",
    "community_url": "https://www.retiretopa.com/the-porches-of-allenberry/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1781407256/42/42_PACB2055232_01.jpg",
    "latitude": 40.1520,
    "longitude": -77.1060,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-the-preserves-gettysburg",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "The Preserves",
    "region": "Adams County",
    "price_min": 300000,
    "price_max": 540000,
    "hoa_fee": 315,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "The Preserves is a charming, highly established active-adult community. The social committee organizes fantastic dinners and get-togethers. Walt's tip: Be sure to tour the clubhouse and meet the neighbors.",
    "community_url": "https://www.retiretopa.com/the-preserves-gettysburg/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1780891104/42/42_PAAD2023644_01.jpg",
    "latitude": 39.7865,
    "longitude": -77.2015,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-the-villages-at-maidencreek-blandon",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "The Villages at Maidencreek-",
    "region": "Berks County",
    "price_min": 240000,
    "price_max": 480000,
    "hoa_fee": 165,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "The Villages at Maidencreek- features modern low-maintenance floorplans. Residents love the convenient access to local retail and dining. Walt's tip: Great community if you travel frequently since exterior upkeep is fully covered!",
    "community_url": "https://www.retiretopa.com/the-villages-at-maidencreek-blandon/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1774108566/42/42_PABK2069426_01.jpg",
    "latitude": 40.3899,
    "longitude": -75.9758,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-villas-cattail",
    "name": "Villas at Cattail Crossing",
    "region": "York County",
    "price_min": 365000,
    "price_max": 385000,
    "hoa_fee": 150,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Exterior maintenance",
      "Common landscaping"
    ],
    "amenities": [
      "Golf Course Views",
      "Championship Golf Access",
      "Clubhouse Grille & Lounge",
      "Sidewalk Trails"
    ],
    "home_types": [
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Villas at Cattail Crossing offers premium low-maintenance homes near the golf course. Located in Hanover, it is very peaceful and well-maintained. Walt's tip: The proximity to Cattail Club makes this a golfer's paradise.",
    "community_url": "https://www.retiretopa.com/the-villas-cattail/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1781077128/42/42_PAAD2023750_01.jpg",
    "latitude": 39.815,
    "longitude": -76.995,
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-the-villas-on-the-lake",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "The Villas On The Lake York",
    "region": "York County",
    "price_min": 220000,
    "price_max": 460000,
    "hoa_fee": 215,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool",
      "Pickleball Courts",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "The Villas On The Lake York offers a peaceful environment for downsizers. Grounds are kept in top-tier shape year-round. Walt's tip: Homes here feature very well-designed single-story layouts.",
    "community_url": "https://www.retiretopa.com/the-villas-on-the-lake/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1779153219/42/42_PAYK2103684_01.jpg",
    "latitude": 39.9538,
    "longitude": -76.747,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-timber-villa",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Timber Villa Berks",
    "region": "Berks County",
    "price_min": 280000,
    "price_max": 600000,
    "hoa_fee": 135,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Pickleball Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Timber Villa Berks features modern low-maintenance floorplans. Residents love the convenient access to local retail and dining. Walt's tip: Great community if you travel frequently since exterior upkeep is fully covered!",
    "community_url": "https://www.retiretopa.com/timber-villa/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1781527639/42/42_PALA2088882_01.jpg",
    "latitude": 40.4023,
    "longitude": -76.0162,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-traditions-of-america-e-petersburg",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Traditions of America E Petersburg",
    "region": "Lancaster County",
    "price_min": 320000,
    "price_max": 560000,
    "hoa_fee": 155,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Traditions of America E Petersburg is a fantastic 55+ neighborhood in the East Petersburg area. Offering beautiful homes and highly quiet environments. Walt's tip: Perfect for buyers wanting peaceful surroundings.",
    "community_url": "https://www.retiretopa.com/traditions-of-america-e-petersburg/",
    "image_url": "https://sierra-public.azureedge.net/2d43c7f0-9b9c-443e-9e8f-d57dc6571c34.jpg",
    "latitude": 40.0850,
    "longitude": -76.3660,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-traditions-of-america-lititz",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Traditions of America Lititz",
    "region": "Lancaster County",
    "price_min": 300000,
    "price_max": 580000,
    "hoa_fee": 245,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Traditions of America Lititz features modern low-maintenance floorplans. Residents love the convenient access to local retail and dining. Walt's tip: Great community if you travel frequently since exterior upkeep is fully covered!",
    "community_url": "https://www.retiretopa.com/traditions-of-america-lititz/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1778562340/42/42_PALA2086048_01.jpg",
    "latitude": 40.1805,
    "longitude": -76.3351,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-traditions-of-america-silver-springs",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Traditions of America",
    "region": "Cumberland County",
    "price_min": 300000,
    "price_max": 480000,
    "hoa_fee": 215,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool",
      "Pickleball Courts",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Traditions of America is a fantastic 55+ neighborhood in the Cumberland County area. Offering beautiful homes and highly quiet environments. Walt's tip: Perfect for buyers wanting peaceful surroundings.",
    "community_url": "https://www.retiretopa.com/traditions-of-america-silver-springs/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1782525002/42/42_PACB2055742_01.jpg",
    "latitude": 40.1938,
    "longitude": -76.9989,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-village-grande-millersville",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Village Grande",
    "region": "Lancaster County",
    "price_min": 300000,
    "price_max": 680000,
    "hoa_fee": 295,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Exterior painting",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Pickleball Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Village Grande features modern low-maintenance floorplans. Residents love the convenient access to local retail and dining. Walt's tip: Great community if you travel frequently since exterior upkeep is fully covered!",
    "community_url": "https://www.retiretopa.com/village-grande-millersville/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1777853933/42/42_PALA2087448_01.jpg",
    "latitude": 40.0658,
    "longitude": -76.3664,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-watson-run-gordonville",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Watson Run",
    "region": "Lancaster County",
    "price_min": 240000,
    "price_max": 360000,
    "hoa_fee": 215,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance",
      "Roof repair"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Watson Run is a charming, highly established active-adult community. The social committee organizes fantastic dinners and get-togethers. Walt's tip: Be sure to tour the clubhouse and meet the neighbors.",
    "community_url": "https://www.retiretopa.com/watson-run-gordonville/",
    "image_url": "https://cdn.listingphotos.sierrastatic.com/pics2x/v1769278896/42/42_PALA2082228_340.jpg",
    "latitude": 40.0837,
    "longitude": -76.26,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-wayfield-at-annville",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Wynfield at Annville",
    "region": "Lebanon County",
    "price_min": 240000,
    "price_max": 560000,
    "hoa_fee": 185,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Swimming Pool"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Wynfield at Annville features modern low-maintenance floorplans. Residents love the convenient access to local retail and dining. Walt's tip: Great community if you travel frequently since exterior upkeep is fully covered!",
    "community_url": "https://www.retiretopa.com/wayfield-at-annville/",
    "image_url": "https://sierra-public.azureedge.net/478e5159-de28-4012-8dab-c2cef2a7da0e.jpg",
    "latitude": 40.3441,
    "longitude": -76.4011,
    "created_at": "2026-05-30T12:56:41.877Z"
  },
  {
    "id": "c-seed-wynfield-at-millersville",
    "realtor_id": "d8c7b80a-9d6e-4c3e-902e-8cb5d6e2e5c8",
    "name": "Wynfield at",
    "region": "Lancaster County",
    "price_min": 320000,
    "price_max": 480000,
    "hoa_fee": 305,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse",
      "Fitness Center",
      "Walking Trails",
      "Social Activities"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Wynfield at features modern low-maintenance floorplans. Residents love the convenient access to local retail and dining. Walt's tip: Great community if you travel frequently since exterior upkeep is fully covered!",
    "community_url": "https://www.retiretopa.com/wynfield-at-millersville/",
    "image_url": "https://sierra-public.azureedge.net/478e5159-de28-4012-8dab-c2cef2a7da0e.jpg",
    "latitude": 40.0125,
    "longitude": -76.2367,
    "created_at": "2026-05-30T12:56:41.878Z"
  },
  {
    "id": "c-seed-del-webb-bexley",
    "realtor_id": "e9b8c71a-0e7f-5d4a-013f-9db6e7f3f6d9",
    "name": "Del Webb Bexley",
    "region": "Pasco County",
    "price_min": 390000,
    "price_max": 580000,
    "hoa_fee": 195,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Common area maintenance",
      "Gated community security"
    ],
    "amenities": [
      "Clubhouse & Social Calendar",
      "Pool & Fitness Facility",
      "Pickleball & Tennis Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Del Webb Bexley is a spectacular active-adult community in Land O' Lakes. The clubhouse features a lakefront view and very active sports courts. Frank's tip: Perfect for golf-cart convenience.",
    "community_url": "https://www.delwebb.com/homes/florida/tampa/land-o-lakes/del-webb-bexley-209633",
    "image_url": "/luxury_clubhouse.png",
    "latitude": 28.2198,
    "longitude": -82.5292,
    "created_at": "2026-05-30T12:56:41.878Z"
  },
  {
    "id": "c-seed-valencia-lakes",
    "realtor_id": "e9b8c71a-0e7f-5d4a-013f-9db6e7f3f6d9",
    "name": "Valencia Lakes",
    "region": "Hillsborough County",
    "price_min": 350000,
    "price_max": 650000,
    "hoa_fee": 210,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Common area upkeep",
      "Gated Security & Staffed Entry"
    ],
    "amenities": [
      "Clubhouse & Social Calendar",
      "Pool & Fitness Facility",
      "Pickleball & Tennis Courts"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Valencia Lakes in Wimauma is Hillsborough's premier active-adult community. Features a massive 40k sq ft clubhouse with resort pool. Frank's tip: Great for social groups.",
    "community_url": "#",
    "image_url": "/springwood_estates_villa.png",
    "latitude": 27.7122,
    "longitude": -82.3086,
    "created_at": "2026-05-30T12:56:41.878Z"
  },
  {
    "id": "c-seed-esplanade-artisan-lakes",
    "realtor_id": "e9b8c71a-0e7f-5d4a-013f-9db6e7f3f6d9",
    "name": "Esplanade at Artisan Lakes",
    "region": "Manatee County",
    "price_min": 380000,
    "price_max": 590000,
    "hoa_fee": 185,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Lawn care",
      "Snow removal",
      "Common area maintenance"
    ],
    "amenities": [
      "Clubhouse & Social Calendar",
      "Pool & Fitness Facility",
      "Walking Trails & Nature Parks",
      "Dog Park & Pet-Friendly Areas"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa"
    ],
    "realtor_notes": "Esplanade offers resort-style living with beautiful nature preserves and pet-friendly trails. Frank's tip: Perfect for walking and biking enthusiasts.",
    "community_url": "#",
    "image_url": "/modern_ranch_home.png",
    "latitude": 27.6044,
    "longitude": -82.5358,
    "created_at": "2026-05-30T12:56:41.878Z"
  },
  {
    "id": "c-seed-sun-city-center",
    "realtor_id": "e9b8c71a-0e7f-5d4a-013f-9db6e7f3f6d9",
    "name": "Sun City Center",
    "region": "Hillsborough County",
    "price_min": 250000,
    "price_max": 450000,
    "hoa_fee": 120,
    "hoa_frequency": "monthly",
    "hoa_inclusions": [
      "Common area upkeep",
      "Insurance"
    ],
    "amenities": [
      "Clubhouse & Social Calendar",
      "Pool & Fitness Facility",
      "Golf Course Access / Cart Paths"
    ],
    "home_types": [
      "Single-Family Detached",
      "Low-Maintenance Townhome / Villa",
      "Condo / Penthouse Layout"
    ],
    "realtor_notes": "Sun City Center is one of the largest and most established golf-cart legal active-adult communities in America. Frank's tip: Best overall value if you want complete freedom.",
    "community_url": "#",
    "image_url": "/golf_villa.png",
    "latitude": 27.7142,
    "longitude": -82.3581,
    "created_at": "2026-05-30T12:56:41.878Z"
  }
];;;;;

// In-memory store for server-side SSR operations when env vars are missing
let serverStore: {
  realtors: any[];
  communities: any[];
  leads: any[];
  chat_messages: any[];
} = {
  realtors: [DEFAULT_REALTOR, TAMPA_REALTOR],
  communities: DEFAULT_COMMUNITIES,
  leads: [],
  chat_messages: []
};

// Local storage helper for client side when env vars are missing
const getLocalStorageDb = () => {
  if (typeof window === 'undefined') {
    return serverStore;
  }

  const getOrInit = (key: string, initial: any) => {
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    try {
      const parsed = JSON.parse(val);
      if (key === '55plus_realtors' && Array.isArray(parsed)) {
        let isUpdated = false;
        const updated = parsed.map(r => {
          if (r.id === DEFAULT_REALTOR.id && r.email !== DEFAULT_REALTOR.email) {
            isUpdated = true;
            return { ...r, email: DEFAULT_REALTOR.email };
          }
          if (r.id === TAMPA_REALTOR.id && r.email !== TAMPA_REALTOR.email) {
            isUpdated = true;
            return { ...r, email: TAMPA_REALTOR.email };
          }
          return r;
        });

        const hasWalt = updated.some(r => r.id === DEFAULT_REALTOR.id);
        const hasTampa = updated.some(r => r.id === TAMPA_REALTOR.id);
        if (!hasWalt || !hasTampa || isUpdated) {
          if (!hasWalt) updated.push(DEFAULT_REALTOR);
          if (!hasTampa) updated.push(TAMPA_REALTOR);
          localStorage.setItem(key, JSON.stringify(updated));
          return updated;
        }
      }
      if (key === '55plus_communities' && Array.isArray(parsed)) {
        // Overwrite if cached list is very old/placeholder, or if it doesn't contain Tampa communities yet, or contains old placeholder images or stale coordinates
        const hasPlaceholder = parsed.some(c => c.id.startsWith('c1111111') || c.id === 'c1111111-1111-1111-1111-111111111111');
        const hasTampaComms = parsed.some(c => c.realtor_id === TAMPA_REALTOR.id);
        const hasPlaceholderImg = parsed.some(c => c.image_url === '/modern_ranch_home.png' || c.image_url === '/traditions_york_exterior.png');
        const hasStaleLocations = parsed.some(c => c.id === 'c-seed-lake-meade' && c.latitude === 39.9553);
        if (parsed.length < 40 || hasPlaceholder || !hasTampaComms || hasPlaceholderImg || hasStaleLocations) {
          localStorage.setItem(key, JSON.stringify(initial));
          return initial;
        }
      }
      return parsed;
    } catch (e) {
      return JSON.parse(val);
    }
  };

  return {
    realtors: getOrInit('55plus_realtors', [DEFAULT_REALTOR, TAMPA_REALTOR]),
    communities: getOrInit('55plus_communities', DEFAULT_COMMUNITIES),
    leads: getOrInit('55plus_leads', []),
    chat_messages: getOrInit('55plus_chat_messages', [])
  };
};

const saveLocalStorageDb = (db: any) => {
  if (typeof window === 'undefined') {
    serverStore = db;
    return;
  }
  localStorage.setItem('55plus_realtors', JSON.stringify(db.realtors));
  localStorage.setItem('55plus_communities', JSON.stringify(db.communities));
  localStorage.setItem('55plus_leads', JSON.stringify(db.leads));
  localStorage.setItem('55plus_chat_messages', JSON.stringify(db.chat_messages));
};

// Mock query chain simulator
class MockQueryBuilder {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    return {
      eq: (colName: string, value: any) => {
        return {
          single: async () => {
            const db = getLocalStorageDb();
            const list = db[this.tableName as keyof typeof db] || [];
            const item = list.find((x: any) => x[colName] === value);
            return { data: item || null, error: null };
          },
          order: (orderByCol: string, options?: { ascending: boolean }) => {
            return {
              then: async (resolve: any) => {
                const db = getLocalStorageDb();
                let list = db[this.tableName as keyof typeof db] || [];
                list = list.filter((x: any) => x[colName] === value);
                list.sort((a: any, b: any) => {
                  const valA = a[orderByCol];
                  const valB = b[orderByCol];
                  if (valA < valB) return options?.ascending === false ? 1 : -1;
                  if (valA > valB) return options?.ascending === false ? -1 : 1;
                  return 0;
                });
                resolve({ data: list, error: null });
              }
            };
          },
          then: async (resolve: any) => {
            const db = getLocalStorageDb();
            const list = db[this.tableName as keyof typeof db] || [];
            const filtered = list.filter((x: any) => x[colName] === value);
            resolve({ data: filtered, error: null });
          }
        };
      },
      order: (orderByCol: string, options?: { ascending: boolean }) => {
        return {
          then: async (resolve: any) => {
            const db = getLocalStorageDb();
            const list = [...(db[this.tableName as keyof typeof db] || [])];
            list.sort((a: any, b: any) => {
              const valA = a[orderByCol];
              const valB = b[orderByCol];
              if (valA < valB) return options?.ascending === false ? 1 : -1;
              if (valA > valB) return options?.ascending === false ? -1 : 1;
              return 0;
            });
            resolve({ data: list, error: null });
          }
        };
      },
      then: async (resolve: any) => {
        const db = getLocalStorageDb();
        const list = db[this.tableName as keyof typeof db] || [];
        resolve({ data: list, error: null });
      }
    };
  }

  insert(data: any) {
    return {
      select: () => {
        return {
          single: async () => {
            const db = getLocalStorageDb();
            const record = {
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              ...data
            };
            db[this.tableName as keyof typeof db].push(record);
            saveLocalStorageDb(db);
            return { data: record, error: null };
          },
          then: async (resolve: any) => {
            const db = getLocalStorageDb();
            const records = Array.isArray(data)
              ? data.map((d) => ({
                  id: crypto.randomUUID(),
                  created_at: new Date().toISOString(),
                  ...d
                }))
              : [{ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...data }];
            db[this.tableName as keyof typeof db].push(...records);
            saveLocalStorageDb(db);
            resolve({ data: records, error: null });
          }
        };
      },
      then: async (resolve: any) => {
        const db = getLocalStorageDb();
        const records = Array.isArray(data)
          ? data.map((d) => ({
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              ...d
            }))
          : [{ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...data }];
        db[this.tableName as keyof typeof db].push(...records);
        saveLocalStorageDb(db);
        resolve({ data: records, error: null });
      }
    };
  }

  update(data: any) {
    return {
      eq: (colName: string, value: any) => {
        return {
          select: () => {
            return {
              single: async () => {
                const db = getLocalStorageDb();
                const list = db[this.tableName as keyof typeof db] || [];
                const idx = list.findIndex((x: any) => x[colName] === value);
                if (idx !== -1) {
                  list[idx] = { ...list[idx], ...data };
                  saveLocalStorageDb(db);
                  return { data: list[idx], error: null };
                }
                return { data: null, error: new Error('Record not found') };
              }
            };
          },
          then: async (resolve: any) => {
            const db = getLocalStorageDb();
            const list = db[this.tableName as keyof typeof db] || [];
            const updated: any[] = [];
            list.forEach((x: any, idx: number) => {
              if (x[colName] === value) {
                list[idx] = { ...x, ...data };
                updated.push(list[idx]);
              }
            });
            if (updated.length > 0) {
              saveLocalStorageDb(db);
            }
            resolve({ data: updated, error: null });
          }
        };
      }
    };
  }

  upsert(data: any) {
    return {
      then: async (resolve: any) => {
        const db = getLocalStorageDb();
        const list = db[this.tableName as keyof typeof db] || [];
        const records = Array.isArray(data) ? data : [data];
        
        records.forEach((record) => {
          const idx = list.findIndex((x: any) => x.id === record.id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...record };
          } else {
            list.push({
              id: record.id || crypto.randomUUID(),
              created_at: new Date().toISOString(),
              ...record
            });
          }
        });
        
        saveLocalStorageDb(db);
        resolve({ data, error: null });
      }
    };
  }

  delete() {
    return {
      eq: (colName: string, value: any) => {
        return {
          then: async (resolve: any) => {
            const db = getLocalStorageDb();
            const list = db[this.tableName as keyof typeof db] || [];
            const remaining = list.filter((x: any) => x[colName] !== value);
            db[this.tableName as keyof typeof db] = remaining;
            saveLocalStorageDb(db);
            resolve({ error: null });
          }
        };
      }
    };
  }
}

const mockSupabase = {
  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  },
  auth: {
    async signInWithOtp({ email, options }: { email: string, options?: any }) {
      return { data: { message: "Mock OTP link generated" }, error: null };
    },
    async signOut() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('55plus_auth_session');
      }
      return { error: null };
    },
    async getSession() {
      if (typeof window === 'undefined') return { data: { session: null }, error: null };
      const val = localStorage.getItem('55plus_auth_session');
      if (val) {
        try {
          const session = JSON.parse(val);
          return { data: { session }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },
    onAuthStateChange(callback: any) {
      this.getSession().then(({ data: { session } }) => {
        callback('SIGNED_IN', session);
      });
      return { data: { subscription: { unsubscribe() {} } } };
    }
  }
};

export const supabase = isRealSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (mockSupabase as any);

export const isMockClient = !isRealSupabaseConfigured;
export { DEFAULT_REALTOR, TAMPA_REALTOR, DEFAULT_COMMUNITIES };
