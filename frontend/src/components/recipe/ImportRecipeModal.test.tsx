import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportRecipeModal from './ImportRecipeModal';
import { ImportPhase, RecipeImportFailure } from '../../hooks/useRecipeImport';

const VALID_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

describe('ImportRecipeModal', () => {
  const onImport = jest.fn();
  const onCancel = jest.fn();
  const onClose = jest.fn();
  const onAddManually = jest.fn();

  const renderModal = (
    props: Partial<{
      isOpen: boolean;
      phase: ImportPhase;
      error: RecipeImportFailure | null;
    }> = {}
  ) =>
    render(
      <ImportRecipeModal
        isOpen={props.isOpen ?? true}
        phase={props.phase ?? 'idle'}
        error={props.error ?? null}
        onImport={onImport}
        onCancel={onCancel}
        onClose={onClose}
        onAddManually={onAddManually}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a labelled URL input and an Import button', () => {
    renderModal();

    expect(
      screen.getByRole('dialog', { name: 'Import from YouTube' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('YouTube video URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeEnabled();
  });

  it('shows an inline error for a non-YouTube URL and does not import', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByLabelText('YouTube video URL'),
      'https://vimeo.com/1'
    );
    await user.click(screen.getByRole('button', { name: 'Import' }));

    const input = screen.getByLabelText('YouTube video URL');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/Enter a YouTube video link/);
    expect(onImport).not.toHaveBeenCalled();
  });

  it('clears the inline error when the URL is edited', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Import' }));
    expect(screen.getByText(/Enter a YouTube video link/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('YouTube video URL'), 'h');
    expect(
      screen.queryByText(/Enter a YouTube video link/)
    ).not.toBeInTheDocument();
  });

  it('imports a valid URL', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByLabelText('YouTube video URL'),
      `  ${VALID_URL}  `
    );
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(onImport).toHaveBeenCalledWith(VALID_URL);
  });

  it.each([
    ['fetching', 'Fetching video…'],
    ['extracting', 'Extracting recipe…'],
  ] as const)('shows the %s loading state', (phase, label) => {
    renderModal({ phase });

    expect(screen.getByRole('status')).toHaveTextContent(label);
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
    expect(screen.getByLabelText('YouTube video URL')).toBeDisabled();
  });

  it('Cancel aborts a running import without closing', async () => {
    const user = userEvent.setup();
    renderModal({ phase: 'fetching' });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Cancel closes the modal when idle', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('the close button aborts a running import and closes', async () => {
    const user = userEvent.setup();
    renderModal({ phase: 'extracting' });

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['upstream_error', 'Import failed, try again or add manually.'],
    ['timeout', 'Import failed, try again or add manually.'],
  ] as const)('offers Add manually for a %s error', async (code, message) => {
    const user = userEvent.setup();
    renderModal({ error: { code, message } });

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    await user.click(screen.getByRole('button', { name: 'Add manually' }));
    expect(onAddManually).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['video_not_found', 'Video not found or not public.'],
    ['not_a_recipe', "We couldn't find a recipe in this video."],
  ] as const)('shows a %s error without Add manually', (code, message) => {
    renderModal({ error: { code, message } });

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(
      screen.queryByRole('button', { name: 'Add manually' })
    ).not.toBeInTheDocument();
  });

  it('shows a server-side invalid URL error on the field', () => {
    renderModal({
      error: {
        code: 'invalid_url',
        message: 'Enter a valid YouTube video URL.',
      },
    });

    expect(
      screen.getByLabelText('YouTube video URL')
    ).toHaveAccessibleDescription('Enter a valid YouTube video URL.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
