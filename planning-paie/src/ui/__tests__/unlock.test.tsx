import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { initialState, useAppStore } from '../../store/store';
import { useExportGate } from '../UnlockSheet';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

let mockAds = true;
const mockWatch = jest.fn();
jest.mock('../../native/ads', () => ({
  adsAvailable: () => mockAds,
  watchRewardedVideo: () => mockWatch(),
}));

const exported = jest.fn();

function Screen() {
  const gate = useExportGate();
  return (
    <>
      <Pressable testID="export" onPress={() => gate.run(exported)}>
        <Text>Exporter</Text>
      </Pressable>
      {gate.sheet}
    </>
  );
}

beforeEach(() => {
  mockAds = true;
  mockPush.mockClear();
  exported.mockClear();
  mockWatch.mockReset();
  useAppStore.setState({
    ...initialState(),
    settings: { ...initialState().settings, language: 'fr' },
  });
});

describe('déblocage des exports (version gratuite)', () => {
  it('propose la vidéo, puis exporte une fois la vidéo regardée', async () => {
    mockWatch.mockImplementation(async () => {
      useAppStore.getState().setSettings({ adPassUntil: Date.now() + 86400000 });
      return 'rewarded';
    });
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('export'));
    expect(screen.getByTestId('unlock-sheet')).toBeTruthy();
    expect(exported).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('unlock-video'));
    expect(exported).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('unlock-sheet')).toBeNull();
    // Débloqué pour 24 h : l'export suivant est direct.
    await fireEvent.press(screen.getByTestId('export'));
    expect(exported).toHaveBeenCalledTimes(2);
  });

  it('n’exporte pas si la vidéo est fermée avant la fin', async () => {
    mockWatch.mockResolvedValue('closed');
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('export'));
    await fireEvent.press(screen.getByTestId('unlock-video'));
    expect(exported).not.toHaveBeenCalled();
  });

  it('va directement à Premium si la publicité est désactivée', async () => {
    mockAds = false;
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('export'));
    expect(mockPush).toHaveBeenCalledWith('/premium');
    expect(screen.queryByTestId('unlock-sheet')).toBeNull();
  });

  it('exporte directement avec Premium', async () => {
    useAppStore.getState().setSettings({ premium: true });
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('export'));
    expect(exported).toHaveBeenCalledTimes(1);
  });
});
