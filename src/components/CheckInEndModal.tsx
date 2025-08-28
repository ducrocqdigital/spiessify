import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { memberService } from '@/services/memberService';
import { Member } from '@/types';

interface CheckInEndModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uncheckedMembers: Member[];
  onConfirm: () => void;
}

export const CheckInEndModal = ({
  open,
  onOpenChange,
  uncheckedMembers,
  onConfirm
}: CheckInEndModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check-in beenden</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {uncheckedMembers.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Es sind noch {uncheckedMembers.length} Schützen offen:
              </p>
              <div className="max-h-40 overflow-y-auto">
                <ul className="text-sm space-y-1">
                  {uncheckedMembers.map((member) => (
                    <li key={member.id} className="text-muted-foreground">
                      • {memberService.getDisplayName(member)}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Alle Schützen wurden erfasst.
            </p>
          )}
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Zurück
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
            >
              Beenden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};