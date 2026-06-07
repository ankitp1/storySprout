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

  it('should reset approved books correctly', () => {
    useStore.setState({ 
      activeProfileId: 'test_profile', 
      approvedBooks: { 'test_profile': ['book_1', 'book_2'] } 
    });
    
    useStore.getState().resetApprovedBooks('test_profile');
    expect(useStore.getState().approvedBooks['test_profile']).toEqual([]);
  });

  it('should manage parental session time limits correctly', () => {
    useStore.setState({
      activeProfileId: 'test_profile',
      sessionLimits: { 'test_profile': 1 }, // 1 minute = 60 seconds
      sessionTimeUsed: 0,
      isSessionLocked: false
    });

    // Incrementing by 30s should not lock
    useStore.getState().incrementSessionTime(30);
    expect(useStore.getState().sessionTimeUsed).toBe(30);
    expect(useStore.getState().isSessionLocked).toBe(false);

    // Incrementing by another 30s (total 60s) should lock
    useStore.getState().incrementSessionTime(30);
    expect(useStore.getState().sessionTimeUsed).toBe(60);
    expect(useStore.getState().isSessionLocked).toBe(true);

    // Unlocking should reset
    useStore.getState().unlockSession();
    expect(useStore.getState().sessionTimeUsed).toBe(0);
    expect(useStore.getState().isSessionLocked).toBe(false);
  });

  it('should default session limit to 60 minutes if not set', () => {
    useStore.setState({
      activeProfileId: 'test_profile',
      sessionLimits: {}, // empty means undefined for test_profile
      sessionTimeUsed: 0,
      isSessionLocked: false
    });

    // 59 minutes (3540 seconds) should not lock
    useStore.getState().incrementSessionTime(3540);
    expect(useStore.getState().isSessionLocked).toBe(false);

    // 60 minutes (3600 seconds total) should lock
    useStore.getState().incrementSessionTime(60);
    expect(useStore.getState().isSessionLocked).toBe(true);
  });

  it('should support profile creation with PIN and updates', () => {
    // 1. Add profile with PIN
    useStore.getState().addProfile('Rowan', '🦊', '#FF6B6B', '5555');
    const profiles = useStore.getState().profiles;
    expect(profiles.length).toBe(1);
    expect(profiles[0].name).toBe('Rowan');
    expect(profiles[0].pin).toBe('5555');

    const profileId = profiles[0].id;

    // 2. Update profile PIN
    useStore.getState().updateProfile(profileId, { pin: '7777' });
    expect(useStore.getState().profiles[0].pin).toBe('7777');

    // 3. Clear profile PIN
    useStore.getState().updateProfile(profileId, { pin: '' });
    expect(useStore.getState().profiles[0].pin).toBe('');
  });
});
