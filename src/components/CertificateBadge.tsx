import { Shield, AlertTriangle } from 'lucide-react';

interface CertificateBadgeProps {
  type: string;
  size?: 'sm' | 'md';
}

export default function CertificateBadge({ type, size = 'sm' }: CertificateBadgeProps) {
  const isProtected = type === 'com_certificado';
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-3 py-1 gap-1.5';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${
      isProtected
        ? 'bg-success/15 text-success border border-success/30'
        : 'bg-warning/15 text-warning border border-warning/30'
    }`}>
      {isProtected ? <Shield className={iconSize} /> : <AlertTriangle className={iconSize} />}
      {isProtected ? 'Protegido pela loja' : 'Sem proteção'}
    </span>
  );
}
