import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { memberService } from '@/services/memberService';
import { Member } from '@/types';

// Auswahl je nicht erschienener Person; Beträge kommen aus dem Katalog
export interface MissedChoice {
  memberId: string;
  catalogName: string | null; // null = keine Strafe
}

interface CheckInEndModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uncheckedMembers: Member[];
  catalog: any[];
  onConfirm: (missed: MissedChoice[]) => void;
}

const CHOICES = [
  { value: 'none', label: 'Keine Strafe' },
  { value: 'Verpasste Abnahme', label: 'Verpasste Abnahme' },
  { value: 'Verpasster Termin/Umzug', label: 'Verpasster Termin' },
  { value: 'Verpasster Termin/Umzug (entschuldigt)', label: 'Entschuldigt' }
];

export const CheckInEndModal = ({
  open,
  onOpenChange,
  uncheckedMembers,
  catalog,
  onConfirm
}: CheckInEndModalProps) => {
  const [choices, setChoices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setChoices({});
  }, [open]);

  const priceFor = (catalogName: string): string => {
    const entry = catalog.find(c => c.name === catalogName);
    return entry ? `${Number(entry.amount).toFixed(0)}€` : '';
  };

  const handleConfirm = () => {
    const missed: MissedChoice[] = uncheckedMembers.map(m => ({
      memberId: m.id,
      catalogName: choices[m.id] && choices[m.id] !== 'none' ? choices[m.id] : null
    }));
    onConfirm(missed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check-in beenden</DialogTitle>
          {uncheckedMembers.length > 0 && (
            <DialogDescription>
              {uncheckedMembers.length} Schützen nicht erschienen – optional direkt Strafe buchen:
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4">
          {uncheckedMembers.length > 0 ? (
            <div className="space-y-2">
              {uncheckedMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {memberService.getDisplayName(member)}
                  </span>
                  <Select
                    value={choices[member.id] || 'none'}
                    onValueChange={(v) => setChoices(prev => ({ ...prev, [member.id]: v }))}
                  >
                    <SelectTrigger className="w-44 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHOICES.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}{c.value !== 'none' ? ` ${priceFor(c.value)}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Alle Schützen wurden erfasst.
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Zurück
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Beenden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
