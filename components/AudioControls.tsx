import type { Lang } from '../types';

type Props = {
  enabled: boolean;
  muted: boolean;
  volume: number;
  labels: {
    audio: string;
    audioOn: string;
    audioOff: string;
    mute: string;
    unmute: string;
    volume: string;
  };
  onToggleEnabled: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
};

export default function AudioControls({
  enabled,
  muted,
  volume,
  labels,
  onToggleEnabled,
  onToggleMute,
  onVolumeChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <span className="text-xs font-medium text-emerald-400 font-bold">{labels.audio}</span>
        <button
          type="button"
          onClick={onToggleEnabled}
          className="px-4 py-1.5 text-xs font-medium border rounded-sm transition font-serif font-bold cursor-pointer"
          style={{
            backgroundColor: enabled ? 'rgba(30, 25, 21, 0.95)' : 'rgba(12, 10, 8, 0.95)',
            color: enabled ? '#34d399' : '#71717a',
            borderColor: enabled ? '#10b981' : '#27272a',
          }}
        >
          {enabled ? labels.audioOn : labels.audioOff}
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          disabled={!enabled}
          className="px-4 py-1.5 text-xs font-medium border rounded-sm transition disabled:opacity-30 font-serif font-bold cursor-pointer"
          style={{
            backgroundColor: !enabled ? 'rgba(12, 10, 8, 0.5)' : muted ? 'rgba(12, 10, 8, 0.95)' : 'rgba(30, 25, 21, 0.95)',
            color: !enabled ? '#6d6954' : muted ? '#71717a' : '#34d399',
            borderColor: !enabled ? '#27272a' : muted ? '#27272a' : '#10b981',
          }}
        >
          {muted ? labels.unmute : labels.mute}
        </button>
      </div>

      {enabled && (
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs font-medium text-emerald-400 font-bold">{labels.volume}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
            disabled={!enabled || muted}
            className="flex-1 h-1 bg-accent/20 rounded-full appearance-none cursor-pointer disabled:opacity-50"
            style={{
              accentColor: '#a89f7d',
            }}
          />
          <span className="text-xs text-emerald-400 font-bold min-w-[2rem] text-right">{Math.round(volume * 100)}%</span>
        </div>
      )}
    </div>
  );
}
