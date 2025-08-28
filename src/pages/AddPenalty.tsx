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

type Step = 'member' | 'category' | 'penalty' | 'amount' | 'final';

const AddPenalty = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [penaltyTypes, setPenaltyTypes] = useState<PenaltyCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Form data
  const [memberId, setMemberId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [penaltyTypeId, setPenaltyTypeId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [notes, setNotes] = useState('');
  
  // UI state
  const [currentStep, setCurrentStep] = useState<Step>('member');
  const [isMobile, setIsMobile] = useState(false);
  const [isSelectionDisabled, setIsSelectionDisabled] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'none'>('none');

  // Helper function to clear any lingering hover states
  const clearHoverStates = () => {
    // Force blur on any focused elements
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  useEffect(() => {
    loadData();
    
    // Detect mobile
    const checkMobile = () => {
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
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

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading data...');
      const [activeMembers, activePenaltyTypes] = await Promise.all([
        memberService.getActive(),
        penaltyCatalogService.getActive()
      ]);
      console.log('Data loaded successfully:', { activeMembers, activePenaltyTypes });
      setMembers(activeMembers);
      setPenaltyTypes(activePenaltyTypes);
    } catch (error) {
      console.error('Error loading data:', error);
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
    setMultiplier(1);
  };

  const handleMemberSelect = (id: string, event?: React.MouseEvent | React.TouchEvent) => {
    if (isSelectionDisabled) return;
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setIsSelectionDisabled(true);
    setMemberId(id);
    
    // Clear hover states when navigating
    clearHoverStates();
    
    if (isMobile) {
      setTimeout(() => {
        setCurrentStep('category');
      }, 150); // Small delay to ensure hover state is cleared
    }
    
    setTimeout(() => {
      setIsSelectionDisabled(false);
    }, 500);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setPenaltyTypeId('');
    clearHoverStates();
    setTimeout(() => {
      setCurrentStep('penalty');
    }, 100);
  };

  const handlePenaltySelect = (penaltyId: string) => {
    const penaltyType = penaltyTypes.find(pt => pt.id === penaltyId);
    setPenaltyTypeId(penaltyId);
    setAmount(penaltyType?.amount || 0);
    setMultiplier(1);
    clearHoverStates();
    setTimeout(() => {
      setCurrentStep('amount');
    }, 100);
  };

  const handleBackStep = () => {
    clearHoverStates();
    switch (currentStep) {
      case 'category':
        setCurrentStep('member');
        setMemberId('');
        break;
      case 'penalty':
        setCurrentStep('category');
        setSelectedCategory('');
        break;
      case 'amount':
        setCurrentStep('penalty');
        setPenaltyTypeId('');
        break;
      case 'final':
        setCurrentStep('amount');
        break;
    }
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
      const selectedPenaltyType = penaltyTypes.find(pt => pt.id === penaltyTypeId);
      const finalAmount = selectedPenaltyType?.has_multiplier ? selectedPenaltyType.amount * multiplier : amount;

      await penaltyService.create({
        member_id: memberId,
        penalty_type_id: penaltyTypeId,
        amount: finalAmount,
        multiplier: selectedPenaltyType?.has_multiplier ? multiplier : undefined,
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

  // Mobile step-by-step workflow
  if (isMobile && !loading) {
    const stepTitle = {
      member: 'Schütze auswählen',
      category: 'Kategorie wählen', 
      penalty: 'Strafe wählen',
      amount: 'Betrag/Anzahl',
      final: 'Zusammenfassung'
    };

    const progressSteps = ['member', 'category', 'penalty', 'amount'];
    const currentStepIndex = progressSteps.indexOf(currentStep);

    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Header with progress and navigation */}
        <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground flex-shrink-0">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentStep !== 'member' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackStep}
                    className="text-primary-foreground hover:bg-primary-foreground/10 p-2 touch-button"
                    data-variant="ghost"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <h1 className="text-lg font-bold">{stepTitle[currentStep]}</h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearHoverStates();
                  navigate('/admin');
                }}
                className="text-primary-foreground hover:bg-primary-foreground/10 p-3 touch-button"
                data-variant="ghost"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Progress bar */}
            <div className="flex gap-1 mt-2">
              {progressSteps.map((step, index) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index <= currentStepIndex ? 'bg-primary-foreground' : 'bg-primary-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="p-4 h-full overflow-hidden"
             style={{ height: 'calc(100vh - 120px)' }}>
          {/* Member Selection */}
          {currentStep === 'member' && (
            <div className="grid gap-3 grid-cols-3 h-full content-start">
              {members.map((member, index) => (
                <Button
                  key={member.id}
                  type="button"
                  variant="outline"
                  onClick={(e) => handleMemberSelect(member.id, e)}
                  onTouchEnd={(e) => {
                    e.currentTarget.blur();
                    clearHoverStates();
                  }}
                  disabled={isSelectionDisabled}
                  className="h-auto min-h-20 py-3 px-2 flex flex-col justify-center text-center animate-fade-in whitespace-normal touch-button"
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-variant="outline"
                >
                  <div className="text-sm font-semibold leading-tight break-words">
                    {member.first_name} {member.last_name}
                  </div>
                  {member.nickname && (
                    <div className="text-xs opacity-70 leading-tight break-words mt-1">
                      "{member.nickname}"
                    </div>
                  )}
                </Button>
              ))}
            </div>
          )}

          {/* Category Selection */}
          {currentStep === 'category' && (
            <div className="grid gap-4 grid-cols-2 h-full content-start">
              {Object.entries(PENALTY_CATALOG_CATEGORIES).map(([categoryKey, categoryName]) => {
                const categoryPenaltyTypes = penaltyTypes.filter(pt => pt.category === categoryKey);
                if (categoryPenaltyTypes.length === 0) return null;
                
                const categoryIcons: Record<string, string> = {
                  timing: '⏰',
                  soziales: '👥', 
                  abnahme: '🎯',
                  maschieren: '🚶',
                  sonstiges: '📝'
                };

                return (
                  <Button
                    key={categoryKey}
                    type="button"
                    variant="outline"
                    onClick={() => handleCategorySelect(categoryKey)}
                    onTouchEnd={(e) => {
                      e.currentTarget.blur();
                      clearHoverStates();
                    }}
                    className="h-24 flex flex-col justify-center gap-2 animate-fade-in hover:bg-primary hover:text-primary-foreground touch-button"
                    data-variant="outline"
                  >
                    <div className="text-2xl">{categoryIcons[categoryKey]}</div>
                    <div className="font-semibold">{categoryName}</div>
                    <div className="text-xs opacity-70">{categoryPenaltyTypes.length} Strafen</div>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Penalty Selection */}
          {currentStep === 'penalty' && selectedCategory && (
            <div className="space-y-3 h-full">
              {penaltyTypes
                .filter(pt => pt.category === selectedCategory)
                .map((penaltyType) => (
                    <Button
                      key={penaltyType.id}
                      type="button"
                      variant="outline"
                      onClick={() => handlePenaltySelect(penaltyType.id)}
                      onTouchEnd={(e) => {
                        e.currentTarget.blur();
                        clearHoverStates();
                      }}
                      className="w-full h-16 justify-between animate-fade-in hover:bg-primary hover:text-primary-foreground touch-button"
                      data-variant="outline"
                    >
                    <div className="text-left">
                      <div className="font-semibold">{penaltyType.name}</div>
                      {penaltyType.has_multiplier && (
                        <div className="text-xs opacity-70">pro Einheit</div>
                      )}
                    </div>
                    <div className="font-mono font-bold">{penaltyType.amount.toFixed(2)}€</div>
                  </Button>
                ))}
            </div>
          )}

          {/* Amount/Multiplier */}
          {currentStep === 'amount' && penaltyTypeId && (
            <div className="space-y-6 h-full">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">
                  {penaltyTypes.find(pt => pt.id === penaltyTypeId)?.name}
                </h3>
              </div>

              {penaltyTypes.find(pt => pt.id === penaltyTypeId)?.has_multiplier ? (
                <div className="space-y-4">
                  <Label htmlFor="multiplier" className="text-center block">Anzahl eingeben</Label>
                  <Input
                    id="multiplier"
                    type="number"
                    value={multiplier}
                    onChange={(e) => setMultiplier(Number(e.target.value) || 1)}
                    className="h-16 text-2xl font-mono text-center"
                    min="1"
                  />
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Gesamtbetrag:</div>
                    <div className="text-2xl font-bold font-mono">
                      {((penaltyTypes.find(pt => pt.id === penaltyTypeId)?.amount || 0) * multiplier).toFixed(2)}€
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label htmlFor="amount" className="text-center block">Betrag anpassen</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="h-16 text-2xl font-mono text-center"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              <div className="space-y-4">
                <Label htmlFor="notes">Bemerkung (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zusätzliche Notizen..."
                  rows={3}
                />
              </div>

              <Button
                type="button"
                onClick={handleSubmit}
                className="w-full h-16 text-lg bg-gradient-to-r from-primary to-primary-glow touch-button"
                data-variant="default"
              >
                <Check className="w-5 h-5 mr-2" />
                Strafe hinzufügen
              </Button>
            </div>
          )}
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
                    onClick={() => {
                      setMemberId('');
                      if (isMobile) setCurrentStep('member');
                    }}
                  >
                    Ändern
                  </Button>
                </div>
              ) : (
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger className="h-16 text-lg">
                    <SelectValue placeholder="Schütze auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                        {member.nickname && ` "${member.nickname}"`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                             <span className="font-medium text-left flex-1">
                               {penaltyType.name}
                               {penaltyType.has_multiplier && <span className="text-xs opacity-70 block">pro Einheit</span>}
                             </span>
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

            {/* Step 3: Amount/Multiplier */}
            {penaltyTypeId && (
              <div className="space-y-4 max-w-md">
                {penaltyTypes.find(pt => pt.id === penaltyTypeId)?.has_multiplier ? (
                  <>
                    <Label htmlFor="multiplier" className="text-lg font-semibold">3. Anzahl</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      value={multiplier}
                      onChange={(e) => setMultiplier(Number(e.target.value) || 1)}
                      placeholder="1"
                      className="h-16 text-xl font-mono text-center"
                      min="1"
                    />
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">Berechnung:</div>
                      <div className="text-xl font-bold font-mono text-center">
                        {penaltyTypes.find(pt => pt.id === penaltyTypeId)?.amount.toFixed(2)}€ × {multiplier} = {((penaltyTypes.find(pt => pt.id === penaltyTypeId)?.amount || 0) * multiplier).toFixed(2)}€
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}

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
