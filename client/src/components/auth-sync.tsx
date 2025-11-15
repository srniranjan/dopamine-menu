import { useEffect, useRef } from 'react';
import { useUser } from '@stackframe/react';
import { useToast } from '@/hooks/use-toast';

export function AuthSync() {
  const stackUser = useUser();
  const prevUserRef = useRef<typeof stackUser | undefined>(undefined); // Initialize to undefined, not stackUser
  const syncInProgressRef = useRef(false);
  const hasSyncedRef = useRef(false); // Track if we've synced this session
  const { toast } = useToast();

  useEffect(() => {
    const prevUser = prevUserRef.current;
    
    // Debug logging
    console.log('[AuthSync] Effect triggered:', {
      prevUser: prevUser ? { id: prevUser.id, email: prevUser.primaryEmail } : prevUser,
      stackUser: stackUser ? { id: stackUser.id, email: stackUser.primaryEmail } : stackUser,
      syncInProgress: syncInProgressRef.current,
      hasSynced: hasSyncedRef.current,
    });
    
    // Skip if still loading
    if (stackUser === undefined) {
      console.log('[AuthSync] Skipping: stackUser is undefined (still loading)');
      return;
    }
    
    // User just signed in or signed up (transitioned from null/undefined to having a user)
    const justAuthenticated = 
      (prevUser === null || prevUser === undefined) && 
      stackUser !== null && 
      stackUser !== undefined;
    
    // Also check if this is the first time we see an authenticated user (component mounted after login)
    const firstTimeAuthenticated = 
      prevUser === undefined && 
      stackUser !== null && 
      stackUser !== undefined &&
      !hasSyncedRef.current;
    
    console.log('[AuthSync] Auth check:', {
      justAuthenticated,
      firstTimeAuthenticated,
      prevUserIsNull: prevUser === null,
      prevUserIsUndefined: prevUser === undefined,
      stackUserIsNotNull: stackUser !== null,
      stackUserIsNotUndefined: stackUser !== undefined,
      hasSynced: hasSyncedRef.current,
    });
    
    // Skip if already syncing, already synced, or if user hasn't changed
    if ((!justAuthenticated && !firstTimeAuthenticated) || syncInProgressRef.current || hasSyncedRef.current) {
      console.log('[AuthSync] Skipping sync:', {
        justAuthenticated,
        firstTimeAuthenticated,
        syncInProgress: syncInProgressRef.current,
        hasSynced: hasSyncedRef.current,
        reason: hasSyncedRef.current ? 'Already synced this session' : 
                syncInProgressRef.current ? 'Sync already in progress' : 
                'User not just authenticated',
      });
      prevUserRef.current = stackUser;
      return;
    }
    
    // Mark sync as in progress and mark as synced
    syncInProgressRef.current = true;
    hasSyncedRef.current = true;
    console.log('[AuthSync] Starting sync for user:', {
      id: stackUser.id,
      email: stackUser.primaryEmail,
      name: stackUser.displayName,
    });
    
    // Sync user to database
    const syncUser = async () => {
      try {
        console.log('[AuthSync] Making fetch request to /api/users/sync');
        const response = await fetch('/api/users/sync', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stackUserId: stackUser.id,
            username: stackUser.primaryEmail || stackUser.id,
            name: stackUser.displayName || undefined,
          }),
        });
        
        console.log('[AuthSync] Fetch response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          
          // Handle specific error cases
          if (response.status === 409) {
            toast({
              title: "Account already exists",
              description: "This account is already linked to another user.",
              variant: "destructive",
            });
          } else {
            throw new Error(errorData.message || 'Failed to sync user');
          }
          return;
        }
        
        const data = await response.json();
        
        // Success - user synced
        console.log('[AuthSync] User synced successfully:', data.user);
        
        // Optionally show a success toast (you might want to skip this for sign-ins)
        // toast({
        //   title: "Welcome!",
        //   description: "Your account has been set up successfully.",
        // });
        
      } catch (error) {
        console.error('[AuthSync] Error syncing user:', error);
        hasSyncedRef.current = false; // Allow retry on error
        
        toast({
          title: "Sync failed",
          description: error instanceof Error 
            ? error.message 
            : "Failed to sync your account. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        // Reset sync flag after a delay to allow for retries if needed
        setTimeout(() => {
          syncInProgressRef.current = false;
        }, 1000);
      }
    };
    
    syncUser();
    prevUserRef.current = stackUser;
    
    // Cleanup function
    return () => {
      // Reset on unmount
      syncInProgressRef.current = false;
    };
  }, [stackUser, toast]);

  // This component doesn't render anything
  return null;
}

