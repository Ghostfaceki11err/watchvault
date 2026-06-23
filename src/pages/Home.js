import { useState, useEffect, lazy, Suspense } from "react";
import { searchMedia, getTrending } from "../services/tmdbApi";
import { addToVault, getVaultItems } from "../services/firestoreService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SearchBar from "../components/SearchBar";
import MediaCard from "../components/MediaCard";
import { ArrowLeft } from "lucide-react";

const MediaModal = lazy(() => import("../components/MediaModal"));

function Home() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [currentQuery, setCurrentQuery] = useState("");
    const [hasMore, setHasMore] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [isTrending, setIsTrending] = useState(true);
    const [vaultIds, setVaultIds] = useState(new Set());

    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadTrending();
    }, []);

    useEffect(() => {
        if (currentUser) {
            getVaultItems(currentUser.uid).then(data => {
                setVaultIds(new Set(data.map(item => item.tmdbId)));
            });
        }
    }, [currentUser]);

    const loadTrending = async () => {
        setLoading(true);
        setIsTrending(true);
        try {
            const data = await getTrending(1);
            const filteredData = data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
            setResults(filteredData);
            setPage(1);
            setHasMore(data.page < data.total_pages);
        } catch (err) {
            setError("Failed to fetch trending media.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        if (!query) {
            loadTrending();
            return;
        }
        setLoading(true);
        setError(null);
        setCurrentQuery(query);
        setIsTrending(false);
        try {
            const data = await searchMedia(query, 1);
            const filteredData = data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
            setResults(filteredData);
            setPage(1);
            setHasMore(data.page < data.total_pages);
        } catch (err) {
            setError("Failed to fetch search results.");
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        const nextPage = page + 1;
        try {
            let data;
            if (isTrending) {
                data = await getTrending(nextPage);
            } else {
                data = await searchMedia(currentQuery, nextPage);
            }
            const filteredData = data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
            setResults([...results, ...filteredData]);
            setPage(nextPage);
            setHasMore(data.page < data.total_pages);
        } catch (err) {
            toast.error("Failed to load more results.");
        }
    };

    const handleAddToVault = async (item) => {
        if (!currentUser) {
            navigate("/login");
            return;
        }

        if (vaultIds.has(item.id)) {
            toast.error("This item is already in your vault!");
            return;
        }

        const title = item.title || item.name;
        const loadingToast = toast.loading(`Adding ${title}...`);
        
        const response = await addToVault(currentUser.uid, item);
        if (response.success) {
            setVaultIds(prev => new Set(prev).add(item.id));
            toast.success(`${title} added to your vault!`, { id: loadingToast });
        } else {
            toast.error("Failed to add to vault. Please try again.", { id: loadingToast });
        }
    };


    return (
        <div className="page container">
            <h1 className="page-title" style={{ textAlign: "center" }}>Discover & Vault</h1>
            <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "40px" }}>
                Search for your favorite movies, TV series, or anime and save them for later.
            </p>
            
            <SearchBar query={currentQuery} setQuery={setCurrentQuery} onSearch={handleSearch} />

            {!isTrending && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                    <button 
                        className="btn btn-outline" 
                        onClick={() => {
                            setCurrentQuery("");
                            loadTrending();
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', fontSize: '0.9rem' }}
                    >
                        <ArrowLeft size={16} /> Back to Trending
                    </button>
                </div>
            )}

            {isTrending && !loading && !error && (
                <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: 600 }}> Trending This Week</h2>
            )}

            {!isTrending && !loading && !error && results.length > 0 && (
                <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: 600 }}>Search Results for "{currentQuery}"</h2>
            )}

            {loading && page === 1 && (
                <>
                    <style>{`
                        @keyframes skeletonPulse {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                    `}</style>
                    <div className="media-grid" style={{ marginBottom: '40px' }}>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="skeleton-card" style={{
                                borderRadius: '12px',
                                aspectRatio: '2 / 3',
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'skeletonPulse 1.5s infinite linear',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}></div>
                        ))}
                    </div>
                </>
            )}
            {error && <div style={{ color: "#f87171", textAlign: "center" }}>{error}</div>}

            {!loading && !error && results.length > 0 && (
                <>
                    <div className="media-grid">
                        {results.map((item, index) => (
                            <MediaCard 
                                key={`${item.id}-${index}`} 
                                item={item} 
                                onAdd={handleAddToVault}
                                onClick={() => setSelectedMedia(item)}
                                isAdded={vaultIds.has(item.id)}
                            />
                        ))}
                    </div>
                    
                    {hasMore && (
                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                            <button className="btn btn-outline" onClick={loadMore}>
                                Load More
                            </button>
                        </div>
                    )}
                </>
            )}
            
            {!loading && !error && results.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "40px" }}>
                    No results to display. Try searching for something else!
                </div>
            )}

            {selectedMedia && (
                <Suspense fallback={null}>
                    <MediaModal media={selectedMedia} onClose={() => setSelectedMedia(null)} />
                </Suspense>
            )}
        </div>
    );
}

export default Home;
