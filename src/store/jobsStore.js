import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

const useJobsStore = create(
  persist(
    (set) => ({
      jobs: {}, // Using an object to store jobs by ID
      
      createNewJob: (jobData) => set((state) => {
        const jobId = uuidv4();
        const newJob = {
            id: jobId,
            ...jobData,
            status: 'Inspection', // Inspection -> Estimate -> JobSheet -> Challan -> Invoice
            inspection: { items: [], photos: [] },
            estimate: {
              items: [],
              discountAmount: 0,
              gstRate: 18,
              approvalNeeded: false,
              status: 'Draft' // Draft -> Pending Approval -> Approved
            },
            jobSheet: { items: [], extraWork: [], finalized: false },
            chalan: null,
            invoice: null,
            createdAt: new Date().toISOString(),
        };
        return { jobs: { ...state.jobs, [jobId]: newJob } };
      }),
      
      updateJobDetails: (jobId, details) => set(state => {
        const job = state.jobs[jobId];
        if (!job) return state;
        const updatedJob = { ...job, ...details };
        return { jobs: { ...state.jobs, [jobId]: updatedJob } };
      }),

      // --- Inspection Methods ---
      addInspectionItem: (jobId, item) => set((state) => {
        const job = state.jobs[jobId];
        if (!job) return state;
        const newItem = { id: uuidv4(), ...item };
        const updatedJob = { ...job, inspection: { ...job.inspection, items: [...job.inspection.items, newItem] } };
        return { jobs: { ...state.jobs, [jobId]: updatedJob } };
      }),
      updateInspectionItem: (jobId, updatedItem) => set((state) => {
        const job = state.jobs[jobId];
        if (!job) return state;
        const updatedItems = job.inspection.items.map(item => item.id === updatedItem.id ? updatedItem : item);
        const updatedJob = { ...job, inspection: { ...job.inspection, items: updatedItems } };
        return { jobs: { ...state.jobs, [jobId]: updatedJob } };
      }),
      deleteInspectionItem: (jobId, itemId) => set((state) => {
        const job = state.jobs[jobId];
        if (!job) return state;
        const filteredItems = job.inspection.items.filter(item => item.id !== itemId);
        const updatedJob = { ...job, inspection: { ...job.inspection, items: filteredItems } };
        return { jobs: { ...state.jobs, [jobId]: updatedJob } };
      }),

      // --- Estimate Methods ---
      generateEstimateFromInspection: (jobId) => set((state) => {
        const job = state.jobs[jobId];
        if (!job || !job.inspection.items) return state;

        const multipliers = { Parts: 1.5, Labour: 2, Hardware: 2, Steel: 1.5 };

        const estimateItems = job.inspection.items.map(item => {
            const multiplier = multipliers[item.category] || 1;
            const finalRate = item.cost * multiplier;
            return {
                id: uuidv4(), 
                description: item.item,
                qty: 1,
                rate: finalRate, // Price with margin
                originalCost: parseFloat(item.cost), // Store original cost for JobSheet
                category: item.category,
            }
        });
        const updatedJob = { ...job, estimate: { ...job.estimate, items: estimateItems } };
        return { jobs: { ...state.jobs, [jobId]: updatedJob }};
      }),

      updateEstimateItem: (jobId, updatedItem) => set((state) => {
        const job = state.jobs[jobId];
        if (!job) return state;
        const updatedItems = job.estimate.items.map(item => item.id === updatedItem.id ? updatedItem : item);
        const updatedJob = { ...job, estimate: { ...job.estimate, items: updatedItems } };
        return { jobs: { ...state.jobs, [jobId]: updatedJob } };
      }),

      updateEstimateTotals: (jobId, newTotals) => set(state => {
        const job = state.jobs[jobId];
        if (!job) return state;
        const subTotal = job.estimate.items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
        const discountAmount = newTotals.discountAmount || 0;
        const discountPercent = subTotal > 0 ? (discountAmount / subTotal) * 100 : 0;

        const approvalNeeded = discountPercent > 5;

        const updatedJob = { ...job, estimate: { ...job.estimate, ...newTotals, approvalNeeded } };
        return { jobs: { ...state.jobs, [jobId]: updatedJob } };
      }),

      approveEstimate: (jobId) => set(state => {
          const job = state.jobs[jobId];
          if(!job) return state;
          const updatedEstimate = { ...job.estimate, approvalNeeded: false, status: 'Approved' };
          const updatedJob = { ...job, estimate: updatedEstimate };
          return { jobs: { ...state.jobs, [jobId]: updatedJob } };
      }),

    }),
    {
      name: 'jobs-storage',
    }
  )
);

export const initializeDefaultJob = () => {
    const { jobs, createNewJob } = useJobsStore.getState();
    if (Object.keys(jobs).length === 0) {
        console.log("No jobs found, creating a default job for demonstration.");
        createNewJob({
            vehicleNo: 'PB08-DEMO',
            ownerName: 'Default Owner',
            branch: 'Head Office',
            inspectionDate: new Date().toISOString().split('T')[0],
        });
    }
};

export default useJobsStore;
