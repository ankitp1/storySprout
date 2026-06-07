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
});
