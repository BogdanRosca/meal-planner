import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportRecipeModal from './ImportRecipeModal';
import { ImportPhase, RecipeImportFailure } from '../../hooks/useRecipeImport';

const VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const REEL_URL = 'https://www.instagram.com/reel/DAbcdEFghiJ/?igsh=abc';

describe('ImportRecipeModal', () => {
  const onImport = jest.fn();
  const onCancel = jest.fn();
  const onClose = jest.fn();
  const onBack = jest.fn();
  const onAddManually = jest.fn();

  const renderModal = (
    props: Partial<{
      phase: ImportPhase;
      error: RecipeImportFailure | null;
    }> = {}
  ) =>
    render(
      <ImportRecipeModal
        phase={props.phase ?? 'idle'}
        error={props.error ?? null}
        onImport={onImport}
        onCancel={onCancel}
        onClose={onClose}
        onBack={onBack}
        onAddManually={onAddManually}
      />
    );

  const choose = async (
    user: ReturnType<typeof userEvent.setup>,
    platform: RegExp
  ) => user.click(screen.getByRole('button', { name: platform }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('platform step', () => {
    it('starts by asking for a platform', () => {
      renderModal();

      expect(
        screen.getByRole('dialog', { name: 'Import from link' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('group', { name: 'Choose a platform' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /YouTube Videos and Shorts/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Instagram Reels/ })
      ).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('Cancel closes the modal', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('platform cards are keyboard accessible', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.tab();
      await user.tab();
      await user.keyboard('{Enter}');

      expect(screen.getByLabelText('YouTube video URL')).toBeInTheDocument();
    });
  });

  describe.each([
    ['YouTube', /YouTube/, 'youtube', 'YouTube video URL', VIDEO_URL],
    ['Instagram', /Instagram/, 'instagram', 'Instagram reel URL', REEL_URL],
  ] as const)('%s URL step', (label, cardName, platformId, urlLabel, url) => {
    it('shows the platform-specific URL input', async () => {
      const user = userEvent.setup();
      renderModal();

      await choose(user, cardName);

      expect(
        screen.getByRole('dialog', { name: `Import from ${label}` })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(urlLabel)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Import' })).toBeEnabled();
    });

    it('imports a valid URL', async () => {
      const user = userEvent.setup();
      renderModal();

      await choose(user, cardName);
      await user.type(screen.getByLabelText(urlLabel), `  ${url}  `);
      await user.click(screen.getByRole('button', { name: 'Import' }));

      expect(onImport).toHaveBeenCalledWith(platformId, url);
    });

    it('rejects a link from another site with an inline error', async () => {
      const user = userEvent.setup();
      renderModal();

      await choose(user, cardName);
      const input = screen.getByLabelText(urlLabel);
      await user.type(input, 'https://vimeo.com/1');
      await user.click(screen.getByRole('button', { name: 'Import' }));

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription(
        new RegExp(`Enter an? ${label}`)
      );
      expect(onImport).not.toHaveBeenCalled();
    });
  });

  it('does not accept a YouTube link on the Instagram step', async () => {
    const user = userEvent.setup();
    renderModal();

    await choose(user, /Instagram/);
    await user.type(screen.getByLabelText('Instagram reel URL'), VIDEO_URL);
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(onImport).not.toHaveBeenCalled();
  });

  it('clears the inline error when the URL is edited', async () => {
    const user = userEvent.setup();
    renderModal();

    await choose(user, /YouTube/);
    await user.click(screen.getByRole('button', { name: 'Import' }));
    expect(screen.getByText(/Enter a YouTube video link/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('YouTube video URL'), 'h');
    expect(
      screen.queryByText(/Enter a YouTube video link/)
    ).not.toBeInTheDocument();
  });

  it('Back returns to the platform step with an empty form', async () => {
    const user = userEvent.setup();
    renderModal();

    await choose(user, /YouTube/);
    await user.type(screen.getByLabelText('YouTube video URL'), 'x');
    await user.click(screen.getByRole('button', { name: 'Import' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Choose a platform')).toBeInTheDocument();

    await choose(user, /Instagram/);
    expect(screen.getByLabelText('Instagram reel URL')).toHaveValue('');
    expect(
      screen.getByLabelText('Instagram reel URL')
    ).not.toHaveAccessibleDescription();
  });

  describe('while importing', () => {
    it.each([
      ['fetching', 'Fetching video…'],
      ['extracting', 'Extracting recipe…'],
    ] as const)('shows the %s loading state', async (phase, text) => {
      const user = userEvent.setup();
      const { rerender } = renderModal();
      await choose(user, /YouTube/);

      rerender(
        <ImportRecipeModal
          phase={phase}
          error={null}
          onImport={onImport}
          onCancel={onCancel}
          onClose={onClose}
          onBack={onBack}
          onAddManually={onAddManually}
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent(text);
      expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
      expect(screen.getByLabelText('YouTube video URL')).toBeDisabled();
    });

    it('Cancel aborts without closing, Close aborts and closes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderModal();
      await choose(user, /YouTube/);
      rerender(
        <ImportRecipeModal
          phase="fetching"
          error={null}
          onImport={onImport}
          onCancel={onCancel}
          onClose={onClose}
          onBack={onBack}
          onAddManually={onAddManually}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(onCancel).toHaveBeenCalledTimes(2);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('Cancel on the URL step closes when idle', async () => {
    const user = userEvent.setup();
    renderModal();

    await choose(user, /YouTube/);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  describe('errors', () => {
    const renderWithError = async (error: RecipeImportFailure) => {
      const user = userEvent.setup();
      const view = renderModal({ error });
      await choose(user, /YouTube/);
      return { user, ...view };
    };

    it.each([
      ['upstream_error', 'Import failed, try again or add manually.'],
      ['timeout', 'Import failed, try again or add manually.'],
    ] as const)('offers Add manually for a %s error', async (code, message) => {
      const { user } = await renderWithError({ code, message });

      expect(screen.getByRole('alert')).toHaveTextContent(message);
      await user.click(screen.getByRole('button', { name: 'Add manually' }));
      expect(onAddManually).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['video_not_found', 'Video not found or not public.'],
      ['not_a_recipe', "We couldn't find a recipe in this video."],
    ] as const)(
      'shows a %s error without Add manually',
      async (code, message) => {
        await renderWithError({ code, message });

        expect(screen.getByRole('alert')).toHaveTextContent(message);
        expect(
          screen.queryByRole('button', { name: 'Add manually' })
        ).not.toBeInTheDocument();
      }
    );

    it('shows a server-side invalid URL error on the field', async () => {
      await renderWithError({
        code: 'invalid_url',
        message: 'Enter a valid video URL.',
      });

      expect(
        screen.getByLabelText('YouTube video URL')
      ).toHaveAccessibleDescription('Enter a valid video URL.');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
