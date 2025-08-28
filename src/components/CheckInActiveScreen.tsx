import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckInEndModal } from './CheckInEndModal';
import { LateArrivalModal } from './LateArrivalModal';
import { memberService } from '@/services/memberService';
import { penaltyService } from '@/services/penaltyService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { Member } from '@/types';
import { toast } from 'sonner';

interface CheckedMember {
  memberId: string;
  checkTime: Date;
  minutesLate: number;
  isOnTime: boolean;
}

interface CheckInActiveScreenProps {
  referenceTime: string;
  onEnd: (checkedMembers: CheckedMember[]) => void;
}

export const CheckInActiveScreen = ({ referenceTime, onEnd }: CheckInActiveScreenProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [checkedMembers, setCheckedMembers] = useState<CheckedMember[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEndModal, setShowEndModal] = useState(false);
  const [showLateModal, setShowLateModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [lateMinutes, setLateMinutes] = useState(0);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const activeMembers = await memberService.getActive();
        setMembers(activeMembers);
      } catch (error) {
        console.error('Failed to load members:', error);
      }
    };

    loadMembers();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getReferenceDateTime = () => {
    const [hours, minutes] = referenceTime.split(':').map(Number);
    const refDate = new Date();
    refDate.setHours(hours, minutes, 0, 0);
    return refDate;
  };

  const getCurrentDelay = () => {
    const refDateTime = getReferenceDateTime();
    const diffMs = currentTime.getTime() - refDateTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return Math.max(0, diffMinutes);
  };

  const handleMemberClick = (member: Member) => {
    if (checkedMembers.some(cm => cm.memberId === member.id)) {
      return; // Already checked
    }

    const refDateTime = getReferenceDateTime();
    const checkTime = new Date();
    const diffMs = checkTime.getTime() - refDateTime.getTime();
    const minutesLate = Math.floor(diffMs / (1000 * 60));
    const isOnTime = minutesLate <= 0;

    if (isOnTime) {
      // Mark as on time immediately
      setCheckedMembers(prev => [...prev, {
        memberId: member.id,
        checkTime,
        minutesLate: 0,
        isOnTime: true
      }]);
    } else {
      // Show late arrival modal
      setSelectedMember(member);
      setLateMinutes(minutesLate);
      setShowLateModal(true);
    }
  };

  const handleLateArrival = async (penaltyAmount: number) => {
    if (!selectedMember) return;

    try {
      // Find the late arrival penalty type from catalog
      const penaltyTypes = await penaltyCatalogService.getActive();
      const latePenalty = penaltyTypes.find(
        pt => pt.name.toLowerCase().includes('verspätung') || 
              pt.category === 'timing' ||
              pt.name.toLowerCase().includes('zu spät')
      );

      // Create penalty record in database
      if (latePenalty) {
        await penaltyService.create({
          member_id: selectedMember.id,
          penalty_type_id: latePenalty.id,
          amount: penaltyAmount,
          notes: `Check-in Verspätung: +${lateMinutes} Minuten`
        });
      } else {
        // If no penalty type found, we still need to create a record
        // This shouldn't happen in normal operation, but we handle it gracefully
        console.warn('No late arrival penalty type found in catalog');
        toast.error('Keine Verspätungs-Strafe im Katalog gefunden');
      }

      const checkTime = new Date();
      setCheckedMembers(prev => [...prev, {
        memberId: selectedMember.id,
        checkTime,
        minutesLate: lateMinutes,
        isOnTime: false
      }]);

      toast.success(`Verspätung für ${memberService.getDisplayName(selectedMember)} erfasst`);
    } catch (error) {
      console.error('Failed to save penalty:', error);
      toast.error('Fehler beim Speichern der Strafe');
    }

    setShowLateModal(false);
    setSelectedMember(null);
  };

  const getMemberStatus = (member: Member) => {
    const checked = checkedMembers.find(cm => cm.memberId === member.id);
    if (!checked) return 'neutral';
    return checked.isOnTime ? 'ontime' : 'late';
  };

  const getMemberStatusText = (member: Member) => {
    const checked = checkedMembers.find(cm => cm.memberId === member.id);
    if (!checked) return '';
    return checked.isOnTime ? 'Pünktlich' : `Zu spät +${checked.minutesLate} Min`;
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
    member => !checkedMembers.some(cm => cm.memberId === member.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Check-in aktiv – Referenz: {referenceTime}
          </h2>
          <div className="text-sm text-muted-foreground">
            Aktuelle Zeit: {currentTime.toTimeString().slice(0, 8)}
            {getCurrentDelay() > 0 && (
              <span className="ml-2 text-orange-600">
                Verspätung: +{getCurrentDelay()} Min
              </span>
            )}
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
        {checkedMembers.length} von {members.length} Schützen erfasst
      </div>

      {/* Modals */}
      <CheckInEndModal
        open={showEndModal}
        onOpenChange={setShowEndModal}
        uncheckedMembers={uncheckedMembers}
        onConfirm={() => onEnd(checkedMembers)}
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