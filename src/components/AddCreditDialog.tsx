import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Member, PenaltyCatalog } from '@/types';
import { penaltyService } from '@/services/penaltyService';
import { memberService } from '@/services/memberService';
import { useToast } from '@/hooks/use-toast';

interface AddCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  penaltyTypes: PenaltyCatalog[];
  onCreditAdded: () => void;
}

export const AddCreditDialog = ({ open, onOpenChange, members, penaltyTypes, onCreditAdded }: AddCreditDialogProps) => {
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Find the "Gutschrift" penalty type
  const creditPenaltyType = penaltyTypes.find(type => type.name === 'Gutschrift');

  const resetForm = () => {
    setFormData({
      memberId: '',
      amount: '',
      notes: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.memberId || !formData.amount || !creditPenaltyType) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast({
        title: "Fehler",
        description: "Der Betrag muss größer als 0 sein.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create credit as negative penalty
      await penaltyService.create({
        member_id: formData.memberId,
        penalty_type_id: creditPenaltyType.id,
        amount: -parseFloat(formData.amount), // Negative amount for credit
        date: new Date().toISOString().split('T')[0], // Today's date
        notes: formData.notes || 'Gutschrift'
      });

      toast({
        title: "Gutschrift hinzugefügt",
        description: "Die Gutschrift wurde erfolgreich hinzugefügt.",
      });

      resetForm();
      onOpenChange(false);
      onCreditAdded();
    } catch (error) {
      console.error('Error adding credit:', error);
      toast({
        title: "Fehler",
        description: "Die Gutschrift konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gutschrift hinzufügen</DialogTitle>
          <DialogDescription>
            Fügen Sie eine Gutschrift für ein Mitglied hinzu. Das Datum wird automatisch auf heute gesetzt.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="member">Mitglied *</Label>
            <Select
              value={formData.memberId}
              onValueChange={(value) => setFormData({ ...formData, memberId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Mitglied auswählen" />
              </SelectTrigger>
              <SelectContent>
                {members.filter(member => member.is_active).map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {memberService.getDisplayName(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Betrag (€) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Grund / Notizen</Label>
            <Textarea
              id="notes"
              placeholder="Grund für die Gutschrift..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Hinzufügen...' : 'Gutschrift hinzufügen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};