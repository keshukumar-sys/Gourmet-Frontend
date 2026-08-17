import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import "./Events.css";
import "./AllEvents.css";

export default function AllUsers() {
  const navigate = useNavigate();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api.get("/users/all")
      .then((res) => {
        if (cancelled) return;
        setUsers(res.data.users || []);
      })
      .catch((err) => {
        if (!cancelled) toast.error(errorMessage(err, "Could not load users"));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const visible = users.filter((u) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [u.name, u.email, u.mobileNumber, u.role]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term));
  });

  const handleDelete = async (row) => {
    if (!window.confirm(`Permanently delete user "${row.name}"? This cannot be undone.`)) return;

    setDeletingId(row._id);
    try {
      const res = await api.delete(`/users/delete/${row._id}`);
      if (res.data.message) {
        setUsers((prev) => prev.filter((u) => u._id !== row._id));
        toast.success("User deleted.");
      } else {
        toast.error(res.data.message || "Could not delete the user");
      }
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the user"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleUserSaved = (updatedUser) => {
    setUsers((prev) => prev.map((u) => u._id === updatedUser._id ? updatedUser : u));
    setEditingUser(null);
  };

  return (
    <div className="sc-page">
      <div className="sc-shell sc-shell--wide sc-fade-in">
        <div className="events-head">
          <div>
            <h1>All Users</h1>
            <p>{users.length} user{users.length === 1 ? "" : "s"} in the system</p>
          </div>

          <div className="allevents-admin-actions">
            <NavLink to="/createUser" className="sc-btn sc-btn--ghost sc-btn--sm">Create user</NavLink>
            <NavLink to="/createAdmin" className="sc-btn sc-btn--ghost sc-btn--sm">Create admin</NavLink>
          </div>
        </div>

        <div className="allevents-controls">
          <div className="sc-field">
            <label htmlFor="ae-search" className="sr-only">Search users</label>
            <input
              id="ae-search"
              type="search"
              placeholder="Search by name, email, role or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="events-grid">
            {[0, 1, 2].map((i) => <div key={i} className="sc-skeleton" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="sc-card sc-empty">
            <h3>No users to show</h3>
            <p>{users.length === 0 ? "No users found in the system." : "Try another search."}</p>
          </div>
        ) : (
          <div className="events-grid">
            {visible.map((row) => (
              <article key={row._id} className="event-card">
                <header className="event-card__head">
                  <h2>{row.name}</h2>
                  <span className={`sc-badge ${row.role === 'admin' ? "sc-badge--success" : ""}`}>
                    {row.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </header>

                <dl className="event-card__facts">
                  <div style={{ gridColumn: '1 / -1' }}><dt>Email</dt><dd style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.email}</dd></div>
                  <div><dt>Mobile</dt><dd>{row.mobileNumber || "—"}</dd></div>
                  <div><dt>Role</dt><dd>{row.role}</dd></div>
                </dl>

                <footer className="event-card__actions" style={{ justifyContent: 'flex-end' }}>
                  <div className="event-card__buttons">
                    <button
                      className="sc-btn sc-btn--ghost sc-btn--sm"
                      onClick={() => setEditingUser(row)}
                    >
                      Edit
                    </button>
                    <button
                      className="sc-btn sc-btn--danger sc-btn--sm"
                      onClick={() => handleDelete(row)}
                      disabled={deletingId === row._id}
                    >
                      {deletingId === row._id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>

      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          onClose={() => setEditingUser(null)} 
          onSaved={handleUserSaved} 
        />
      )}
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [mobileNumber, setMobileNumber] = useState(user.mobileNumber || "");
  const [role, setRole] = useState(user.role || "user");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, email, mobileNumber, role };
      if (password) {
        payload.password = password;
      }
      const res = await api.patch(`/users/patch/${user._id}`, payload);
      toast.success("User updated successfully");
      onSaved(res.data.user || { ...user, ...payload });
    } catch (err) {
      toast.error(errorMessage(err, "Could not update user"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ev-modal" role="dialog" aria-modal="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
      <div className="ev-modal__panel sc-shell" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--sc-surface)', padding: '2rem', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Edit User</h2>
          <button className="sc-btn sc-btn--ghost sc-btn--sm" onClick={onClose} style={{ padding: '0.25rem 0.5rem' }}>×</button>
        </header>

        <form onSubmit={handleSave}>
          <div className="sc-field">
            <label>Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="sc-field" style={{ marginTop: "1rem" }}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="sc-field" style={{ marginTop: "1rem" }}>
            <label>Mobile number</label>
            <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
          </div>

          <div className="sc-field" style={{ marginTop: "1rem" }}>
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--sc-border)' }}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="sc-field" style={{ marginTop: "1rem" }}>
            <label>New Password (optional)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
          </div>

          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button type="button" className="sc-btn sc-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="sc-btn" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
