import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Users, Euro, BarChart3, LogOut, ThumbsDown, Minus, Filter, Clock, Trophy, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SettingsMenu from '@/components/SettingsMenu';
import { penaltyService } from '@/services/penaltyService';
import { memberService } from '@/services/memberService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { Penalty, PENALTY_CATALOG_CATEGORIES } from '@/types';
import { useToast } from '@/hooks/use-toast';
import PenaltyTable from '@/components/PenaltyTable';
import { AddCreditDialog } from '@/components/AddCreditDialog';
import { CheckInStartModal } from '@/components/CheckInStartModal';
import { CheckInActiveScreen } from '@/components/CheckInActiveScreen';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [memberRanking, setMemberRanking] = useState<any[]>([]);
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
  
  // Check-in state
  const [checkInActive, setCheckInActive] = useState(false);
  const [checkInStartModalOpen, setCheckInStartModalOpen] = useState(false);
  const [checkInReferenceTime, setCheckInReferenceTime] = useState('');
  const [checkInOccasion, setCheckInOccasion] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    memberId: '',
    category: 'all',
    date: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin-login');
      return;
    }
    
    // Reset filters on page load for fresh data
    setFilters({
      memberId: '',
      category: 'all',
      date: ''
    });
    
    // Check for active check-in session
    const savedCheckIn = localStorage.getItem('checkInSession');
    if (savedCheckIn) {
      const checkInData = JSON.parse(savedCheckIn);
      setCheckInActive(true);
      setCheckInReferenceTime(checkInData.referenceTime);
      setCheckInOccasion(checkInData.occasion || '');
    }
    
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const [penaltyStats, allPenaltiesData, zugsauData, allMembers, activePenaltyTypes, membersWithStats] = await Promise.all([
        penaltyService.getStats(),
        penaltyService.getAll(),
        penaltyService.getZugsau(),
        memberService.getAll(),
        penaltyCatalogService.getActive(),
        memberService.getMembersWithStats()
      ]);
      
      setStats({
        ...penaltyStats,
        totalMembers: penaltyStats.activeMembers
      });
      setAllPenalties(allPenaltiesData);
      setMembers(allMembers);
      setPenaltyTypes(activePenaltyTypes);
      setZugsau(zugsauData);
      setMemberRanking(membersWithStats.sort((a, b) => b.totalAmount - a.totalAmount));
      
      // Load initial filtered data
      await loadFilteredPenalties(true);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredPenalties = async (reset = false, useFilters = filters) => {
    if (loadingMore && !reset) return;
    
    if (!reset) setLoadingMore(true);
    
    try {
      const offset = reset ? 0 : penalties.length;
      
      // Use passed filters or current filters, with proper sanitization
      const filterOptions = {
        memberId: useFilters.memberId && useFilters.memberId.trim() !== '' ? useFilters.memberId.trim() : undefined,
        categoryFilter: useFilters.category === "all" ? undefined : useFilters.category,
        dateFrom: useFilters.date && useFilters.date.trim() !== '' ? useFilters.date.trim() : undefined,
        dateTo: useFilters.date && useFilters.date.trim() !== '' ? useFilters.date.trim() : undefined
      };
      
      console.log('Loading filtered penalties:', {
        limit: pageSize,
        offset,
        ...filterOptions,
        originalFilters: useFilters
      });
      
      const filteredData = await penaltyService.getFiltered({
        limit: pageSize,
        offset,
        ...filterOptions
      });
      
      console.log('Filtered data received:', filteredData.length, 'items');
      
      if (reset) {
        setPenalties(filteredData);
      } else {
        setPenalties(prev => [...prev, ...filteredData]);
      }
      
      setHasMore(filteredData.length === pageSize);
    } catch (error) {
      console.error('Failed to load filtered penalties:', error);
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
    console.log('Filter change:', key, value);
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    console.log('New filters set:', newFilters);
    
    // Reset pagination when filters change
    setPenalties([]);
    setHasMore(true);
    
    // Apply filter immediately with the new filter values
    setTimeout(() => {
      loadFilteredPenalties(true, newFilters);
    }, 100);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setPenalties([]);
    setHasMore(true);
    setTimeout(() => loadFilteredPenalties(true, filters), 100);
  };

  const clearFilters = () => {
    const emptyFilters = {
      memberId: '',
      category: 'all',
      date: ''
    };
    setFilters(emptyFilters);
    setPenalties([]);
    setHasMore(true);
    setTimeout(() => loadFilteredPenalties(true, emptyFilters), 100);
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

  const handleStartCheckIn = (referenceTime: string, occasion: string) => {
    setCheckInActive(true);
    setCheckInReferenceTime(referenceTime);
    setCheckInOccasion(occasion);
    
    // Save to localStorage to persist across page reloads
    localStorage.setItem('checkInSession', JSON.stringify({
      referenceTime,
      occasion,
      startTime: new Date().toISOString()
    }));
  };

  const handleEndCheckIn = (checkedMembers: any[]) => {
    setCheckInActive(false);
    setCheckInReferenceTime('');
    setCheckInOccasion('');
    
    // Clear localStorage
    localStorage.removeItem('checkInSession');
    
    // Here you could process the checked members data
    // For now, we'll just show a toast
    toast({
      title: "Check-in beendet",
      description: `${checkedMembers.length} Schützen wurden erfasst.`,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('checkInSession'); // Clear check-in session on logout
    navigate('/');
  };

  // Show Check-in Active Screen if check-in is active
  if (checkInActive) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Spieß Dashboard</h1>
                <p className="text-primary-foreground/80">Check-in Modus</p>
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

        <div className="container mx-auto px-4 py-6">
          <CheckInActiveScreen
            referenceTime={checkInReferenceTime}
            occasion={checkInOccasion}
            onEnd={handleEndCheckIn}
          />
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <SettingsMenu />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setCheckInStartModalOpen(true)}
                variant="outline"
                className="h-12 border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Clock className="w-4 h-4 mr-2" />
                Check-in starten
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Strafenverwaltung</CardTitle>
                <CardDescription>
                  Alle Strafen mit Bearbeitungs- und Löschfunktionen
                </CardDescription>
                <div className="text-sm text-muted-foreground mt-1">
                  {allPenalties.length} gesamt, {penalties.length} angezeigt
                </div>
              </div>
            </div>
            
            {/* Compact Filters */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                <div>
                  <Label htmlFor="pageSize" className="text-xs">Einträge</Label>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-8">
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
                  <Label htmlFor="memberFilter" className="text-xs">Mitglied</Label>
                  <Select value={filters.memberId || "all"} onValueChange={(value) => handleFilterChange('memberId', value === "all" ? "" : value)}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Mitglieder</SelectItem>
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
                  <Label htmlFor="categoryFilter" className="text-xs">Kategorie</Label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Alle" />
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
                  <Label htmlFor="date" className="text-xs">Datum</Label>
                  <Input
                    id="date"
                    type="date"
                    className="h-8"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                  />
                </div>
                
                <div>
                  <Button variant="outline" onClick={clearFilters} size="sm" className="h-8 w-full">
                    Zurücksetzen
                  </Button>
                </div>
              </div>
            </div>
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

        {/* Member Ranking Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Schützen Ranking
            </CardTitle>
            <CardDescription>
              Übersicht aller Schützen sortiert nach Strafenbetrag
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Laden...</div>
            ) : (
              <div className="space-y-2">
                 {memberRanking.slice(0, 10).map((member, index) => (
                   <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                         {index + 1}
                       </div>
                       <Avatar className="h-10 w-10">
                         <AvatarImage 
                           src={member.profile_photo} 
                           alt={memberService.getDisplayName(member)} 
                         />
                         <AvatarFallback className="bg-primary/10 text-primary">
                           <User className="h-5 w-5" />
                         </AvatarFallback>
                       </Avatar>
                       <div>
                         <div className="font-medium text-card-foreground">
                           {memberService.getDisplayName(member)}
                         </div>
                       </div>
                     </div>
                     <div className="text-lg font-bold text-primary">
                       {member.totalAmount.toFixed(2)}€
                     </div>
                   </div>
                 ))}
                {memberRanking.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    ... und {memberRanking.length - 10} weitere Schützen
                  </div>
                )}
              </div>
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

      {/* Check-in Start Modal */}
      <CheckInStartModal
        open={checkInStartModalOpen}
        onOpenChange={setCheckInStartModalOpen}
        onStart={handleStartCheckIn}
      />
    </div>
  );
};

export default AdminDashboard;