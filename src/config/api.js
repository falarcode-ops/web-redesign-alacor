const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isDev = hostname === 'localhost' || hostname === '127.0.0.1';
const isTestWeb = hostname === 'testweb.alacor.net';

// Chat Server: en local usa localhost:3000; en testweb usa relativo ''; en Hostinger (alacor.com.co) usa el gateway HTTPS de testweb
export const CHAT_API_URL = isDev ? 'http://localhost:3000' : (isTestWeb ? '' : 'https://testweb.alacor.net');

// CorePrice Base URL: en local usa proxy de vite; en testweb usa proxy Nginx ''; en Hostinger (alacor.com.co) conecta directamente con https://coreprice.alacor.net
export const COREPRICE_BASE_URL = isDev ? '/coreprice-proxy' : (isTestWeb ? '' : 'https://coreprice.alacor.net');

export const COREPRICE_API_URL = `${COREPRICE_BASE_URL}/api/v1/catalog`;
export const COREPRICE_TAXONOMY_URL = `${COREPRICE_BASE_URL}/api/taxonomy_config`;
export const CORALIS_BASE_URL = 'https://coralis.alacor.net';
export const CORALIS_QUOTE_URL = `${CORALIS_BASE_URL}/api/v1/requests/public`;


