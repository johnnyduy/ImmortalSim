'use client';

import { useState } from 'react';
import { GameState, ItemInstance, SectShopItem } from '../types';
import itemsData from '../data/items.json';
import sectShopData from '../data/sect-shop.json';
import { uiText } from '../lib/i18n';

interface SectShopModalProps {
  state: GameState;
  onUpdateState: (newState: GameState) => void;
  onClose: () => void;
  language?: 'vi' | 'en';
}

export default function SectShopModal({ state, onUpdateState, onClose, language = 'vi' }: SectShopModalProps) {
  const shopItems = sectShopData as SectShopItem[];
  
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

  const playerRankWeight = rankWeights[state.sectRank || 'ngoại_môn'];

  const handleExchange = (shopItem: SectShopItem) => {
    if ((state.sectContribution || 0) < shopItem.cost) {
      alert((uiText[language]?.['notEnoughSectContrib'] || 'Not enough sect contribution!'));
      return;
    }

    const nextState = { ...state };
    nextState.sectContribution = (nextState.sectContribution || 0) - shopItem.cost;

    let itemName = '';

    if (shopItem.type === 'item' && shopItem.itemId) {
      const baseItem = (itemsData as ItemInstance[]).find(i => i.id === shopItem.itemId);
      if (baseItem) {
        itemName = baseItem.name;
        const newItem: ItemInstance = {
          ...baseItem,
          id: `${baseItem.id}_shop_${Date.now()}`,
          quantity: shopItem.quantity || 1
        };
        nextState.inventory = [...(nextState.inventory || []), newItem];
      }
    } else if (shopItem.type === 'technique' && shopItem.techniqueId) {
      // Find if player already has this technique
      const existingTechIndex = nextState.techniques?.findIndex(t => t.id === shopItem.techniqueId) ?? -1;
      
      // Infer name from ID
      itemName = shopItem.techniqueId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      if (existingTechIndex >= 0 && nextState.techniques) {
        const nextTechs = [...nextState.techniques];
        nextTechs[existingTechIndex] = {
          ...nextTechs[existingTechIndex],
          fragmentsCollected: nextTechs[existingTechIndex].fragmentsCollected + (shopItem.quantity || 1)
        };
        nextState.techniques = nextTechs;
      } else {
        // If they don't have it, add it
        const newTech: any = { 
          id: shopItem.techniqueId,
          name: itemName,
          type: 'tâm_pháp',
          tier: shopItem.techniqueId.includes('hoang') ? 'hoàng' : shopItem.techniqueId.includes('dia') ? 'địa' : 'thiên',
          completeness: 'tàn_quyển',
          isActive: false,
          fragmentsCollected: shopItem.quantity || 1,
          fragmentsRequired: 10
        };
        nextState.techniques = [...(nextState.techniques || []), newTech];
      }
    }

    nextState.log = [
      ...nextState.log, 
      { 
        type: 'info', 
        message: { 
          vi: `Đổi thành công ${shopItem.quantity || 1}x ${itemName} tại Tông Môn Bảo Các (Trừ ${shopItem.cost} Cống hiến).`, 
          en: `Successfully exchanged ${shopItem.quantity || 1}x ${itemName} at Sect Vault (-${shopItem.cost} Contribution).` 
        } 
      }
    ];

    onUpdateState(nextState);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border-2 border-emerald-500/60 rounded-xl max-w-4xl w-full flex flex-col overflow-hidden text-text-primary shadow-[0_0_30px_rgba(197,160,89,0.15)] relative max-h-[90vh]">
        
        <div className="bg-zinc-900/80 p-4 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-emerald-400">
              {(uiText[language]?.['sectVault'] || 'SECT VAULT')}
            </h2>
            <div className="text-sm text-text-secondary mt-1">
              {(uiText[language]?.['currentContribution'] || 'Current Contribution: ')}
              <span className="text-emerald-500 font-bold">{state.sectContribution || 0}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-red-400 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {shopItems.map((item, idx) => {
            const reqRankWeight = rankWeights[item.minRank];
            const isLocked = playerRankWeight < reqRankWeight;
            const canAfford = (state.sectContribution || 0) >= item.cost;
            
            let displayName = '';
            let description = '';
            let displayTier = '';
            
            if (item.type === 'item' && item.itemId) {
              const baseItem = (itemsData as ItemInstance[]).find(i => i.id === item.itemId);
              displayName = baseItem?.name || item.itemId;
              description = baseItem?.description || '';
              displayTier = baseItem?.tier || '';
            } else if (item.type === 'technique' && item.techniqueId) {
              displayName = item.techniqueId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' (Mảnh)';
              description = (uiText[language]?.['techniqueFragmentCol'] || 'Technique fragment, collect enough to comprehend.');
              displayTier = item.techniqueId.includes('hoang') ? 'hoàng' : item.techniqueId.includes('dia') ? 'địa' : 'thiên';
            }

            return (
              <div 
                key={idx} 
                className={`p-4 border rounded-sm flex flex-col justify-between ${isLocked ? 'border-zinc-800/40 bg-zinc-950/40 opacity-70' : 'border-emerald-500/30 bg-zinc-900/60 hover:border-emerald-500/60'}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-serif font-bold text-lg ${isLocked ? 'text-gray-500' : 'text-emerald-400'}`}>
                      {displayName} {item.quantity && item.quantity > 1 ? `x${item.quantity}` : ''}
                    </h3>
                    {displayTier && (
                      <span className="text-xs uppercase px-2 py-1 bg-zinc-800/50 rounded text-text-secondary">
                        {displayTier}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                    {description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="text-sm">
                    {isLocked ? (
                      <span className="text-red-400/80 italic">
                        {(uiText[language]?.['requiredRanknamesite'] || 'Required: ${rankNames[item.minRank].en}')}
                      </span>
                    ) : (
                      <span className={`font-bold ${canAfford ? 'text-emerald-500' : 'text-red-400'}`}>
                        {item.cost} {(uiText[language]?.['contrib'] || 'Contrib')}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleExchange(item)}
                    disabled={isLocked || !canAfford}
                    className={`px-4 py-2 rounded text-sm font-bold tracking-wide transition-colors ${
                      isLocked || !canAfford 
                        ? 'bg-zinc-800 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#10b981]/20 text-emerald-400 hover:bg-[#10b981]/40 border border-emerald-500/50'
                    }`}
                  >
                    {(uiText[language]?.['exchange'] || 'EXCHANGE')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
