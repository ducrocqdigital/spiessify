import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { memberService } from '@/services/memberService';
import { Member, MEMBER_RANKS, MemberRank } from '@/types';
import { Plus, Edit2, ToggleLeft, ToggleRight, ArrowLeft, Trash2, User } from 'lucide-react';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';

const MemberManagement = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    nickname: '',
    email: '',
    phone: '',
    birth_date: '',
    join_year: '',
    rank: 'schuetze' as MemberRank,
    is_active: true,
    profile_photo: ''
  });

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadMembers();
  }, [navigate]);

  const loadMembers = async () => {
    try {
      const data = await memberService.getAll();
      setMembers(data);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Mitglieder konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      nickname: '',
      email: '',
      phone: '',
      birth_date: '',
      join_year: '',
      rank: 'schuetze',
      is_active: true,
      profile_photo: ''
    });
  };

  const handleAddMember = async () => {
    try {
      const memberData = {
        ...formData,
        join_year: formData.join_year ? parseInt(formData.join_year) : undefined,
        birth_date: formData.birth_date || undefined
      };
      await memberService.create(memberData);
      toast({
        title: "Erfolg",
        description: "Mitglied wurde erfolgreich hinzugefügt.",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadMembers();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Mitglied konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    }
  };

  const handleEditMember = async () => {
    if (!editingMember) return;
    
    try {
      const updateData = {
        ...formData,
        join_year: formData.join_year ? parseInt(formData.join_year) : null,
        birth_date: formData.birth_date || null
      };
      await memberService.update(editingMember.id, updateData);
      toast({
        title: "Erfolg",
        description: "Mitglied wurde erfolgreich aktualisiert.",
      });
      setIsEditDialogOpen(false);
      setEditingMember(null);
      resetForm();
      loadMembers();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Mitglied konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (member: Member) => {
    try {
      await memberService.toggleActive(member.id);
      toast({
        title: "Erfolg",
        description: `${member.first_name} ${member.last_name} wurde ${member.is_active ? 'deaktiviert' : 'aktiviert'}.`,
      });
      loadMembers();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    
    try {
      await memberService.delete(deletingMember.id);
      toast({
        title: "Erfolg",
        description: `${deletingMember.first_name} ${deletingMember.last_name} wurde gelöscht.`,
      });
      setIsDeleteDialogOpen(false);
      setDeletingMember(null);
      loadMembers();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Mitglied konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (member: Member) => {
    setDeletingMember(member);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (member: Member) => {
    setEditingMember(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      nickname: member.nickname || '',
      email: member.email || '',
      phone: member.phone || '',
      birth_date: member.birth_date || '',
      join_year: member.join_year?.toString() || '',
      rank: member.rank || 'schuetze',
      is_active: member.is_active,
      profile_photo: member.profile_photo || ''
    });
    setIsEditDialogOpen(true);
  };

  const handlePhotoUpdated = (memberId: string, photoUrl: string) => {
    setMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, profile_photo: photoUrl }
        : member
    ));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 min-w-0">
          <Button variant="outline" onClick={() => navigate('/admin')} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold truncate">Mitgliederverwaltung</h1>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Neues Mitglied
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neues Mitglied hinzufügen</DialogTitle>
              <DialogDescription>
                Fügen Sie ein neues Mitglied zur Schützengesellschaft hinzu.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-6 py-4">
              {/* Profile Photo Section */}
              <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted/30">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <ProfilePhotoUpload
                  memberId="new"
                  onPhotoUpdated={(photoUrl) => setFormData({...formData, profile_photo: photoUrl})}
                />
              </div>
              
              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Vorname *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nachname *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="nickname">Spitzname</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="rank">Rang</Label>
                <Select value={formData.rank} onValueChange={(value) => setFormData({...formData, rank: value as MemberRank})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEMBER_RANKS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Geburtsdatum</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="join_year">Beitrittsjahr</Label>
                <Input
                  id="join_year"
                  type="number"
                  value={formData.join_year}
                  onChange={(e) => setFormData({...formData, join_year: e.target.value})}
                />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleAddMember} disabled={!formData.first_name || !formData.last_name}>
                Hinzufügen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Mitglieder ({members.length})</CardTitle>
          <CardDescription>
            Verwalten Sie die Mitglieder der Schützengesellschaft
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profilbild</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Rang</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Beitrittsjahr</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className={!member.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={member.profile_photo || undefined} 
                          alt={`${member.first_name} ${member.last_name}`} 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {member.first_name} {member.last_name}
                        </div>
                        {member.nickname && (
                          <div className="text-sm text-muted-foreground">
                            "{member.nickname}"
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {MEMBER_RANKS[member.rank || 'schuetze']}
                      </Badge>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{member.join_year}</TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(member)}
                          className="hover:bg-primary/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(member)}
                          className={member.is_active ? "hover:bg-warning/10" : "hover:bg-success/10"}
                        >
                          {member.is_active ? (
                            <ToggleRight className="h-4 w-4 text-warning" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(member)}
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {members.map((member) => (
              <Card key={member.id} className={`border ${!member.is_active ? "opacity-50" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage 
                        src={member.profile_photo || undefined} 
                        alt={`${member.first_name} ${member.last_name}`} 
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-card-foreground">
                            {member.first_name} {member.last_name}
                          </h3>
                          {member.nickname && (
                            <p className="text-sm text-muted-foreground">"{member.nickname}"</p>
                          )}
                        </div>
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {MEMBER_RANKS[member.rank || 'schuetze']}
                          </Badge>
                          {member.join_year && (
                            <span className="text-xs">Seit {member.join_year}</span>
                          )}
                        </div>
                        {member.email && (
                          <div className="text-xs">{member.email}</div>
                        )}
                        {member.phone && (
                          <div className="text-xs">{member.phone}</div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(member)}
                          className="flex-1 h-8"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(member)}
                          className="h-8 px-2"
                        >
                          {member.is_active ? (
                            <ToggleRight className="h-4 w-4 text-warning" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(member)}
                          className="h-8 px-2 hover:border-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mitglied bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Informationen des Mitglieds.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-6 py-4">
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <Avatar className="h-20 w-20">
                <AvatarImage src={editingMember?.profile_photo} alt={`${editingMember?.first_name} ${editingMember?.last_name}`} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <ProfilePhotoUpload
                memberId={editingMember?.id || ""}
                currentPhotoUrl={editingMember?.profile_photo}
                onPhotoUpdated={(photoUrl) => handlePhotoUpdated(editingMember?.id || "", photoUrl)}
              />
            </div>
            
            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_first_name">Vorname *</Label>
              <Input
                id="edit_first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_last_name">Nachname *</Label>
              <Input
                id="edit_last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_nickname">Spitzname</Label>
              <Input
                id="edit_nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_rank">Rang</Label>
              <Select value={formData.rank} onValueChange={(value) => setFormData({...formData, rank: value as MemberRank})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEMBER_RANKS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_email">E-Mail</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_phone">Telefon</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_birth_date">Geburtsdatum</Label>
              <Input
                id="edit_birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_join_year">Beitrittsjahr</Label>
              <Input
                id="edit_join_year"
                type="number"
                value={formData.join_year}
                onChange={(e) => setFormData({...formData, join_year: e.target.value})}
              />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditMember} disabled={!formData.first_name || !formData.last_name}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitglied löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie <strong>{deletingMember?.first_name} {deletingMember?.last_name}</strong> dauerhaft löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember}>
              <Trash2 className="h-4 w-4 mr-2" />
              Endgültig löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberManagement;