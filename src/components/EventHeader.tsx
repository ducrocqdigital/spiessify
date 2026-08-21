import { useState, useEffect } from 'react';
import { eventService } from '@/services/eventService';
import { Event } from '@/types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export const EventHeader = () => {
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  useEffect(() => {
    const loadActiveEvent = async () => {
      try {
        const event = await eventService.getActiveEvent();
        setActiveEvent(event);
      } catch (error) {
        console.error('Failed to load active event:', error);
      }
    };

    loadActiveEvent();
  }, []);

  if (!activeEvent) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
        <div className="text-sm font-medium text-destructive">
          Kein aktives Event – Zahlen zeigen alle Jahre, neue Strafen können nicht eingetragen werden.
        </div>
      </div>
    );
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = format(new Date(startDate), 'dd.MM.', { locale: de });
    const end = format(new Date(endDate), 'dd.MM.yyyy', { locale: de });
    return `${start}–${end}`;
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
      <div className="text-sm font-medium text-primary">
        Aktives Event: {activeEvent.name} ({formatDateRange(activeEvent.start_date, activeEvent.end_date)})
      </div>
    </div>
  );
};