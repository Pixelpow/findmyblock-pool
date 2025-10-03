import React, { useState, useEffect } from 'react';
import CardBase from './CardBase';
import { Icon } from './Icon';

const Accordion = ({ title, children, isOpen, onClick }) => (
    <div className={`border-b ${isOpen ? 'border-green-400/30' : 'border-slate-800'}`}>
        <button onClick={onClick} className={`flex justify-between items-center w-full py-4 text-left text-lg font-semibold transition-colors ${isOpen ? 'text-green-400' : 'text-gray-100'}`}>
            {/* Use monospace font for question-style titles */}
            <span className="font-mono font-semibold text-sm tracking-wide flex items-center gap-3">
                <span className={`inline-block w-2 h-2 rounded-full ${isOpen ? 'bg-green-400' : 'bg-slate-700'}`}></span>
                {title}
            </span>
            <Icon path={isOpen ? "M19.5 12h-15" : "M12 4.5v15m7.5-7.5h-15"} className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'text-green-400 rotate-90' : 'text-primary-text'}`} />
        </button>
        <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
            <div className="pb-4 text-gray-300 text-sm space-y-3">
                {children}
            </div>
        </div>
    </div>
);

export const ConnectionTutorial = ({ t }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [copied, setCopied] = useState(false);
    const [openAccordion, setOpenAccordion] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [entered, setEntered] = useState(false);
    const [tutorialWallet, setTutorialWallet] = useState('');

    useEffect(() => {
        // Trigger entrance animation
        const id = setTimeout(() => setEntered(true), 60);
        return () => clearTimeout(id);
    }, []);

    const stratumUrl = 'stratum+tcp://stratum.findmyblock.xyz:3335';

    // Normalize and dispatch wallet address so App can pick it up and show My Stats
    const submitWalletFromTutorial = (raw) => {
        if (!raw || typeof raw !== 'string') return;
        let s = raw.trim();
        s = s.replace(/^bitcoin:/i, '');
        s = s.replace(/\s+/g, '');
        s = s.replace(/[^\x21-\x7E]/g, '');
        if (/^bc1/i.test(s)) s = s.toLowerCase();
        if (!s) return;
        const ev = new CustomEvent('walletSubmit', { detail: s });
        window.dispatchEvent(ev);
    };

    const handleCopy = (textToCopy) => {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    };
    
    const toggleAccordion = (id) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    const tabs = ['general', 'rentals', 'bitaxe', 'avalon', 'nerdminer', 'cgminer', 'magicminer'];

    // Bitaxe style variants (10). Persist selection.
    const BITAXE_VARIANTS = [
        'minimal', 'panel', 'gradient', 'matrix', 'glass', 'terminal', 'cards', 'steps', 'compact', 'split'
    ];
    const [bitaxeStyle, setBitaxeStyle] = useState(() => {
        try { return localStorage.getItem('bitaxe_style_variant') || 'gradient'; } catch(e) { return 'gradient'; }
    });
    useEffect(() => {
        try { localStorage.setItem('bitaxe_style_variant', bitaxeStyle); } catch(e) {}
    }, [bitaxeStyle]);

    const BitaxeWrapper = ({ children }) => {
        // Provide container classes per variant
        const base = 'transition-all duration-500';
        const map = {
            minimal: base + ' space-y-4',
            panel: base + ' space-y-5 p-4 rounded-lg bg-slate-900/50 border border-slate-700/60 shadow-inner',
            gradient: base + ' space-y-6 p-5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900/60 border border-slate-700/40 shadow-lg shadow-black/40',
            matrix: base + ' space-y-4 p-4 rounded-lg bg-slate-950 relative overflow-hidden',
            glass: base + ' space-y-5 p-5 rounded-xl bg-slate-900/30 backdrop-blur-md border border-slate-600/40 shadow-lg',
            terminal: base + ' space-y-3 p-4 rounded-md bg-[#0b1117] text-[13px] font-mono border border-slate-800',
            cards: base + ' grid gap-4 md:grid-cols-2',
            steps: base + ' space-y-3 relative pl-4 before:absolute before:top-1 before:bottom-1 before:left-0 before:w-px before:bg-gradient-to-b before:from-amber-400/40 before:to-slate-700/40',
            compact: base + ' space-y-2 text-sm',
            split: base + ' grid md:grid-cols-5 gap-6 md:gap-8'
        };
        return <div className={map[bitaxeStyle] || map.minimal}>{children}</div>;
    };

    const BitaxeStep = ({ index, title, children }) => {
        if (bitaxeStyle === 'cards') {
            return (
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-700/60 hover:border-amber-400/40 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">{index}</span>
                        <h4 className="text-sm font-semibold text-gray-200 font-mono tracking-wide">{title}</h4>
                    </div>
                    <div className="text-gray-400 text-xs leading-relaxed space-y-1">{children}</div>
                </div>
            );
        }
        if (bitaxeStyle === 'steps') {
            return (
                <div className="pl-3 relative">
                    <div className="absolute -left-4 top-1 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[11px] font-bold text-amber-300">{index}</div>
                    <h4 className="text-sm font-semibold text-gray-200 font-mono tracking-wide mb-1">{title}</h4>
                    <div className="text-gray-400 text-xs leading-relaxed mb-3">{children}</div>
                </div>
            );
        }
        if (bitaxeStyle === 'split') {
            // In split layout we expect a 5-column grid; steps occupy full columns sequentially
            return (
                <div className="p-3 rounded-md bg-slate-900/40 border border-slate-700/50 flex flex-col">
                    <h4 className="text-[12px] font-semibold text-amber-200 font-mono mb-1 tracking-wide">{index}. {title}</h4>
                    <div className="text-gray-400 text-[11px] leading-snug flex-1">{children}</div>
                </div>
            );
        }
        // default / minimal etc
        return (
            <div className="space-y-1">
                <h4 className="text-sm font-semibold text-gray-200 font-mono tracking-wide flex items-center gap-2"><span className="inline-flex w-5 h-5 items-center justify-center rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold">{index}</span>{title}</h4>
                <div className="text-gray-400 text-xs leading-relaxed pl-1">{children}</div>
            </div>
        );
    };

    // matrix background effect
    const MatrixFx = () => (
        <div className="pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(circle_at_center,black,transparent)]">
            <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(56,189,248,0.08)_25%,rgba(56,189,248,0.08)_26%,transparent_27%,transparent_74%,rgba(56,189,248,0.08)_75%,rgba(56,189,248,0.08)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,rgba(56,189,248,0.08)_25%,rgba(56,189,248,0.08)_26%,transparent_27%,transparent_74%,rgba(56,189,248,0.08)_75%,rgba(56,189,248,0.08)_76%,transparent_77%)] bg-[length:14px_14px]" />
        </div>
    );
    
    const renderCode = (code, opts = {}) => (
            <div className={`relative rounded-lg my-3 p-4 ${opts.dark ? 'bg-slate-950/60 border border-slate-800/60' : 'bg-slate-900 border border-amber-400/10'} transform transition-all duration-300 overflow-hidden`}>
            <div className={`absolute -left-8 -top-8 w-48 h-48 ${opts.dark ? 'bg-slate-900/10' : 'bg-amber-400'} opacity-6 blur-3xl pointer-events-none`}></div>
            <div className="flex items-center justify-between">
                <code className="text-cyan-300 text-sm break-all font-mono">{code}</code>
                <div className="flex items-center gap-3">
                    {/* removed small Port/Pool badges per design request */}
                    <button onClick={() => handleCopy(code)} className={`inline-flex items-center gap-2 bg-gradient-to-b from-amber-400 to-amber-500 text-black text-xs font-bold py-1 px-3 rounded shadow-md ring-amber-400/20 ${copied ? 'scale-105 animate-pulse' : 'hover:brightness-105'}`}>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        {copied ? t('copied') : t('copy')}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStep = (title, content) => (
        <div>
            <h4 className="text-md font-semibold text-gray-200 mb-1 font-title">{title}</h4>
            <div className="text-gray-400 text-sm space-y-1 pl-4 border-l-2 border-slate-700">{content}</div>
        </div>
    );

    return (
        <div className="mt-8">
            {/* Single dark CardBase container — removed the outer lighter wrapper */}
            <CardBase className={`p-6 bg-slate-950/60 tile-gold-glow ${entered ? 'animate-fade-in-out' : 'opacity-0'}`}>
                {/* Persistent compact tabs row (small, tight, stays above the section) */}
                <div className="mb-3">
                    <div className="flex gap-1 items-center justify-end text-xs">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-2 py-0.5 rounded text-xs font-mono ${activeTab === tab ? 'text-white bg-slate-700 active-tab-border' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="transition-opacity duration-500">
                {activeTab === 'general' && (
                    <div className="space-y-10">
                        {/* Section: Quick Connect & Wallet */}
                        <div className="grid lg:grid-cols-5 gap-8 items-start">
                            <div className="lg:col-span-3 space-y-5">
                                <div>
                                    <h3 className="text-lg font-semibold text-amber-300 font-title">{t('quickConnectTitle')}</h3>
                                    <p className="text-sm text-gray-400 mt-1">{t('quickConnectDesc')}</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-slate-400 font-mono mb-2 block">{t('stratumURL')}</label>
                                        {renderCode(stratumUrl, {dark:true})}
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-slate-400 font-mono mb-1" htmlFor="tutorial-wallet-input">{t('pasteYourWallet')}</label>
                                        <div className="relative">
                                            <input
                                                id="tutorial-wallet-input"
                                                type="text"
                                                value={tutorialWallet}
                                                onChange={(e) => setTutorialWallet(e.target.value)}
                                                placeholder={t('walletPlaceholder')}
                                                className={`w-full bg-slate-900/70 border text-sm rounded-md px-3 py-2 pr-24 font-mono tracking-tight placeholder-gray-600 focus:outline-none focus:ring-1 transition ${tutorialWallet ? (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{20,}$/i.test(tutorialWallet.trim()) ? 'border-emerald-500/50 focus:border-emerald-400 ring-emerald-400/30' : 'border-rose-500/50 focus:border-rose-400 ring-rose-400/30') : 'border-slate-700 focus:border-amber-400 ring-amber-400/30'}`}
                                            />
                                            {/* Status pill */}
                                            {tutorialWallet && (
                                                <span className={`absolute top-1/2 -translate-y-1/2 right-2 text-[11px] font-mono px-2 py-0.5 rounded border ${/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{20,}$/i.test(tutorialWallet.trim()) ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'}`}>{/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{20,}$/i.test(tutorialWallet.trim()) ? t('walletValid') : t('walletInvalid')}</span>
                                            )}
                                            {/* Clear button */}
                                            {tutorialWallet && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTutorialWallet('');
                                                        try { localStorage.removeItem('solo_pool_wallet'); } catch(e) {}
                                                        window.dispatchEvent(new CustomEvent('walletClear'));
                                                        const el = document.getElementById('tutorial-wallet-input'); if (el) el.focus();
                                                    }}
                                                    className="absolute right-[90px] top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                                    aria-label="Clear"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 font-mono">{t('pasteYourWalletHelp')}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        <button
                                            onClick={() => { submitWalletFromTutorial(tutorialWallet); }}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md text-black bg-amber-500 hover:bg-amber-600 shadow shadow-amber-500/20"
                                        >
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                                            {t('view')}
                                        </button>
                                        <button
                                            onClick={() => setShowDetails(s => !s)}
                                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md border border-slate-600/60 text-slate-300 hover:border-amber-400/50 hover:text-amber-200 transition"
                                            aria-expanded={showDetails}
                                        >
                                            <svg className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                            {showDetails ? t('hideAdvanced') : t('showAdvanced')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* Side panel: security reminder */}
                            <div className="lg:col-span-2">
                                <div className="relative p-5 rounded-xl border border-slate-700/70 bg-gradient-to-br from-slate-900/70 to-slate-900/30 overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
                                    <h4 className="text-sm font-mono tracking-wide text-amber-300 mb-2 flex items-center gap-2"><svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>{t('securityReminder')}</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">{t('securityReminderDesc')}</p>
                                    <ul className="mt-3 space-y-1 text-[11px] text-slate-400 font-mono">
                                        <li className="flex items-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{t('howToSecureL4')}</li>
                                        <li className="flex items-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{t('howToSecureL5')}</li>
                                        <li className="flex items-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{t('howToSecureL6')}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Advanced accordion area */}
                        {showDetails && (
                            <div className="space-y-2 border-t border-slate-800 pt-6">
                                <Accordion title={t('howToSecureTitle')} isOpen={openAccordion === 'secure'} onClick={() => toggleAccordion('secure')}>
                                    <p>{t('howToSecureL1')}</p>
                                    <p>{t('howToSecureL2')}</p>
                                    <p className="font-semibold text-gray-300 pt-2">{t('howToSecureL3')}</p>
                                    <ul className="list-disc list-inside space-y-1 pl-2">
                                        <li>{t('howToSecureL4')}</li>
                                        <li>{t('howToSecureL5')}</li>
                                        <li>{t('howToSecureL6')}</li>
                                    </ul>
                                    <p className="font-bold text-yellow-400 pt-2">{t('howToSecureL7')}</p>
                                </Accordion>
                                <Accordion title={t('variableDifficulty')} isOpen={openAccordion === 'vardiff'} onClick={() => toggleAccordion('vardiff')}>
                                    <p>{t('vardiffTooltip')}</p>
                                </Accordion>
                                <Accordion title={t('howRewardsWorkTitle')} isOpen={openAccordion === 'rewards'} onClick={() => toggleAccordion('rewards')}>
                                    <p>{t('howRewardsWorkL1')}</p>
                                    <p>{t('howRewardsWorkL2')}</p>
                                    <h4 className="text-md font-semibold text-gray-200 mb-1 font-title mt-4">{t('howRewardsWorkStep1Title')}</h4>
                                    <p>{t('howRewardsWorkStep1Desc')}</p>
                                    <h4 className="text-md font-semibold text-gray-200 mb-1 font-title mt-4">{t('howRewardsWorkStep2Title')}</h4>
                                    <p>{t('howRewardsWorkStep2Desc')}</p>
                                    <h4 className="text-md font-semibold text-gray-200 mb-1 font-title mt-4">{t('howRewardsWorkStep3Title')}</h4>
                                    <p>{t('howRewardsWorkStep3Desc')}</p>
                                    <p className="font-bold text-yellow-400 pt-2">{t('howRewardsWorkStep4')}</p>
                                </Accordion>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'bitaxe' && (
                    <div className="relative">
                        {/* Style selector + discreet overclock link */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">{t('bitaxeLayoutStyle')}:</span>
                                <select
                                    value={bitaxeStyle}
                                    onChange={e => setBitaxeStyle(e.target.value)}
                                    className="bg-slate-900/70 border border-slate-700 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-amber-400/60 focus:ring-0"
                                >
                                    {BITAXE_VARIANTS.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <a
                                href="https://youtu.be/p2TU7An_Itk"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-400/60 transition-colors"
                                title={t('bitaxeOverclockGuide')}
                            >
                                <svg className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V6"/><path d="M5 13l7-7 7 7"/></svg>
                                <span>{t('bitaxeOverclockGuide')}</span>
                            </a>
                        </div>
                        <BitaxeWrapper>
                            {bitaxeStyle === 'matrix' && <MatrixFx />}
                            <BitaxeStep index={1} title={t('firmwareUpdate')}><span>{t('flashBitaxe')} <a href="https://github.com/bitaxe-org/bitaxe/releases" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">{t('officialGitHub')}</a>.</span></BitaxeStep>
                            <BitaxeStep index={2} title={t('networkSetup')}>{t('connectBitaxeWifi')}</BitaxeStep>
                            <BitaxeStep index={3} title={t('interfaceAccess')}>{t('openBrowser')} <code className="text-cyan-400">192.168.4.1</code></BitaxeStep>
                            <BitaxeStep index={4} title={t('wifiSettings')}>{t('configureWifi')}</BitaxeStep>
                            <BitaxeStep index={5} title={t('poolConfiguration')}>
                                <div className="space-y-2">
                                    <div><strong className="text-gray-300">{t('stratumURL')}:</strong> {renderCode(stratumUrl, {dark:true})}</div>
                                    <div><strong className="text-gray-300">{t('stratumUser')}:</strong> {t('yourBitcoinAddress')}</div>
                                    <div><strong className="text-gray-300">{t('stratumPassword')}:</strong> {t('leaveBlankOrX')}</div>
                                </div>
                            </BitaxeStep>
                            <BitaxeStep index={6} title={t('finalization')}>{t('saveRestart')}</BitaxeStep>
                        </BitaxeWrapper>
                    </div>
                )}
                {activeTab === 'avalon' && (
                    <div className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-700/60">
                                <h3 className="text-sm font-mono tracking-wide text-amber-300 mb-3">{t('mobileApp')}</h3>
                                {renderStep('1. ' + t('downloadAvalonApp'), <p>{t('connectMinerWifi')}</p>)}
                                {renderStep('2. ' + t('openAppScan'), <p>{t('goToSettingsPool')}</p>)}
                                {renderStep('3. ' + t('poolConfiguration'), <>
                                    <div><strong className="text-gray-300">{t('pool1')}:</strong> {renderCode(stratumUrl, {dark:true})}</div>
                                    <div><strong className="text-gray-300">{t('worker')}:</strong> {t('yourBitcoinAddress')}</div>
                                    <div><strong className="text-gray-300">{t('password')}:</strong> {t('leaveBlankOrX')}</div>
                                </>)}
                            </div>
                            <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-700/60">
                                <h3 className="text-sm font-mono tracking-wide text-amber-300 mb-3">{t('browserConfiguration')}</h3>
                                {renderStep('1. ' + t('getMinerIP'), <p>{t('openMinerIP')}</p>)}
                                {renderStep('2. ' + t('goToConfigPool'), <p>{t('poolConfiguration')}</p>)}
                                {renderStep('3. ' + t('poolConfiguration'), <>
                                    <div><strong className="text-gray-300">{t('pool1')}:</strong> {renderCode(stratumUrl, {dark:true})}</div>
                                    <div><strong className="text-gray-300">{t('worker')}:</strong> {t('yourBitcoinAddress')}</div>
                                    <div><strong className="text-gray-300">{t('password')}:</strong> {t('leaveBlankOrX')}</div>
                                </>)}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'nerdminer' && (
                    <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-700/60 space-y-5">
                        <h3 className="text-sm font-mono tracking-wide text-amber-300">NerdMiner</h3>
                        {renderStep('1. ' + t('connectNerdMinerUSB'), <p>{t('connectNerdMinerAP')}</p>)}
                        {renderStep('2. ' + t('interfaceAccess'), <p>{t('browserAutoOpen')}</p>)}
                        {renderStep('3. ' + t('configureWifiNerdMiner'), <p>{t('modifyDefaultSettings')}</p>)}
                        {renderStep('4. ' + t('poolConfiguration'), <>
                            <div><strong className="text-gray-300">{t('pool')}:</strong> {renderCode(stratumUrl, {dark:true})}</div>
                            <div><strong className="text-gray-300">{t('btcAddress')}:</strong> {t('yourBitcoinAddress')} <span className="text-amber-400">{t('bc1qFormat')}</span></div>
                        </>)}
                    </div>
                )}
                {activeTab === 'cgminer' && (
                    <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-700/60 space-y-5">
                        <h3 className="text-sm font-mono tracking-wide text-amber-300">CGMiner</h3>
                        {renderStep('1. ' + t('downloadCGMiner'), <p><a href="https://bitcointalk.org/index.php?topic=28402.0" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">bitcointalk.org</a></p>)}
                        {renderStep('2. ' + t('createBatFile'), <>
                            {renderCode(`cgminer.exe -o ${stratumUrl} -u YOUR_BTC_ADDRESS -p x`, {dark:true})}
                            <div>Replace <code className="text-cyan-400">YOUR_BTC_ADDRESS</code> with your actual Bitcoin wallet address.</div>
                        </>)}
                        {renderStep('3. ' + t('runBatFile'), <p>{t('runBatFile')}</p>)}
                    </div>
                )}
                {activeTab === 'magicminer' && (
                    <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-700/60 space-y-5">
                        <h3 className="text-sm font-mono tracking-wide text-amber-300">MagicMiner</h3>
                        {renderStep('1. ' + t('downloadMagicMiner'), <p><a href="https://github.com/magic-miner/magic-miner-GUI/releases" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">GitHub</a>.</p>)}
                        {renderStep('2. ' + t('unzipAndRun'), <p>{t('enterPoolDetails')}</p>)}
                        {renderStep('3. ' + t('poolConfiguration'), <>
                            <div><strong className="text-gray-300">{t('pool')}:</strong> {renderCode(stratumUrl, {dark:true})}</div>
                            <div><strong className="text-gray-300">{t('worker')}:</strong> {t('yourBitcoinAddress')}</div>
                            <div><strong className="text-gray-300">{t('password')}:</strong> {t('leaveBlankOrX')}</div>
                        </>)}
                    </div>
                )}
                {activeTab === 'rentals' && (
                    <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-700/60 space-y-8">
                        <h3 className="text-sm font-mono tracking-wide text-amber-300 flex items-center gap-2">{t('rentalsShort')}<span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-400/20">NEW</span></h3>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{t('rentalsDesc')}</p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-md bg-slate-950/50 border border-slate-700/60 flex flex-col gap-2">
                                <h4 className="text-[12px] font-mono tracking-wide text-amber-300">{t('rentalsStep1')}</h4>
                                <p className="text-xs text-slate-400">MiningRigRentals</p>
                            </div>
                            <div className="p-4 rounded-md bg-slate-950/50 border border-slate-700/60 flex flex-col gap-2">
                                <h4 className="text-[12px] font-mono tracking-wide text-amber-300">{t('rentalsStep2')}</h4>
                                <p className="text-xs text-slate-400">BTC / LTC / etc.</p>
                            </div>
                            <div className="p-4 rounded-md bg-slate-950/50 border border-slate-700/60 flex flex-col gap-2">
                                <h4 className="text-[12px] font-mono tracking-wide text-amber-300">{t('rentalsStep3')}</h4>
                                <p className="text-xs text-slate-400">URL + {t('yourBitcoinAddress')}</p>
                            </div>
                        </div>
                        <div className="pt-2">
                            <h4 className="text-[11px] font-mono tracking-wide text-amber-300 mb-3 flex items-center gap-2">{t('rentalsAlgoTitle')}<span className="h-px flex-1 bg-slate-700/60"></span></h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-md bg-slate-950/60 border border-slate-700/60 hover:border-amber-400/40 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[12px] font-mono text-emerald-300">{t('rentalsAlgoBoost')}</span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">OPTIMAL</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">{t('rentalsAlgoNote')}</p>
                                </div>
                                <div className="p-4 rounded-md bg-slate-950/60 border border-slate-700/60">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[12px] font-mono text-slate-300">{t('rentalsAlgoStandard')}</span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-600/20 text-slate-300 border border-slate-600/40">FALLBACK</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">{t('rentalsAlgoNote')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-2">
                            <a
                                href="https://www.miningrigrentals.com/?ref=53899"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md text-black bg-amber-500 hover:bg-amber-600 shadow shadow-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:ring-offset-0"
                                title="MiningRigRentals (affiliate)"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                                {t('rentalsButton')}
                            </a>
                        </div>
                    </div>
                )}
                </div>
            </CardBase>
        </div>
    );
};