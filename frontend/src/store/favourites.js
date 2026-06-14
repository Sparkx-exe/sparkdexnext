import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFavouritesStore = create(
  persist(
    (set, get) => ({
      favourites: [], // array of manga UUID strings
      
      addFavourite: (id) => {
        const current = get().favourites;
        if (!current.includes(id)) {
          set({ favourites: [...current, id] });
        }
      },
      
      removeFavourite: (id) => {
        set({ favourites: get().favourites.filter((favId) => favId !== id) });
      },
      
      isFavourite: (id) => {
        return get().favourites.includes(id);
      },
    }),
    {
      name: 'sparkdex_favourites',
    }
  )
);
