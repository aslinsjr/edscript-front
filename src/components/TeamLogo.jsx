import { useState, useEffect } from 'react';
import { teamImageUrl } from '../utils/images.js';
import { fetchLeagueLogo, getCachedLogo } from '../utils/leagueLogo.js';

function Logo({ src, alt, size, className }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <img
        src="/fallback-flag.png"
        alt=""
        width={size}
        height={size}
        className={`logo-img ${className || ''}`}
      />
    );
  }

  function handleLoad(e) {
    const img = e.currentTarget;
    if (img.naturalWidth <= 1 && img.naturalHeight <= 1) {
      setFailed(true);
    }
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`logo-img ${className || ''}`}
      onLoad={handleLoad}
      onError={() => setFailed(true)}
    />
  );
}

export function TeamLogo({ imageId, name, size = 24, className }) {
  return (
    <Logo
      src={teamImageUrl(imageId)}
      alt={name || ''}
      size={size}
      className={className}
    />
  );
}

export function LeagueLogo({ leagueId, name, cc, size = 24, className }) {
  const [src, setSrc] = useState(() => getCachedLogo(leagueId));

  useEffect(() => {
    if (!leagueId && !name) return;
    const cached = getCachedLogo(leagueId);
    if (cached !== null) { setSrc(cached); return; }
    fetchLeagueLogo(leagueId, name, cc).then(url => setSrc(url || null));
  }, [leagueId, name, cc]);

  return (
    <Logo
      src={src}
      alt={name || ''}
      size={size}
      className={className}
    />
  );
}
