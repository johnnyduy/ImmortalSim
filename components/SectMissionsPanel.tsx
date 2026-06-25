import { useState } from 'react';
import type { SectQuest, Lang } from '../types';
import sectQuestsData from '../data/sect-quests.json';

// Cast JSON data to SectQuest[]
const sectQuests = sectQuestsData as SectQuest[];

type Props = {
  currentRank: 'ngoại_môn' | 'nội_môn' | 'chân_truyền' | 'trưởng_lão';
  playerStats: {
    combatPower: number;
    luck: number;
    comprehension: number;
    daoHeart: number;
  };
  hasActiveQuest: boolean;
  onAcceptQuest: (quest: SectQuest, isParty: boolean) => void;
  onClose: () => void;
  language?: Lang;
  warLevel?: number;
};

export default function SectMissionsPanel({
  currentRank,
  playerStats,
  hasActiveQuest,
  onAcceptQuest,
  onClose,
  language = 'vi',
  warLevel = 0,
}: Props) {
  // Store chosen modes for each quest by quest ID. Default to Solo (isParty = false).
  const [questPartyModes, setQuestPartyModes] = useState<Record<string, boolean>>({});

  const rankWeights = {
    'ngoại_môn': 0,
    'nội_môn': 1,
    'chân_truyền': 2,
    'trưởng_lão': 3,
  };

  const rankNames = {
    'ngoại_môn': { vi: 'Ngoại Môn Đệ Tử', en: 'Outer Disciple' },
    'nội_môn': { vi: 'Nội Môn Đệ Tử', en: 'Inner Disciple' },
    'chân_truyền': { vi: 'Chân Truyền Đệ Tử', en: 'Core Disciple' },
    'trưởng_lão': { vi: 'Tông Môn Trưởng Lão', en: 'Sect Elder' },
  };

  const difficultyColors: Record<string, string> = {
    'Hoàng': 'border-gray-500 text-gray-400 bg-gray-950/40',
    'Huyền': 'border-emerald-600 text-emerald-400 bg-emerald-950/40',
    'Địa': 'border-sky-600 text-sky-400 bg-sky-950/40',
    'Thiên': 'border-purple-600 text-purple-400 bg-purple-950/40',
  };

  const getStatName = (stat: string) => {
    const names: Record<string, { vi: string; en: string }> = {
      combatPower: { vi: 'Chiến Lực (CP)', en: 'Combat Power (CP)' },
      luck: { vi: 'Vận May', en: 'Luck' },
      comprehension: { vi: 'Ngộ Tính', en: 'Comprehension' },
      daoHeart: { vi: 'Đạo Tâm', en: 'Dao Heart' },
    };
    return names[stat]?.[language === 'vi' ? 'vi' : 'en'] || stat;
  };

  const getPlayerStatValue = (stat: string) => {
    const key = stat as keyof typeof playerStats;
    return playerStats[key] ?? 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Backdrop */}
      <button 
        type="button" 
        className="absolute inset-0 cursor-default focus:outline-none" 
        onClick={onClose} 
        aria-label="Close panel" 
      />

      {/* Main Panel Box */}
      <div className="adventure-card w-full max-w-2xl max-h-[85vh] p-6 overflow-y-auto relative z-10 animate-slide-up flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h2 className="font-serif text-2xl text-emerald-400 tracking-wider">
              {language === 'vi' ? '☯ Nhiệm Vụ Đường' : '☯ Sect Quest Hall'}
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              {language === 'vi' 
                ? `Thân phận hiện tại: ` 
                : `Current Rank: `}
              <strong className="text-purple-400 font-serif">{rankNames[currentRank][language === 'vi' ? 'vi' : 'en']}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-white text-xl font-serif focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Info Banner */}
        {hasActiveQuest && (
          <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-sm text-xs text-amber-300 leading-relaxed font-sans">
            ⚠️ {language === 'vi' 
              ? 'Bạn đang thực hiện một nhiệm vụ khác. Hoàn thành hoặc thất bại nhiệm vụ cũ trước khi nhận nhiệm vụ mới.' 
              : 'You are currently on an active quest. Complete or fail your current quest before accepting a new one.'}
          </div>
        )}

        {/* Quest List */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {sectQuests.map((quest) => {
            const isParty = questPartyModes[quest.id] ?? false;
            
            const minRankWeight = rankWeights[quest.minRank];
            const playerRankWeight = rankWeights[currentRank];
            const isRankEligible = playerRankWeight >= minRankWeight;

            // Check if player meets stat requirements
            let meetsStats = true;
            let requiredStatVal = 0;
            let playerStatVal = 0;
            if (quest.checkStat && quest.checkValue) {
              requiredStatVal = isParty ? Math.floor(quest.checkValue * 0.5) : quest.checkValue;
              playerStatVal = getPlayerStatValue(quest.checkStat);
              meetsStats = playerStatVal >= requiredStatVal;
            }

            const isCleanupQuest = quest.id === 'quest_cleanup';
            const isWarLevelLocked = isCleanupQuest && warLevel <= 50;

            const canAccept = isRankEligible && meetsStats && !hasActiveQuest && !isWarLevelLocked;

            // Calculate active rewards based on Solo vs Party
            const rewardContribution = isParty ? Math.max(1, Math.floor(quest.rewards.contribution * 0.5)) : quest.rewards.contribution;
            const rewardGold = quest.rewards.gold ? (isParty ? Math.max(1, Math.floor(quest.rewards.gold * 0.5)) : quest.rewards.gold) : 0;

            const difficultyBadge = difficultyColors[quest.difficulty] || 'border-zinc-800 text-text-primary';

            return (
              <div 
                key={quest.id}
                className={`bg-zinc-950/80 border border-zinc-800/60 p-4 rounded-sm flex flex-col gap-4 hover:border-[#5a4a3a] transition duration-300 relative overflow-hidden`}
              >
                {/* Title and Difficulty */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-serif text-base text-emerald-400 font-bold">
                      {quest.title[language === 'vi' ? 'vi' : 'en']}
                    </h3>
                    <span className="text-[10px] text-text-secondary tracking-wider block">
                      {language === 'vi' ? 'Yêu cầu thân phận: ' : 'Min Rank: '}
                      <strong className="text-text-primary uppercase font-serif">
                        {rankNames[quest.minRank][language === 'vi' ? 'vi' : 'en']}
                      </strong>
                    </span>
                  </div>
                  <span className={`text-xs uppercase font-sans font-bold border px-2 py-0.5 rounded-sm tracking-widest ${difficultyBadge}`}>
                    {quest.difficulty} Cấp
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-text-secondary leading-relaxed font-sans border-l-2 border-emerald-500/40 pl-3 py-1">
                  {quest.description[language === 'vi' ? 'vi' : 'en']}
                </p>

                {/* Option Toggles */}
                <div className="bg-[#0b0908] border border-[#2b241c] p-2 rounded-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <span className="text-xs text-emerald-400 font-serif font-semibold">
                    {language === 'vi' ? 'Phương thức hành trình:' : 'Mission Approach:'}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setQuestPartyModes(prev => ({ ...prev, [quest.id]: false }))}
                      className={`px-3 py-1 border text-xs rounded-sm font-serif transition-all duration-200 ${
                        !isParty 
                          ? 'border-emerald-500 bg-[#10b981]/10 text-emerald-400 font-bold shadow-md' 
                          : 'border-transparent bg-transparent text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      {language === 'vi' ? 'Độc Hành (Solo)' : 'Solo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestPartyModes(prev => ({ ...prev, [quest.id]: true }))}
                      className={`px-3 py-1 border text-xs rounded-sm font-serif transition-all duration-200 ${
                        isParty 
                          ? 'border-emerald-500 bg-[#10b981]/10 text-emerald-400 font-bold shadow-md' 
                          : 'border-transparent bg-transparent text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      {language === 'vi' ? 'Tổ Đội (Party)' : 'Party'}
                    </button>
                  </div>
                </div>

                {/* Requirements & Rewards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-t border-zinc-800/40 pt-3">
                  {/* Left Column: Requirements & Status */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-medium text-emerald-500 font-semibold font-serif">
                      {language === 'vi' ? 'Yêu Cầu & Thử Thách' : 'Requirements & Checks'}
                    </h4>
                    
                    <div className="space-y-1.5 font-sans text-text-secondary">
                      <div className="flex justify-between items-center">
                        <span>{language === 'vi' ? 'Thời gian:' : 'Duration:'}</span>
                        <span className="text-text-primary font-serif font-bold">{quest.durationMonths} {language === 'vi' ? 'Tháng' : 'Months'}</span>
                      </div>

                      {quest.checkStat && quest.checkValue && (
                        <div className="flex justify-between items-center">
                          <span>
                            {language === 'vi' ? 'Yêu cầu ' : 'Required '}
                            {getStatName(quest.checkStat)}:
                          </span>
                          <span className={`font-serif font-bold ${meetsStats ? 'text-emerald-400' : 'text-red-400'}`}>
                            {playerStatVal} / {requiredStatVal}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <span>{language === 'vi' ? 'Rủi ro thất bại:' : 'Failure Penalty:'}</span>
                        <span className={isParty ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {isParty 
                            ? (language === 'vi' ? 'An toàn (Đồng đội hỗ trợ)' : 'Safe (Rescued)') 
                            : (language === 'vi' ? 'Trừ Khí Huyết lớn (HP)' : 'High HP Loss')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Rewards */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-medium text-emerald-500 font-semibold font-serif">
                      {language === 'vi' ? 'Phần Thưởng Thực Nhận' : 'Expected Rewards'}
                    </h4>
                    
                    <div className="space-y-1.5 font-sans text-text-secondary">
                      <div className="flex justify-between items-center">
                        <span>{language === 'vi' ? 'Đóng góp Tông môn:' : 'Sect Contribution:'}</span>
                        <span className="text-purple-400 font-serif font-bold">+{rewardContribution}</span>
                      </div>

                      {rewardGold > 0 && (
                        <div className="flex justify-between items-center">
                          <span>{language === 'vi' ? 'Linh Thạch:' : 'Spirit Stones:'}</span>
                          <span className="text-amber-400 font-serif font-bold">+{rewardGold}</span>
                        </div>
                      )}

                      {quest.rewards.health && (
                        <div className="flex justify-between items-center">
                          <span>{language === 'vi' ? 'Sinh lực:' : 'Max HP:'}</span>
                          <span className="text-red-400 font-serif font-bold">+{quest.rewards.health}</span>
                        </div>
                      )}

                      {quest.rewards.comprehension && (
                        <div className="flex justify-between items-center">
                          <span>{language === 'vi' ? 'Ngộ tính:' : 'Comprehension:'}</span>
                          <span className="text-emerald-400 font-serif font-bold">+{quest.rewards.comprehension}</span>
                        </div>
                      )}

                      {quest.rewards.cultivation && (
                        <div className="flex justify-between items-center">
                          <span>{language === 'vi' ? 'Tu vi:' : 'Cultivation:'}</span>
                          <span className="text-blue-400 font-serif font-bold">+{quest.rewards.cultivation}</span>
                        </div>
                      )}

                      {quest.rewards.daoHeart && (
                        <div className="flex justify-between items-center">
                          <span>{language === 'vi' ? 'Đạo tâm:' : 'Dao Heart:'}</span>
                          <span className="text-indigo-400 font-serif font-bold">+{quest.rewards.daoHeart}</span>
                        </div>
                      )}

                      {quest.rewards.item && (
                        <div className="flex justify-between items-center border-t border-zinc-800/35 pt-1 mt-1 text-[11px]">
                          <span>{language === 'vi' ? 'Vật phẩm hiếm:' : 'Rare Item:'}</span>
                          <span className="text-emerald-400 font-serif font-bold">
                            [{quest.rewards.item.itemId.replace('item_', '').replace(/_/g, ' ')}] x{quest.rewards.item.quantity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-2 border-t border-zinc-800/30 pt-3 flex justify-end">
                  {isWarLevelLocked ? (
                    <span className="text-xs text-red-400 italic">
                      ⚠️ {language === 'vi' 
                        ? 'Chiến sự tông môn chưa đạt mức khốc liệt (Sect War Level > 50) để dọn dẹp tử địa.' 
                        : 'Sect War Level must be > 50 to unlock battlefield cleanup.'}
                    </span>
                  ) : !isRankEligible ? (
                    <span className="text-xs text-red-400 italic">
                      ⚠️ {language === 'vi' ? 'Thân phận không đủ điều kiện' : 'Required Rank not met'}
                    </span>
                  ) : !meetsStats ? (
                    <span className="text-xs text-red-400 italic">
                      ⚠️ {language === 'vi' ? 'Không đủ thuộc tính yêu cầu' : 'Insufficient stats for this approach'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAccept}
                      onClick={() => onAcceptQuest(quest, isParty)}
                      className={`px-4 py-1.5 font-serif text-xs rounded-sm transition duration-200 border ${
                        canAccept
                          ? 'border-emerald-500 bg-zinc-900 text-emerald-400 hover:bg-[#10b981] hover:text-[#0b0908] font-bold shadow-md cursor-pointer'
                          : 'border-zinc-800 bg-black/20 text-text-tertiary cursor-not-allowed'
                      }`}
                    >
                      {language === 'vi' ? 'Nhận Nhiệm Vụ' : 'Accept Quest'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
