import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, FileSpreadsheet, Wrench, PackageCheck, ReceiptText, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import InspectionStep from './jobs/InspectionStep';
import EstimateStep from './jobs/EstimateStep';
import JobSheetStep from './jobs/JobSheetStep';
import ChalanStep from './jobs/ChalanStep';
import InvoiceStep from './jobs/InvoiceStep';
import useJobsStore, { initializeDefaultJob } from '@/store/jobsStore';
import { motion } from 'framer-motion';

const steps = [
  { id: 'inspection', name: 'Vehicle Inspection', icon: ClipboardList, component: InspectionStep },
  { id: 'estimate', name: 'Estimate', icon: FileSpreadsheet, component: EstimateStep },
  { id: 'jobsheet', name: 'Job Sheet', icon: Wrench, component: JobSheetStep },
  { id: 'chalan', name: 'Chalan', icon: PackageCheck, component: ChalanStep },
  { id: 'invoice', name: 'Invoice', icon: ReceiptText, component: InvoiceStep },
];

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const jobs = useJobsStore(state => state.jobs);
  
  const activeJobId = Object.keys(jobs)[0]; 

  useEffect(() => {
    initializeDefaultJob();
  }, []);

  useEffect(() => {
    const stepParam = searchParams.get('step');
    const stepIndex = steps.findIndex(s => s.id === stepParam);
    setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
  }, [searchParams]);

  const navigateToStep = (index) => {
    setSearchParams({ step: steps[index].id });
  };
  const handleNext = () => { if (currentStep < steps.length - 1) navigateToStep(currentStep + 1); };
  const handlePrev = () => { if (currentStep > 0) navigateToStep(currentStep - 1); };
  
  const ActiveComponent = steps[currentStep].component;

  if (!activeJobId) {
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-dark-text-secondary">Loading or creating a new job...</p>
        </div>
    );
  }

  return (
    <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-xl shadow-card dark:shadow-dark-card border border-gray-100 dark:border-gray-700 space-y-6"
    >
      {/* Sync Status Indicator */}
      <div className="flex justify-end">
        <SyncStatusIndicator />
      </div>

      <div className="border-b dark:border-gray-700 pb-6">
        <nav aria-label="Progress">
          <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className="md:flex-1">
                <div onClick={() => navigateToStep(stepIdx)} className="group flex items-center cursor-pointer relative">
                    <div className="flex items-center">
                        <motion.div
                            animate={{ scale: stepIdx === currentStep ? 1.1 : 1 }}
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${ stepIdx <= currentStep ? 'bg-brand-red text-white' : 'border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-gray-500 dark:text-dark-text-secondary'}`}>
                            <step.icon className="h-6 w-6" />
                        </motion.div>
                        <div className="ml-4 text-left">
                          <div className={`text-sm font-medium ${ stepIdx <= currentStep ? 'text-brand-dark dark:text-dark-text' : 'text-gray-500 dark:text-dark-text-secondary'}`}>{step.name}</div>
                        </div>
                    </div>
                    {stepIdx < steps.length - 1 && (
                        <div className="hidden md:block absolute top-5 left-14 w-[calc(100%-3.5rem)] h-0.5 bg-gray-200 dark:bg-gray-700">
                           <div className={`h-full transition-colors duration-200 ${stepIdx < currentStep ? 'bg-brand-red' : 'bg-transparent'}`} />
                        </div>
                    )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="min-h-[400px]">
        <ActiveComponent jobId={activeJobId} />
      </div>

      <div className="flex justify-between border-t dark:border-gray-700 pt-4">
        <Button onClick={handlePrev} disabled={currentStep === 0} variant="secondary">
          <ArrowLeft className="h-5 w-5 mr-2"/> Previous
        </Button>
        <Button onClick={handleNext} disabled={currentStep === steps.length - 1}>
          Next <ArrowRight className="h-5 w-5 ml-2"/>
        </Button>
      </div>
    </motion.div>
  );
};
export default Jobs;
