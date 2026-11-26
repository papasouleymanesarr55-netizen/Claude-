import { legalText } from '..';

describe('politique de confidentialité', () => {
  it('ne parle pas de publicité quand elle est désactivée', () => {
    const text = JSON.stringify(legalText('fr', 'privacy', false));
    expect(text).toContain('pas de publicité');
    expect(text).not.toContain('AdMob');
  });
  it('décrit AdMob et le consentement quand la publicité est activée', () => {
    const text = JSON.stringify(legalText('fr', 'privacy', true));
    expect(text).toContain('AdMob');
    expect(text).toContain('Confidentialité des publicités');
    expect(text).not.toContain('pas de publicité');
  });
});
