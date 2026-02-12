export interface DivisionalSecretariat {
  name: string;
  divisionNumber: string;
  district?: string;
  province?: string;
}

// Placeholder list — extend with real data as needed
export const sriLankaDivisions: DivisionalSecretariat[] = [
  { name: 'Colombo', divisionNumber: '01', district: 'Colombo', province: 'Western' },
  { name: 'Dehiwala-Mount Lavinia', divisionNumber: '02', district: 'Colombo', province: 'Western' },
  { name: 'Kandy', divisionNumber: '03', district: 'Kandy', province: 'Central' },
  { name: 'Galle', divisionNumber: '04', district: 'Galle', province: 'Southern' },
  { name: 'Jaffna', divisionNumber: '05', district: 'Jaffna', province: 'Northern' },
  { name: 'Kurunegala', divisionNumber: '06', district: 'Kurunegala', province: 'North Western' },
  { name: 'Matara', divisionNumber: '07', district: 'Matara', province: 'Southern' },
  { name: 'Negombo', divisionNumber: '08', district: 'Gampaha', province: 'Western' },
  { name: 'Ratnapura', divisionNumber: '09', district: 'Ratnapura', province: 'Sabaragamuwa' },
  { name: 'Anuradhapura', divisionNumber: '10', district: 'Anuradhapura', province: 'North Central' },
  { name: 'Batticaloa', divisionNumber: '11', district: 'Batticaloa', province: 'Eastern' },
  { name: 'Trincomalee', divisionNumber: '12', district: 'Trincomalee', province: 'Eastern' },
  { name: 'Badulla', divisionNumber: '13', district: 'Badulla', province: 'Uva' },
  { name: 'Nuwara Eliya', divisionNumber: '14', district: 'Nuwara Eliya', province: 'Central' },
  { name: 'Hambantota', divisionNumber: '15', district: 'Hambantota', province: 'Southern' },
];

export default sriLankaDivisions;
