import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Check, X, Circle, User, Plus, Minus } from 'lucide-react';
import { memberService } from '@/services/memberService';
import { INSPECTION_CATEGORIES } from '@/services/inspectionService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { InspectionSession, Member, InspectionData } from '@/types';

interface InspectionDetailScreenProps {
  member: Member;
  session: InspectionSession;
  initialData: any;
  onSave: (data: InspectionData) => void;
  onBack: () => void;
}

type InspectionStatus = 'neutral' | 'ok' | 'fehler';

export const InspectionDetailScreen = ({ 
  member, 
  session, 
  initialData, 
  onSave, 
  onBack 
}: InspectionDetailScreenProps) => {
  const [abnahmePenalties, setAbnahmePenalties] = useState<any[]>([]);
  const [inspectionData, setInspectionData] = useState<InspectionData>(() => {
    // Initialize with default values if no initial data
    const defaultData: InspectionData = {
      kopf: {},
      oberkoerper: {},
      unterkoerper: {},
      ausruestung: {},
      sonstiges: {}
    };

    // Merge with initial data if available
    if (initialData && typeof initialData === 'object') {
      return { ...defaultData, ...initialData };
    }
    
    return defaultData;
  });

  // Load Abnahme penalties on component mount
  useEffect(() => {
    const loadAbnahmePenalties = async () => {
      try {
        const penalties = await penaltyCatalogService.getByCategory('abnahme');
        setAbnahmePenalties(penalties);
      } catch (error) {
        console.error('Failed to load abnahme penalties:', error);
      }
    };
    loadAbnahmePenalties();
  }, []);

  const adjustMultiplier = (category: keyof InspectionData, item: string, adjustment: number) => {
    const currentValue = (inspectionData[category] as any)[item] as number || 0;
    const newValue = Math.max(0, currentValue + adjustment);

    setInspectionData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [item]: newValue
      }
    }));
  };

  const getMultiplier = (category: keyof InspectionData, item: string): number => {
    return ((inspectionData[category] as any)[item] as number) || 0;
  };

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier > 0) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-300 bg-white';
  };

  const handleSave = () => {
    onSave(inspectionData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>
        
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={member.profile_photo} 
              alt={memberService.getDisplayName(member)} 
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h1 className="text-xl font-bold">
              Musterung – {memberService.getDisplayName(member)}
            </h1>
            <div className="text-sm text-muted-foreground">
              {session.anlass}
            </div>
          </div>
        </div>
      </div>

      {/* Abnahme Penalties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Abnahme Strafen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {abnahmePenalties.map((penalty) => {
              const multiplier = getMultiplier('sonstiges', penalty.id);
              
              return (
                <div
                  key={penalty.id}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${getMultiplierColor(multiplier)}
                  `}
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="font-medium text-sm">{penalty.name}</div>
                      <div className="text-xs text-muted-foreground">{penalty.amount}€</div>
                      {multiplier > 0 && (
                        <div className="text-xs mt-1 font-medium text-red-600">
                          {multiplier}x = {(penalty.amount * multiplier).toFixed(2)}€
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => adjustMultiplier('sonstiges', penalty.id, -1)}
                        disabled={multiplier <= 0}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      
                      <span className="font-medium text-sm min-w-[2rem] text-center">
                        {multiplier}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => adjustMultiplier('sonstiges', penalty.id, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Zurück
        </Button>
        <Button 
          onClick={handleSave}
          className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
        >
          Speichern
        </Button>
      </div>
    </div>
  );
};