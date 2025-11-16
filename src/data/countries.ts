export interface Country {
  code: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  hasStates?: boolean;
  stateType?: 'us-states' | 'canada-provinces' | 'australia-states' | 'india-states';
  region: string;
}

export interface Region {
  id: string;
  name: string;
  icon: string;
  coordinates: [number, number];
}

export const REGIONS: Region[] = [
  { id: "north-america", name: "North America", icon: "🌎", coordinates: [-100, 45] },
  { id: "europe", name: "Europe", icon: "🇪🇺", coordinates: [15, 50] },
  { id: "asia", name: "Asia", icon: "🌏", coordinates: [100, 30] },
  { id: "africa", name: "Africa", icon: "🌍", coordinates: [20, 0] },
  { id: "south-america", name: "South America", icon: "🌎", coordinates: [-60, -15] },
  { id: "oceania", name: "Oceania", icon: "🌏", coordinates: [135, -25] },
  { id: "middle-east", name: "Middle East", icon: "🕌", coordinates: [45, 25] },
];

export const COUNTRIES: Country[] = [
  // North America
  { code: "US", name: "United States", coordinates: [-95.7129, 37.0902], hasStates: true, stateType: 'us-states', region: "north-america" },
  { code: "CA", name: "Canada", coordinates: [-106.3468, 56.1304], hasStates: true, stateType: 'canada-provinces', region: "north-america" },
  { code: "MX", name: "Mexico", coordinates: [-102.5528, 23.6345], region: "north-america" },
  
  // Europe
  { code: "GB", name: "United Kingdom", coordinates: [-0.1276, 51.5074], region: "europe" },
  { code: "DE", name: "Germany", coordinates: [10.4515, 51.1657], region: "europe" },
  { code: "FR", name: "France", coordinates: [2.2137, 46.2276], region: "europe" },
  { code: "IT", name: "Italy", coordinates: [12.5674, 41.8719], region: "europe" },
  { code: "ES", name: "Spain", coordinates: [-3.7492, 40.4637], region: "europe" },
  { code: "RU", name: "Russia", coordinates: [105.3188, 61.5240], region: "europe" },
  { code: "PL", name: "Poland", coordinates: [19.1451, 51.9194], region: "europe" },
  { code: "NL", name: "Netherlands", coordinates: [5.2913, 52.1326], region: "europe" },
  { code: "SE", name: "Sweden", coordinates: [18.6435, 60.1282], region: "europe" },
  { code: "NO", name: "Norway", coordinates: [8.4689, 60.4720], region: "europe" },
  { code: "DK", name: "Denmark", coordinates: [9.5018, 56.2639], region: "europe" },
  { code: "FI", name: "Finland", coordinates: [25.7482, 61.9241], region: "europe" },
  { code: "CH", name: "Switzerland", coordinates: [8.2275, 46.8182], region: "europe" },
  { code: "AT", name: "Austria", coordinates: [14.5501, 47.5162], region: "europe" },
  { code: "BE", name: "Belgium", coordinates: [4.4699, 50.5039], region: "europe" },
  { code: "PT", name: "Portugal", coordinates: [-8.2245, 39.3999], region: "europe" },
  { code: "GR", name: "Greece", coordinates: [21.8243, 39.0742], region: "europe" },
  { code: "CZ", name: "Czech Republic", coordinates: [15.4730, 49.8175], region: "europe" },
  { code: "IE", name: "Ireland", coordinates: [-8.2439, 53.4129], region: "europe" },
  
  // Asia
  { code: "CN", name: "China", coordinates: [104.1954, 35.8617], region: "asia" },
  { code: "IN", name: "India", coordinates: [78.9629, 20.5937], hasStates: true, stateType: 'india-states', region: "asia" },
  { code: "JP", name: "Japan", coordinates: [138.2529, 36.2048], region: "asia" },
  { code: "KR", name: "South Korea", coordinates: [127.7669, 35.9078], region: "asia" },
  { code: "ID", name: "Indonesia", coordinates: [113.9213, -0.7893], region: "asia" },
  { code: "TH", name: "Thailand", coordinates: [100.9925, 15.8700], region: "asia" },
  { code: "SG", name: "Singapore", coordinates: [103.8198, 1.3521], region: "asia" },
  { code: "MY", name: "Malaysia", coordinates: [101.9758, 4.2105], region: "asia" },
  { code: "PH", name: "Philippines", coordinates: [121.7740, 12.8797], region: "asia" },
  { code: "VN", name: "Vietnam", coordinates: [108.2772, 14.0583], region: "asia" },
  { code: "PK", name: "Pakistan", coordinates: [69.3451, 30.3753], region: "asia" },
  { code: "BD", name: "Bangladesh", coordinates: [90.3563, 23.6850], region: "asia" },
  
  // Middle East
  { code: "SA", name: "Saudi Arabia", coordinates: [45.0792, 23.8859], region: "middle-east" },
  { code: "TR", name: "Turkey", coordinates: [35.2433, 38.9637], region: "middle-east" },
  { code: "AE", name: "United Arab Emirates", coordinates: [53.8478, 23.4241], region: "middle-east" },
  { code: "IL", name: "Israel", coordinates: [34.8516, 31.0461], region: "middle-east" },
  { code: "EG", name: "Egypt", coordinates: [30.8025, 26.8206], region: "middle-east" },
  
  // Africa
  { code: "ZA", name: "South Africa", coordinates: [22.9375, -30.5595], region: "africa" },
  { code: "NG", name: "Nigeria", coordinates: [8.6753, 9.0820], region: "africa" },
  { code: "KE", name: "Kenya", coordinates: [37.9062, -0.0236], region: "africa" },
  { code: "GH", name: "Ghana", coordinates: [-1.0232, 7.9465], region: "africa" },
  
  // South America
  { code: "BR", name: "Brazil", coordinates: [-51.9253, -14.2350], region: "south-america" },
  { code: "AR", name: "Argentina", coordinates: [-63.6167, -38.4161], region: "south-america" },
  { code: "CL", name: "Chile", coordinates: [-71.5430, -35.6751], region: "south-america" },
  { code: "CO", name: "Colombia", coordinates: [-74.2973, 4.5709], region: "south-america" },
  { code: "PE", name: "Peru", coordinates: [-75.0152, -9.1900], region: "south-america" },
  
  // Oceania
  { code: "AU", name: "Australia", coordinates: [133.7751, -25.2744], hasStates: true, stateType: 'australia-states', region: "oceania" },
  { code: "NZ", name: "New Zealand", coordinates: [174.8860, -40.9006], region: "oceania" },
];

export const getCountriesByRegion = (regionId: string): Country[] => {
  return COUNTRIES.filter(country => country.region === regionId);
};
