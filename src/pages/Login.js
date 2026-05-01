import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
    const { loginWithGoogle, loginWithEmail, signupWithEmail, currentUser } = useAuth();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            navigate("/vault");
        }
    }, [currentUser, navigate]);

    const handleGoogleLogin = async () => {
        try {
            setError("");
            setLoading(true);
            await loginWithGoogle();
            navigate("/vault");
        } catch (err) {
            setError("Failed to sign in with Google.");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        try {
            setError("");
            setLoading(true);
            if (isLogin) {
                await loginWithEmail(email, password);
            } else {
                await signupWithEmail(email, password);
            }
            navigate("/vault");
        } catch (err) {
            setError(isLogin ? "Failed to log in. Check your credentials." : "Failed to create account.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container container">
            <div className="login-card">
                <h1 className="login-title">Welcome to WatchVault</h1>
                <p className="login-subtitle">Sign in to manage your watchlist</p>
                
                {error && <div style={{ color: "#f87171", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "6px", marginBottom: "20px", fontSize: "0.9rem" }}>{error}</div>}
                
                <button 
                    className="btn google-btn" 
                    onClick={handleGoogleLogin} 
                    disabled={loading}
                    style={{ marginBottom: "20px" }}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" style={{ width: "18px", height: "18px" }} />
                    Continue with Google
                </button>
                
                <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
                    <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
                    <span style={{ padding: "0 10px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>OR</span>
                    <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
                </div>

                <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: "12px", borderRadius: "8px", border: "var(--glass-border)", background: "rgba(0,0,0,0.2)", color: "white", outline: "none", fontFamily: "inherit" }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: "12px", borderRadius: "8px", border: "var(--glass-border)", background: "rgba(0,0,0,0.2)", color: "white", outline: "none", fontFamily: "inherit" }}
                    />
                    <button type="submit" className="btn" disabled={loading} style={{ marginTop: "8px" }}>
                        {isLogin ? "Log In" : "Sign Up"}
                    </button>
                </form>

                <p style={{ marginTop: "24px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        onClick={() => setIsLogin(!isLogin)} 
                        style={{ background: "none", border: "none", color: "var(--accent-primary)", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}
                    >
                        {isLogin ? "Sign Up" : "Log In"}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Login;
