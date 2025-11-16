export interface IndiaState {
  name: string;
  code: string;
  coordinates: [number, number]; // [longitude, latitude]
  zoom: number;
}

export const INDIA_STATES: IndiaState[] = [
  { name: "Andhra Pradesh", code: "AP", coordinates: [80.0982, 15.9129], zoom: 6 },
  { name: "Arunachal Pradesh", code: "AR", coordinates: [94.7278, 28.2180], zoom: 6 },
  { name: "Assam", code: "AS", coordinates: [92.9376, 26.2006], zoom: 6 },
  { name: "Bihar", code: "BR", coordinates: [85.3131, 25.0961], zoom: 6 },
  { name: "Chhattisgarh", code: "CG", coordinates: [81.8661, 21.2787], zoom: 6 },
  { name: "Goa", code: "GA", coordinates: [74.1240, 15.2993], zoom: 8 },
  { name: "Gujarat", code: "GJ", coordinates: [71.1924, 22.2587], zoom: 6 },
  { name: "Haryana", code: "HR", coordinates: [76.0856, 29.0588], zoom: 7 },
  { name: "Himachal Pradesh", code: "HP", coordinates: [77.1734, 31.1048], zoom: 6 },
  { name: "Jharkhand", code: "JH", coordinates: [85.2799, 23.6102], zoom: 6 },
  { name: "Karnataka", code: "KA", coordinates: [75.7139, 15.3173], zoom: 6 },
  { name: "Kerala", code: "KL", coordinates: [76.2711, 10.8505], zoom: 6 },
  { name: "Madhya Pradesh", code: "MP", coordinates: [78.6569, 22.9734], zoom: 6 },
  { name: "Maharashtra", code: "MH", coordinates: [75.7139, 19.7515], zoom: 6 },
  { name: "Manipur", code: "MN", coordinates: [93.9063, 24.6637], zoom: 7 },
  { name: "Meghalaya", code: "ML", coordinates: [91.3662, 25.4670], zoom: 7 },
  { name: "Mizoram", code: "MZ", coordinates: [92.9376, 23.1645], zoom: 7 },
  { name: "Nagaland", code: "NL", coordinates: [94.5624, 26.1584], zoom: 7 },
  { name: "Odisha", code: "OR", coordinates: [85.0985, 20.9517], zoom: 6 },
  { name: "Punjab", code: "PB", coordinates: [75.3412, 31.1471], zoom: 7 },
  { name: "Rajasthan", code: "RJ", coordinates: [74.2179, 27.0238], zoom: 6 },
  { name: "Sikkim", code: "SK", coordinates: [88.5122, 27.5330], zoom: 8 },
  { name: "Tamil Nadu", code: "TN", coordinates: [78.6569, 11.1271], zoom: 6 },
  { name: "Telangana", code: "TG", coordinates: [79.0193, 18.1124], zoom: 6 },
  { name: "Tripura", code: "TR", coordinates: [91.9882, 23.9408], zoom: 7 },
  { name: "Uttar Pradesh", code: "UP", coordinates: [80.9462, 26.8467], zoom: 6 },
  { name: "Uttarakhand", code: "UK", coordinates: [79.0193, 30.0668], zoom: 6 },
  { name: "West Bengal", code: "WB", coordinates: [87.8550, 22.9868], zoom: 6 },
  { name: "Delhi", code: "DL", coordinates: [77.1025, 28.7041], zoom: 9 },
];
