import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, User } from 'lucide-react';
import { memberService } from '@/services/memberService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import {
  partsForMember,
  priceFor,
  UniformPart,
  PartState,
  STATE_LABELS,
  ZONE_LABELS
} from '@/services/uniformParts';
import { InspectionSession, Member, InspectionData } from '@/types';

interface InspectionDetailScreenProps {
  member: Member;
  session: InspectionSession;
  initialData: any;
  onSave: (data: InspectionData) => void;
  onBack: () => void;
}

export const InspectionDetailScreen = ({
  member,
  session,
  initialData,
  onSave,
  onBack
}: InspectionDetailScreenProps) => {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [partStates, setPartStates] = useState<Record<string, PartState>>(() => {
    if (initialData && typeof initialData === 'object' && initialData.parts) {
      return { ...initialData.parts };
    }
    return {};
  });
  const [activePart, setActivePart] = useState<UniformPart | null>(null);

  const parts = partsForMember(member);
  const zones: UniformPart['zone'][] = ['kopf', 'oberkoerper', 'unten', 'ausruestung', 'person'];

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const penalties = await penaltyCatalogService.getByCategory('abnahme');
        setCatalog(penalties);
      } catch (error) {
        console.error('Failed to load abnahme penalties:', error);
      }
    };
    loadCatalog();
  }, []);

  const handlePartTap = (part: UniformPart) => {
    if (part.singleState) {
      // Ein-Zustand-Teile (z.B. Ungepflegt) togglen direkt
      setPartStates(prev => {
        const next = { ...prev };
        if (next[part.key]) {
          delete next[part.key];
        } else {
          next[part.key] = part.singleState!;
        }
        return next;
      });
      return;
    }
    setActivePart(part);
  };

  const setState = (part: UniformPart, state: PartState | null) => {
    setPartStates(prev => {
      const next = { ...prev };
      if (state === null) {
        delete next[part.key];
      } else {
        next[part.key] = state;
      }
      return next;
    });
    setActivePart(null);
  };

  const handleSave = () => {
    onSave({ parts: partStates } as unknown as InspectionData);
  };

  const totalAmount = Object.entries(partStates).reduce((sum, [key, state]) => {
    const part = parts.find(p => p.key === key);
    return part ? sum + priceFor(part, state, catalog) : sum;
  }, 0);

  const mangelCount = Object.keys(partStates).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>

        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={member.profile_photo}
              alt={memberService.getDisplayName(member)}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-lg font-bold leading-tight">
              {memberService.getDisplayName(member)}
            </h1>
            <div className="text-xs text-muted-foreground">
              {session.anlass}
              {mangelCount > 0 && ` · ${mangelCount} ${mangelCount > 1 ? 'Mängel' : 'Mangel'} = ${totalAmount.toFixed(2)}€`}
            </div>
          </div>
        </div>
      </div>

      {/* Zonen mit Teil-Chips */}
      {zones.map(zone => {
        const zoneParts = parts.filter(p => p.zone === zone);
        if (zoneParts.length === 0) return null;

        return (
          <div key={zone}>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {ZONE_LABELS[zone]}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {zoneParts.map(part => {
                const state = partStates[part.key];
                return (
                  <button
                    key={part.key}
                    type="button"
                    onClick={() => handlePartTap(part)}
                    className={`rounded-lg border-2 px-2 py-2.5 text-sm font-medium transition-all text-center leading-tight
                      ${state
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-border bg-card hover:bg-muted/50'}`}
                  >
                    <div>{part.label}</div>
                    {state && (
                      <div className="text-xs font-normal mt-0.5">
                        {STATE_LABELS[state]} · {priceFor(part, state, catalog).toFixed(0)}€
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Zurück
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
        >
          {mangelCount === 0 ? 'Makellos speichern' : `Speichern (${totalAmount.toFixed(2)}€)`}
        </Button>
      </div>

      {/* Zustands-Auswahl */}
      <Dialog open={!!activePart} onOpenChange={(open) => !open && setActivePart(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{activePart?.label}</DialogTitle>
          </DialogHeader>
          {activePart && (
            <div className="space-y-2">
              {(['fehlt', 'versaut', 'dreckig', 'unzureichend'] as PartState[]).map(state => (
                <Button
                  key={state}
                  variant={partStates[activePart.key] === state ? 'default' : 'outline'}
                  className="w-full justify-between h-12 text-base"
                  onClick={() => setState(activePart, state)}
                >
                  <span>{STATE_LABELS[state]}</span>
                  <span className="text-muted-foreground">
                    {priceFor(activePart, state, catalog).toFixed(0)}€
                  </span>
                </Button>
              ))}
              {partStates[activePart.key] && (
                <Button
                  variant="ghost"
                  className="w-full h-11"
                  onClick={() => setState(activePart, null)}
                >
                  Keine Beanstandung
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
