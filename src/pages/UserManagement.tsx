import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, EyeOff, AlertCircle, Plus, Trash2, Shield, Users, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { Member } from '@/types';
import { memberService } from '@/services/memberService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserAccount {
  id: string;
  email: string;
  member: Member;
  is_oberadmin: boolean;
  is_chargierte: boolean;
  created_at: string;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const { userProfile, isOberadmin } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [eligibleMembers, setEligibleMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    memberId: '',
    isOberadmin: false
  });

  useEffect(() => {
    if (!isOberadmin) {
      navigate('/admin');
      return;
    }
    
    loadUsers();
    loadEligibleMembers();
  }, [isOberadmin, navigate]);

  const loadUsers = async () => {
    try {
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          member:members(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails from auth.users
      const userAccounts: UserAccount[] = [];
      
      for (const userRole of userRoles || []) {
        try {
          const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userRole.user_id);
          
          if (!userError && user) {
            userAccounts.push({
              id: userRole.user_id,
              email: user.email || '',
              member: userRole.member,
              is_oberadmin: userRole.is_oberadmin,
              is_chargierte: userRole.member.rank === 'oberleutnant' || userRole.member.rank === 'leutnant' || userRole.member.rank === 'feldwebel',
              created_at: userRole.created_at
            });
          }
        } catch (userError) {
          console.error('Error fetching user details:', userError);
        }
      }
      
      setUsers(userAccounts);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEligibleMembers = async () => {
    try {
      const members = await authService.getEligibleMembers();
      setEligibleMembers(members);
    } catch (error) {
      console.error('Error loading eligible members:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (createForm.password !== createForm.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      setSubmitting(false);
      return;
    }

    if (!createForm.memberId) {
      setError('Bitte wählen Sie ein Mitgliedsprofil aus');
      setSubmitting(false);
      return;
    }

    try {
      // Create user via Supabase Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: createForm.email,
        password: createForm.password,
        email_confirm: true
      });

      if (error) throw error;

      // Link user to member with appropriate role
      await authService.linkUserToMember(data.user.id, createForm.memberId, createForm.isOberadmin);

      toast({
        title: "Benutzer erstellt",
        description: `Account für ${createForm.email} wurde erfolgreich erstellt.`
      });

      setShowCreateDialog(false);
      setCreateForm({
        email: '',
        password: '',
        confirmPassword: '',
        memberId: '',
        isOberadmin: false
      });
      
      loadUsers();
      loadEligibleMembers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'Fehler beim Erstellen des Benutzers');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Benutzer ${email} wirklich löschen?`)) return;

    try {
      // Delete user via Supabase Admin API
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;

      toast({
        title: "Benutzer gelöscht",
        description: `${email} wurde erfolgreich gelöscht.`
      });

      loadUsers();
      loadEligibleMembers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  const handleToggleOberadmin = async (userId: string, currentStatus: boolean) => {
    try {
      await authService.updateUserRole(userId, !currentStatus);
      
      toast({
        title: "Berechtigung aktualisiert",
        description: `Oberadmin-Status wurde ${!currentStatus ? 'aktiviert' : 'deaktiviert'}.`
      });

      loadUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Fehler",
        description: "Berechtigung konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    }
  };

  const getRoleDisplay = (user: UserAccount) => {
    if (user.is_oberadmin) return 'Oberadmin';
    if (user.is_chargierte) return 'Chargierte';
    return 'Schütze';
  };

  const getRoleBadgeVariant = (user: UserAccount) => {
    if (user.is_oberadmin) return 'destructive';
    if (user.is_chargierte) return 'default';
    return 'secondary';
  };

  if (!isOberadmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 min-w-0">
          <Button variant="outline" onClick={() => navigate('/admin')} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold truncate">Nutzerverwaltung</h1>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Neuen Benutzer anlegen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Benutzeraccounts
          </CardTitle>
          <CardDescription>
            Verwalten Sie Zugriffe für Chargierte und Oberadmins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Laden...</div>
          ) : users.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Noch keine Benutzer vorhanden. Erstellen Sie den ersten Account.
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{memberService.getFullName(user.member)}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getRoleBadgeVariant(user)}>
                          {getRoleDisplay(user)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {user.member.rank}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleOberadmin(user.id, user.is_oberadmin)}
                      className={user.is_oberadmin ? 'border-destructive text-destructive' : ''}
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      {user.is_oberadmin ? 'Oberadmin entfernen' : 'Zu Oberadmin machen'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Account für ein Mitglied.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member">Mitgliedsprofil auswählen</Label>
              <Select
                value={createForm.memberId}
                onValueChange={(value) => setCreateForm({ ...createForm, memberId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie ein Profil" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {memberService.getFullName(member)} ({member.rank})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@beispiel.de"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Passwort bestätigen</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={createForm.confirmPassword}
                onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="oberadmin"
                checked={createForm.isOberadmin}
                onChange={(e) => setCreateForm({ ...createForm, isOberadmin: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="oberadmin" className="text-sm">
                Als Oberadmin anlegen
              </Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setCreateForm({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  memberId: '',
                  isOberadmin: false
                });
                setError('');
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleCreateUser} disabled={submitting}>
              {submitting ? 'Erstellen...' : 'Benutzer erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;