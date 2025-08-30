import { useState, useEffect } from 'react';
import { Penalty } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, MapPin, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDateTime } from '@/utils/dateUtils';
import { memberService } from '@/services/memberService';
import { userService } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';

interface PenaltyTableProps {
  penalties: Penalty[];
  onEdit: (id: string, updates: Partial<Penalty>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  members?: any[];
  penaltyTypes?: any[];
  showAssignedBy?: boolean;
}

const PenaltyTable = ({ penalties, onEdit, onDelete, members = [], penaltyTypes = [], showAssignedBy = false }: PenaltyTableProps) => {
  const { isOberadmin, isChargierte } = useAuth();
  const [editDialog, setEditDialog] = useState<{ penalty: Penalty | null; open: boolean }>({ penalty: null, open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ penalty: Penalty | null; open: boolean }>({ penalty: null, open: false });
  const [editForm, setEditForm] = useState({
    member_id: '',
    penalty_type_id: '',
    amount: 0,
    notes: '',
    date: ''
  });

  const openEditDialog = (penalty: Penalty) => {
    setEditForm({
      member_id: penalty.member_id,
      penalty_type_id: penalty.penalty_type_id,
      amount: penalty.amount,
      notes: penalty.notes || '',
      date: penalty.date
    });
    setEditDialog({ penalty, open: true });
  };

  const openDeleteDialog = (penalty: Penalty) => {
    setDeleteDialog({ penalty, open: true });
  };

  const handleEdit = async () => {
    if (!editDialog.penalty) return;
    
    await onEdit(editDialog.penalty.id, editForm);
    setEditDialog({ penalty: null, open: false });
  };

  const handleDelete = async () => {
    if (!deleteDialog.penalty) return;
    
    await onDelete(deleteDialog.penalty.id);
    setDeleteDialog({ penalty: null, open: false });
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'timing': return 'destructive';
      case 'soziales': return 'secondary';
      case 'abnahme': return 'outline';
      case 'maschieren': return 'default';
      case 'sonstiges': return 'default';
      default: return 'default';
    }
  };

  const handlePenaltyTypeChange = (value: string) => {
    const penaltyType = penaltyTypes.find(pt => pt.id === value);
    setEditForm(prev => ({
      ...prev,
      penalty_type_id: value,
      amount: penaltyType?.amount || prev.amount
    }));
  };

  return (
    <>
      <div className="space-y-3">
        {penalties.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Keine Strafen vorhanden</div>
        ) : (
          penalties.map((penalty) => (
            <div key={penalty.id} className="border border-border rounded-lg p-3 bg-card hover:shadow-md transition-shadow">
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage 
                        src={penalty.member?.profile_photo} 
                        alt={penalty.member ? memberService.getDisplayName(penalty.member) : 'Unbekannt'} 
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {penalty.member ? memberService.getDisplayName(penalty.member) : 'Unbekannt'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(penalty.created_time || penalty.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-primary">{penalty.amount}€</div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(penalty)}
                        className="h-6 w-6 p-0"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(penalty)}
                        className="h-6 w-6 p-0 hover:border-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getCategoryBadgeVariant(penalty.penalty_type?.category || '')} className="text-xs">
                      {penalty.penalty_type?.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {penalty.penalty_type?.name}
                    </span>
                    {penalty.location_latitude && penalty.location_longitude && (
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {penalty.notes && (
                  <div className="text-xs bg-muted p-1.5 rounded text-muted-foreground mt-2 truncate">
                    {penalty.notes}
                  </div>
                )}
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden md:flex items-start gap-4">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage 
                    src={penalty.member?.profile_photo} 
                    alt={penalty.member ? memberService.getDisplayName(penalty.member) : 'Unbekannt'} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-card-foreground">
                        {penalty.member ? memberService.getDisplayName(penalty.member) : 'Unbekannt'}
                      </h4>
                      <Badge variant={getCategoryBadgeVariant(penalty.penalty_type?.category || '')}>
                        {penalty.penalty_type?.category || 'Unbekannt'}
                      </Badge>
                    </div>
                    <div className="text-lg font-bold text-primary">{penalty.amount}€</div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="font-medium text-card-foreground">
                      {penalty.penalty_type?.name || 'Unbekannt'}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span>{formatDateTime(penalty.created_time || penalty.created_at)}</span>
                      {penalty.location_latitude && penalty.location_longitude && (
                        <MapPin className="w-3 h-3" />
                      )}
                    </div>
                    {penalty.notes && (
                      <div className="text-xs bg-muted p-2 rounded text-muted-foreground">
                        {penalty.notes}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(penalty)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(penalty)}
                    className="h-8 w-8 p-0 hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Strafe bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie die Details der Strafe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mitglied</Label>
              <Select value={editForm.member_id} onValueChange={(value) => setEditForm(prev => ({ ...prev, member_id: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {memberService.getDisplayName(member)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Strafart</Label>
              <Select value={editForm.penalty_type_id} onValueChange={handlePenaltyTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {penaltyTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.amount}€)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Betrag (€)</Label>
              <Input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Datum</Label>
              <Input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notizen</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Zusätzliche Notizen..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ penalty: null, open: false })}>
              Abbrechen
            </Button>
            <Button onClick={handleEdit}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Strafe löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie diese Strafe löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ penalty: null, open: false })}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Component to display who assigned the penalty
const AssignedByCell = ({ penalty }: { penalty: Penalty }) => {
  const [assignedBy, setAssignedBy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedBy = async () => {
      if (penalty.assigned_by_user_id) {
        try {
          const userData = await userService.getAssignedByInfo(penalty);
          setAssignedBy(userData);
        } catch (error) {
          console.error('Error fetching assigned-by info:', error);
        }
      }
      setLoading(false);
    };

    fetchAssignedBy();
  }, [penalty.assigned_by_user_id]);

  if (loading) {
    return <span className="text-xs text-muted-foreground">Laden...</span>;
  }

  if (!assignedBy) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <span className="text-xs text-muted-foreground">
      {memberService.getDisplayName(assignedBy)}
    </span>
  );
};

export default PenaltyTable;