import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Users, Euro, BarChart3, LogOut, ThumbsDown, Settings } from 'lucide-react';
import { penaltyService } from '@/services/penaltyService';
import { memberService } from '@/services/memberService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { Penalty } from '@/types';
import { useToast } from '@/hooks/use-toast';
import PenaltyTable from '@/components/PenaltyTable';

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
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [penaltyTypes, setPenaltyTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      const [penaltyStats, allPenalties, zugsauData, allMembers, activePenaltyTypes] = await Promise.all([
        penaltyService.getStats(),
        penaltyService.getAll(),
        penaltyService.getZugsau(),
        memberService.getAll(),
        penaltyCatalogService.getActive()
      ]);
      
      setStats({
        ...penaltyStats,
        totalMembers: penaltyStats.activeMembers
      });
      setPenalties(allPenalties);
      setMembers(allMembers);
      setPenaltyTypes(activePenaltyTypes);
      setZugsau(zugsauData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPenalty = async (id: string, updates: Partial<Penalty>) => {
    try {
      await penaltyService.update(id, updates);
      await loadDashboardData();
      toast({
        title: "Strafe aktualisiert",
        description: "Die Strafe wurde erfolgreich aktualisiert.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Strafe konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePenalty = async (id: string) => {
    try {
      await penaltyService.delete(id);
      await loadDashboardData();
      toast({
        title: "Strafe gelöscht",
        description: "Die Strafe wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Strafe konnte nicht gelöscht werden.",
        variant: "destructive",
      });
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
                onClick={() => navigate('/admin/penalty-catalog')}
                className="h-12"
              >
                <Settings className="w-4 h-4 mr-2" />
                Strafenkatalog verwalten
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="h-12"
              >
                Öffentliche Rangliste
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <ThumbsDown className="w-8 h-8 mx-auto text-orange-500 mb-2" />
              {loading ? (
                <>
                  <div className="text-2xl font-bold">...</div>
                  <div className="text-sm text-muted-foreground">Zugsau</div>
                </>
              ) : zugsau ? (
                <>
                  <div className="text-2xl font-bold text-black">
                    {memberService.getDisplayName(zugsau.member)} ({zugsau.totalAmount}€)
                  </div>
                  <div className="text-sm text-muted-foreground">Zugsau</div>
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

        {/* Penalty Management */}
        <Card>
          <CardHeader>
            <CardTitle>Strafenverwaltung</CardTitle>
            <CardDescription>
              Alle Strafen mit Bearbeitungs- und Löschfunktionen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Laden...</div>
            ) : (
              <PenaltyTable
                penalties={penalties}
                onEdit={handleEditPenalty}
                onDelete={handleDeletePenalty}
                members={members}
                penaltyTypes={penaltyTypes}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;