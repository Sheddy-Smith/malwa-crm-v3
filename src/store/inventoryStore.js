import { create } from 'zustand';
import { toast } from 'sonner';
import { dbOperations, updateInventoryStock } from '@/lib/db';

const useInventoryStore = create((set, get) => ({
  stockItems: [],
  categories: [],
  stockMovements: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    try {
      const data = await dbOperations.getAll('inventory_categories');
      set({ categories: data || [] });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  addCategory: async (categoryName) => {
    try {
      set({ loading: true, error: null });
      const data = await dbOperations.insert('inventory_categories', { name: categoryName });

      set((state) => ({ categories: [...state.categories, data], loading: false }));
      toast.success('Category added successfully');
      return data;
    } catch (error) {
      console.error('Error adding category:', error);
      set({ error: error.message, loading: false });
      toast.error('Failed to add category');
      throw error;
    }
  },

  updateCategory: async (categoryId, newName) => {
    try {
      await dbOperations.update('inventory_categories', categoryId, { name: newName });

      set((state) => ({
        categories: state.categories.map((c) => (c.id === categoryId ? { ...c, name: newName } : c)),
      }));
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      await dbOperations.delete('inventory_categories', categoryId);

      set((state) => ({
        categories: state.categories.filter((c) => c.id !== categoryId),
      }));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  fetchStockItems: async () => {
    try {
      set({ loading: true });
      const items = await dbOperations.getAll('inventory_items');
      const categories = await dbOperations.getAll('inventory_categories');

      const itemsWithCategory = items.map(item => {
        const category = categories.find(c => c.id === item.category_id);
        return {
          ...item,
          category: category ? { name: category.name } : null
        };
      });

      set({ stockItems: itemsWithCategory || [], loading: false });
    } catch (error) {
      console.error('Error fetching stock items:', error);
      set({ loading: false });
    }
  },

  addStockItem: async (itemData) => {
    try {
      set({ loading: true, error: null });
      const newItem = {
        name: itemData.name,
        code: itemData.code || null,
        category_id: itemData.category_id,
        unit: itemData.unit || 'pcs',
        current_stock: itemData.current_stock || 0,
        reorder_level: itemData.reorder_level || 0,
        cost_price: itemData.cost_price || 0,
        selling_price: itemData.selling_price || 0,
        location: itemData.location || null,
      };

      const data = await dbOperations.insert('inventory_items', newItem);

      set((state) => ({ stockItems: [...state.stockItems, data], loading: false }));
      toast.success('Stock item added successfully');
      return data;
    } catch (error) {
      console.error('Error adding stock item:', error);
      set({ error: error.message, loading: false });
      toast.error('Failed to add stock item');
      throw error;
    }
  },

  updateStockItem: async (updatedItem) => {
    try {
      await dbOperations.update('inventory_items', updatedItem.id, {
        name: updatedItem.name,
        code: updatedItem.code,
        category_id: updatedItem.category_id,
        unit: updatedItem.unit,
        reorder_level: updatedItem.reorder_level,
        cost_price: updatedItem.cost_price,
        selling_price: updatedItem.selling_price,
        location: updatedItem.location,
      });

      set((state) => ({
        stockItems: state.stockItems.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem } : item)),
      }));
    } catch (error) {
      console.error('Error updating stock item:', error);
      throw error;
    }
  },

  deleteStockItem: async (itemId) => {
    try {
      await dbOperations.delete('inventory_items', itemId);

      set((state) => ({
        stockItems: state.stockItems.filter((item) => item.id !== itemId),
      }));
    } catch (error) {
      console.error('Error deleting stock item:', error);
      throw error;
    }
  },

  fetchStockMovements: async (filters = {}) => {
    try {
      const allMovements = await dbOperations.getAll('stock_movements');
      const items = await dbOperations.getAll('inventory_items');

      let filteredMovements = allMovements;

      if (filters.item_id) {
        filteredMovements = filteredMovements.filter(m => m.item_id === filters.item_id);
      }
      if (filters.start_date) {
        filteredMovements = filteredMovements.filter(m => m.movement_date >= filters.start_date);
      }
      if (filters.end_date) {
        filteredMovements = filteredMovements.filter(m => m.movement_date <= filters.end_date);
      }

      const movementsWithItem = filteredMovements.map(movement => {
        const item = items.find(i => i.id === movement.item_id);
        return {
          ...movement,
          item: item ? { name: item.name, code: item.code, unit: item.unit } : null
        };
      });

      movementsWithItem.sort((a, b) => new Date(b.movement_date) - new Date(a.movement_date));

      set({ stockMovements: movementsWithItem || [] });
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    }
  },

  addStockMovement: async (movementData) => {
    try {
      set({ loading: true, error: null });
      const data = await dbOperations.insert('stock_movements', movementData);

      await updateInventoryStock(movementData.item_id, movementData.movement_type, movementData.quantity);

      set((state) => ({ stockMovements: [data, ...state.stockMovements], loading: false }));
      toast.success('Stock movement recorded successfully');
      return data;
    } catch (error) {
      console.error('Error adding stock movement:', error);
      set({ error: error.message, loading: false });
      toast.error('Failed to record stock movement');
      throw error;
    }
  },
}));

export default useInventoryStore;
