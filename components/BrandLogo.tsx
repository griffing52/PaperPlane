// components/BrandLogo.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;           // where to go on click, default "/"
  className?: string;      // extra classes for header wrapper if needed
};

export function BrandLogo({ href = "/", className = "" }: BrandLogoProps) {
  const content = (
    <div className="relative h-10 w-40 md:h-12 md:w-48 lg:h-14 lg:w-56 cursor-pointer">
      <Image
        src="/paperplane-logo.svg"
        alt="PaperPlane Logo"
        fill
        priority
        className="object-contain"
      />
    </div>
  );

  return (
    <header className={`px-6 py-4 ${className}`}>
      {href ? (
        <Link href={href} className="flex items-center">
          {content}
        </Link>
      ) : (
        <div className="flex items-center">{content}</div>
      )}
    </header>
  );
}
