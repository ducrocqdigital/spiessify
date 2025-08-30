import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types';

export const eventService = {
  // Get all events (non-archived)
  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_archived', false)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get archived events
  async getArchivedEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_archived', true)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get active event (current date within event range)
  async getActiveEvent(): Promise<Event | null> {
    const { data, error } = await supabase
      .rpc('get_active_event');

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  // Create new event
  async createEvent(eventData: {
    name: string;
    start_date: string;
    end_date: string;
    notes?: string;
  }): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Archive event
  async archiveEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .update({ is_archived: true })
      .eq('id', eventId);

    if (error) throw error;
  },

  // Update event
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete event
  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  }
};