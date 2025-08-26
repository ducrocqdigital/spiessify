import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { memberService } from '@/services/memberService';
import { penaltyService } from '@/services/penaltyService';
import { PENALTY_CATEGORIES, PENALTY_AMOUNTS, PenaltyCategory, Member } from '@/types';

const AddPenalty = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [memberId, setMemberId] = useState('');
  const [category, setCategory] = useState<PenaltyCategory>('uniform');
  const [amount, setAmount] = useState<number>(PENALTY_AMOUNTS.uniform);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const activeMembers = await memberService.getActive();
      setMembers(activeMembers);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Mitglieder konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value: PenaltyCategory) => {
    setCategory(value);
    setAmount(PENALTY_AMOUNTS[value]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberId || !category) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie ein Mitglied und eine Kategorie aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      await penaltyService.create({
        member_id: memberId,
        category,
        amount,
        notes: notes || undefined
      });

      toast({
        title: "Strafe hinzugefügt",
        description: `Strafe wurde erfolgreich hinzugefügt.`,
      });

      navigate('/admin');
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Strafe konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Strafe hinzufügen</h1>
              <p className="text-primary-foreground/80 text-sm">Schnelle 3-Tap Eingabe</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Neue Strafe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Select Member */}
              <div className="space-y-2">
                <Label htmlFor="member">1. Schütze auswählen</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Schütze wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>Laden...</SelectItem>
                    ) : members.length === 0 ? (
                      <SelectItem value="empty" disabled>Keine aktiven Mitglieder</SelectItem>
                    ) : (
                      members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {memberService.getDisplayName(member)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Select Category */}
              <div className="space-y-2">
                <Label htmlFor="category">2. Kategorie wählen</Label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(PENALTY_CATEGORIES).map(([key, label]) => (
                    <Button
                      key={key}
                      type="button"
                      variant={category === key ? "default" : "outline"}
                      className="h-12 justify-between"
                      onClick={() => handleCategoryChange(key as PenaltyCategory)}
                    >
                      <span>{label}</span>
                      <span className="font-mono">{PENALTY_AMOUNTS[key as PenaltyCategory]}€</span>
                      {category === key && <Check className="w-4 h-4" />}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Step 3: Adjust Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">3. Betrag (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0"
                  className="h-12 text-lg font-mono text-center"
                  min="0"
                  step="0.5"
                />
              </div>

              {/* Optional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Bemerkung (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zusätzliche Notizen..."
                  className="resize-none"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary-glow"
                disabled={!memberId || !category}
              >
                <Check className="w-5 h-5 mr-2" />
                Strafe hinzufügen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddPenalty;