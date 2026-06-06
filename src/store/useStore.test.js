import { describe, it, expect, beforeEach } from 'vitest';
import useStore from './useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Reset state before each test
    const state = useStore.getState();
    useStore.setState({
      profiles: [],
      activeProfileId: null,
      points: {},
      unlockedAvatars: {}
    });
  });

  it('should initialize with default state', () => {
    const state = useStore.getState();
    expect(state.isAdmin).toBe(false);
    expect(state.activeProfileId).toBeNull();
  });

  it('should add points to active profile correctly', () => {
    useStore.setState({ activeProfileId: 'test_profile', points: {} });
    
    useStore.getState().addPoints(50);
    expect(useStore.getState().points['test_profile']).toBe(50);

    useStore.getState().addPoints(10);
    expect(useStore.getState().points['test_profile']).toBe(60);
  });

  it('should not add points if no active profile', () => {
    useStore.setState({ activeProfileId: null, points: {} });
    useStore.getState().addPoints(50);
    expect(useStore.getState().points).toEqual({});
  });

  it('should handle avatar purchases properly', () => {
    useStore.setState({ activeProfileId: 'test_profile', points: { 'test_profile': 150 }, unlockedAvatars: {} });
    
    // Purchase for 100
    useStore.getState().unlockAvatar('🤖', 100);
    
    expect(useStore.getState().points['test_profile']).toBe(50);
    expect(useStore.getState().unlockedAvatars['test_profile']).toContain('🤖');

    // Try to purchase for 100 again, should fail
    useStore.getState().unlockAvatar('🦄', 100);
    expect(useStore.getState().points['test_profile']).toBe(50);
    expect(useStore.getState().unlockedAvatars['test_profile']).not.toContain('🦄');
  });
});
