import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { memberService } from '@/services/memberService';
import { inspectionService, INSPECTION_CATEGORIES } from '@/services/inspectionService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { penaltyService } from '@/services/penaltyService';
import { InspectionResult, InspectionSession, Member, InspectionData } from '@/types';
import { partsForMember, catalogEntryFor, STATE_LABELS, PartState } from '@/services/uniformParts';
import { useToast } from '@/hooks/use-toast';
import { InspectionDetailScreen } from './InspectionDetailScreen';

interface InspectionActiveScreenProps {
  session: InspectionSession;
  onEnd: () => void;
  onLeave: () => void;
}

export const InspectionActiveScreen = ({ session, onEnd, onLeave }: InspectionActiveScreenProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [inspectionResults, setInspectionResults] = useState<InspectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [missedSelections, setMissedSelections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [session.id]);

  const loadData = async () => {
    try {
      const [membersData, resultsData] = await Promise.all([
        memberService.getActive(),
        inspectionService.getSessionResults(session.id)
      ]);

      setMembers(membersData);
      setInspectionResults(resultsData);

      // Initialize results for members who don't have one yet
      const existingMemberIds = new Set(resultsData.map(r => r.member_id));
      const initPromises = membersData
        .filter(member => !existingMemberIds.has(member.id))
        .map(member => inspectionService.initializeMemberResult(session.id, member.id));

      if (initPromises.length > 0) {
        const newResults = await Promise.all(initPromises);
        setInspectionResults(prev => [...prev, ...newResults]);
      }
    } catch (error) {
      console.error('Failed to load inspection data:', error);
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMemberStatus = (memberId: string): 'offen' | 'gemustert' => {
    const result = inspectionResults.find(r => r.member_id === memberId);
    return result?.status || 'offen';
  };

  const getStatusStats = () => {
    const gemustert = inspectionResults.filter(r => r.status === 'gemustert').length;
    const offen = members.length - gemustert;
    return { gemustert, offen };
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
  };

  const handleInspectionSave = async (memberId: string, inspectionData: InspectionData) => {
    try {
      const penaltyCatalog = await penaltyCatalogService.getActive();

      // Part-based format: { parts: { partKey: state } }
      const member = members.find(m => m.id === memberId);
      const partsDef = member ? partsForMember(member) : [];
      const partsMap = ((inspectionData as any).parts || {}) as Record<string, PartState>;
      const partStates = Object.entries(partsMap)
        .map(([key, state]) => {
          const part = partsDef.find(pd => pd.key === key);
          if (!part) return null;
          return {
            partLabel: part.label,
            stateLabel: STATE_LABELS[state],
            catalogEntry: catalogEntryFor(part, state, penaltyCatalog)
          };
        })
        .filter(Boolean) as { partLabel: string; stateLabel: string; catalogEntry: any }[];

      await inspectionService.createPenaltiesFromParts(
        session.id,
        memberId,
        partStates
      );

      // Update the inspection result
      await inspectionService.updateMemberResult(
        session.id, 
        memberId, 
        inspectionData, 
        'gemustert'
      );

      // Refresh data
      await loadData();
      setSelectedMember(null);

      toast({
        title: "Musterung gespeichert",
        description: "Die Musterung wurde erfolgreich gespeichert.",
      });
    } catch (error) {
      console.error('Failed to save inspection:', error);
      toast({
        title: "Fehler",
        description: "Die Musterung konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleEndInspection = () => {
    setEndModalOpen(true);
  };

  const confirmEndInspection = async () => {
    try {
      // Strafen für Nicht-Erschienene buchen (Schnellauswahl)
      const selectedIds = Object.entries(missedSelections).filter(([, v]) => v).map(([id]) => id);
      if (selectedIds.length > 0) {
        const catalog = await penaltyCatalogService.getActive();
        const missedType = catalog.find(c => c.name === 'Verpasste Abnahme');
        if (missedType) {
          for (const memberId of selectedIds) {
            await penaltyService.create({
              member_id: memberId,
              penalty_type_id: missedType.id,
              amount: Number(missedType.amount),
              notes: `${session.anlass}: nicht erschienen`,
              event_id: session.event_id || undefined
            });
          }
        }
      }

      await inspectionService.endActiveSession();
      setEndModalOpen(false);
      onEnd();
      toast({
        title: "Musterung beendet",
        description: "Die Musterung wurde erfolgreich beendet.",
      });
    } catch (error) {
      console.error('Failed to end inspection:', error);
      toast({
        title: "Fehler",
        description: "Die Musterung konnte nicht beendet werden.",
        variant: "destructive",
      });
    }
  };

  const stats = getStatusStats();
  const offenMembers = members.filter(m => getMemberStatus(m.id) === 'offen');

  if (selectedMember) {
    const memberResult = inspectionResults.find(r => r.member_id === selectedMember.id);
    return (
      <InspectionDetailScreen
        member={selectedMember}
        session={session}
        initialData={memberResult?.inspection_data || {}}
        onSave={(data) => handleInspectionSave(selectedMember.id, data)}
        onBack={() => setSelectedMember(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-lg font-medium">Lade Musterung...</div>
          <div className="text-sm text-muted-foreground">Daten werden geladen</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Musterung – {session.anlass}</h1>
          <div className="text-lg mt-2">
            <span className="text-green-600 font-medium">Gemustert {stats.gemustert}</span>
            <span className="mx-2">/</span>
            <span className="text-orange-600 font-medium">Offen {stats.offen}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onLeave}>
            Verlassen
          </Button>
          <Button
            variant="outline"
            onClick={handleEndInspection}
            className="border-red-500 text-red-600 hover:bg-red-50"
          >
            Beenden
          </Button>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {members.map((member) => {
          const status = getMemberStatus(member.id);
          const isGemustert = status === 'gemustert';
          
          return (
            <Card 
              key={member.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                isGemustert 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-border hover:border-primary'
              }`}
              onClick={() => handleMemberClick(member)}
            >
              <CardContent className="p-4 text-center">
                <Avatar className="h-16 w-16 mx-auto mb-3">
                  <AvatarImage 
                    src={member.profile_photo} 
                    alt={memberService.getDisplayName(member)} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <div className="font-medium text-sm">
                    {memberService.getDisplayName(member)}
                  </div>
                  
                  <Badge 
                    variant={isGemustert ? "default" : "outline"}
                    className={
                      isGemustert 
                        ? "bg-green-500 text-white" 
                        : "border-orange-500 text-orange-600"
                    }
                  >
                    {isGemustert ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Gemustert
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Offen
                      </>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* End Inspection Modal */}
      <Dialog open={endModalOpen} onOpenChange={setEndModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Musterung beenden</DialogTitle>
            <DialogDescription>
              {offenMembers.length > 0
                ? `Noch ${offenMembers.length} Schützen offen. Antippen bucht "Verpasste Abnahme" (10€):`
                : "Alle Schützen wurden gemustert. Musterung kann beendet werden."}
            </DialogDescription>
          </DialogHeader>
          {offenMembers.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {offenMembers.map(member => {
                const selected = !!missedSelections[member.id];
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setMissedSelections(prev => ({ ...prev, [member.id]: !prev[member.id] }))}
                    className={`w-full flex items-center justify-between rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all
                      ${selected ? 'border-red-500 bg-red-50 text-red-700' : 'border-border bg-card hover:bg-muted/50'}`}
                  >
                    <span>{memberService.getDisplayName(member)}</span>
                    <span className="text-xs font-normal">
                      {selected ? 'Verpasste Abnahme · 10€' : 'keine Strafe'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEndModalOpen(false)}>
              Zurück
            </Button>
            <Button 
              onClick={confirmEndInspection}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Beenden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};