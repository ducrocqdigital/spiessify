import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, Filter, Users, Euro, Calendar, LogIn, Settings } from 'lucide-react';
import { memberService } from '@/services/memberService';
import { penaltyService } from '@/services/penaltyService';
import { Member, Penalty } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { EventHeader } from '@/components/EventHeader';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type FilterType = 'all' | 'today' | 'week' | 'uniform' | 'marsch' | 'sonstiges';

type PublicMemberStats = {
  id: string;
  first_name: string;
  last_name: string;
  family_name_particle?: string;
  nickname?: string;
  rank: string;
  is_active: boolean;
  profile_photo?: string;
  total_penalties: number;
  total_amount: number;
  created_at?: string;
  updated_at?: string;
};

const PublicDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isOberadmin, isChargierte, signOut } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [members, setMembers] = useState<PublicMemberStats[]>([]);
  const [penaltyStats, setPenaltyStats] = useState<{ totalPenalties: number; totalAmount: number; penaltiesToday: number }>({ totalPenalties: 0, totalAmount: 0, penaltiesToday: 0 });
  const [recentPenalties, setRecentPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load members with penalty stats for leaderboard
      const { data: membersData, error: membersError } = await supabase
        .rpc('get_members_with_public_stats');
      
      if (membersError) throw membersError;
      
      // Get penalty statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_public_penalty_stats');
      
      if (statsError) throw statsError;
      
      // Get recent penalties for the feed
      const recentPenaltiesData = await penaltyService.getRecentPublic(10, 0);
      
      setMembers((membersData || []).map((m: any) => ({
        ...m,
        created_at: m.created_at || new Date().toISOString(),
        updated_at: m.updated_at || new Date().toISOString()
      })));
      setPenaltyStats({
        totalPenalties: Number(statsData[0]?.total_penalties || 0),
        totalAmount: Number(statsData[0]?.total_amount || 0),
        penaltiesToday: Number(statsData[0]?.penalties_today || 0)
      });
      setRecentPenalties(recentPenaltiesData.map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.penalty_date,
        created_time: p.created_time,
        penalty_type: { name: p.penalty_type_name },
        member: {
          first_name: p.member_first_name,
          last_name: p.member_last_name,
          family_name_particle: p.member_family_name_particle,
          nickname: p.member_nickname
        }
      })));
      setHasMore(recentPenaltiesData.length === 10);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePenalties = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const morePenalties = await penaltyService.getRecentPublic(10, recentPenalties.length);
      const formattedPenalties = morePenalties.map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.penalty_date,
        created_time: p.created_time,
        penalty_type: { name: p.penalty_type_name },
        member: {
          first_name: p.member_first_name,
          last_name: p.member_last_name,
          family_name_particle: p.member_family_name_particle,
          nickname: p.member_nickname
        }
      } as any));
      setRecentPenalties(prev => [...prev, ...formattedPenalties]);
      setHasMore(morePenalties.length === 10);
    } catch (error) {
      console.error('Failed to load more penalties:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Sort members by total amount (descending)
  const sortedMembers = useMemo(() => {
    if (loading) return [];
    return members
      .filter(member => Number(member.total_amount) > 0)
      .sort((a, b) => Number(b.total_amount) - Number(a.total_amount))
      .map(member => ({
        ...member,
        totalAmount: Number(member.total_amount),
        totalPenalties: Number(member.total_penalties)
      }));
  }, [members, loading]);

  const getPositionIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  const getPositionClass = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/20";
      case 1:
        return "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/20";
      case 2:
        return "bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/20";
      default:
        return "";
    }
  };

  // Helper function to get public display name with abbreviated surname
  const getPublicDisplayName = (member: { first_name: string; last_name: string; family_name_particle?: string; nickname?: string }) => {
    if (member.nickname) return member.nickname;
    
    const abbreviatedLastName = member.last_name.charAt(0) + '.';
    const abbreviatedParticle = member.family_name_particle 
      ? ` ${member.family_name_particle.charAt(0)}.` 
      : '';
    
    return `${member.first_name}${abbreviatedParticle} ${abbreviatedLastName}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold mb-2">Spießify</h1>
              <p className="text-primary-foreground/80">
                Wer hat die meisten Strafen gesammelt?
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {(isOberadmin || isChargierte) && (
                    <Button
                      variant="outline-inverse"
                      onClick={() => navigate('/admin')}
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Admin
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => signOut()}
                    className="text-primary-foreground hover:bg-white/10"
                  >
                    Abmelden
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline-inverse"
                  onClick={() => navigate('/auth')}
                  size="icon"
                  className="flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{loading ? '...' : members.length}</div>
              <div className="text-sm text-muted-foreground">Schützen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Filter className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{loading ? '...' : penaltyStats.totalPenalties}</div>
              <div className="text-sm text-muted-foreground">Strafen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Euro className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">
                {loading ? '...' : `${penaltyStats.totalAmount}€`}
              </div>
              <div className="text-sm text-muted-foreground">Gesamt</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Euro className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">
                {loading ? '...' : `${penaltyStats.penaltiesToday}€`}
              </div>
              <div className="text-sm text-muted-foreground">Heute</div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Rangliste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Laden...</div>
              ) : sortedMembers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">Keine Daten vorhanden</div>
              ) : (
                sortedMembers.map((member, index) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${getPositionClass(index)}`}
                  >
                    <div className="flex items-center gap-4">
                      {getPositionIcon(index)}
                      <div>
                        <div className="font-medium">
                          {getPublicDisplayName(member)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.totalPenalties || 0} Strafen
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        {member.totalAmount || 0}€
                      </div>
                      {(member.totalPenalties || 0) > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          ⌀ {((member.totalAmount || 0) / (member.totalPenalties || 1)).toFixed(1)}€
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Penalties */}
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Strafen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Laden...</div>
              ) : recentPenalties.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">Keine Strafen vorhanden</div>
              ) : (
                <>
                  {recentPenalties.map((penalty) => (
                    <div key={penalty.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {penalty.member ? memberService.getPublicDisplayName(penalty.member) : 'Unbekannt'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {penalty.penalty_type?.name || 'Unbekannt'}
                          </Badge>
                          <span>{formatDateTime(penalty.created_time || penalty.date)}</span>
                        </div>
                        {penalty.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {penalty.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {penalty.amount}€
                      </div>
                    </div>
                  ))}
                  {hasMore && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={loadMorePenalties}
                        disabled={loadingMore}
                      >
                        {loadingMore ? 'Lädt...' : '10 weitere laden'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicDashboard;