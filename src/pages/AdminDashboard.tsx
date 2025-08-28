import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Users, Euro, BarChart3, LogOut, ThumbsDown, Settings, Minus, Filter } from 'lucide-react';
import { penaltyService } from '@/services/penaltyService';
import { memberService } from '@/services/memberService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { Penalty, PENALTY_CATALOG_CATEGORIES } from '@/types';
import { useToast } from '@/hooks/use-toast';
import PenaltyTable from '@/components/PenaltyTable';
import { AddCreditDialog } from '@/components/AddCreditDialog';

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
  const [allPenalties, setAllPenalties] = useState<Penalty[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [penaltyTypes, setPenaltyTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    memberId: '',
    category: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
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
      const [penaltyStats, allPenaltiesData, zugsauData, allMembers, activePenaltyTypes] = await Promise.all([
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
      setAllPenalties(allPenaltiesData);
      setMembers(allMembers);
      setPenaltyTypes(activePenaltyTypes);
      setZugsau(zugsauData);
      
      // Load initial filtered data
      await loadFilteredPenalties(true);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredPenalties = async (reset = false) => {
    if (loadingMore && !reset) return;
    
    if (!reset) setLoadingMore(true);
    
    try {
      const offset = reset ? 0 : penalties.length;
      const filteredData = await penaltyService.getFiltered({
        limit: pageSize,
        offset,
        memberId: filters.memberId || undefined,
        categoryFilter: filters.category,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined
      });
      
      if (reset) {
        setPenalties(filteredData);
      } else {
        setPenalties(prev => [...prev, ...filteredData]);
      }
      
      setHasMore(filteredData.length === pageSize);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Strafen konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      if (!reset) setLoadingMore(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadFilteredPenalties(true);
  };

  const clearFilters = () => {
    setFilters({
      memberId: '',
      category: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setTimeout(() => loadFilteredPenalties(true), 0);
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

  const loadMorePenalties = () => {
    if (hasMore && !loadingMore) {
      loadFilteredPenalties(false);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate('/add-penalty')}
                className="h-16 text-lg bg-gradient-to-r from-primary to-primary-glow"
              >
                <PlusCircle className="w-6 h-6 mr-3" />
                Neue Strafe hinzufügen
              </Button>
              <Button
                onClick={() => setCreditDialogOpen(true)}
                variant="outline"
                className="h-16 text-lg border-2 border-green-500 text-green-600 hover:bg-green-50"
              >
                <Minus className="w-6 h-6 mr-3" />
                Gutschrift hinzufügen
              </Button>
            </div>
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Einstellungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
              <div>
                <Label htmlFor="pageSize">Einträge pro Seite</Label>
                <Select value={pageSize.toString()} onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setTimeout(() => loadFilteredPenalties(true), 0);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="40">40</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="memberFilter">Mitglied</Label>
                <Select value={filters.memberId} onValueChange={(value) => handleFilterChange('memberId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Mitglieder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Mitglieder</SelectItem>
                    {members
                      .filter(member => member.is_active)
                      .map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {memberService.getDisplayName(member)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="categoryFilter">Kategorie</Label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Kategorien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {Object.entries(PENALTY_CATALOG_CATEGORIES).map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dateFrom">Von Datum</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="dateTo">Bis Datum</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
              
              <div className="flex items-end gap-2">
                <Button onClick={applyFilters} className="flex-1">
                  Anwenden
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Zurücksetzen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Penalty Management */}
        <Card>
          <CardHeader>
            <CardTitle>Strafenverwaltung ({allPenalties.length} gesamt, {penalties.length} angezeigt)</CardTitle>
            <CardDescription>
              Alle Strafen mit Bearbeitungs- und Löschfunktionen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Laden...</div>
            ) : (
              <>
                <PenaltyTable
                  penalties={penalties}
                  onEdit={handleEditPenalty}
                  onDelete={handleDeletePenalty}
                  members={members}
                  penaltyTypes={penaltyTypes}
                />
                {hasMore && (
                  <div className="mt-6 text-center">
                    <Button 
                      variant="outline" 
                      onClick={loadMorePenalties}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Laden...' : `${pageSize} weitere laden`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Credit Dialog */}
      <AddCreditDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        members={members}
        penaltyTypes={penaltyTypes}
        onCreditAdded={loadDashboardData}
      />
    </div>
  );
};

export default AdminDashboard;