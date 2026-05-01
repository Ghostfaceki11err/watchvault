import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, Search } from "lucide-react";

function Navbar() {
    const { currentUser, logout } = useAuth();
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="container">
                <Link to="/" className="nav-brand">
                    WatchVault
                </Link>
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
