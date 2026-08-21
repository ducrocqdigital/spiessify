import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { memberService } from '@/services/memberService';
import { checkinService, computeLateAmount } from '@/services/checkinService';
import { Member, CheckinSession, CheckinResult } from '@/types';
import { toast } from 'sonner';

interface EditCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  result: CheckinResult | null;
  session: CheckinSession;
  latePenaltyType: any | undefined;
  onSaved: (updated: CheckinResult) => void;
  onCheckedOut: (result: CheckinResult) => void;
}

export const EditCheckInModal = ({
  open,
  onOpenChange,
  member,
  result,
  session,
  latePenaltyType,
  onSaved,
  onCheckedOut
}: EditCheckInModalProps) => {
  const [timeValue, setTimeValue] = useState('');
  const [amountValue, setAmountValue] = useState('');
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [saving, setSaving] = useState(false);

  const referenceTime = new Date(session.reference_time);

  useEffect(() => {
    if (open && result) {
      setTimeValue(new Date(result.check_time).toTimeString().slice(0, 5));
      setAmountValue(result.is_on_time ? '0' : String(currentAmountGuess()));
      setConfirmCheckout(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, result?.id]);

  const currentAmountGuess = () => {
    if (!result || result.is_on_time) return 0;
    return computeLateAmount(latePenaltyType, result.minutes_late);
  };

  const buildCheckTime = (hhmm: string): Date => {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const d = new Date(result ? result.check_time : session.reference_time);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const minutesLateFor = (hhmm: string): number => {
    if (!hhmm) return 0;
    const diff = buildCheckTime(hhmm).getTime() - referenceTime.getTime();
    return Math.max(0, Math.floor(diff / 60000));
  };

  // Changing the time recalculates the suggested amount;
  // the amount stays manually editable afterwards.
  const handleTimeChange = (hhmm: string) => {
    setTimeValue(hhmm);
    const minutes = minutesLateFor(hhmm);
    setAmountValue(String(minutes > 0 ? computeLateAmount(latePenaltyType, minutes) : 0));
  };

  const handleSave = async () => {
    if (!result || !timeValue) return;
    setSaving(true);
    try {
      const amount = Math.max(0, parseFloat(amountValue) || 0);
      const updated = await checkinService.updateCheckIn(
        session,
        result,
        buildCheckTime(timeValue),
        amount,
        latePenaltyType
      );
      onSaved(updated);
      onOpenChange(false);
      toast.success('Check-in aktualisiert');
    } catch (error) {
      console.error('Failed to update check-in:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    if (!result) return;
    if (!confirmCheckout) {
      setConfirmCheckout(true);
      return;
    }
    setSaving(true);
    try {
      await checkinService.undoCheckIn(result);
      onCheckedOut(result);
      onOpenChange(false);
      toast.success(result.penalty_id ? 'Ausgecheckt, Strafe gelöscht' : 'Ausgecheckt');
    } catch (error) {
      console.error('Failed to undo check-in:', error);
      toast.error('Fehler beim Auschecken');
    } finally {
      setSaving(false);
    }
  };

  if (!member || !result) return null;

  const minutes = minutesLateFor(timeValue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{memberService.getDisplayName(member)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Referenz: {referenceTime.toTimeString().slice(0, 5)} Uhr
            {minutes > 0
              ? ` – ${minutes} Min. zu spät`
              : ' – pünktlich'}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-check-time">Ankunftszeit</Label>
            <Input
              id="edit-check-time"
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">Strafe (€)</Label>
            <Input
              id="edit-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={amountValue}
              onChange={(e) => setAmountValue(e.target.value)}
              disabled={minutes <= 0}
            />
            {minutes <= 0 && (
              <div className="text-xs text-muted-foreground">
                Pünktlich – keine Strafe. Eine bestehende Verspätungsstrafe wird beim Speichern gelöscht.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant={confirmCheckout ? 'destructive' : 'outline'}
              onClick={handleCheckout}
              disabled={saving}
            >
              {confirmCheckout
                ? (result.penalty_id ? 'Wirklich? Strafe wird gelöscht' : 'Wirklich auschecken?')
                : 'Auschecken'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving || !timeValue}>
                Speichern
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
