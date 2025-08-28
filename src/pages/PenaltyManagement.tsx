import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { penaltyService } from '@/services/penaltyService';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { memberService } from '@/services/memberService';
import { Penalty, Member, PenaltyCatalog, PENALTY_CATALOG_CATEGORIES } from '@/types';
import { Plus, Edit2, ArrowLeft, Trash2, Euro, Settings, Filter, Calendar, Users } from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';

const PenaltyManagement = () => {
  const navigate = useNavigate();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [allPenalties, setAllPenalties] = useState<Penalty[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [penaltyTypes, setPenaltyTypes] = useState<PenaltyCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  
  // Filters
  const [filters, setFilters] = useState({
    memberId: '',
    category: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState<Penalty | null>(null);
  const [deletingPenalty, setDeletingPenalty] = useState<Penalty | null>(null);
  const [formData, setFormData] = useState({
    member_id: '',
    penalty_type_id: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [allPenaltiesData, membersData, penaltyTypesData] = await Promise.all([
        penaltyService.getAll(),
        memberService.getAll(),
        penaltyCatalogService.getActive()
      ]);
      setAllPenalties(allPenaltiesData);
      setMembers(membersData);
      setPenaltyTypes(penaltyTypesData);
      
      // Load initial filtered data
      await loadFilteredPenalties(true);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden.",
        variant: "destructive",
      });
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

  const resetForm = () => {
    setFormData({
      member_id: '',
      penalty_type_id: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handlePenaltyTypeChange = (penaltyTypeId: string) => {
    const penaltyType = penaltyTypes.find(pt => pt.id === penaltyTypeId);
    setFormData({
      ...formData,
      penalty_type_id: penaltyTypeId,
      amount: penaltyType?.amount || 0
    });
  };

  const handleAddPenalty = async () => {
    try {
      await penaltyService.create(formData);
      toast({
        title: "Erfolg",
        description: "Strafe wurde erfolgreich hinzugefügt.",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Strafe konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    }
  };

  const handleEditPenalty = async () => {
    if (!editingPenalty) return;
    
    try {
      await penaltyService.update(editingPenalty.id, formData);
      toast({
        title: "Erfolg",
        description: "Strafe wurde erfolgreich aktualisiert.",
      });
      setIsEditDialogOpen(false);
      setEditingPenalty(null);
      resetForm();
      loadData();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Strafe konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePenalty = async () => {
    if (!deletingPenalty) return;
    
    try {
      await penaltyService.delete(deletingPenalty.id);
      toast({
        title: "Erfolg",
        description: "Strafe wurde gelöscht.",
      });
      setIsDeleteDialogOpen(false);
      setDeletingPenalty(null);
      loadData();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Strafe konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (penalty: Penalty) => {
    setDeletingPenalty(penalty);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (penalty: Penalty) => {
    setEditingPenalty(penalty);
    setFormData({
      member_id: penalty.member_id,
      penalty_type_id: penalty.penalty_type_id,
      amount: penalty.amount,
      date: penalty.date,
      notes: penalty.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const getMemberDisplayName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? memberService.getDisplayName(member) : 'Unbekannt';
  };

  const getPenaltyTypeName = (penaltyTypeId: string) => {
    const penaltyType = penaltyTypes.find(pt => pt.id === penaltyTypeId);
    return penaltyType?.name || 'Unbekannt';
  };

  const getPenaltyTypeCategory = (penaltyTypeId: string) => {
    const penaltyType = penaltyTypes.find(pt => pt.id === penaltyTypeId);
    return penaltyType?.category || 'sonstiges';
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  const getCategoryBadgeVariant = (category: string) => {
    const variants: Record<string, any> = {
      timing: 'default',
      soziales: 'secondary', 
      abnahme: 'outline',
      maschieren: 'destructive',
      sonstiges: 'default'
    };
    return variants[category] || 'default';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Strafenverwaltung</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/penalty-catalog')}>
            <Settings className="h-4 w-4 mr-2" />
            Strafenkatalog verwalten
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Strafe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Neue Strafe hinzufügen</DialogTitle>
                <DialogDescription>
                  Fügen Sie eine neue Strafe für ein Mitglied hinzu.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="member_id">Mitglied *</Label>
                  <Select value={formData.member_id} onValueChange={(value) => setFormData({...formData, member_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mitglied auswählen" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="penalty_type_id">Strafart *</Label>
                  <Select value={formData.penalty_type_id} onValueChange={handlePenaltyTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Strafart auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PENALTY_CATALOG_CATEGORIES).map(([categoryKey, categoryName]) => (
                        <div key={categoryKey}>
                          <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                            {categoryName}
                          </div>
                          {penaltyTypes
                            .filter(pt => pt.category === categoryKey)
                            .map((penaltyType) => (
                              <SelectItem key={penaltyType.id} value={penaltyType.id}>
                                {penaltyType.name} ({penaltyType.amount.toFixed(2)}€)
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Betrag (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notizen</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Zusätzliche Informationen..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleAddPenalty} disabled={!formData.member_id || !formData.penalty_type_id}>
                  Hinzufügen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Strafen ({allPenalties.length} gesamt, {penalties.length} angezeigt)</CardTitle>
          <CardDescription>
            Verwalten Sie die Strafen der Schützengesellschaft
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mitglied</TableHead>
                <TableHead>Strafart</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Datum & Zeit</TableHead>
                <TableHead>Notizen</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {penalties.map((penalty) => (
                <TableRow key={penalty.id}>
                  <TableCell>
                    <div className="font-medium">
                      {getMemberDisplayName(penalty.member_id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{getPenaltyTypeName(penalty.penalty_type_id)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCategoryBadgeVariant(getPenaltyTypeCategory(penalty.penalty_type_id))}>
                      {PENALTY_CATALOG_CATEGORIES[getPenaltyTypeCategory(penalty.penalty_type_id) as keyof typeof PENALTY_CATALOG_CATEGORIES]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{penalty.amount}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(penalty.created_time || penalty.date)}</TableCell>
                  <TableCell>
                    <div className="max-w-32 truncate text-sm text-muted-foreground">
                      {penalty.notes || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(penalty)}
                        className="hover:bg-primary/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(penalty)}
                        className="hover:bg-destructive/10 hover:border-destructive/20"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {hasMore && (
            <div className="text-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => loadFilteredPenalties(false)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Lädt...' : `${pageSize} weitere laden`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Strafe bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Informationen der Strafe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit_member_id">Mitglied *</Label>
              <Select value={formData.member_id} onValueChange={(value) => setFormData({...formData, member_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Mitglied auswählen" />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="edit_penalty_type_id">Strafart *</Label>
              <Select value={formData.penalty_type_id} onValueChange={handlePenaltyTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Strafart auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PENALTY_CATALOG_CATEGORIES).map(([categoryKey, categoryName]) => (
                    <div key={categoryKey}>
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                        {categoryName}
                      </div>
                      {penaltyTypes
                        .filter(pt => pt.category === categoryKey)
                        .map((penaltyType) => (
                          <SelectItem key={penaltyType.id} value={penaltyType.id}>
                            {penaltyType.name} ({penaltyType.amount.toFixed(2)}€)
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_amount">Betrag (€) *</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="edit_date">Datum *</Label>
              <Input
                id="edit_date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_notes">Notizen</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Zusätzliche Informationen..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditPenalty} disabled={!formData.member_id || !formData.penalty_type_id}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Strafe löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie diese Strafe löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          {deletingPenalty && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <p><strong>Mitglied:</strong> {getMemberDisplayName(deletingPenalty.member_id)}</p>
              <p><strong>Strafart:</strong> {getPenaltyTypeName(deletingPenalty.penalty_type_id)}</p>
              <p><strong>Betrag:</strong> {deletingPenalty.amount}€</p>
              <p><strong>Datum:</strong> {formatDate(deletingPenalty.date)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDeletePenalty}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PenaltyManagement;