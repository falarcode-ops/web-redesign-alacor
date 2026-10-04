import React, { createContext, useContext, useState, useEffect } from 'react';
import { COREPRICE_API_URL } from '../config/api.js';
import { ee } from '../data/catalogData.js';

const CatalogContext = createContext(null);

export const CatalogProvider = ({ children }) => {
  const [catalog, setCatalog] = useState(() => {
    try {
      const saved = localStorage.getItem('alacor_catalog_v14');
      if (saved) return ee(JSON.parse(saved));
    } catch (err) {
      console.warn('Error al cargar catálogo guardado:', err);
    }
    return {};
  });

  const [corePriceSyncing, setCorePriceSyncing] = useState(false);
  const [corePriceLastSync, setCorePriceLastSync] = useState(null);
  const [corePriceError, setCorePriceError] = useState(null);

  const syncWithCorePrice = async () => {
    setCorePriceSyncing(true);
    setCorePriceError(null);
    try {
      const res = await fetch(COREPRICE_API_URL);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data && data.categories) {
        const sanitized = ee(data.categories);
        setCatalog(sanitized);
        localStorage.setItem('alacor_catalog_v14', JSON.stringify(sanitized));
        setCorePriceLastSync(new Date());
      }
    } catch (err) {
      console.error('Error al sincronizar con CorePrice:', err);
      setCorePriceError(err.message);
    } finally {
      setCorePriceSyncing(false);
    }
  };

  useEffect(() => {
    syncWithCorePrice();
  }, []);

  return (
    <CatalogContext.Provider value={{
      catalog,
      setCatalog,
      syncWithCorePrice,
      corePriceSyncing,
      corePriceLastSync,
      corePriceError
    }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog debe ser usado dentro de un CatalogProvider');
  return context;
};
