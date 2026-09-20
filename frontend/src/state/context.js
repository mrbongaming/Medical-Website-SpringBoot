import { createContext, useContext } from 'react';
export const HospitalContext = createContext(null);
export const useHospital = () => useContext(HospitalContext);
