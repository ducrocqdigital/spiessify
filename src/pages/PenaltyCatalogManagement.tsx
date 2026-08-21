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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { penaltyCatalogService } from '@/services/penaltyCatalogService';
import { PenaltyCatalog, PENALTY_CATALOG_CATEGORIES, PenaltyCatalogCategory } from '@/types';
import { Plus, Edit2, ArrowLeft, Trash2, Euro } from 'lucide-react';

const PenaltyCatalogManagement = () => {
  const navigate = useNavigate();
  const [penaltyTypes, setPenaltyTypes] = useState<PenaltyCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPenaltyType, setEditingPenaltyType] = useState<PenaltyCatalog | null>(null);
  const [deletingPenaltyType, setDeletingPenaltyType] = useState<PenaltyCatalog | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'timing' as PenaltyCatalogCategory,
    amount: 0,
    description: '',
    has_multiplier: false
  });

  useEffect(() => {
    loadPenaltyTypes();
  }, []);

  const loadPenaltyTypes = async () => {
    try {
      const data = await penaltyCatalogService.getAll();
      setPenaltyTypes(data);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Strafenkatalog konnte nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'timing' as PenaltyCatalogCategory,
      amount: 0,
      description: '',
      has_multiplier: false
    });
  };

  const handleAddPenaltyType = async () => {
    try {
      await penaltyCatalogService.create(formData);
      toast({
        title: "Erfolg",
        description: "Strafart wurde erfolgreich hinzugefügt.",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadPenaltyTypes();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Strafart konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    }
  };

  const handleEditPenaltyType = async () => {
    if (!editingPenaltyType) return;
    
    try {
      await penaltyCatalogService.update(editingPenaltyType.id, formData);
      toast({
        title: "Erfolg",
        description: "Strafart wurde erfolgreich aktualisiert.",
      });
      setIsEditDialogOpen(false);
      setEditingPenaltyType(null);
      resetForm();
      loadPenaltyTypes();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Strafart konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };


  const handleDeletePenaltyType = async () => {
    if (!deletingPenaltyType) return;
    
    try {
      await penaltyCatalogService.hardDelete(deletingPenaltyType.id);
      toast({
        title: "Erfolg",
        description: `${deletingPenaltyType.name} wurde gelöscht.`,
      });
      setIsDeleteDialogOpen(false);
      setDeletingPenaltyType(null);
      loadPenaltyTypes();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Strafart konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (penaltyType: PenaltyCatalog) => {
    setDeletingPenaltyType(penaltyType);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (penaltyType: PenaltyCatalog) => {
    setEditingPenaltyType(penaltyType);
    setFormData({
      name: penaltyType.name,
      category: penaltyType.category,
      amount: penaltyType.amount,
      description: penaltyType.description || '',
      has_multiplier: penaltyType.has_multiplier
    });
    setIsEditDialogOpen(true);
  };

  const getCategoryBadgeVariant = (category: PenaltyCatalogCategory) => {
    const variants = {
      timing: 'default',
      soziales: 'secondary', 
      abnahme: 'outline',
      maschieren: 'destructive',
      sonstiges: 'default'
    };
    return variants[category] as any;
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
          <h1 className="text-3xl font-bold">Strafenkatalog verwalten</h1>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Strafart
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Strafart hinzufügen</DialogTitle>
              <DialogDescription>
                Fügen Sie eine neue Strafart zum Katalog hinzu.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="z.B. Zu spät erschienen"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategorie *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value as PenaltyCatalogCategory})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PENALTY_CATALOG_CATEGORIES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
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
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Zusätzliche Informationen zur Strafart..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_multiplier"
                  checked={formData.has_multiplier}
                  onCheckedChange={(checked) => setFormData({...formData, has_multiplier: !!checked})}
                />
                <Label htmlFor="has_multiplier" className="text-sm font-normal">
                  Multiplikator verwenden (z.B. für minutenbasierte Strafen)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleAddPenaltyType} disabled={!formData.name || formData.amount < 0}>
                Hinzufügen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strafenkatalog ({penaltyTypes.length})</CardTitle>
          <CardDescription>
            Verwalten Sie die verschiedenen Strafarten nach Kategorien
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {penaltyTypes.map((penaltyType) => (
                <TableRow key={penaltyType.id}>
                  <TableCell>
                    <div className="font-medium">{penaltyType.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCategoryBadgeVariant(penaltyType.category)}>
                      {PENALTY_CATALOG_CATEGORIES[penaltyType.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{penaltyType.amount.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48 truncate text-sm text-muted-foreground">
                      {penaltyType.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(penaltyType)}
                        className="hover:bg-primary/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(penaltyType)}
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Strafart bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Informationen der Strafart.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit_name">Name *</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="z.B. Zu spät erschienen"
              />
            </div>
            <div>
              <Label htmlFor="edit_category">Kategorie *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value as PenaltyCatalogCategory})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PENALTY_CATALOG_CATEGORIES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
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
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="edit_description">Beschreibung</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Zusätzliche Informationen zur Strafart..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_has_multiplier"
                checked={formData.has_multiplier}
                onCheckedChange={(checked) => setFormData({...formData, has_multiplier: !!checked})}
              />
              <Label htmlFor="edit_has_multiplier" className="text-sm font-normal">
                Multiplikator verwenden (z.B. für minutenbasierte Strafen)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditPenaltyType} disabled={!formData.name || formData.amount < 0}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Strafart löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie diese Strafart endgültig löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          {deletingPenaltyType && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <p><strong>Name:</strong> {deletingPenaltyType.name}</p>
              <p><strong>Kategorie:</strong> {PENALTY_CATALOG_CATEGORIES[deletingPenaltyType.category]}</p>
              <p><strong>Betrag:</strong> {deletingPenaltyType.amount.toFixed(2)}€</p>
              {deletingPenaltyType.description && (
                <p><strong>Beschreibung:</strong> {deletingPenaltyType.description}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDeletePenaltyType}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PenaltyCatalogManagement;