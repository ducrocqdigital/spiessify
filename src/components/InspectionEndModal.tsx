import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { memberService } from '@/services/memberService';
import { Member } from '@/types';

interface InspectionEndModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offenMembers: Member[];
  onConfirm: (selectedIds: string[]) => void;
}

export const InspectionEndModal = ({
  open,
  onOpenChange,
  offenMembers,
  onConfirm
}: InspectionEndModalProps) => {
  const [missedSelections, setMissedSelections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) setMissedSelections({});
  }, [open]);

  const handleConfirm = () => {
    const selectedIds = Object.entries(missedSelections)
      .filter(([, v]) => v)
      .map(([id]) => id);
    onConfirm(selectedIds);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Musterung beenden</DialogTitle>
          <DialogDescription>
            {offenMembers.length > 0
              ? `Noch ${offenMembers.length} Schützen offen. Antippen bucht "Verpasste Abnahme" (10€):`
              : "Alle Schützen wurden gemustert. Musterung kann beendet werden."}
          </DialogDescription>
        </DialogHeader>
        {offenMembers.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {offenMembers.map(member => {
              const selected = !!missedSelections[member.id];
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMissedSelections(prev => ({ ...prev, [member.id]: !prev[member.id] }))}
                  className={`w-full flex items-center justify-between rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all
                    ${selected ? 'border-red-500 bg-red-50 text-red-700' : 'border-border bg-card hover:bg-muted/50'}`}
                >
                  <span>{memberService.getDisplayName(member)}</span>
                  <span className="text-xs font-normal">
                    {selected ? 'Verpasste Abnahme · 10€' : 'keine Strafe'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zurück
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Beenden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
