import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCompanyStore = create(
  persist(
    (set) => ({
      companyDetails: {
        name: 'Malwa Trolley',
        industry: 'Automobile / Heavy Vehicle Body Building',
        established: '1999',
        businessType: 'Manufacturer · Service Provider · Fabricator',
        gstin: '23CLKPM9473J1ZI',
        address: '122/1, Bypass Road, Behind Gurudwara & Wine Shop',
        city: 'Nayta Mundla, Nemawar Road, Indore',
        state: 'Madhya Pradesh',
        pincode: '452020',
        country: 'India',
        phone: '+91 8224000822',
        email: 'malwatrolley@gmail.com',
        website: 'www.malwatrolley.com',
        workingHours: 'Mon-Sat: 10:00 AM - 8:00 PM',
        workingDays: 'Sunday: Closed',
        logo: null,

        director: {
          name: 'Shahid Multani',
          phone: '+91 8224000822',
          email: 'malwatrolley@gmail.com'
        },
        projectManager: {
          name: 'Sahil Patel',
          phone: '+91 8224000821',
          email: 'sahil.malwatrolley@gmail.com'
        },
        marketingManager: {
          name: 'Akram Khan',
          phone: '+91 8224000828',
          email: 'akram.malwatrolley@gmail.com'
        },

        services: [
          'Tipper / Dumper Body Fabrication',
          'Trailer & Hydraulic System Fabrication',
          'Container / Custom Body Fabrication',
          'Accidental Repair, Denting & Painting',
          'Mechanical Repairs & Trolley/Trailer Repair'
        ],

        invoicePrefix: 'MT',
        invoiceFormat: 'MT/BRANCHCODE/2025/0001',

        bankDetails: {
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          accountHolderName: '',
          branch: ''
        },

        termsAndConditions: [
          'Payment terms: As per agreement',
          'Warranty: As per service type',
          'All disputes subject to Indore jurisdiction'
        ]
      },

      updateCompanyDetails: (details) => set((state) => ({
        companyDetails: { ...state.companyDetails, ...details }
      })),

      updateContactPerson: (role, details) => set((state) => ({
        companyDetails: {
          ...state.companyDetails,
          [role]: { ...state.companyDetails[role], ...details }
        }
      })),

      updateBankDetails: (details) => set((state) => ({
        companyDetails: {
          ...state.companyDetails,
          bankDetails: { ...state.companyDetails.bankDetails, ...details }
        }
      })),

      addService: (service) => set((state) => ({
        companyDetails: {
          ...state.companyDetails,
          services: [...state.companyDetails.services, service]
        }
      })),

      removeService: (index) => set((state) => ({
        companyDetails: {
          ...state.companyDetails,
          services: state.companyDetails.services.filter((_, i) => i !== index)
        }
      })),

      addTermsCondition: (term) => set((state) => ({
        companyDetails: {
          ...state.companyDetails,
          termsAndConditions: [...state.companyDetails.termsAndConditions, term]
        }
      })),

      removeTermsCondition: (index) => set((state) => ({
        companyDetails: {
          ...state.companyDetails,
          termsAndConditions: state.companyDetails.termsAndConditions.filter((_, i) => i !== index)
        }
      })),
    }),
    { name: 'company-storage' }
  )
);

export default useCompanyStore;
