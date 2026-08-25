import React, { useState } from 'react';
import { 
  Wifi, 
  Smartphone, 
  Globe, 
  CheckCircle2, 
  X, 
  HelpCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw
} from 'lucide-react';

interface NetworkHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkHelpModal: React.FC<NetworkHelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'mobile' | 'wifi' | 'dns'>('mobile');
  const [copiedDns, setCopiedDns] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDns(text);
    setTimeout(() => setCopiedDns(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#121E36] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#233558] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Zap className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">মোবাইল ডাটা ও ওয়াইফাই সংযোগ নির্দেশিকা</h3>
              <p className="text-xs text-emerald-100 mt-0.5">সব নেটওয়ার্কে দ্রুত অ্যাপ খোলার স্থায়ী সমাধান</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-[#233558] bg-slate-50 dark:bg-[#0D172A] px-3 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'mobile'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#121E36]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            মোবাইল ডাটা (GP/Robi/BL)
          </button>
          <button
            onClick={() => setActiveTab('dns')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'dns'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#121E36]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Private DNS (স্থায়ী সমাধান)
          </button>
          <button
            onClick={() => setActiveTab('wifi')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'wifi'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#121E36]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            ওয়াইফাই ও ব্রাউজার
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-300 text-sm">
          {activeTab === 'mobile' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  <strong>অফলাইন ক্যাশ প্রযুক্তি যুক্ত করা হয়েছে:</strong> মোবাইল ডাটা ধীরগতির হলেও অ্যাপের প্রশ্ন এবং বিষয় তাৎক্ষণিকভাবে লোড হবে।
                </p>
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white text-sm">সিম কার্ড ডাটার ক্ষেত্রে যা করবেন:</h4>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">১</span>
                  <span><strong>Google Chrome বা Brave ব্রাউজার ব্যবহার করুন:</strong> Opera Mini এর Data Saver বা Extreme মোড অন থাকলে কিছু স্ক্রিপ্ট আটকে যায়। Chrome বা Brave এ এমন সমস্যা হয় না।</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">২</span>
                  <span><strong>Data Saver বন্ধ করুন:</strong> ফোনের নোটিফিকেশন বার থেকে Data Saver অন থাকলে ব্রাউজার ব্যাকগ্রাউন্ড কানেকশন স্লো হতে পারে।</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">৩</span>
                  <span><strong>১ বার Private DNS সেট করুন:</strong> গ্রামীণফোন, রবি ও বাংলালিংক সিমের DNS মাঝে মাঝে ব্লক হতে পারে। Private DNS দিলে আজীবন কোনো সমস্যা হবে না।</span>
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'dns' && (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                বাংলাদেশের মোবাইল অপারেটরদের DNS মাঝেমধ্যে ক্লাউড সার্ভার ব্লক করে। নিচের সেটিংসটি ১ বার করে নিলে যেকোনো সিম ও ওয়াইফাইতে সর্বোচ্চ স্পিডে চলবে:
              </p>

              <div className="bg-slate-100 dark:bg-[#0D172A] p-3.5 rounded-xl border border-slate-200 dark:border-[#233558] space-y-2.5">
                <h5 className="font-bold text-xs text-slate-900 dark:text-white">অ্যান্ড্রয়েড ফোনে মাত্র ৩ ধাপ:</h5>
                <ol className="list-decimal list-inside text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <li>ফোনের <strong>Settings</strong> ➔ <strong>Connections / Network</strong> এ যান।</li>
                  <li><strong>Private DNS</strong> অপশনটি খুঁজুন।</li>
                  <li><strong>Private DNS provider hostname</strong> সিলেক্ট করে নিচের যেকোনো একটি বসান:</li>
                </ol>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between bg-white dark:bg-[#121E36] p-2.5 rounded-lg border border-slate-200 dark:border-[#233558]">
                    <div>
                      <span className="text-xs text-slate-500 block">Google DNS (সুপার ফাস্ট)</span>
                      <code className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">dns.google</code>
                    </div>
                    <button
                      onClick={() => handleCopy('dns.google')}
                      className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-emerald-100"
                    >
                      {copiedDns === 'dns.google' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedDns === 'dns.google' ? 'কপি হয়েছে' : 'কপি করুন'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white dark:bg-[#121E36] p-2.5 rounded-lg border border-slate-200 dark:border-[#233558]">
                    <div>
                      <span className="text-xs text-slate-500 block">Cloudflare DNS</span>
                      <code className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">1dot1dot1dot1.cloudflare-dns.com</code>
                    </div>
                    <button
                      onClick={() => handleCopy('1dot1dot1dot1.cloudflare-dns.com')}
                      className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-emerald-100"
                    >
                      {copiedDns === '1dot1dot1dot1.cloudflare-dns.com' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedDns === '1dot1dot1dot1.cloudflare-dns.com' ? 'কপি হয়েছে' : 'কপি করুন'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wifi' && (
            <div className="space-y-3.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">ব্রাউজার ক্যাশ ও ওয়াইফাই অপ্টিমাইজেশন:</h4>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>অ্যাড-টু-হোমস্ক্রিন (PWA):</strong> ক্রোম ব্রাউজারের ৩ ডট মেনু থেকে <strong>"Install App"</strong> বা <strong>"Add to Home screen"</strong> করে নিলে সাধারণ অ্যাপের মতো কোনো লোডিং ছাড়াই সবসময় ওপেন হবে।</span>
                </li>
                <li className="flex items-start gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>ক্যাশ ক্লিয়ার:</strong> ব্রাউজার স্লো মনে হলে History ➔ Clear Browsing Data দিয়ে ১ বার রিফ্রেশ দিন।</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0D172A] border-t border-slate-200 dark:border-[#233558] flex items-center justify-between">
          <span className="text-xs text-slate-500">আত-তামরীন অনলাইন একাডেমি</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            বুঝেছি, ধন্যবাদ
          </button>
        </div>
      </div>
    </div>
  );
};
