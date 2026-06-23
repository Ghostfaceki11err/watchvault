import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, Search, Sparkles, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

function Navbar() {
    const { currentUser, logout } = useAuth();
    const location = useLocation();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <nav className="navbar">
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link to="/" className="nav-brand">
                        WatchVault
                    </Link>
                    {!isOnline && (
                        <span style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}>
                            Offline Mode
                        </span>
                    )}
                </div>
                <div className="nav-links">
                    <Link 
                        to="/" 
                        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                    >
                        <Search size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        Search
                    </Link>
                    {currentUser ? (
                        <>
                            <Link 
                                to="/vault" 
                                className={`nav-link ${location.pathname === '/vault' ? 'active' : ''}`}
                            >
                                <LayoutDashboard size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                My Vault
                            </Link>
                            <Link 
                                to="/recommendations" 
                                className={`nav-link ${location.pathname === '/recommendations' ? 'active' : ''}`}
                            >
                                <Sparkles size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Discover
                            </Link>
                            <Link 
                                to="/stats" 
                                className={`nav-link ${location.pathname === '/stats' ? 'active' : ''}`}
                            >
                                <BarChart3 size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Stats
                            </Link>
                            <button onClick={logout} className="btn btn-outline" style={{ padding: '6px 12px' }}>
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn" style={{ padding: '6px 16px' }}>
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
