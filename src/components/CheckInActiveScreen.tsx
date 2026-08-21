import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckInEndModal } from './CheckInEndModal';
import { LateArrivalModal } from './LateArrivalModal';
import { memberService } from '@/services/memberService';
import { penaltyService } from '@/services/penaltyService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { checkinService } from '@/services/checkinService';
import { Member, CheckinSession, CheckinResult } from '@/types';
import { toast } from 'sonner';

interface CheckInActiveScreenProps {
  session: CheckinSession;
  onEnd: (results: CheckinResult[]) => void;
}

export const CheckInActiveScreen = ({ session, onEnd }: CheckInActiveScreenProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [results, setResults] = useState<CheckinResult[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEndModal, setShowEndModal] = useState(false);
  const [showLateModal, setShowLateModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [lateMinutes, setLateMinutes] = useState(0);
  const [saving, setSaving] = useState(false);

  const referenceDateTime = new Date(session.reference_time);
  const referenceTimeLabel = referenceDateTime.toTimeString().slice(0, 5);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activeMembers, sessionResults] = await Promise.all([
          memberService.getActive(),
          checkinService.getSessionResults(session.id)
        ]);
        setMembers(activeMembers);
        setResults(sessionResults);
      } catch (error) {
        console.error('Failed to load check-in data:', error);
        toast.error('Fehler beim Laden des Check-in-Stands');
      }
    };

    loadData();
  }, [session.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimeStatus = () => {
    const diffMs = currentTime.getTime() - referenceDateTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes <= 0) {
      return {
        text: `Noch ${Math.abs(diffMinutes)} Min`,
        color: 'text-green-600',
        isLate: false
      };
    } else {
      return {
        text: `Verspätung: +${diffMinutes} Min`,
        color: 'text-orange-600',
        isLate: true
      };
    }
  };

  const handleMemberClick = async (member: Member) => {
    if (saving) return;

    const existing = results.find(r => r.member_id === member.id);

    if (existing) {
      // Undo check-in (also removes a linked penalty)
      setSaving(true);
      try {
        await checkinService.undoCheckIn(existing);
        setResults(prev => prev.filter(r => r.id !== existing.id));
        if (existing.penalty_id) {
          toast.success(`Check-in zurückgenommen, Strafe gelöscht`);
        }
      } catch (error) {
        console.error('Failed to undo check-in:', error);
        toast.error('Fehler beim Zurücknehmen');
      } finally {
        setSaving(false);
      }
      return;
    }

    const checkTime = new Date();
    const diffMs = checkTime.getTime() - referenceDateTime.getTime();
    const minutesLate = Math.floor(diffMs / (1000 * 60));
    const isOnTime = minutesLate <= 0;

    if (isOnTime) {
      setSaving(true);
      try {
        const result = await checkinService.checkInMember(session.id, member.id, 0);
        setResults(prev => [...prev, result]);
      } catch (error) {
        console.error('Failed to check in member:', error);
        toast.error('Fehler beim Speichern des Check-ins');
      } finally {
        setSaving(false);
      }
    } else {
      // Show late arrival modal
      setSelectedMember(member);
      setLateMinutes(minutesLate);
      setShowLateModal(true);
    }
  };

  const handleLateArrival = async (penaltyAmount: number) => {
    if (!selectedMember) return;
    setSaving(true);

    try {
      // Find the late arrival penalty type from catalog
      const penaltyTypes = await penaltyCatalogService.getActive();
      const latePenalty = penaltyTypes.find(
        pt => pt.name.toLowerCase().includes('verspätung') ||
              pt.category === 'timing' ||
              pt.name.toLowerCase().includes('zu spät')
      );

      let penaltyId: string | undefined;
      if (latePenalty) {
        const penalty = await penaltyService.create({
          member_id: selectedMember.id,
          penalty_type_id: latePenalty.id,
          amount: penaltyAmount,
          notes: `${session.occasion}: +${lateMinutes} Min.`,
          event_id: session.event_id || undefined
        });
        penaltyId = penalty.id;
      } else {
        console.warn('No late arrival penalty type found in catalog');
        toast.error('Keine Verspätungs-Strafe im Katalog gefunden');
      }

      const result = await checkinService.checkInMember(
        session.id,
        selectedMember.id,
        lateMinutes,
        penaltyId
      );
      setResults(prev => [...prev, result]);

      toast.success(`Verspätung für ${memberService.getDisplayName(selectedMember)} erfasst`);
    } catch (error) {
      console.error('Failed to save penalty:', error);
      toast.error('Fehler beim Speichern der Strafe');
    } finally {
      setSaving(false);
    }

    setShowLateModal(false);
    setSelectedMember(null);
  };

  const getMemberStatus = (member: Member) => {
    const checked = results.find(r => r.member_id === member.id);
    if (!checked) return 'neutral';
    return checked.is_on_time ? 'ontime' : 'late';
  };

  const getMemberStatusText = (member: Member) => {
    const checked = results.find(r => r.member_id === member.id);
    if (!checked) return '';
    return checked.is_on_time ? 'Pünktlich' : `Zu spät +${checked.minutes_late} Min`;
  };

  const getCardClassName = (status: string) => {
    switch (status) {
      case 'ontime':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'late':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-card border-border hover:bg-muted/50 cursor-pointer';
    }
  };

  const uncheckedMembers = members.filter(
    member => !results.some(r => r.member_id === member.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Check-in aktiv – Referenz: {referenceTimeLabel}
          </h2>
          <div className="text-sm">
            <div className="text-muted-foreground">
              {session.occasion} · Aktuelle Zeit: {currentTime.toTimeString().slice(0, 8)}
            </div>
            <div className={`font-medium ${getTimeStatus().color}`}>
              {getTimeStatus().text}
            </div>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowEndModal(true)}
        >
          Check-in beenden
        </Button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {members.map((member) => {
          const status = getMemberStatus(member);
          const statusText = getMemberStatusText(member);

          return (
            <Card
              key={member.id}
              className={`transition-all ${getCardClassName(status)}`}
              onClick={() => handleMemberClick(member)}
            >
              <CardContent className="p-3 text-center">
                <div className="font-medium text-sm">
                  {memberService.getDisplayName(member)}
                </div>
                {statusText && (
                  <Badge
                    variant={status === 'ontime' ? 'default' : 'destructive'}
                    className="mt-1 text-xs"
                  >
                    {statusText}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        {results.length} von {members.length} Schützen erfasst
      </div>

      {/* Modals */}
      <CheckInEndModal
        open={showEndModal}
        onOpenChange={setShowEndModal}
        uncheckedMembers={uncheckedMembers}
        onConfirm={() => onEnd(results)}
      />

      <LateArrivalModal
        open={showLateModal}
        onOpenChange={setShowLateModal}
        member={selectedMember}
        minutesLate={lateMinutes}
        onConfirm={handleLateArrival}
      />
    </div>
  );
};
