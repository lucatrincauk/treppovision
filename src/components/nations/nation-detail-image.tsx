
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface NationDetailImageProps {
  nationId: string;
  nationName: string;
  countryCode: string;
}

export function NationDetailImage({ nationId, nationName, countryCode }: NationDetailImageProps) {
  const localThumbnailUrl = `/${nationId}.jpg`;
  const fallbackFlagUrl = `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;

  const [imageUrl, setImageUrl] = useState(localThumbnailUrl);
  const [imageAlt, setImageAlt] = useState(`Immagine ${nationName}`);

  useEffect(() => {
    // Reset to local thumbnail if nationId changes
    setImageUrl(`/${nationId}.jpg`);
    setImageAlt(`Immagine ${nationName}`);
  }, [nationId, nationName]);

  const handleImageError = () => {
    if (imageUrl !== fallbackFlagUrl) {
      setImageUrl(fallbackFlagUrl);
      setImageAlt(`Bandiera ${nationName}`);
    }
  };

  return (
    <Image
      src={imageUrl}
      alt={imageAlt}
      width={160}
      height={107}
      className="rounded-md shadow-lg border-2 border-white/20 object-contain"
      priority={['gb', 'fr', 'de', 'it', 'es', 'ch'].includes(nationId) && imageUrl === fallbackFlagUrl}
      onError={handleImageError}
      data-ai-hint={imageUrl === fallbackFlagUrl ? `${nationName} flag` : `${nationName} photo`}
    />
  );
}
