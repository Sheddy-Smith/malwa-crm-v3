import { create } from 'zustand';
import { toast } from 'sonner';
import { dbOperations, recalculateLabourBalance } from '@/lib/db';

const useLabourStore = create((set, get) => ({
  labour: [],
  loading: false,
  error: null,

  fetchLabour: async () => {
    try {
      set({ loading: true, error: null });
      const data = await dbOperations.getAll('labour');
      set({ labour: data || [], loading: false });
      return data;
    } catch (error) {
      console.error('Error fetching labour:', error);
      set({ error: error.message, loading: false });
      toast.error('Failed to load labour');
      throw error;
    }
  },

  addLabour: async (labourData) => {
    try {
      set({ loading: true, error: null });
      const newLabour = {
        name: labourData.name,
        phone: labourData.phone || null,
        address: labourData.address || null,
        skill_type: labourData.skill_type || null,
        opening_balance: labourData.opening_balance || 0,
        current_balance: labourData.opening_balance || 0,
        daily_rate: labourData.daily_rate || 0,
      };

      const data = await dbOperations.insert('labour', newLabour);

      if (data && parseFloat(data.opening_balance) !== 0) {
        await dbOperations.insert('labour_ledger_entries', {
          labour_id: data.id,
          entry_date: new Date().toISOString().split('T')[0],
          particulars: 'Opening Balance',
          ref_type: 'opening',
          debit: parseFloat(data.opening_balance),
          credit: 0,
        });
      }

      set((state) => ({ labour: [...state.labour, data], loading: false }));
      toast.success('Labour added successfully');
      return data;
    } catch (error) {
      console.error('Error adding labour:', error);
      set({ error: error.message, loading: false });
      toast.error('Failed to add labour');
      throw error;
    }
  },

  updateLabour: async (updatedLabour) => {
    try {
      set({ loading: true, error: null });
      await dbOperations.update('labour', updatedLabour.id, {
        name: updatedLabour.name,
        phone: updatedLabour.phone,
        address: updatedLabour.address,
        skill_type: updatedLabour.skill_type,
        daily_rate: updatedLabour.daily_rate,
      });

      set((state) => ({
        labour: state.labour.map((l) => (l.id === updatedLabour.id ? { ...l, ...updatedLabour } : l)),
        loading: false,
      }));
      toast.success('Labour updated successfully');
    } catch (error) {
      console.error('Error updating labour:', error);
      set({ error: error.message, loading: false });
      toast.error('Failed to update labour');
      throw error;
    }
  },

  deleteLabour: async (labourId) => {
    try {
      set({ loading: true, error: null });
      await dbOperations.delete('labour', labourId);

      set((state) => ({
        labour: state.labour.filter((l) => l.id !== labourId),
        loading: false,
      }));
      toast.success('Labour deleted successfully');
    } catch (error) {
      console.error('Error deleting labour:', error);
      set({ error: error.message, loading: false });
      toast.error('Failed to delete labour');
      throw error;
    }
  },
}));

export default useLabourStore;
