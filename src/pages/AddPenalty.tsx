import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check, X } from 'lucide-react';
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
  const [showMemberSelection, setShowMemberSelection] = useState(true);

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

  const handleMemberSelect = (id: string) => {
    setMemberId(id);
    setShowMemberSelection(false);
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

  // Full-screen member selection overlay
  if (showMemberSelection && !loading && members.length > 0) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden h-screen">
        {/* Cancel button */}
        <div className="absolute top-1 right-1 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            className="bg-background/80 backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Compact title */}
        <div className="py-1 text-center flex-shrink-0">
          <h1 className="text-lg font-bold">Schütze auswählen</h1>
        </div>
        
        {/* Member grid - uses nearly full viewport */}
        <div className="flex-1 px-1 pb-1 min-h-0 overflow-hidden">
          <div className="h-full w-full grid gap-1" 
               style={{
                 gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                 gridTemplateRows: `repeat(${Math.ceil(members.length / 3)}, minmax(0, 1fr))`
               }}>
            {members.map((member) => (
              <Button
                key={member.id}
                type="button"
                variant="outline"
                className="h-full p-1 text-center transition-all duration-200 hover:bg-primary hover:text-primary-foreground border-2 hover:border-primary flex flex-col overflow-hidden"
                onClick={() => handleMemberSelect(member.id)}
              >
                <div className="flex flex-col w-full h-full justify-center items-center min-h-0 p-2">
                  <div className="text-center font-bold text-sm leading-tight w-full whitespace-normal break-words hyphens-auto">
                    <div>{member.first_name}</div>
                    <div>{member.last_name}</div>
                    {member.nickname && (
                      <div className="text-xs opacity-70 mt-1">
                        "{member.nickname}"
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Neue Strafe</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Selected Member */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">1. Schütze auswählen</Label>
              {memberId ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                  <div>
                    <span className="font-semibold">
                      {members.find(m => m.id === memberId)?.first_name} {members.find(m => m.id === memberId)?.last_name}
                    </span>
                    {members.find(m => m.id === memberId)?.nickname && (
                      <span className="text-muted-foreground ml-2">
                        "{members.find(m => m.id === memberId)?.nickname}"
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMemberSelection(true)}
                  >
                    Ändern
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-16 w-full text-left justify-center"
                  onClick={() => setShowMemberSelection(true)}
                >
                  Schütze auswählen
                </Button>
              )}
            </div>

            {/* Step 2: Select Category */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">2. Kategorie wählen</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
                {Object.entries(PENALTY_CATEGORIES).map(([key, label]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={category === key ? "default" : "outline"}
                    className={`h-16 justify-between transition-all duration-300 ${
                      category === key 
                        ? "bg-primary text-primary-foreground shadow-lg scale-105 ring-2 ring-primary/50" 
                        : "hover:bg-primary/5 hover:scale-102 hover:shadow-md"
                    }`}
                    onClick={() => handleCategoryChange(key as PenaltyCategory)}
                  >
                    <span className="font-medium">{label}</span>
                    <span className="font-mono font-bold">{PENALTY_AMOUNTS[key as PenaltyCategory]}€</span>
                    {category === key && <Check className="w-5 h-5" />}
                  </Button>
                ))}
              </div>
            </div>

            {/* Step 3: Adjust Amount */}
            <div className="space-y-4 max-w-md">
              <Label htmlFor="amount" className="text-lg font-semibold">3. Betrag (€)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
                className="h-16 text-xl font-mono text-center"
                min="0"
                step="0.5"
              />
            </div>

            {/* Optional Notes */}
            <div className="space-y-4 max-w-md">
              <Label htmlFor="notes" className="text-lg font-semibold">Bemerkung (optional)</Label>
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
              className="w-full max-w-md h-16 text-lg bg-gradient-to-r from-primary to-primary-glow"
              disabled={!memberId || !category}
            >
              <Check className="w-5 h-5 mr-2" />
              Strafe hinzufügen
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPenalty;