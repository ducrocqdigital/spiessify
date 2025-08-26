import { supabase } from '@/integrations/supabase/client';
import { PenaltyCatalog, PenaltyCatalogCategory } from '@/types';

export const penaltyCatalogService = {
  // Get all penalty types
  async getAll(): Promise<PenaltyCatalog[]> {
    const { data, error } = await supabase
      .from('penalty_catalog')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    return (data || []) as PenaltyCatalog[];
  },

  // Get active penalty types only
  async getActive(): Promise<PenaltyCatalog[]> {
    const { data, error } = await supabase
      .from('penalty_catalog')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    return (data || []) as PenaltyCatalog[];
  },

  // Get penalty types by category
  async getByCategory(category: PenaltyCatalogCategory): Promise<PenaltyCatalog[]> {
    const { data, error } = await supabase
      .from('penalty_catalog')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return (data || []) as PenaltyCatalog[];
  },

  // Create new penalty type
  async create(penaltyType: {
    name: string;
    category: PenaltyCatalogCategory;
    amount: number;
    description?: string;
  }): Promise<PenaltyCatalog> {
    const { data, error } = await supabase
      .from('penalty_catalog')
      .insert([penaltyType])
      .select('*')
      .single();
    
    if (error) throw error;
    return data as PenaltyCatalog;
  },

  // Update penalty type
  async update(id: string, updates: Partial<PenaltyCatalog>): Promise<PenaltyCatalog> {
    const { data, error } = await supabase
      .from('penalty_catalog')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as PenaltyCatalog;
  },

  // Delete penalty type (soft delete by setting is_active to false)
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('penalty_catalog')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Hard delete penalty type
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('penalty_catalog')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Toggle active status
  async toggleActive(id: string): Promise<PenaltyCatalog> {
    // First get current status
    const { data: current, error: fetchError } = await supabase
      .from('penalty_catalog')
      .select('is_active')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Update with opposite status
    const { data, error } = await supabase
      .from('penalty_catalog')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as PenaltyCatalog;
  }
};