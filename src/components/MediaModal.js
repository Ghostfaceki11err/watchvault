import { useEffect, useState, useRef } from "react";
import { getMediaDetails, getPersonDetails } from "../services/tmdbApi";
import { addToVault, getVaultItems } from "../services/firestoreService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { X, Star, Plus, Check, ArrowLeft } from "lucide-react";
import YouTube from "react-youtube";

function MediaModal({ media, onClose }) {
    const [mediaHistory, setMediaHistory] = useState([media]);
    const currentMedia = mediaHistory[mediaHistory.length - 1];
    
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [vaultIds, setVaultIds] = useState(new Set());
    const modalContentRef = useRef(null);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Reset internal state if the external prop changes
    useEffect(() => {
        setMediaHistory([media]);
    }, [media]);

    useEffect(() => {
        if (currentUser) {
            getVaultItems(currentUser.uid).then(data => {
                setVaultIds(new Set(data.map(item => item.tmdbId)));
            });
        }
    }, [currentUser]);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setDetails(null);
            
            // Scroll back to top when media changes
            if (modalContentRef.current) {
                modalContentRef.current.scrollTop = 0;
            }

            if (currentMedia.media_type === 'person' || currentMedia.type === 'person') {
                const data = await getPersonDetails(currentMedia.id);
                setDetails(data);
            } else if (currentMedia.media_type === 'movie' || currentMedia.media_type === 'tv' || currentMedia.type === 'movie' || currentMedia.type === 'tv' || currentMedia.type === 'anime') {
                let type = currentMedia.media_type || currentMedia.type;
                if (type === 'anime') type = 'tv'; // TMDb uses 'tv' for anime
                const data = await getMediaDetails(currentMedia.tmdbId || currentMedia.id, type);
                setDetails(data);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [currentMedia]);

    if (!currentMedia) return null;

    const isPerson = currentMedia.media_type === 'person' || currentMedia.type === 'person';

    const title = isPerson ? (details?.name || currentMedia.name) : (details?.title || details?.name || currentMedia.title || currentMedia.name);
    const overview = isPerson ? (details?.biography || "No biography available.") : (details?.overview || currentMedia.overview);
    const year = isPerson ? null : (details?.release_date || details?.first_air_date || currentMedia.release_date || currentMedia.first_air_date || "").substring(0, 4);
    const rating = isPerson ? null : (details?.vote_average?.toFixed(1) || currentMedia.vote_average?.toFixed(1));
    const language = isPerson ? null : (details?.spoken_languages?.[0]?.english_name || currentMedia.original_language?.toUpperCase() || details?.original_language?.toUpperCase());
    const status = isPerson ? null : details?.status;
    const backdropUrl = isPerson ? null : ((details?.backdrop_path || currentMedia.backdrop_path) ? `https://image.tmdb.org/t/p/w1280${details?.backdrop_path || currentMedia.backdrop_path}` : null);
    const posterUrl = isPerson ? ((details?.profile_path || currentMedia.profile_path) ? `https://image.tmdb.org/t/p/w500${details?.profile_path || currentMedia.profile_path}` : null) : ((details?.poster_path || currentMedia.poster_path || currentMedia.poster) ? `https://image.tmdb.org/t/p/w500${details?.poster_path || currentMedia.poster_path || currentMedia.poster}` : null);
    
    // Determine the display type
    let rawType = currentMedia.media_type || currentMedia.type;
    // Auto-detect if it was a TV show from Japan with Animation genre
    if (!isPerson && details && rawType === 'tv' && details.origin_country?.includes("JP") && details.genres?.some(g => g.id === 16)) {
        rawType = 'anime';
    }
    const isTV = rawType === 'tv' || rawType === 'anime';
    const displayType = isPerson ? details?.known_for_department : (rawType === 'anime' ? 'Anime' : (isTV ? 'TV Series' : 'Movie'));

    // Find a trailer
    const videos = isPerson ? [] : (details?.videos?.results || []);
    const trailer = videos.find(vid => vid.type === "Trailer" && vid.site === "YouTube") || videos.find(vid => vid.site === "YouTube");

    // Get Top Cast & Recommendations
    const cast = isPerson ? [] : (details?.credits?.cast?.slice(0, 10) || []);
    const recommendations = isPerson ? [] : (details?.recommendations?.results?.slice(0, 12) || []);
    
    // Get Actor's known for credits
    const actorCredits = isPerson ? (details?.combined_credits?.cast?.sort((a, b) => b.vote_count - a.vote_count).slice(0, 20) || []) : [];

    const handleRecommendationClick = (rec) => {
        // Carry over the current type so the API knows which endpoint to hit
        // If it's an actor credit, it has a media_type naturally
        const typeToUse = rec.media_type || (rawType === 'anime' ? 'tv' : rawType);
        setMediaHistory([...mediaHistory, { ...rec, media_type: typeToUse }]);
    };

    const handleActorClick = (actor) => {
        setMediaHistory([...mediaHistory, { ...actor, media_type: 'person' }]);
    };

    const handleBack = () => {
        if (mediaHistory.length > 1) {
            setMediaHistory(mediaHistory.slice(0, -1));
        }
    };

    const handleAddRecommendation = async (e, rec) => {
        e.stopPropagation(); // prevent modal from navigating to the movie
        if (!currentUser) {
            navigate("/login");
            return;
        }

        if (vaultIds.has(rec.id)) {
            toast.error(`${rec.title || rec.name} is already in your vault!`);
            return;
        }

        const recTitle = rec.title || rec.name;
        const loadingToast = toast.loading(`Adding ${recTitle}...`);
        
        const typeToUse = rec.media_type || (rawType === 'anime' ? 'tv' : rawType);
        const itemToSave = { ...rec, media_type: typeToUse };
        
        const response = await addToVault(currentUser.uid, itemToSave);
        if (response.success) {
            setVaultIds(prev => new Set(prev).add(rec.id));
            toast.success(`${recTitle} added to your vault!`, { id: loadingToast });
        } else {
            toast.error("Failed to add to vault.", { id: loadingToast });
        }
    };

    const isCurrentInVault = vaultIds.has(currentMedia.tmdbId || currentMedia.id);

    const handleAddCurrentToVault = async () => {
        if (!currentUser) {
            navigate("/login");
            return;
        }
        if (isCurrentInVault) {
            toast.error("This item is already in your vault!");
            return;
        }
        
        const recTitle = currentMedia.title || currentMedia.name;
        const loadingToast = toast.loading(`Adding ${recTitle}...`);
        
        const typeToUse = rawType === 'anime' ? 'tv' : rawType;
        const itemToSave = { ...currentMedia, media_type: typeToUse };
        
        const response = await addToVault(currentUser.uid, itemToSave);
        if (response.success) {
            setVaultIds(prev => new Set(prev).add(currentMedia.tmdbId || currentMedia.id));
            toast.success(`${recTitle} added to your vault!`, { id: loadingToast });
        } else {
            toast.error("Failed to add to vault.", { id: loadingToast });
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} ref={modalContentRef}>
                
                {/* Navigation Buttons */}
                <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between', zIndex: 20 }}>
                    {mediaHistory.length > 1 ? (
                        <button 
                            className="modal-close" 
                            onClick={handleBack} 
                            style={{ position: 'relative', top: '0', right: '0' }}
                            title="Go Back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    ) : (
                        <div /> /* Empty div to push close button to the right */
                    )}
                    <button 
                        className="modal-close" 
                        onClick={onClose}
                        style={{ position: 'relative', top: '0', right: '0' }}
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {backdropUrl && (
                    <div className="modal-header-bg" style={{ backgroundImage: `url(${backdropUrl})` }} />
                )}

                <div className="modal-body" style={{ marginTop: backdropUrl ? '-100px' : '0' }}>
                    
                    {/* Top Section: Poster & Core Info */}
                    <div className="modal-top-section">
                        {posterUrl ? (
                            <img src={posterUrl} alt={title} className="modal-poster" style={isPerson ? { height: '300px', objectFit: 'cover' } : {}} />
                        ) : (
                            <div className="modal-poster" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1d24' }}>
                                <span style={{ color: '#94a3b8' }}>No Image</span>
                            </div>
                        )}
                        
                        <div className="modal-info">
                            <h2 className="modal-title">{title}</h2>
                            
                            <div className="modal-meta">
                                {year && <span>{year}</span>}
                                {year && <span>•</span>}
                                {displayType && <span style={{ textTransform: 'capitalize' }}>{displayType}</span>}
                                
                                {isTV && details?.number_of_seasons && (
                                    <>
                                        <span>•</span>
                                        <span>{details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''} ({details.number_of_episodes} Episodes)</span>
                                    </>
                                )}

                                {status && status !== 'Released' && (
                                    <>
                                        <span>•</span>
                                        <span style={{ 
                                            color: (status === 'Returning Series' || status === 'In Production') ? '#34d399' : 
                                                   (status === 'Canceled') ? '#ef4444' : '#94a3b8',
                                            fontWeight: '500'
                                        }}>
                                            {status === 'Returning Series' ? 'Currently Airing' : status}
                                        </span>
                                    </>
                                )}

                                {language && (
                                    <>
                                        <span>•</span>
                                        <span>{language}</span>
                                    </>
                                )}

                                {rating > 0 && (
                                    <>
                                        <span>•</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                                            <Star size={14} fill="currentColor" /> {rating}
                                        </span>
                                    </>
                                )}

                                {isPerson && details?.birthday && (
                                    <>
                                        <span>•</span>
                                        <span>Born: {details.birthday}</span>
                                    </>
                                )}
                            </div>

                            {!isPerson && (
                                <div style={{ marginBottom: '20px', maxWidth: '300px' }}>
                                    <button 
                                        className="btn"
                                        onClick={handleAddCurrentToVault}
                                        style={{ 
                                            width: '100%', 
                                            display: 'flex', 
                                            justifyContent: 'center', 
                                            alignItems: 'center', 
                                            gap: '8px',
                                            background: isCurrentInVault ? '#22c55e' : 'var(--accent-primary)',
                                            borderColor: isCurrentInVault ? '#22c55e' : 'var(--accent-primary)',
                                            color: 'white',
                                            cursor: isCurrentInVault ? 'default' : 'pointer',
                                            padding: '12px'
                                        }}
                                    >
                                        {isCurrentInVault ? <><Check size={18} /> In Your Vault</> : <><Plus size={18} /> Add to Vault</>}
                                    </button>
                                </div>
                            )}

                            {!isPerson && details?.genres && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                                    {details.genres.map(g => (
                                        <span key={g.id} style={{ background: 'rgba(229, 9, 20, 0.2)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', color: '#f8fafc' }}>
                                            {g.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <p className="modal-overview" style={isPerson ? { whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' } : {}}>
                                {loading ? "Loading details..." : overview}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Section: Full Width Details */}
                    <div className="modal-bottom-section">
                        {cast.length > 0 && (
                            <div className="modal-cast-section">
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Top Cast</h3>
                                <div className="modal-cast-list">
                                    {cast.map(actor => (
                                        <div 
                                            key={actor.id} 
                                            className="cast-item" 
                                            onClick={() => handleActorClick(actor)}
                                        >
                                            {actor.profile_path ? (
                                                <img 
                                                    src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} 
                                                    alt={actor.name} 
                                                    className="cast-photo"
                                                />
                                            ) : (
                                                <div className="cast-photo-fallback">No Img</div>
                                            )}
                                            <span className="cast-name">{actor.name}</span>
                                            <span className="cast-character">{actor.character}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {trailer && (
                            <div className="modal-trailer-section">
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Trailer</h3>
                                <div className="trailer-container">
                                    <YouTube 
                                        videoId={trailer.key} 
                                        opts={{ width: '100%', height: '100%', playerVars: { origin: 'http://localhost:3000' } }} 
                                    />
                                </div>
                            </div>
                        )}

                        {recommendations.length > 0 && (
                            <div className="modal-recommendations-section">
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>More Like This</h3>
                                <div className="modal-recommendation-list">
                                    {recommendations.map(rec => (
                                        <div 
                                            key={rec.id} 
                                            className="recommendation-card"
                                            onClick={() => handleRecommendationClick(rec)}
                                        >
                                            <div className="recommendation-poster-wrapper">
                                                {rec.poster_path ? (
                                                    <img 
                                                        src={`https://image.tmdb.org/t/p/w342${rec.poster_path}`} 
                                                        alt={rec.title || rec.name} 
                                                        className="recommendation-poster"
                                                    />
                                                ) : (
                                                    <div className="recommendation-poster-fallback">No Img</div>
                                                )}
                                                <div className="recommendation-overlay">
                                                    {vaultIds.has(rec.id) ? (
                                                        <div style={{ background: '#22c55e', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Check size={20} />
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            className="recommendation-add-btn" 
                                                            onClick={(e) => handleAddRecommendation(e, rec)}
                                                            title="Add to Vault"
                                                        >
                                                            <Plus size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="recommendation-title">{rec.title || rec.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {actorCredits.length > 0 && (
                            <div className="modal-recommendations-section">
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Known For</h3>
                                <div className="modal-recommendation-list">
                                    {actorCredits.map(rec => (
                                        <div 
                                            key={`${rec.id}-${rec.media_type}`} 
                                            className="recommendation-card"
                                            onClick={() => handleRecommendationClick(rec)}
                                        >
                                            <div className="recommendation-poster-wrapper">
                                                {rec.poster_path ? (
                                                    <img 
                                                        src={`https://image.tmdb.org/t/p/w342${rec.poster_path}`} 
                                                        alt={rec.title || rec.name} 
                                                        className="recommendation-poster"
                                                    />
                                                ) : (
                                                    <div className="recommendation-poster-fallback">No Img</div>
                                                )}
                                                <div className="recommendation-overlay">
                                                    {vaultIds.has(rec.id) ? (
                                                        <div style={{ background: '#22c55e', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Check size={20} />
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            className="recommendation-add-btn" 
                                                            onClick={(e) => handleAddRecommendation(e, rec)}
                                                            title="Add to Vault"
                                                        >
                                                            <Plus size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="recommendation-title">{rec.title || rec.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MediaModal;
