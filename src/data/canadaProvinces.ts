export interface CanadaProvince {
  name: string;
  code: string;
  coordinates: [number, number]; // [longitude, latitude]
  zoom: number;
}

export const CANADA_PROVINCES: CanadaProvince[] = [
  { name: "Alberta", code: "AB", coordinates: [-114.0719, 53.9333], zoom: 5 },
  { name: "British Columbia", code: "BC", coordinates: [-125.0000, 53.7267], zoom: 5 },
  { name: "Manitoba", code: "MB", coordinates: [-98.7390, 53.7609], zoom: 5 },
  { name: "New Brunswick", code: "NB", coordinates: [-66.4619, 46.5653], zoom: 6 },
  { name: "Newfoundland and Labrador", code: "NL", coordinates: [-57.6604, 53.1355], zoom: 5 },
  { name: "Northwest Territories", code: "NT", coordinates: [-116.6752, 64.8255], zoom: 4 },
  { name: "Nova Scotia", code: "NS", coordinates: [-63.5858, 44.6820], zoom: 6 },
  { name: "Nunavut", code: "NU", coordinates: [-95.4820, 70.2998], zoom: 3 },
  { name: "Ontario", code: "ON", coordinates: [-85.3232, 51.2538], zoom: 5 },
  { name: "Prince Edward Island", code: "PE", coordinates: [-63.1311, 46.5107], zoom: 8 },
  { name: "Quebec", code: "QC", coordinates: [-71.2082, 52.9399], zoom: 5 },
  { name: "Saskatchewan", code: "SK", coordinates: [-106.3468, 52.9399], zoom: 5 },
  { name: "Yukon", code: "YT", coordinates: [-135.0568, 64.2823], zoom: 4 },
];
