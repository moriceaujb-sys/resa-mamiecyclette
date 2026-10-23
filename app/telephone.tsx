"use client";

// Numéro de téléphone cliquable (appel direct depuis un téléphone).
// stopPropagation : le lien reste utilisable dans une ligne de tableau cliquable.
export default function Telephone({
  numero,
  className = "font-medium",
}: {
  numero: string;
  className?: string;
}) {
  return (
    <a
      href={`tel:${numero.replace(/[^\d+]/g, "")}`}
      onClick={(e) => e.stopPropagation()}
      className={`whitespace-nowrap text-marine-600 underline hover:text-marine-700 ${className}`}
    >
      {numero}
    </a>
  );
}
