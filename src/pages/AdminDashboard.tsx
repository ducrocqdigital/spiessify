import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Users, Euro, BarChart3, LogOut, Crown } from 'lucide-react';
import { penaltyService } from '@/services/penaltyService';
import { memberService } from '@/services/memberService';
import { Penalty, PENALTY_CATEGORIES } from '@/types';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalPenalties: 0,
    totalAmount: 0,
    todayCount: 0,
    activeMembers: 0
  });
  const [zugsau, setZugsau] = useState<{ member: any; totalAmount: number; penaltyCount: number } | null>(null);
  const [recentPenalties, setRecentPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin-login');
      return;
    }
    
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const [penaltyStats, recent, zugsauData] = await Promise.all([
        penaltyService.getStats(),
        penaltyService.getRecent(5),
        penaltyService.getZugsau()
      ]);
      
      setStats({
        ...penaltyStats,
        totalMembers: penaltyStats.activeMembers
      });
      setRecentPenalties(recent);
      setZugsau(zugsauData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Spieß Dashboard</h1>
              <p className="text-primary-foreground/80">Strafen verwalten</p>
            </div>
            <Button
              variant="outline-inverse"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Crown className="w-8 h-8 mx-auto text-warning mb-2" />
              {loading ? (
                <>
                  <div className="text-2xl font-bold">...</div>
                  <div className="text-sm text-muted-foreground">Zugsau</div>
                </>
              ) : zugsau ? (
                <>
                  <div className="text-2xl font-bold text-warning">
                    {memberService.getDisplayName(zugsau.member)}
                  </div>
                  <div className="text-sm text-muted-foreground">Zugsau ({zugsau.totalAmount}€)</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">-</div>
                  <div className="text-sm text-muted-foreground">Zugsau</div>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalPenalties}</div>
              <div className="text-sm text-muted-foreground">Strafen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Euro className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{loading ? '...' : `${stats.totalAmount}€`}</div>
              <div className="text-sm text-muted-foreground">Gesamt</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <PlusCircle className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{loading ? '...' : stats.todayCount}</div>
              <div className="text-sm text-muted-foreground">Heute</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
            <CardDescription>
              Verwalten Sie Strafen mit wenigen Klicks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => navigate('/add-penalty')}
              className="w-full h-16 text-lg bg-gradient-to-r from-primary to-primary-glow"
            >
              <PlusCircle className="w-6 h-6 mr-3" />
              Neue Strafe hinzufügen
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/members')}
                className="h-12"
              >
                <Users className="w-4 h-4 mr-2" />
                Mitglieder verwalten
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="h-12"
              >
                Öffentliche Rangliste
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard?filter=today')}
                className="h-12"
              >
                Heutige Strafen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Penalties */}
        <Card>
          <CardHeader>
            <CardTitle>Neueste Strafen</CardTitle>
            <CardDescription>
              Die letzten hinzugefügten Strafen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-muted-foreground py-4">Laden...</div>
              ) : recentPenalties.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">Keine Strafen vorhanden</div>
              ) : (
                recentPenalties.map((penalty) => (
                  <div key={penalty.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">
                        {penalty.member ? memberService.getDisplayName(penalty.member) : 'Unbekannt'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {PENALTY_CATEGORIES[penalty.category]} • {penalty.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{penalty.amount}€</div>
                      {penalty.notes && (
                        <div className="text-xs text-muted-foreground">{penalty.notes}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;