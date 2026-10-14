import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, CheckCircle2, MoreVertical, PlusSquare, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ar' | 'en';
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose, lang = 'ar' }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-sky-500/30 bg-[#070d1e] p-6 shadow-2xl text-slate-100"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header with Integrated Close Button */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 shrink-0 flex items-center justify-center">
                <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>{lang === 'ar' ? 'تثبيت تطبيق shadow.ai' : 'Install shadow.ai App'}</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                    Android & Web
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'ar'
                    ? 'يعمل كتطبيق أصلي سريع بدون متصفح مع أيقونة على شاشتك'
                    : 'Runs as a native standalone app on your home screen'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition shrink-0"
              title={lang === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* App Status / Direct Install */}
          {isInstalled ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 mb-4">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span className="text-sm">
                {lang === 'ar' ? 'التطبيق مُثبت بالفعل على جهازك ويعمل بوضع ملء الشاشة!' : 'App is already installed and ready!'}
              </span>
            </div>
          ) : isInstallable ? (
            <div className="mb-5">
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-sky-500/25 transition active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                <span>{lang === 'ar' ? 'تثبيت الآن على Android بنقرة واحدة' : 'Install Now on Android (1-Click)'}</span>
              </button>
            </div>
          ) : null}

          {/* Android Step-by-Step Instructions */}
          <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 mb-5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'ar' ? 'خطوات التثبيت السريعة على هواتف أندرويد:' : 'Easy Android Installation Steps:'}</span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                1
              </div>
              <p>
                {lang === 'ar' ? (
                  <>
                    افتح القائمة من النقاط الثلاث <MoreVertical className="inline w-3.5 h-3.5 text-slate-400" /> في أعلى يسار متصفح Chrome أو أي متصفح أندرويد.
                  </>
                ) : (
                  'Open the Chrome menu (three dots at the top).'
                )}
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                2
              </div>
              <p>
                {lang === 'ar' ? (
                  <>
                    اختر <strong className="text-white">«تثبيت التطبيق» (Install App)</strong> أو{' '}
                    <strong className="text-white">«إضافة إلى الشاشة الرئيسية»</strong>{' '}
                    <PlusSquare className="inline w-3.5 h-3.5 text-sky-400" />.
                  </>
                ) : (
                  'Select "Install App" or "Add to Home Screen".'
                )}
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                3
              </div>
              <p>
                {lang === 'ar' ? (
                  <>
                    ستظهر أيقونة <strong className="text-sky-300">shadow.ai</strong> مباشرة على شاشة هاتفك وتفتح كتطبيق سريع بدون شريط المتصفح!
                  </>
                ) : (
                  'The shadow.ai icon will appear directly on your home screen with full native app experience.'
                )}
              </p>
            </div>
          </div>

          {/* Footer Features */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-4">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>{lang === 'ar' ? 'يعمل بدون إنترنت (Offline)' : 'Offline Support'}</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{lang === 'ar' ? 'استجابة فائقة السرعة' : 'Ultra-fast performance'}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
          >
            {lang === 'ar' ? 'تم، إغلاق' : 'Got it, Close'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
