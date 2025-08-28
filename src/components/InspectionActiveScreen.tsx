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
import { InspectionResult, InspectionSession, Member, InspectionData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { InspectionDetailScreen } from './InspectionDetailScreen';

interface InspectionActiveScreenProps {
  session: InspectionSession;
  onEnd: () => void;
}

export const InspectionActiveScreen = ({ session, onEnd }: InspectionActiveScreenProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [inspectionResults, setInspectionResults] = useState<InspectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [endModalOpen, setEndModalOpen] = useState(false);
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
      
      // Create penalties for any failures
      await inspectionService.createPenaltiesFromInspection(
        session.id, 
        memberId, 
        inspectionData, 
        penaltyCatalog
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
        <Button
          variant="outline"
          onClick={handleEndInspection}
          className="border-red-500 text-red-600 hover:bg-red-50"
        >
          Musterung beenden
        </Button>
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
              {offenMembers.length > 0 ? (
                <>
                  Es sind noch {offenMembers.length} Schützen offen:
                  <div className="mt-2 text-sm text-muted-foreground">
                    {offenMembers.map(member => memberService.getDisplayName(member)).join(', ')}
                  </div>
                </>
              ) : (
                "Alle Schützen wurden gemustert. Musterung kann beendet werden."
              )}
            </DialogDescription>
          </DialogHeader>
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