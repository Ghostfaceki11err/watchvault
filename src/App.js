import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Vault from "./pages/Vault";
import Login from "./pages/Login";

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Toaster 
                        position="bottom-right" 
                        toastOptions={{
                            style: {
                                background: '#1a0000',
                                color: '#f8fafc',
                                border: '1px solid rgba(229, 9, 20, 0.3)'
                            }
                        }} 
                    />
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/vault" element={<Vault />} />
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;