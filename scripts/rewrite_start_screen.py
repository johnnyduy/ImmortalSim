import re

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the location of the start marker and the end of the start screen
start_idx = content.find("START SCREEN - Trường Sinh Lộ")
if start_idx == -1:
    print("Could not find start marker")
    exit(1)

# The comment ends, then the div starts
start_idx = content.find("<div className=\"relative flex flex-col items-center justify-start flex-1 min-h-screen overflow-hidden\">", start_idx)
if start_idx == -1:
    print("Could not find div marker")
    exit(1)

# Backtrack to the spaces before the div
start_idx = content.rfind("          <div", 0, start_idx + 15)

# The end marker
end_idx = content.find("=== 'mountain' && !activeCombat && (", start_idx)
if end_idx == -1:
    print("Could not find end marker")
    exit(1)

# Backtrack to the closing div of the main game block
end_idx = content.rfind("        </div>", start_idx, end_idx)

new_start_screen = """          <div className="relative flex flex-col items-center justify-center flex-1 min-h-[100dvh] bg-surface-container-lowest text-on-surface p-6 font-mono-data overflow-hidden">
            
            {/* Terminal Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/5 via-surface-container-lowest to-surface-container-lowest" />
              <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }} />
            </div>

            {/* Title Block */}
            <div className="relative z-20 text-center w-full max-w-md border border-outline-variant/30 bg-surface-container-low/50 p-8 shadow-[0_0_30px_rgba(255,176,0,0.05)] backdrop-blur-md animate-fade-in">
              <div className="text-secondary/60 text-[10px] tracking-widest mb-4 font-headline-sm uppercase">{'<System Initialization>'}</div>
              <h1 className="font-headline-lg text-4xl text-primary font-bold tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(255,176,0,0.3)]">
                {language === 'vi' ? 'Trường Sinh Lộ' : 'Immortal Sim'}
              </h1>
              <div className="h-[1px] w-3/4 mx-auto bg-gradient-to-r from-transparent via-secondary/30 to-transparent my-6" />
              <p className="text-xs text-on-surface-variant tracking-wide leading-relaxed">
                {language === 'vi'
                  ? 'Tải dữ liệu... Vận mệnh đang được tái thiết lập. Bạn đã sẵn sàng kết nối lại mạng lưới luân hồi?'
                  : 'Loading data... Destiny is being recompiled. Are you ready to reconnect to the reincarnation network?'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="relative z-20 w-full max-w-md mt-8 space-y-4">
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-4 px-6 text-center font-headline-sm text-sm uppercase tracking-widest border transition-all duration-300 border-secondary/40 text-secondary hover:border-secondary hover:bg-secondary/10 hover:shadow-[0_0_15px_rgba(255,176,0,0.2)] hover:-translate-y-0.5 cursor-pointer bg-surface-container-low/80"
              >
                {copy.startNew || (language === 'vi' ? 'Khởi Chạy Tiến Trình Mới' : 'Execute New Process')}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-4 px-6 text-center font-headline-sm text-sm uppercase tracking-widest border transition-all duration-300 border-error/40 text-error hover:border-error hover:bg-error/10 hover:shadow-[0_0_15px_rgba(255,100,100,0.2)] hover:-translate-y-0.5 cursor-pointer bg-surface-container-low/80"
              >
                {copy.resetLegacy || (language === 'vi' ? 'Xóa Bộ Nhớ Cache Di Sản' : 'Wipe Legacy Cache')}
              </button>
            </div>

            {/* Settings & Legacy Data */}
            <div className="relative z-20 w-full max-w-md mt-8 grid grid-cols-2 gap-4">
              {/* Audio/Language Settings Panel */}
              <div className="border border-outline-variant/30 bg-surface-container-low/40 p-4 flex flex-col gap-4">
                <div className="text-[10px] text-secondary/60 uppercase tracking-wider mb-2">{'// Cấu Hình'}</div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-on-surface-variant">{language === 'vi' ? 'Ngôn Ngữ:' : 'Language:'}</span>
                  <div className="flex gap-1.5">
                    {(['en', 'vi'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLanguage(l)}
                        className={`text-[9px] px-2 py-1 uppercase border transition-colors ${
                          language === l ? 'border-secondary text-secondary bg-secondary/10' : 'border-outline-variant/50 text-on-surface-variant hover:text-white hover:border-outline-variant'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-on-surface-variant">{language === 'vi' ? 'Âm Thanh:' : 'Audio:'}</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleAudioEnabled}
                      className={`text-[9px] px-2 py-1 uppercase border transition-colors ${
                        audioEnabled ? 'border-secondary text-secondary bg-secondary/10' : 'border-outline-variant/50 text-on-surface-variant hover:text-white hover:border-outline-variant'
                      }`}
                    >
                      {audioEnabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      disabled={!audioEnabled}
                      className={`text-[9px] px-2 py-1 uppercase border transition-colors disabled:opacity-30 ${
                        (!audioMuted && audioEnabled) ? 'border-secondary text-secondary bg-secondary/10' : 'border-outline-variant/50 text-on-surface-variant hover:text-white hover:border-outline-variant'
                      }`}
                    >
                      {audioMuted ? 'MUTE' : 'PLAY'}
                    </button>
                  </div>
                </div>

                {audioEnabled && (
                  <div className="pt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(audioVolume * 100)}
                      onChange={(e) => handleAudioVolumeChange(parseInt(e.target.value) / 100)}
                      disabled={!audioEnabled || audioMuted}
                      className="w-full h-1 bg-surface-container appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-secondary"
                    />
                  </div>
                )}
              </div>

              {/* Legacy Data Panel */}
              <div className="border border-outline-variant/30 bg-surface-container-low/40 p-4 flex flex-col gap-3">
                <div className="text-[10px] text-secondary/60 uppercase tracking-wider mb-1">{'// Dữ Liệu Di Sản'}</div>
                
                {[
                  { label: copy.legacyPower || (language === 'vi' ? 'Sức mạnh' : 'Power'), value: inheritance.legacyPower },
                  { label: copy.ancestralMemory || (language === 'vi' ? 'Ký ức' : 'Memory'), value: inheritance.ancestralMemory },
                  { label: copy.blessing || (language === 'vi' ? 'Phúc lành' : 'Blessing'), value: inheritance.blessing },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-outline-variant/20 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-[9px] text-on-surface-variant uppercase">{item.label}</span>
                    <span className="text-[11px] font-headline-sm text-secondary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
          </div>"""

# Replace the content
new_content = content[:start_idx] + new_start_screen + "\n" + content[end_idx:]

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Replaced start screen block. Old block size: {end_idx - start_idx}. New block size: {len(new_start_screen)}")
