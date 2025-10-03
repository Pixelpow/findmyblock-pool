import { useState, useEffect, useRef } from 'react';

// Hook: useFearGreed
// - Fetches Crypto Fear & Greed index (0-100) and classification
// - Primary source: alternative.me (no API key)
// - Optional RapidAPI fallback if you provide rapidApiOptions { host, key, endpoint }
// - Polls every `intervalMs` (default 10 minutes)

export default function useFearGreed({ intervalMs = 24 * 60 * 60 * 1000, rapidApiOptions = null } = {}) {
  const [value, setValue] = useState(null); // numeric 0-100
  const [classification, setClassification] = useState(null); // raw classification string
  const [adjective, setAdjective] = useState(null); // mapped adjective
  const [color, setColor] = useState(null); // mapped color (tailwind-friendly)
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const mounted = useRef(true);

  // Maps number -> adjective + color
  function classify(val) {
    // val assumed numeric 0..100
    if (val === null || typeof val !== 'number' || isNaN(val)) return { adjective: 'Unknown', color: 'text-gray-400' };
    if (val <= 24) return { adjective: 'Extreme Fear', color: 'text-red-500' };
    if (val <= 49) return { adjective: 'Fear', color: 'text-amber-400' };
    if (val === 50) return { adjective: 'Neutral', color: 'text-gray-400' };
    if (val <= 74) return { adjective: 'Greed', color: 'text-green-400' };
    return { adjective: 'Extreme Greed', color: 'text-green-600' };
  }

  // Primary fetcher: alternative.me
  async function fetchAlternative() {
    const url = 'https://api.alternative.me/fng/?limit=1&format=json';
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`alternative.me HTTP ${resp.status}`);
    const j = await resp.json();
    // Expected shape: { data: [ { value: "xx", value_classification: "...", timestamp: "..." } ], metadata: { ... } }
    if (!j || !j.data || !Array.isArray(j.data) || !j.data[0]) throw new Error('alternative.me: unexpected response');
    const d = j.data[0];
    return {
      value: Number(d.value),
      classification: d.value_classification || null,
      timestamp: d.timestamp ? new Date(Number(d.timestamp) * 1000) : new Date(),
      raw: d,
    };
  }

  // Fallback via AllOrigins (free CORS proxy). Note: may be rate-limited.
  async function fetchViaAllOrigins(targetUrl) {
    const proxy = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(targetUrl);
    const resp = await fetch(proxy, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`allorigins HTTP ${resp.status}`);
    const j = await resp.json();
    return j;
  }

  // Optional RapidAPI fallback (example). rapidApiOptions should be { host, key, path }
  async function fetchRapidApi() {
    if (!rapidApiOptions || !rapidApiOptions.host || !rapidApiOptions.key || !rapidApiOptions.path) {
      throw new Error('RapidAPI options not provided');
    }
    const url = rapidApiOptions.path; // full URL expected
    const resp = await fetch(url, {
      headers: {
        'x-rapidapi-host': rapidApiOptions.host,
        'x-rapidapi-key': rapidApiOptions.key,
      },
      cache: 'no-store',
    });
    if (!resp.ok) throw new Error(`rapidapi HTTP ${resp.status}`);
    const j = await resp.json();
    // This block must be adapted depending on the chosen RapidAPI provider's shape
    // We'll try common shapes: { value: number } or { data: { value: ... } }
    let v = null;
    if (typeof j.value === 'number' || typeof j.value === 'string') v = Number(j.value);
    else if (j.data && (typeof j.data.value === 'number' || typeof j.data.value === 'string')) v = Number(j.data.value);
    else if (Array.isArray(j) && j[0] && j[0].value) v = Number(j[0].value);
    if (v === null || isNaN(v)) throw new Error('rapidapi: could not parse value');
    return { value: v, classification: j.classification || null, timestamp: new Date(), raw: j };
  }

  async function doFetch() {
    setIsLoading(true);
    setError(null);
    try {
      // Try primary
      let res = null;
      try {
        res = await fetchAlternative();
      } catch (e) {
        // Try AllOrigins fallback (in case of CSP/CORS blocking)
        try {
          const all = await fetchViaAllOrigins('https://api.alternative.me/fng/?limit=1&format=json');
          const entry = Array.isArray(all.data) ? all.data[0] : (all && all.data ? all.data[0] : null);
          if (entry) {
            res = { value: Number(entry.value), classification: entry.value_classification || null, timestamp: entry.timestamp ? new Date(Number(entry.timestamp) * 1000) : new Date(), raw: entry };
          } else {
            throw e;
          }
        } catch (e2) {
          // If alternative/allorigins fail, try RapidAPI if configured
          if (rapidApiOptions) {
            res = await fetchRapidApi();
          } else {
            // Will fall through to catch below — but first try to use cached value
            throw e2 || e;
          }
        }
      }

      if (!mounted.current) return;

      const numeric = Number(res.value);
      setValue(Number.isFinite(numeric) ? numeric : null);
      setClassification(res.classification || null);
      const mapped = classify(Number(numeric));
      setAdjective(mapped.adjective);
      setColor(mapped.color);
      setLastUpdated(res.timestamp || new Date());
    } catch (e) {
      if (!mounted.current) return;
      // Better error messaging for CSP/network blocks
      const msg = (e && e.message) ? e.message : String(e);
      const cspLike = /Refused to connect|violates the following Content Security Policy|blocked by CORS/i.test(msg) || msg === 'Failed to fetch' || msg === 'NetworkError when attempting to fetch resource.';

      // Try to read from cache (localStorage) if available
      try {
        const raw = localStorage.getItem('fng_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.value !== undefined) {
            setValue(parsed.value);
            setClassification(parsed.classification || null);
            const mapped = classify(Number(parsed.value));
            setAdjective(mapped.adjective);
            setColor(mapped.color);
            setLastUpdated(parsed.timestamp ? new Date(parsed.timestamp) : new Date());
            setFromCache(true);
            setError((cspLike ? 'Network/CSP blocked live fetch; showing cached value. ' : '') + (msg || 'Error fetching FNG'));
            return;
          }
        }
      } catch (cacheErr) {
        // ignore cache parse errors
      }

      if (cspLike) {
        setError('Network/CSP blocked the request to alternative.me/allorigins. Either add https://api.alternative.me to your connect-src CSP, allow the proxy host, or provide a fallback RapidAPI provider via rapidApiOptions. (' + msg + ')');
      } else {
        setError(msg);
      }
    } finally {
      if (!mounted.current) return;
      setIsLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    // initial fetch
    doFetch();
    // interval
    const id = setInterval(doFetch, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, JSON.stringify(rapidApiOptions)]);

  // Persist the latest successful value to localStorage so we can show something
  useEffect(() => {
    if (value !== null && value !== undefined) {
      try {
        localStorage.setItem('fng_cache', JSON.stringify({ value, classification, timestamp: lastUpdated ? lastUpdated.toISOString() : new Date().toISOString() }));
        setFromCache(false);
      } catch (e) {
        // ignore storage errors
      }
    }
  }, [value, classification, lastUpdated]);

  return { value, classification, adjective, color, lastUpdated, isLoading, error, fromCache, refetch: doFetch };
}
