import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-semibold text-primary font-[var(--font-outfit)]">
          Expenses
        </Link>
        {user && (
          <div className="flex gap-6 text-sm text-text-secondary">
            <Link to="/" className="hover:text-text-primary transition-colors">
              Expenses
            </Link>
            <Link to="/analytics" className="hover:text-text-primary transition-colors">
              Analytics
            </Link>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-text-secondary text-sm">
              {user.username}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-surface-elevated hover:bg-border rounded-md transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex gap-4 text-sm">
            <Link to="/login" className="text-text-secondary hover:text-text-primary transition-colors">
              Login
            </Link>
            <Link to="/register" className="text-primary hover:text-primary-hover transition-colors">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}