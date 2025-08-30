import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { Member } from '@/types';
import { memberService } from '@/services/memberService';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [eligibleMembers, setEligibleMembers] = useState<Member[]>([]);
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    rememberMe: true
  });
  
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    memberId: '',
    rememberMe: true
  });

  useEffect(() => {
    if (isAuthenticated && !loading) {
      const returnTo = searchParams.get('returnTo') || '/admin';
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, searchParams]);

  useEffect(() => {
    const loadEligibleMembers = async () => {
      try {
        const members = await authService.getEligibleMembers();
        setEligibleMembers(members);
      } catch (error) {
        console.error('Error loading eligible members:', error);
      }
    };
    
    if (activeTab === 'signup') {
      loadEligibleMembers();
    }
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await signIn(loginForm);
      toast({
        title: "Anmeldung erfolgreich",
        description: "Willkommen zurück!"
      });
    } catch (error: any) {
      console.error('Login error:', error);
      setError(getAuthErrorMessage(error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await authService.resetPassword(resetEmail);
      toast({
        title: "E-Mail gesendet",
        description: "Überprüfen Sie Ihre E-Mail für den Passwort-Reset-Link."
      });
      setShowResetForm(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError('Fehler beim Senden der Reset-E-Mail. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      setSubmitting(false);
      return;
    }

    if (!signupForm.memberId) {
      setError('Bitte wählen Sie Ihr Mitgliedsprofil aus');
      setSubmitting(false);
      return;
    }

    try {
      await signUp({
        email: signupForm.email,
        password: signupForm.password,
        memberId: signupForm.memberId
      });
      
      toast({
        title: "Registrierung erfolgreich",
        description: "Bitte überprüfen Sie Ihre E-Mail zur Bestätigung."
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(getAuthErrorMessage(error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getAuthErrorMessage = (errorMessage: string): string => {
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.';
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'Bitte bestätigen Sie Ihre E-Mail-Adresse.';
    }
    if (errorMessage.includes('User already registered')) {
      return 'Ein Benutzer mit dieser E-Mail-Adresse ist bereits registriert.';
    }
    return 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Rangliste
        </Button>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Spießify</CardTitle>
            <CardDescription className="text-center">
              Chargierte-Zugang zur Strafenverwaltung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Anmelden</TabsTrigger>
                <TabsTrigger value="signup">Registrieren</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ihre.email@beispiel.de"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
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

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={loginForm.rememberMe}
                      onCheckedChange={(checked) => 
                        setLoginForm({ ...loginForm, rememberMe: checked as boolean })
                      }
                    />
                    <Label htmlFor="remember" className="text-sm">
                      Angemeldet bleiben (7 Tage)
                    </Label>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Anmelden...' : 'Anmelden'}
                  </Button>
                  
                  <div className="text-center">
                    <Button
                      variant="link"
                      type="button"
                      onClick={() => setShowResetForm(!showResetForm)}
                      className="text-sm"
                    >
                      Passwort vergessen?
                    </Button>
                  </div>
                </form>

                {showResetForm && (
                  <form onSubmit={handlePasswordReset} className="space-y-4 mt-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail">E-Mail für Passwort-Reset</Label>
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="ihre.email@beispiel.de"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={submitting} className="flex-1">
                        {submitting ? 'Senden...' : 'Reset-Link senden'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowResetForm(false)}
                        className="flex-1"
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail">E-Mail</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="ihre.email@beispiel.de"
                      required
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword">Passwort</Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      required
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberSelect">Mitgliedsprofil</Label>
                    <Select
                      value={signupForm.memberId}
                      onValueChange={(value) => setSignupForm({ ...signupForm, memberId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wählen Sie Ihr Mitgliedsprofil" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Registrieren...' : 'Registrieren'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;