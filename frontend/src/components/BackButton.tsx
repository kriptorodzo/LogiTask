'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  label?: string;
}

export default function BackButton({ href, label = 'Back' }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button onClick={handleBack} className="back-button">
      <span className="back-icon">←</span>
      <span>{label}</span>
    </button>
  );
}