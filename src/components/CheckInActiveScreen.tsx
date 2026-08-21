import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckInEndModal } from './CheckInEndModal';
import { EditCheckInModal } from './EditCheckInModal';
import { memberService } from '@/services/memberService';
import { penaltyService } from '@/services/penaltyService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { checkinService, findLatePenaltyType, computeLateAmount } from '@/services/checkinService';
import { Member, CheckinSession, CheckinResult } from '@/types';
import { toast } from 'sonner';

interface CheckInActiveScreenProps {
  session: CheckinSession;
  onEnd: (results: CheckinResult[]) => void;
  onLeave: () => void;
}

export const CheckInActiveScreen = ({ session, onEnd, onLeave }: CheckInActiveScreenProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [results, setResults] = useState<CheckinResult[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEndModal, setShowEndModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editResult, setEditResult] = useState<CheckinResult | null>(null);
  const [latePenaltyType, setLatePenaltyType] = useState<any | undefined>(undefined);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const referenceDateTime = new Date(session.reference_time);
  const referenceTimeLabel = referenceDateTime.toTimeString().slice(0, 5);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activeMembers, sessionResults, catalog] = await Promise.all([
          memberService.getActive(),
          checkinService.getSessionResults(session.id),
          penaltyCatalogService.getActive()
        ]);
        setMembers(activeMembers);
        setResults(sessionResults);
        setCatalog(catalog);
        setLatePenaltyType(findLatePenaltyType(catalog));
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
      // Already checked in: open the edit dialog (correct time/amount or check out)
      setEditMember(member);
      setEditResult(existing);
      return;
    }

    // One tap = checked in. Late arrivals are booked automatically
    // at the standard rate; corrections go through the edit dialog.
    const checkTime = new Date();
    const diffMs = checkTime.getTime() - referenceDateTime.getTime();
    const minutesLate = Math.max(0, Math.floor(diffMs / (1000 * 60)));

    setSaving(true);
    try {
      let penaltyId: string | undefined;
      if (minutesLate > 0) {
        if (latePenaltyType) {
          const amount = computeLateAmount(latePenaltyType, minutesLate);
          const penalty = await penaltyService.create({
            member_id: member.id,
            penalty_type_id: latePenaltyType.id,
            amount,
            multiplier: latePenaltyType?.has_multiplier ? minutesLate : 1,
            notes: `${session.occasion}: +${minutesLate} Min.`,
            event_id: session.event_id || undefined
          });
          penaltyId = penalty.id;
        } else {
          toast.error('Keine Verspätungs-Strafe im Katalog gefunden');
        }
      }

      const result = await checkinService.checkInMember(
        session.id,
        member.id,
        minutesLate,
        penaltyId
      );
      setResults(prev => [...prev, result]);

      if (minutesLate > 0) {
        toast.success(`${memberService.getDisplayName(member)}: +${minutesLate} Min. gebucht – zum Korrigieren antippen`);
      }
    } catch (error) {
      console.error('Failed to check in member:', error);
      toast.error('Fehler beim Speichern des Check-ins');
    } finally {
      setSaving(false);
    }
  };

  const handleEndWithMissed = async (missed: { memberId: string; catalogName: string | null }[]) => {
    // Optional: Strafen für Nicht-Erschienene buchen
    for (const m of missed) {
      if (!m.catalogName) continue;
      const entry = catalog.find(c => c.name === m.catalogName);
      if (!entry) continue;
      try {
        await penaltyService.create({
          member_id: m.memberId,
          penalty_type_id: entry.id,
          amount: Number(entry.amount),
          notes: `${session.occasion}: nicht erschienen`,
          event_id: session.event_id || undefined
        });
      } catch (error) {
        console.error('Failed to create missed penalty:', error);
        toast.error('Strafe für Nicht-Erschienenen konnte nicht gebucht werden');
      }
    }
    onEnd(results);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={onLeave}>
            Verlassen
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowEndModal(true)}
          >
            Beenden
          </Button>
        </div>
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
        catalog={catalog}
        onConfirm={handleEndWithMissed}
      />

      <EditCheckInModal
        open={!!editResult}
        onOpenChange={(open) => { if (!open) { setEditMember(null); setEditResult(null); } }}
        member={editMember}
        result={editResult}
        session={session}
        latePenaltyType={latePenaltyType}
        onSaved={(updated) => setResults(prev => prev.map(r => r.id === updated.id ? updated : r))}
        onCheckedOut={(removed) => setResults(prev => prev.filter(r => r.id !== removed.id))}
      />
    </div>
  );
};
