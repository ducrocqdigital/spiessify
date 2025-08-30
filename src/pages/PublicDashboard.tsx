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

type FilterType = 'all' | 'today' | 'week' | 'uniform' | 'marsch' | 'sonstiges';

const PublicDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isOberadmin, isChargierte, signOut } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [members, setMembers] = useState<Member[]>([]);
  const [penaltyStats, setPenaltyStats] = useState<{ totalPenalties: number; totalAmount: number; uniqueDays: number }>({ totalPenalties: 0, totalAmount: 0, uniqueDays: 0 });
  const [recentPenalties, setRecentPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [membersData, penaltyStatsData, recentPenaltiesData] = await Promise.all([
        memberService.getMembersWithStatsPublic(), // Use secure public function
        penaltyService.getStatsPublic(), // Use secure public function 
        penaltyService.getRecentPublic(10, 0) // Use secure public function
      ]);
      
      setMembers(membersData);
      setPenaltyStats(penaltyStatsData);
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
    return [...members].sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
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
              <Calendar className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">
                {loading ? '...' : penaltyStats.uniqueDays}
              </div>
              <div className="text-sm text-muted-foreground">Tage</div>
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
                        <div className="font-medium">{memberService.getPublicDisplayName(member)}</div>
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