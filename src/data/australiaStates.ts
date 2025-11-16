export interface AustraliaState {
  name: string;
  code: string;
  coordinates: [number, number]; // [longitude, latitude]
  zoom: number;
}

export const AUSTRALIA_STATES: AustraliaState[] = [
  { name: "New South Wales", code: "NSW", coordinates: [146.9211, -32.1654], zoom: 5 },
  { name: "Victoria", code: "VIC", coordinates: [144.7852, -37.4713], zoom: 6 },
  { name: "Queensland", code: "QLD", coordinates: [142.7028, -20.9176], zoom: 5 },
  { name: "South Australia", code: "SA", coordinates: [135.7617, -30.0002], zoom: 5 },
  { name: "Western Australia", code: "WA", coordinates: [122.2363, -27.6728], zoom: 4 },
  { name: "Tasmania", code: "TAS", coordinates: [146.8087, -41.6368], zoom: 6 },
  { name: "Northern Territory", code: "NT", coordinates: [133.8807, -19.4914], zoom: 5 },
  { name: "Australian Capital Territory", code: "ACT", coordinates: [149.0124, -35.4735], zoom: 9 },
];
