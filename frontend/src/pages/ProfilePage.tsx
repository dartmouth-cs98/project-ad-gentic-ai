import { useState, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
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
  Loader2Icon,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { useCompany } from '../contexts/CompanyContext';
import { useUser } from '../contexts/UserContext';

const INVITE_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

const STATIC_TEAM = [
  { name: 'Sarah Chen', email: 'sarah@acme.inc', role: 'Editor', isMe: false },
  { name: 'Mike Ross', email: 'mike@acme.inc', role: 'Viewer', isMe: false },
];

function XIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={11} height={11}>
      <path d="M2 2l8 8M10 2L2 10" />
    </svg>
  );
}

function SignOutModal({
  onConfirm,
  onClose,
  isLoading,
}: {
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const modal = (
    <div className="as-modal-overlay" onClick={() => !isLoading && onClose()}>
      <div
        role="alertdialog"
        aria-labelledby="sign-out-title"
        className="as-modal sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="as-modal-head">
          <div>
            <div className="as-modal-eyebrow">— SESSION</div>
            <div className="as-modal-title" id="sign-out-title">Sign out?</div>
          </div>
          <button type="button" className="as-modal-close" onClick={onClose} disabled={isLoading}>
            <XIcon />
          </button>
        </div>
        <div className="as-modal-body">
          <p style={{ fontSize: 14, color: 'var(--as-ink-2)', lineHeight: 1.55, margin: 0 }}>
            You&apos;ll be returned to the sign-in page.
          </p>
        </div>
        <div className="as-modal-foot">
          <button type="button" className="as-btn-ghost" onClick={onClose} disabled={isLoading} style={{ padding: '8px 16px' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 18px',
              background: isLoading ? 'var(--as-rule)' : 'var(--as-ink)',
              color: isLoading ? 'var(--as-ink-3)' : 'var(--as-bg)',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 13,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading && <Loader2Icon size={13} style={{ animation: 'as-spin 0.8s linear infinite' }} />}
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}

export function ProfilePage() {
  const { profile, updateProfile } = useCompany();
  const { logout } = useUser();
  const navigate = useNavigate();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditForm(profile);
    }
  }, [profile, isEditing]);

  const handleSignOut = () => {
    setSigningOut(true);
    setConfirmOpen(false);
    setTimeout(() => { logout(); navigate('/sign-in'); }, 1000);
  };

  const handleSave = () => {
    updateProfile(editForm);
    setIsEditing(false);
  };

  const handleInvite = (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setShowInviteSuccess(true);
    setInviteEmail('');
    setTimeout(() => setShowInviteSuccess(false), 3000);
  };

  const members = [
    { name: profile.userName, email: profile.email, role: 'Admin', isMe: true },
    ...STATIC_TEAM,
  ];

  return (
    <AppShell pageLabel="PROFILE">
      <div className="as-canvas">
        <div className="as-page-head">
          <div>
            <span className="as-eyebrow">— COMPANY</span>
            <h1>Company Profile</h1>
            <p style={{ fontSize: 14, color: 'var(--as-ink-2)', marginTop: 8 }}>
              Manage your company identity and team members.
            </p>
          </div>
          {!isEditing ? (
            <button
              type="button"
              className="as-btn-solid"
              onClick={() => setIsEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px' }}
            >
              <Edit2Icon size={14} />
              Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="as-btn-ghost"
                onClick={() => { setEditForm(profile); setIsEditing(false); }}
                style={{ padding: '9px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="as-btn-solid"
                onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px' }}
              >
                <CheckIcon size={14} />
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="prf-grid">
          <div className="prf-main">
            {/* Company identity */}
            <div className="stg-section">
              <div className="prf-section-head">
                <div className="prf-section-title">
                  <BuildingIcon size={16} style={{ color: 'var(--as-ink-2)' }} />
                  Company Identity
                </div>
              </div>

              <div className="prf-field-grid">
                <div>
                  <label className="stg-label" htmlFor="prf-company-name">Company Name</label>
                  {isEditing ? (
                    <input
                      id="prf-company-name"
                      className="stg-input"
                      value={editForm.companyName}
                      onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    />
                  ) : (
                    <div className="prf-value">{profile.companyName}</div>
                  )}
                </div>
                <div>
                  <label className="stg-label" htmlFor="prf-industry">Industry</label>
                  {isEditing ? (
                    <input
                      id="prf-industry"
                      className="stg-input"
                      value={editForm.industry}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    />
                  ) : (
                    <div className="prf-value">{profile.industry}</div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label className="stg-label" htmlFor="prf-primary-product">Primary Product</label>
                {isEditing ? (
                  <input
                    id="prf-primary-product"
                    className="stg-input"
                    value={editForm.primaryProduct}
                    onChange={(e) => setEditForm({ ...editForm, primaryProduct: e.target.value })}
                  />
                ) : (
                  <div className="prf-value">{profile.primaryProduct}</div>
                )}
              </div>
            </div>

            {/* Team members */}
            <div className="stg-section">
              <div className="prf-section-head">
                <div className="prf-section-title">
                  <UsersIcon size={16} style={{ color: 'var(--as-ink-2)' }} />
                  Team Members
                </div>
                <span className="prf-member-count">3 Active</span>
              </div>

              <form onSubmit={handleInvite} className="prf-invite-box">
                <h3>Invite New Member</h3>
                <div className="prf-invite-row">
                  <input
                    type="email"
                    className="stg-input"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <select
                    className="as-select"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    style={{ width: 120, flexShrink: 0, padding: '9px 12px' }}
                  >
                    {INVITE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="as-btn-solid"
                    disabled={!inviteEmail}
                    style={{ padding: '9px 16px', whiteSpace: 'nowrap' }}
                  >
                    Send Invite
                  </button>
                </div>
                {showInviteSuccess && (
                  <div className="prf-invite-success">
                    <CheckIcon size={13} />
                    Invitation sent successfully
                  </div>
                )}
              </form>

              <div style={{ border: '1px solid var(--as-rule)' }}>
                <table className="as-table prf-team-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--as-ink)' }}>
                            {member.name}{member.isMe ? ' (You)' : ''}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--as-ink-3)', marginTop: 2 }}>{member.email}</div>
                        </td>
                        <td>
                          <span className={`prf-role-tag${member.role === 'Admin' ? ' admin' : ''}`}>
                            {member.role}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {!member.isMe && (
                            <button
                              type="button"
                              className="cmp-row-btn danger"
                              aria-label={`Remove ${member.name}`}
                            >
                              <TrashIcon size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="prf-side">
            <div className="prf-security">
              <div className="prf-security-head">
                <div className="prf-security-icon">
                  <ShieldIcon size={18} />
                </div>
                <div>
                  <div className="prf-security-title">Enterprise Security</div>
                  <div className="prf-security-sub">Active &amp; Monitored</div>
                </div>
              </div>
              <ul className="prf-security-list">
                <li><CheckIcon size={14} /> SSO Enabled</li>
                <li><CheckIcon size={14} /> 2FA Enforced</li>
                <li><CheckIcon size={14} /> Audit Logs Active</li>
              </ul>
            </div>

            <div className="stg-section" style={{ padding: 16 }}>
              <div className="stg-section-head" style={{ marginBottom: 14 }}>Quick Actions</div>
              <div className="prf-actions">
                <Link to="/settings" className="prf-action-btn">
                  <PackageIcon size={15} />
                  Manage Subscription
                </Link>
                <Link to="/settings" className="prf-action-btn">
                  <BriefcaseIcon size={15} />
                  View Invoices
                </Link>
                <button
                  type="button"
                  className="prf-action-btn danger"
                  onClick={() => setConfirmOpen(true)}
                  disabled={signingOut}
                >
                  <LogOutIcon size={15} className={signingOut ? 'as-spin' : undefined} />
                  {signingOut ? 'Signing out…' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <SignOutModal
          onConfirm={handleSignOut}
          onClose={() => setConfirmOpen(false)}
          isLoading={signingOut}
        />
      )}
    </AppShell>
  );
}
