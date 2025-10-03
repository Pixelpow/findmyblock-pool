import React, { useState } from 'react';
import { Icon } from './Icon';

export const Footer = ({ t }) => {
  const btcAddress = "bc1q4jefr6uu2v42a4x5mkqwt6rftkyr86rpzffh5v4a5k78pw7vv4us9r5tyy";
  const lightningAddress = "morninghaze22032@getalby.com";
  const [copied, setCopied] = useState('');

  const handleCopy = (address, type) => {
    navigator.clipboard.writeText(address);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  // Compute days since pool start (persisted date in localStorage)
  const poolStartKey = 'pool_start_date';
  let poolStart = null;
  try {
    poolStart = localStorage.getItem(poolStartKey);
    if (!poolStart) {
      // Start the counter at the same day 3 months ago
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      poolStart = threeMonthsAgo.toISOString();
      try { localStorage.setItem(poolStartKey, poolStart); } catch (e) { /* ignore */ }
    }
  } catch (e) { const fallback = new Date(); fallback.setMonth(fallback.getMonth() - 3); poolStart = fallback.toISOString(); }
  const startTs = new Date(poolStart).getTime();
  const daysSince = Math.max(0, Math.floor((Date.now() - startTs) / (1000 * 60 * 60 * 24)));

  return (
    <footer className="bg-slate-950/60 border-t border-slate-700/50 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-sm">
        
        <div className="mb-8">
          <p className="mb-4">{t('donationMessage')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="inline-flex items-center justify-center bg-slate-800 rounded-full px-3 py-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" alt="Bitcoin" className="w-5 h-5 mr-2"/>
              <code className="text-xs text-gray-300 break-all">{btcAddress}</code>
              <button 
                onClick={() => handleCopy(btcAddress, 'btc')} 
                className="ml-3 text-gray-500 hover:text-amber-400 transition-colors flex-shrink-0"
                title={copied === 'btc' ? t('copied') : t('copy')}
              >
                <Icon path={copied === 'btc' ? "M4.5 12.75l6 6 9-13.5" : "M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.393-.03.792-.03 1.188 0 1.13.094 1.976 1.057 1.976 2.192V7.5m-9 7.5h12.75a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5H6.75a1.5 1.5 0 00-1.5 1.5v6a1.5 1.5 0 001.5 1.5z"} className="w-5 h-5" />
              </button>
            </div>
            <div className="inline-flex items-center justify-center bg-slate-800 rounded-full px-3 py-2">
              <Icon path="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" className="w-5 h-5 mr-2 text-yellow-400"/>
              <code className="text-xs text-gray-300 break-all">{lightningAddress}</code>
              <button 
                onClick={() => handleCopy(lightningAddress, 'ln')} 
                className="ml-3 text-gray-500 hover:text-amber-400 transition-colors flex-shrink-0"
                title={copied === 'ln' ? t('copied') : t('copy')}
              >
                <Icon path={copied === 'ln' ? "M4.5 12.75l6 6 9-13.5" : "M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.393-.03.792-.03 1.188 0 1.13.094 1.976 1.057 1.976 2.192V7.5m-9 7.5h12.75a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5H6.75a1.5 1.5 0 00-1.5 1.5v6a1.5 1.5 0 001.5 1.5z"} className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="mb-4">{t('ourPartners')}</p>
          <div className="flex justify-center items-center space-x-8">
            <a href="https://mineshop.eu/?wpam_id=35" target="_blank" rel="noopener noreferrer">
              <img src="/mineshop-logo.webp" alt="Mineshop Logo" className="h-12 filter grayscale hover:grayscale-0 transition duration-300"/>
            </a>
            <a href="https://www.miningrigrentals.com?ref=53899" target="_blank" rel="noopener noreferrer">
              <img src="/mrr-logo2.png" alt="MiningRigRentals Logo" className="h-12 filter grayscale hover:grayscale-0 transition duration-300"/>
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-6 mb-4">
          <p>Uptime : <span className="text-green-400">{daysSince} {daysSince === 1 ? t('day') : t('days')}</span></p>
          <div className="flex items-center space-x-4">
            <span>{t('joinUsOn')}:</span>
            <a href="https://discord.gg/zEFrHyTF9Q" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-300 hover:text-green-400 transition-colors">Discord</a>
            <a href="https://x.com/findmyblock" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-300 hover:text-green-400 transition-colors">X</a>
          </div>
        </div>

        <p className="text-gray-500">&copy; {new Date().getFullYear()} FindMyBlock.xyz. {t('allRightsReserved')}</p>
      </div>
    </footer>
  );
};