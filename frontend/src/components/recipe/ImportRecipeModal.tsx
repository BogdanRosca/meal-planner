import React, { useState } from 'react';
import { X, Link, Loader2, ArrowLeft } from 'lucide-react';
import { ImportPlatform } from '../../types/recipe';
import {
  IMPORT_PLATFORMS,
  getImportPlatform,
} from '../../config/importPlatforms';
import {
  ImportPhase,
  RecipeImportFailure,
  canAddManually,
} from '../../hooks/useRecipeImport';
import styles from './ImportRecipeModal.module.css';

interface ImportRecipeModalProps {
  phase: ImportPhase;
  error: RecipeImportFailure | null;
  onImport: (_platform: ImportPlatform, _url: string) => void;
  onCancel: () => void;
  onClose: () => void;
  onBack: () => void;
  onAddManually: () => void;
}

const PHASE_LABELS: Record<ImportPhase, string> = {
  idle: '',
  fetching: 'Fetching video…',
  extracting: 'Extracting recipe…',
};

// Mounted only while open, so every open starts at the platform step
const ImportRecipeModal: React.FC<ImportRecipeModalProps> = ({
  phase,
  error,
  onImport,
  onCancel,
  onClose,
  onBack,
  onAddManually,
}) => {
  const [platformId, setPlatformId] = useState<ImportPlatform | null>(null);
  const [url, setUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const loading = phase !== 'idle';
  const platform = platformId ? getImportPlatform(platformId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform) return;
    if (!platform.parse(url)) {
      setUrlError(platform.invalidUrlMessage);
      return;
    }
    setUrlError(null);
    onImport(platform.id, url.trim());
  };

  const handleClose = () => {
    if (loading) onCancel();
    onClose();
  };

  const handleBack = () => {
    onBack();
    setPlatformId(null);
    setUrl('');
    setUrlError(null);
  };

  const fieldError =
    urlError ?? (error?.code === 'invalid_url' ? error.message : null);
  const requestError = error && error.code !== 'invalid_url' ? error : null;
  const HeaderIcon = platform ? platform.Icon : Link;

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-recipe-title"
      >
        <div className={styles.header}>
          <h2 id="import-recipe-title">
            <HeaderIcon size={24} aria-hidden />
            {platform ? `Import from ${platform.label}` : 'Import from link'}
          </h2>
          <button
            type="button"
            className={styles['close-button']}
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {!platform ? (
          <div className={styles.form}>
            <p className={styles['step-title']} id="import-platform-heading">
              Choose a platform
            </p>
            <div
              className={styles['platform-list']}
              role="group"
              aria-labelledby="import-platform-heading"
            >
              {IMPORT_PLATFORMS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={styles['platform-card']}
                  onClick={() => setPlatformId(option.id)}
                >
                  <option.Icon size={28} aria-hidden />
                  <span className={styles['platform-label']}>
                    {option.label}
                  </span>
                  <span className={styles['platform-description']}>
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                className={styles['cancel-btn']}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <button
              type="button"
              className={styles['back-btn']}
              onClick={handleBack}
            >
              <ArrowLeft size={16} aria-hidden />
              Back
            </button>

            <div className={styles['form-group']}>
              <label htmlFor="import-url">{platform.urlLabel}</label>
              <input
                id="import-url"
                type="url"
                value={url}
                onChange={e => {
                  setUrl(e.target.value);
                  setUrlError(null);
                }}
                placeholder={platform.placeholder}
                className={styles.input}
                disabled={loading}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={fieldError ? 'import-url-error' : undefined}
              />
              {fieldError && (
                <p id="import-url-error" className={styles['field-error']}>
                  {fieldError}
                </p>
              )}
            </div>

            {loading && (
              <p className={styles.status} role="status">
                <Loader2 size={18} className={styles.spinner} aria-hidden />
                {PHASE_LABELS[phase]}
              </p>
            )}

            {requestError && (
              <div className={styles['request-error']} role="alert">
                <p>{requestError.message}</p>
                {canAddManually(requestError) && (
                  <button
                    type="button"
                    className={styles['manual-btn']}
                    onClick={onAddManually}
                  >
                    Add manually
                  </button>
                )}
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                onClick={loading ? onCancel : handleClose}
                className={styles['cancel-btn']}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles['submit-btn']}
                disabled={loading}
              >
                Import
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ImportRecipeModal;
