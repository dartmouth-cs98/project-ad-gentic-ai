import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { useSidebar } from '../contexts/SidebarContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { useCompany } from '../contexts/CompanyContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  BuildingIcon,
  BriefcaseIcon,
  PackageIcon,
  Edit2Icon,
  CheckIcon,
  TrashIcon,
  ShieldIcon,
  UsersIcon,
  LogOutIcon,
} from
  'lucide-react';
export function ProfilePage() {
  const { collapsed } = useSidebar();
  const { profile, updateProfile } = useCompany();
  const { logout } = useUser();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    setSigningOut(true);
    setConfirmOpen(false);
    setTimeout(() => { logout(); navigate('/sign-in'); }, 1000);
  };
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);
  const handleSave = () => {
    updateProfile(editForm);
    setIsEditing(false);
  };
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setShowInviteSuccess(true);
    setInviteEmail('');
    setTimeout(() => setShowInviteSuccess(false), 3000);
  };
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className={`${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 flex-1 p-8`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Company Profile
              </h1>
              <p className="text-muted-foreground">
                Manage your company identity and team members.
              </p>
            </div>
            {!isEditing ?
              <Button
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit2Icon className="w-4 h-4" />}>

                Edit Profile
              </Button> :

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditForm(profile);
                    setIsEditing(false);
                  }}>

                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  leftIcon={<CheckIcon className="w-4 h-4" />}>

                  Save Changes
                </Button>
              </div>
            }
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Main Company Info */}
            <div className="col-span-2 space-y-8">
              <Card variant="elevated" padding="lg">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <BuildingIcon className="w-5 h-5 text-blue-500" />
                  Company Identity
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Company Name
                      </label>
                      {isEditing ?
                        <Input
                          value={editForm.companyName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              companyName: e.target.value
                            })
                          } /> :


                        <div className="text-lg font-medium text-foreground py-2">
                          {profile.companyName}
                        </div>
                      }
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Industry
                      </label>
                      {isEditing ?
                        <Input
                          value={editForm.industry}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              industry: e.target.value
                            })
                          } /> :


                        <div className="text-lg font-medium text-foreground py-2">
                          {profile.industry}
                        </div>
                      }
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Primary Product
                    </label>
                    {isEditing ?
                      <Input
                        value={editForm.primaryProduct}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            primaryProduct: e.target.value
                          })
                        } /> :


                      <div className="text-lg font-medium text-foreground py-2">
                        {profile.primaryProduct}
                      </div>
                    }
                  </div>
                </div>
              </Card>

              {/* Team Members */}
              <Card variant="elevated" padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-blue-500" />
                    Team Members
                  </h2>
                  <Badge variant="info">{3} Active Members</Badge>
                </div>

                {/* Invite Form */}
                <form
                  onSubmit={handleInvite}
                  className="bg-background p-4 rounded-xl border border-border mb-8">

                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Invite New Member
                  </h3>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="colleague@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="bg-white" />

                    </div>
                    <div className="w-40">
                      <Select
                        options={[
                          {
                            value: 'admin',
                            label: 'Admin'
                          },
                          {
                            value: 'editor',
                            label: 'Editor'
                          },
                          {
                            value: 'viewer',
                            label: 'Viewer'
                          }]
                        }
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="bg-white" />

                    </div>
                    <Button disabled={!inviteEmail}>Send Invite</Button>
                  </div>
                  {showInviteSuccess &&
                    <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 animate-in fade-in slide-in-from-top-1">
                      <CheckIcon className="w-4 h-4" />
                      Invitation sent successfully!
                    </div>
                  }
                </form>

                {/* Team Table */}
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-background text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        {
                          name: profile.userName,
                          email: profile.email,
                          role: 'Admin',
                          isMe: true
                        },
                        {
                          name: 'Sarah Chen',
                          email: 'sarah@acme.inc',
                          role: 'Editor',
                          isMe: false
                        },
                        {
                          name: 'Mike Ross',
                          email: 'mike@acme.inc',
                          role: 'Viewer',
                          isMe: false
                        }].
                        map((member, i) =>
                          <tr key={i} className="hover:bg-background">
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">
                                {member.name} {member.isMe && '(You)'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {member.email}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  member.role === 'Admin' ? 'info' : 'default'
                                }>

                                {member.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!member.isMe &&
                                <button className="text-muted-foreground hover:text-red-600 transition-colors">
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              }
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <Card
                variant="default"
                padding="md"
                className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-none">

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <ShieldIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Enterprise Security</h3>
                    <p className="text-xs text-white/80">Active & Monitored</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-white/90">
                  <div className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4" /> SSO Enabled
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4" /> 2FA Enforced
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4" /> Audit Logs Active
                  </div>
                </div>
              </Card>

              <Card variant="elevated" padding="md">
                <h3 className="font-semibold text-foreground mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    leftIcon={<PackageIcon className="w-4 h-4" />}>

                    Manage Subscription
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    leftIcon={<BriefcaseIcon className="w-4 h-4" />}>

                    View Invoices
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    leftIcon={<LogOutIcon className={`w-4 h-4 ${signingOut ? 'animate-spin' : ''}`} />}
                    onClick={() => setConfirmOpen(true)}
                    disabled={signingOut}>

                    {signingOut ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {confirmOpen && (
        <ConfirmDialog
          title="Sign out?"
          description="You'll be returned to the sign-in page."
          confirmLabel="Sign out"
          onConfirm={handleSignOut}
          onCancel={() => setConfirmOpen(false)}
          isLoading={signingOut}
        />
      )}
    </div>);

}