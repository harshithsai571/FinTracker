import React from 'react';
import { Sparkles, Download, ShieldCheck, ExternalLink } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ReleaseInfo } from '../../services/native/updateService';

interface NativeUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: ReleaseInfo | null;
  currentVersion: string;
  onUpdate: (downloadUrl: string) => void;
}

export const NativeUpdateModal: React.FC<NativeUpdateModalProps> = ({
  isOpen,
  onClose,
  release,
  currentVersion,
  onUpdate,
}) => {
  if (!release) return null;

  // Format release notes into clean bullet items if formatted as markdown
  const parseNotes = (notes: string) => {
    if (!notes) return [];
    return notes
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('*') || line.startsWith('-') || line.startsWith('•'))
      .map(line => line.replace(/^[\*\-•]\s*/, '').trim())
      .filter(Boolean);
  };

  const bullets = parseNotes(release.releaseNotes);
  const formattedSize = release.assetSize
    ? `${(release.assetSize / (1024 * 1024)).toFixed(1)} MB`
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          <span>New version available</span>
        </div>
      }
      description={`An update for FinTracker is available to download.`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Version Compare Banner */}
        <div className="p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400">
              New Release
            </p>
            <p className="text-lg font-black text-brand-700 dark:text-brand-300">
              FinTracker v{release.version}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400">
              Installed Version
            </p>
            <p className="text-sm font-bold text-surface-700 dark:text-surface-300">
              v{currentVersion}
            </p>
          </div>
        </div>

        {/* Release Notes / What's New */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 uppercase tracking-wider">
            What's New in This Release
          </h4>

          {bullets.length > 0 ? (
            <ul className="space-y-1.5 p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700/80 text-xs text-surface-700 dark:text-surface-300">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700/80 text-xs text-surface-600 dark:text-surface-400 whitespace-pre-line">
              {release.releaseNotes || 'Performance optimizations and stability enhancements.'}
            </div>
          )}
        </div>

        {/* Package info & Data Safety Guarantee */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-bold">Financial Data Preserved</p>
            <p className="text-emerald-700 dark:text-emerald-400">
              Your recorded transactions, categories, and balances are stored securely in IndexedDB and remain 100% intact across updates.
            </p>
            {formattedSize && (
              <p className="mt-1 font-medium text-surface-500 dark:text-surface-400">
                Package size: {formattedSize}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 text-xs font-semibold"
            onClick={onClose}
          >
            Later
          </Button>
          <Button
            variant="primary"
            className="flex-1 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-surface-950"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => onUpdate(release.downloadUrl)}
          >
            Update Now
          </Button>
        </div>
      </div>
    </Modal>
  );
};
