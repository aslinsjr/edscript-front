import { useState } from 'react';
import { teamImageUrl, leagueImageUrl } from '../utils/images.js';

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

export function LeagueLogo({ imageId, name, size = 16, className }) {
  return (
    <Logo
      src={leagueImageUrl(imageId)}
      alt={name || ''}
      size={size}
      className={className}
    />
  );
}
