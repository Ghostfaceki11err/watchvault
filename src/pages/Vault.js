import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getVaultItems, updateVaultItemStatus, updateVaultItemType, removeVaultItem, addToVault, clearVault } from "../services/firestoreService";
import { searchMedia } from "../services/tmdbApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import VaultItem from "../components/VaultItem";
import MediaModal from "../components/MediaModal";
import { Filter, Upload, Download, Search, Trash2 } from "lucide-react";

function Vault() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const fileInputRef = useRef(null);

    // Filter/Sort States
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState("date_desc");

    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
            return;
        }

        const fetchItems = async () => {
            const data = await getVaultItems(currentUser.uid);
            setItems(data);
            setLoading(false);
        };

        fetchItems();
    }, [currentUser, navigate]);

    const handleUpdateStatus = async (id, newStatus) => {
        const response = await updateVaultItemStatus(id, newStatus);
        if (response.success) {
            setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item));
            toast.success("Status updated!");
        } else {
            toast.error("Failed to update status.");
        }
    };

    const handleUpdateType = async (id, newType) => {
        const response = await updateVaultItemType(id, newType);
        if (response.success) {
            setItems(items.map(item => item.id === id ? { ...item, type: newType } : item));
            toast.success("Type classification updated!");
        } else {
            toast.error("Failed to update type.");
        }
    };

    const executeRemoveItem = async (toastId, id) => {
        toast.dismiss(toastId);
        const loadingToast = toast.loading("Removing item...");
        const response = await removeVaultItem(id);
        if (response.success) {
            setItems(items.filter(item => item.id !== id));
            toast.success("Item removed from vault.", { id: loadingToast });
        } else {
            toast.error("Failed to remove item.", { id: loadingToast });
        }
    };

    const handleRemove = (id) => {
        toast.custom((t) => (
            <div style={{ 
                background: 'var(--bg-glass)', 
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(248, 113, 113, 0.5)', 
                padding: '20px', 
                borderRadius: '16px', 
                color: 'var(--text-primary)',
                boxShadow: '0 10px 25px -5px rgba(248, 113, 113, 0.15)'
            }}>
                <h3 style={{ marginBottom: '12px', fontSize: '1.1rem', color: '#f87171' }}>Remove Item?</h3>
                <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>Are you sure you want to remove this item from your vault?</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" onClick={() => toast.dismiss(t.id)}>Cancel</button>
                    <button className="btn" style={{ background: '#ef4444' }} onClick={() => executeRemoveItem(t.id, id)}>Remove</button>
                </div>
            </div>
        ), { duration: Infinity, id: `remove-${id}` });
    };

    const executeClearVault = async (toastId) => {
        toast.dismiss(toastId);
        const loadingToast = toast.loading("Clearing vault...");
        const response = await clearVault(currentUser.uid);
        if (response.success) {
            setItems([]);
            toast.success("Vault has been completely cleared.", { id: loadingToast });
        } else {
            toast.error("Failed to clear vault.", { id: loadingToast });
        }
    };

    const handleClearVault = () => {
        if (items.length === 0) return;
        
        toast.custom((t) => (
            <div style={{ 
                background: 'var(--bg-glass)', 
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(248, 113, 113, 0.5)', 
                padding: '24px', 
                borderRadius: '16px', 
                color: 'var(--text-primary)',
                boxShadow: '0 25px 50px -12px rgba(248, 113, 113, 0.25)',
                maxWidth: '400px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#f87171' }}>
                    <Trash2 size={24} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Clear Entire Vault?</h3>
                </div>
                <p style={{ marginBottom: '24px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Are you absolutely sure you want to delete your ENTIRE vault? This action cannot be undone and you will lose all your saved items.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button 
                        className="btn btn-outline" 
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </button>
                    <button 
                        className="btn" 
                        style={{ background: '#ef4444', color: 'white' }} 
                        onClick={() => executeClearVault(t.id)}
                    >
                        Yes, Delete All
                    </button>
                </div>
            </div>
        ), { duration: Infinity, id: 'clear-vault-confirm' });
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (!json.items || !Array.isArray(json.items)) {
                    toast.error("Invalid JSON. Expected 'items' array.");
                    return;
                }

                const itemsToImport = json.items;
                const loadingToast = toast.loading(`Importing 0 / ${itemsToImport.length}...`);
                
                let successCount = 0;
                
                for (let i = 0; i < itemsToImport.length; i++) {
                    const item = itemsToImport[i];
                    if (item.title) {
                        try {
                            const searchResult = await searchMedia(item.title, 1);
                            const topResult = searchResult.results?.filter(r => r.media_type === 'movie' || r.media_type === 'tv')[0];
                            if (topResult) {
                                await addToVault(currentUser.uid, topResult, "Plan to Watch");
                                successCount++;
                            }
                        } catch (err) {
                            console.error("Failed to import", item.title, err);
                        }
                    }
                    toast.loading(`Importing ${i + 1} / ${itemsToImport.length}...`, { id: loadingToast });
                }

                toast.success(`Import complete! Added ${successCount} items.`, { id: loadingToast });
                
                // Refetch items
                setLoading(true);
                const data = await getVaultItems(currentUser.uid);
                setItems(data);
                setLoading(false);
            } catch (error) {
                toast.error("Failed to parse JSON file.");
            }
        };
        reader.readAsText(file);
        event.target.value = null; // Reset input
    };

    const handleExport = () => {
        if (items.length === 0) {
            toast.error("Nothing to export!");
            return;
        }
        const exportData = {
            exportedAt: new Date().toISOString(),
            total: items.length,
            items: items.map(item => ({
                title: item.title,
                type: item.type,
                status: item.status,
                tmdbId: item.tmdbId,
                addedAt: item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : null
            }))
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "WatchVault_Export.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Vault exported successfully!");
    };

    const filteredAndSortedItems = useMemo(() => {
        let result = [...items];

        // Search Query Filter
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            result = result.filter(item => item.title?.toLowerCase().includes(query));
        }

        // Filter Type
        if (filterType !== "all") {
            result = result.filter(item => item.type === filterType);
        }

        // Filter Status
        if (filterStatus !== "all") {
            result = result.filter(item => item.status === filterStatus);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === "title_asc") {
                return a.title.localeCompare(b.title);
            } else if (sortBy === "date_asc") {
                return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
            } else {
                // date_desc
                return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            }
        });

        return result;
    }, [items, searchQuery, filterType, filterStatus, sortBy]);

    if (loading) {
        return <div className="page container" style={{ textAlign: "center" }}>Loading your vault...</div>;
    }

    // Custom tab style
    const getTabStyle = (type) => ({
        padding: '8px 16px',
        borderRadius: '20px',
        border: 'none',
        background: filterType === type ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
        color: filterType === type ? '#fff' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 600,
        transition: 'all 0.2s',
        marginRight: '8px',
        outline: 'none'
    });

    return (
        <div className="page container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <h1 className="page-title" style={{ marginBottom: 0, background: 'linear-gradient(135deg, #ff4b4b 0%, #b81d24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    The Vault
                </h1>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input 
                        type="file" 
                        accept=".json" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileUpload}
                    />
                    <button className="btn btn-outline" onClick={() => fileInputRef.current.click()} style={{ fontSize: '0.9rem', padding: '8px 12px' }}>
                        <Upload size={16} /> Import
                    </button>
                    <button className="btn btn-outline" onClick={handleExport} style={{ fontSize: '0.9rem', padding: '8px 12px' }}>
                        <Download size={16} /> Export
                    </button>
                    <button 
                        className="btn btn-outline" 
                        onClick={handleClearVault} 
                        style={{ fontSize: '0.9rem', padding: '8px 12px', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)' }}
                        disabled={items.length === 0}
                    >
                        <Trash2 size={16} /> Clear Vault
                    </button>
                </div>
            </div>

            {/* Vault Search Bar */}
            <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '400px' }}>
                <input 
                    type="text" 
                    placeholder="Search in your vault..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        paddingLeft: '40px',
                        borderRadius: '8px',
                        border: 'var(--glass-border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontFamily: 'inherit'
                    }}
                />
                <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Modern Tab Navigation */}
            <div style={{ display: 'flex', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                <button style={getTabStyle('all')} onClick={() => setFilterType('all')}>All Collection</button>
                <button style={getTabStyle('movie')} onClick={() => setFilterType('movie')}>Movies</button>
                <button style={getTabStyle('tv')} onClick={() => setFilterType('tv')}>TV Series</button>
                <button style={getTabStyle('anime')} onClick={() => setFilterType('anime')}>Anime</button>
            </div>
            
            {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", background: "var(--bg-secondary)", borderRadius: "12px", border: "var(--glass-border)" }}>
                    <h3 style={{ marginBottom: "16px" }}>Your vault is empty</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>Start searching to add movies and TV shows to your watchlist.</p>
                    <button className="btn" onClick={() => navigate("/")}>Go to Search</button>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: 'var(--glass-border)', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                            <Filter size={18} /> Filters & Sorting:
                        </div>

                        <select className="status-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">All Statuses</option>
                            <option value="Plan to Watch">Plan to Watch</option>
                            <option value="Watching">Watching</option>
                            <option value="Completed">Completed</option>
                        </select>

                        <select className="status-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ marginLeft: 'auto' }}>
                            <option value="date_desc">Newest First</option>
                            <option value="date_asc">Oldest First</option>
                            <option value="title_asc">Alphabetical (A-Z)</option>
                        </select>
                    </div>

                    <div className="vault-list">
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map((item) => (
                                <VaultItem 
                                    key={item.id} 
                                    item={item} 
                                    onUpdateStatus={handleUpdateStatus}
                                    onUpdateType={handleUpdateType}
                                    onRemove={handleRemove}
                                    onClick={() => setSelectedMedia(item)}
                                />
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                {searchQuery ? `No items found matching "${searchQuery}".` : "No items match your current filters."}
                            </div>
                        )}
                    </div>
                </>
            )}

            {selectedMedia && (
                <MediaModal media={selectedMedia} onClose={() => setSelectedMedia(null)} />
            )}
        </div>
    );
}

export default Vault;
