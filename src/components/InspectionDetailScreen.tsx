import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Check, X, Circle, User } from 'lucide-react';
import { memberService } from '@/services/memberService';
import { INSPECTION_CATEGORIES } from '@/services/inspectionService';
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
  const [inspectionData, setInspectionData] = useState<InspectionData>(() => {
    // Initialize with default values if no initial data
    const defaultData: InspectionData = {
      kopf: { hut: 'neutral', krawatte: 'neutral', frisur: 'neutral' },
      oberkoerper: { jacke: 'neutral', hemd: 'neutral', abzeichen: 'neutral' },
      unterkoerper: { hose: 'neutral', hosenstege: 'neutral', schuhe: 'neutral' },
      ausruestung: { gewehr_saebel: 'neutral', handschuhe: 'neutral', schuetzenstock: 'neutral' },
      sonstiges: { auftreten: 'neutral', benehmen: 'neutral' }
    };

    // Merge with initial data if available
    if (initialData && typeof initialData === 'object') {
      return { ...defaultData, ...initialData };
    }
    
    return defaultData;
  });

  const toggleItemStatus = (category: keyof InspectionData, item: string) => {
    const currentStatus = inspectionData[category][item] as InspectionStatus;
    let nextStatus: InspectionStatus;
    
    switch (currentStatus) {
      case 'neutral':
        nextStatus = 'ok';
        break;
      case 'ok':
        nextStatus = 'fehler';
        break;
      case 'fehler':
        nextStatus = 'neutral';
        break;
      default:
        nextStatus = 'ok';
    }

    setInspectionData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [item]: nextStatus
      }
    }));
  };

  const getStatusIcon = (status: InspectionStatus) => {
    switch (status) {
      case 'ok':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'fehler':
        return <X className="w-5 h-5 text-red-600" />;
      case 'neutral':
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case 'ok':
        return 'border-green-500 bg-green-50 hover:bg-green-100';
      case 'fehler':
        return 'border-red-500 bg-red-50 hover:bg-red-100';
      case 'neutral':
      default:
        return 'border-gray-300 bg-white hover:bg-gray-50';
    }
  };

  const getStatusText = (status: InspectionStatus) => {
    switch (status) {
      case 'ok':
        return 'OK';
      case 'fehler':
        return 'Fehler';
      case 'neutral':
      default:
        return '';
    }
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

      {/* Inspection Categories */}
      <div className="space-y-6">
        {Object.entries(INSPECTION_CATEGORIES).map(([categoryKey, categoryData]) => (
          <Card key={categoryKey}>
            <CardHeader>
              <CardTitle className="text-lg">{categoryData.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(categoryData.items).map(([itemKey, itemName]) => {
                  const status = inspectionData[categoryKey as keyof InspectionData][itemKey] as InspectionStatus;
                  
                  return (
                    <button
                      key={itemKey}
                      onClick={() => toggleItemStatus(categoryKey as keyof InspectionData, itemKey)}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${getStatusColor(status)}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{itemName}</div>
                          {getStatusText(status) && (
                            <div className="text-xs mt-1 font-medium">
                              {getStatusText(status)}
                            </div>
                          )}
                        </div>
                        {getStatusIcon(status)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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