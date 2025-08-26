import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check, X, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { memberService } from '@/services/memberService';
import { penaltyService } from '@/services/penaltyService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { PenaltyCatalog, PENALTY_CATALOG_CATEGORIES, Member } from '@/types';
import { getCurrentLocation } from '@/utils/dateUtils';

const AddPenalty = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [penaltyTypes, setPenaltyTypes] = useState<PenaltyCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [memberId, setMemberId] = useState('');
  const [penaltyTypeId, setPenaltyTypeId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [showMemberSelection, setShowMemberSelection] = useState(true);
  const [isSelectionDisabled, setIsSelectionDisabled] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'none'>('none');

  useEffect(() => {
    loadData();
    // Try to get location on mobile devices
    if (navigator.geolocation && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      setLocationStatus('loading');
      getCurrentLocation()
        .then((coords) => {
          setLocation(coords);
          setLocationStatus('success');
        })
        .catch(() => {
          setLocationStatus('error');
        });
    }
  }, []);

  const loadData = async () => {
    try {
      const [activeMembers, activePenaltyTypes] = await Promise.all([
        memberService.getActive(),
        penaltyCatalogService.getActive()
      ]);
      setMembers(activeMembers);
      setPenaltyTypes(activePenaltyTypes);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePenaltyTypeChange = (value: string) => {
    const penaltyType = penaltyTypes.find(pt => pt.id === value);
    setPenaltyTypeId(value);
    setAmount(penaltyType?.amount || 0);
  };

  const handleMemberSelect = (id: string, event?: React.MouseEvent | React.TouchEvent) => {
    // Prevent unwanted selection if already in progress
    if (isSelectionDisabled) return;
    
    // Prevent default behavior and stop propagation for touch events
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Temporarily disable further selections
    setIsSelectionDisabled(true);
    
    setMemberId(id);
    setShowMemberSelection(false);
    
    // Re-enable selection after a short delay
    setTimeout(() => {
      setIsSelectionDisabled(false);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberId || !penaltyTypeId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie ein Mitglied und eine Strafart aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      await penaltyService.create({
        member_id: memberId,
        penalty_type_id: penaltyTypeId,
        amount,
        notes: notes || undefined,
        location_latitude: location?.latitude,
        location_longitude: location?.longitude,
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

  const getPenaltyTypesByCategory = (category: string) => {
    return penaltyTypes.filter(pt => pt.category === category);
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
          <div className="h-full w-full grid gap-1 member-grid-enter" 
               style={{
                 gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                 gridTemplateRows: `repeat(${Math.ceil(members.length / 3)}, minmax(0, 1fr))`
               }}>
            {members.map((member, index) => (
              <Button
                key={member.id}
                type="button"
                variant="outline"
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isSelectionDisabled) {
                    handleMemberSelect(member.id, e);
                  }
                }}
                disabled={isSelectionDisabled}
                className={`member-selection-button member-button-enter smooth-hover tap-animation h-full p-1 text-center transition-all duration-300 hover:bg-primary hover:text-primary-foreground border-2 hover:border-primary flex flex-col overflow-hidden hover:shadow-lg hover:scale-105 ${
                  isSelectionDisabled ? 'pointer-events-none opacity-50' : ''
                }`}
                style={{ 
                  animationDelay: `${index * 50}ms` // Staggered animation
                }}
              >
                <div className="flex flex-col w-full h-full justify-center items-center min-h-0 p-2">
                  <div className="text-center font-bold text-sm leading-tight w-full whitespace-normal break-words hyphens-auto">
                    <div className="transition-transform duration-200">{member.first_name}</div>
                    <div className="transition-transform duration-200">{member.last_name}</div>
                    {member.nickname && (
                      <div className="text-xs opacity-70 mt-1 transition-opacity duration-200">
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
          <div className="mb-6 penalty-form-enter">
            <h2 className="text-2xl font-bold">Neue Strafe</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8 penalty-form-enter"
                style={{ animationDelay: '0.2s' }}>
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

            {/* Step 2: Select Penalty Type */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">2. Strafart wählen</Label>
              <div className="space-y-6 max-w-4xl">
                {Object.entries(PENALTY_CATALOG_CATEGORIES).map(([categoryKey, categoryName]) => {
                  const categoryPenaltyTypes = getPenaltyTypesByCategory(categoryKey);
                  if (categoryPenaltyTypes.length === 0) return null;
                  
                  return (
                    <div key={categoryKey} className="space-y-3">
                      <h3 className="font-medium text-muted-foreground">{categoryName}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryPenaltyTypes.map((penaltyType) => (
                          <Button
                            key={penaltyType.id}
                            type="button"
                            variant={penaltyTypeId === penaltyType.id ? "default" : "outline"}
                            className={`h-16 justify-between transition-all duration-300 smooth-hover tap-animation ${
                              penaltyTypeId === penaltyType.id 
                                ? "bg-primary text-primary-foreground shadow-lg scale-105 ring-2 ring-primary/50" 
                                : "hover:bg-primary/5 hover:scale-102 hover:shadow-md"
                            }`}
                            onClick={() => handlePenaltyTypeChange(penaltyType.id)}
                          >
                            <span className="font-medium text-left flex-1">{penaltyType.name}</span>
                            <span className="font-mono font-bold">{penaltyType.amount.toFixed(2)}€</span>
                            {penaltyTypeId === penaltyType.id && <Check className="w-5 h-5 ml-2" />}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
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
                step="0.01"
              />
            </div>

            {/* Location Status */}
            {locationStatus !== 'none' && (
              <div className="space-y-2 max-w-md">
                <Label>
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Standort
                </Label>
                <div className="text-sm text-muted-foreground">
                  {locationStatus === 'loading' && 'Standort wird ermittelt...'}
                  {locationStatus === 'success' && 'Standort erfasst ✓'}
                  {locationStatus === 'error' && 'Standort konnte nicht ermittelt werden'}
                </div>
              </div>
            )}

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
              disabled={!memberId || !penaltyTypeId}
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