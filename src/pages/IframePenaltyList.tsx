import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { memberService } from '@/services/memberService';
import { penaltyService } from '@/services/penaltyService';
import { Penalty, Member } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';

const IframePenaltyList = () => {
  const [penalties, setPenalties] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [penaltiesData, membersData] = await Promise.all([
        penaltyService.getRecentPublic(50, 0),
        memberService.getActive()
      ]);
      setPenalties(penaltiesData);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeaderboard = () => {
    const memberPenalties = members.map(member => {
      const memberPenaltiesData = penalties.filter(p => 
        (p.member_first_name === member.first_name && p.member_last_name === member.last_name) ||
        (p.member_nickname && p.member_nickname === member.nickname)
      );
      const totalAmount = memberPenaltiesData.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalCount = memberPenaltiesData.length;
      
      return {
        member,
        totalAmount,
        totalCount
      };
    })
    .filter(item => item.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);
    
    return memberPenalties;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="text-center text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Leaderboard */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 text-center">Leaderboard</h2>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-2">
              {getLeaderboard().map((item, index) => (
                <div key={item.member.id} className="flex items-center justify-between p-2 bg-background rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-foreground">
                      {memberService.getPublicDisplayName(item.member)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{item.totalAmount}€</div>
                    <div className="text-xs text-muted-foreground">{item.totalCount} Strafen</div>
                  </div>
                </div>
              ))}
              {getLeaderboard().length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Keine Strafen vorhanden
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Aktuelle Strafenliste</h1>
          <p className="text-muted-foreground">
            {penalties.length} {penalties.length === 1 ? 'Strafe' : 'Strafen'} gefunden
          </p>
        </div>

        {penalties.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Keine Strafen vorhanden
          </div>
        ) : (
          <div className="space-y-3">
            {penalties.map((penalty) => (
              <div key={penalty.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex-1">
                   <div className="font-medium text-foreground text-lg">
                     {penalty.member_nickname || `${penalty.member_first_name || ''} ${penalty.member_last_name || ''}`.trim() || 'Unbekannt'}
                   </div>
                   <div className="flex items-center gap-3 mt-2">
                     <Badge variant="outline" className="text-xs">
                       {penalty.penalty_type_name || 'Unbekannt'}
                     </Badge>
                     <span className="text-sm text-muted-foreground">
                       {formatDateTime(penalty.created_time || penalty.penalty_date)}
                     </span>
                   </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">
                    {penalty.amount}€
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IframePenaltyList;