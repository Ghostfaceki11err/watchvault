const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export const searchMedia = async (query, page = 1) => {
    const response = await fetch(
        `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}&page=${page}`
    );

    const data = await response.json();
    return data;
};

export const getTrending = async (page = 1) => {
    const response = await fetch(
        `${BASE_URL}/trending/all/week?api_key=${API_KEY}&page=${page}`
    );
    const data = await response.json();
    return data;
};

export const getMediaDetails = async (id, type) => {
    // type must be 'movie' or 'tv'
    const response = await fetch(
        `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=videos,credits,recommendations`
    );
    const data = await response.json();
    return data;
};

export const getPersonDetails = async (id) => {
    const response = await fetch(
        `${BASE_URL}/person/${id}?api_key=${API_KEY}&append_to_response=combined_credits`
    );
    const data = await response.json();
    return data;
};