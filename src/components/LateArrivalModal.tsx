import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { memberService } from '@/services/memberService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { Member } from '@/types';

interface LateArrivalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  minutesLate: number;
  onConfirm: (penaltyAmount: number) => void;
}

export const LateArrivalModal = ({
  open,
  onOpenChange,
  member,
  minutesLate,
  onConfirm
}: LateArrivalModalProps) => {
  const [penaltyAmount, setPenaltyAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');

  useEffect(() => {
    if (open && minutesLate > 0) {
      // Try to find a "Verspätung" penalty type from catalog
      const loadDefaultPenalty = async () => {
        try {
          const penaltyTypes = await penaltyCatalogService.getActive();
          const latePenalty = penaltyTypes.find(
            pt => pt.name.toLowerCase().includes('verspätung') || 
                  pt.category === 'timing' ||
                  pt.name.toLowerCase().includes('zu spät')
          );
          
          if (latePenalty) {
            // Calculate penalty based on minutes and multiplier if applicable
            const baseAmount = Number(latePenalty.amount);
            const amount = latePenalty.has_multiplier ? baseAmount * minutesLate : baseAmount;
            setPenaltyAmount(amount);
            setCustomAmount(amount.toString());
          } else {
            // Default fallback - 1€ per minute late
            const defaultAmount = minutesLate * 1;
            setPenaltyAmount(defaultAmount);
            setCustomAmount(defaultAmount.toString());
          }
        } catch (error) {
          console.error('Failed to load penalty types:', error);
          // Fallback calculation - 1€ per minute late
          const defaultAmount = minutesLate * 1;
          setPenaltyAmount(defaultAmount);
          setCustomAmount(defaultAmount.toString());
        }
      };

      loadDefaultPenalty();
    }
  }, [open, minutesLate]);

  const handleAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    setPenaltyAmount(isNaN(numValue) ? 0 : numValue);
  };

  const handleConfirm = () => {
    onConfirm(penaltyAmount);
    setCustomAmount('');
    setPenaltyAmount(0);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setCustomAmount('');
    setPenaltyAmount(0);
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verspätung</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm">
            <p className="font-medium">{memberService.getDisplayName(member)}</p>
            <p className="text-muted-foreground">
              +{minutesLate} Minuten – Strafe gemäß Katalog
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="penalty-amount">Betrag anpassen (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="penalty-amount"
                type="number"
                step="0.01"
                min="0"
                value={customAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">€</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Abbrechen
            </Button>
            <Button onClick={handleConfirm}>
              Übernehmen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};