import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ArrowLeft, Archive, Trash2 } from 'lucide-react';
import { eventService } from '@/services/eventService';
import { Event } from '@/types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export const EventManagement = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [archivedEvents, setArchivedEvents] = useState<Event[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    loadEvents();
    loadArchivedEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsData = await eventService.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('Fehler beim Laden der Events');
    }
  };

  const loadArchivedEvents = async () => {
    try {
      const archivedData = await eventService.getArchivedEvents();
      setArchivedEvents(archivedData);
    } catch (error) {
      console.error('Failed to load archived events:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.start_date || !newEvent.end_date) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    if (new Date(newEvent.start_date) > new Date(newEvent.end_date)) {
      toast.error('Startdatum muss vor dem Enddatum liegen');
      return;
    }

    try {
      await eventService.createEvent(newEvent);
      toast.success('Event erfolgreich erstellt');
      setIsCreateDialogOpen(false);
      setNewEvent({ name: '', start_date: '', end_date: '', notes: '' });
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Fehler beim Erstellen des Events');
    }
  };

  const handleArchiveEvent = async (eventId: string) => {
    try {
      await eventService.archiveEvent(eventId);
      toast.success('Event erfolgreich archiviert');
      loadEvents();
      loadArchivedEvents();
    } catch (error) {
      console.error('Failed to archive event:', error);
      toast.error('Fehler beim Archivieren des Events');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Event wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    try {
      await eventService.deleteEvent(eventId);
      toast.success('Event erfolgreich gelöscht');
      loadEvents();
      loadArchivedEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Fehler beim Löschen des Events');
    }
  };

  const getEventStatus = (event: Event) => {
    const today = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    if (today < startDate) {
      return { label: 'Geplant', variant: 'secondary' as const };
    } else if (today >= startDate && today <= endDate) {
      return { label: 'Aktiv', variant: 'default' as const };
    } else {
      return { label: 'Beendet', variant: 'outline' as const };
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = format(new Date(startDate), 'dd.MM.yyyy', { locale: de });
    const end = format(new Date(endDate), 'dd.MM.yyyy', { locale: de });
    return `${start} - ${end}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-2xl font-bold">Veranstaltungen</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neues Event anlegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Event anlegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder="z.B. Schützenfest 2025"
                />
              </div>
              <div>
                <Label htmlFor="start_date">Startdatum *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newEvent.start_date}
                  onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">Enddatum *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newEvent.end_date}
                  onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notiz</Label>
                <Textarea
                  id="notes"
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  placeholder="Optionale Notizen zum Event"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateEvent}>
                  Event anlegen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Aktive Events</TabsTrigger>
          <TabsTrigger value="archived">Archivierte Events</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Aktive Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notizen</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const status = getEventStatus(event);
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>{formatDateRange(event.start_date, event.end_date)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{event.notes || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleArchiveEvent(event.id)}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {events.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Keine Events vorhanden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>Archivierte Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead>Notizen</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{formatDateRange(event.start_date, event.end_date)}</TableCell>
                      <TableCell>{event.notes || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {archivedEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Keine archivierten Events vorhanden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};