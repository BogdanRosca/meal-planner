import React, { useState } from 'react';
import { X, Youtube, Loader2 } from 'lucide-react';
import { parseYoutubeVideoId } from '../../utils/youtube';
import {
  ImportPhase,
  RecipeImportFailure,
  canAddManually,
} from '../../hooks/useRecipeImport';
import styles from './ImportRecipeModal.module.css';

interface ImportRecipeModalProps {
  isOpen: boolean;
  phase: ImportPhase;
  error: RecipeImportFailure | null;
  onImport: (_url: string) => void;
  onCancel: () => void;
  onClose: () => void;
  onAddManually: () => void;
}

const PHASE_LABELS: Record<ImportPhase, string> = {
  idle: '',
  fetching: 'Fetching video…',
  extracting: 'Extracting recipe…',
};

const ImportRecipeModal: React.FC<ImportRecipeModalProps> = ({
  isOpen,
  phase,
  error,
  onImport,
  onCancel,
  onClose,
  onAddManually,
}) => {
  const [url, setUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const loading = phase !== 'idle';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parseYoutubeVideoId(url)) {
      setUrlError(
        'Enter a YouTube video link, e.g. https://www.youtube.com/watch?v=…'
      );
      return;
    }
    setUrlError(null);
    onImport(url.trim());
  };

  const handleClose = () => {
    if (loading) onCancel();
    onClose();
  };

  const fieldError =
    urlError ?? (error?.code === 'invalid_url' ? error.message : null);
  const requestError = error && error.code !== 'invalid_url' ? error : null;

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
            <Youtube size={24} />
            Import from YouTube
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

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles['form-group']}>
            <label htmlFor="youtube-url">YouTube video URL</label>
            <input
              id="youtube-url"
              type="url"
              value={url}
              onChange={e => {
                setUrl(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className={styles.input}
              disabled={loading}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? 'youtube-url-error' : undefined}
            />
            {fieldError && (
              <p id="youtube-url-error" className={styles['field-error']}>
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
      </div>
    </div>
  );
};

export default ImportRecipeModal;
