// Avatar com moldura cosmética opcional (avatar_frame equipado no loadout global).
import { useUserLoadout } from '@/hooks/useCosmetics';

export function AvatarWithFrame({
  userId, src, fallback, size = 48,
}: { userId?: string | null; src?: string | null; fallback?: string; size?: number }) {
  const { rows } = useUserLoadout(userId || null);
  const frame = rows.find(r => r.slot === 'avatar_frame')?.reward;
  const color = frame?.payload?.color || 'hsl(var(--primary))';

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {frame && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: `0 0 0 2px ${color}, 0 0 14px ${color}88`,
            background: frame.asset_url ? `center/cover url(${frame.asset_url})` : undefined,
          }}
        />
      )}
      <div
        className="rounded-full overflow-hidden bg-secondary flex items-center justify-center text-xs font-bold"
        style={{ width: size - (frame ? 6 : 0), height: size - (frame ? 6 : 0) }}
      >
        {src ? (
          <img src={src} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{fallback || '?'}</span>
        )}
      </div>
    </div>
  );
}
