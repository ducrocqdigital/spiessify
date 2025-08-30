import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface NoEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: () => void;
}

export const NoEventModal = ({ isOpen, onClose, onCreateEvent }: NoEventModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kein aktives Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Es ist aktuell kein Event aktiv. Möchtest du ein neues Event anlegen?
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={onCreateEvent}>
              Neues Event anlegen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};