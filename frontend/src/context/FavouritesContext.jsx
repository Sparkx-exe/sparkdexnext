import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const FavouritesContext = createContext();

export const FavouritesProvider = ({ children }) => {
  const [favourites, setFavourites] = useState(() => {
    try {
      const stored = localStorage.getItem('mangaFavourites');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse favourites from localStorage', e);
      return [];
    }
  });

  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem('mangaFavourites', JSON.stringify(favourites));
  }, [favourites]);

  const addFavourite = (manga) => {
    if (favourites.some((item) => item.id === manga.id)) return;
    
    const mangaData = {
      id: manga.id,
      title: manga.title,
      coverUrl: manga.coverUrl,
      description: manga.description,
      status: manga.status,
      author: manga.author
    };

    setFavourites((prev) => [...prev, mangaData]);
    showToast(`"${manga.title}" added to Favourites!`);
  };

  const removeFavourite = (mangaId) => {
    const manga = favourites.find((item) => item.id === mangaId);
    if (!manga) return;

    setFavourites((prev) => prev.filter((item) => item.id !== mangaId));
    showToast(`"${manga.title}" removed from Favourites!`);
  };

  const isFavourite = (mangaId) => {
    return favourites.some((item) => item.id === mangaId);
  };

  return (
    <FavouritesContext.Provider value={{ favourites, addFavourite, removeFavourite, isFavourite }}>
      {children}
    </FavouritesContext.Provider>
  );
};

export const useFavourites = () => {
  const context = useContext(FavouritesContext);
  if (!context) {
    throw new Error('useFavourites must be used within a FavouritesProvider');
  }
  return context;
};
