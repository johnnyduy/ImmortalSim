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
        <span className="text-xs uppercase tracking-widest text-[#e5c17b] font-bold">{labels.audio}</span>
        <button
          type="button"
          onClick={onToggleEnabled}
          className="px-4 py-1.5 text-xs uppercase tracking-wider border rounded-sm transition font-serif font-bold cursor-pointer"
          style={{
            backgroundColor: enabled ? 'rgba(30, 25, 21, 0.95)' : 'rgba(12, 10, 8, 0.95)',
            color: enabled ? '#e5c17b' : '#847764',
            borderColor: enabled ? '#c5a059' : '#3e3328',
          }}
        >
          {enabled ? labels.audioOn : labels.audioOff}
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          disabled={!enabled}
          className="px-4 py-1.5 text-xs uppercase tracking-wider border rounded-sm transition disabled:opacity-30 font-serif font-bold cursor-pointer"
          style={{
            backgroundColor: !enabled ? 'rgba(12, 10, 8, 0.5)' : muted ? 'rgba(12, 10, 8, 0.95)' : 'rgba(30, 25, 21, 0.95)',
            color: !enabled ? '#6d6954' : muted ? '#847764' : '#e5c17b',
            borderColor: !enabled ? '#3e3328' : muted ? '#3e3328' : '#c5a059',
          }}
        >
          {muted ? labels.unmute : labels.mute}
        </button>
      </div>

      {enabled && (
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs uppercase tracking-widest text-[#e5c17b] font-bold">{labels.volume}</span>
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
          <span className="text-xs text-[#e5c17b] font-bold min-w-[2rem] text-right">{Math.round(volume * 100)}%</span>
        </div>
      )}
    </div>
  );
}
