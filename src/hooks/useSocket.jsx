// // import { useEffect, useRef, useState, useCallback } from 'react';
// // import { io } from 'socket.io-client';
// // import { auth } from '../firebase';

// // /**
// //  * FIXED: Per-tab socket isolation.
// //  * 
// //  * THE BUG: The original code used a module-level _socket singleton.
// //  * When you open Profile_1 in Tab 1 and Profile_2 in Tab 2, both tabs
// //  * shared the exact same socket connection. Tab 2 would still receive
// //  * Profile_1 events because they were on the same socket object.
// //  *
// //  * THE FIX: Each browser tab gets its own socket instance, identified
// //  * by a unique TAB_ID stored in sessionStorage (which is per-tab, unlike
// //  * localStorage which is shared). Each tab independently subscribes/
// //  * unsubscribes to its own profile rooms.
// //  */

// // // sessionStorage is isolated per tab — perfect for tab-unique IDs
// // const TAB_ID = (() => {
// //   let id = sessionStorage.getItem('_mw_tab_id');
// //   if (!id) {
// //     id = Math.random().toString(36).slice(2);
// //     sessionStorage.setItem('_mw_tab_id', id);
// //   }
// //   return id;
// // })();

// // // These are now per-tab because each tab has its own JS module instance
// // // (module-level vars are fine here — each tab loads its own copy of the module)
// // let _socket = null;
// // let _connectionPromise = null;
// // const _listeners = new Set();

// // function notifyListeners(connected) {
// //   _listeners.forEach(fn => fn(connected));
// // }

// // async function getSocket() {
// //   if (_socket?.connected) return _socket;
// //   if (_connectionPromise) return _connectionPromise;

// //   _connectionPromise = new Promise(async (resolve) => {
// //     try {
// //       const user = auth.currentUser;
// //       if (!user) { _connectionPromise = null; resolve(null); return; }

// //       const token = await user.getIdToken();

// //       _socket = io(window.location.origin, {
// //         auth: { token },
// //         transports: ['websocket', 'polling'],
// //         reconnection: true,
// //         reconnectionDelay: 1000,
// //         reconnectionDelayMax: 5000,
// //         reconnectionAttempts: Infinity,
// //         query: { tabId: TAB_ID },
// //       });

// //       _socket.on('connect', () => {
// //         console.log(`🔌 [Tab:${TAB_ID}] Socket connected [${_socket.id}]`);
// //         notifyListeners(true);
// //         _connectionPromise = null;
// //         resolve(_socket);
// //       });

// //       _socket.on('disconnect', (reason) => {
// //         console.log(`🔌 [Tab:${TAB_ID}] Socket disconnected: ${reason}`);
// //         notifyListeners(false);
// //         // Server-initiated disconnect = refresh token and reconnect
// //         if (reason === 'io server disconnect') {
// //           setTimeout(async () => {
// //             try {
// //               const freshToken = await auth.currentUser?.getIdToken(true);
// //               if (freshToken && _socket) {
// //                 _socket.auth.token = freshToken;
// //                 _socket.connect();
// //               }
// //             } catch (_) {}
// //           }, 500);
// //         }
// //       });

// //       _socket.on('connect_error', (err) => {
// //         console.warn(`[Tab:${TAB_ID}] Socket error:`, err.message);
// //         _connectionPromise = null;
// //         resolve(_socket);
// //       });

// //     } catch (err) {
// //       console.error(`[Tab:${TAB_ID}] Socket init error:`, err);
// //       _connectionPromise = null;
// //       resolve(null);
// //     }
// //   });

// //   return _connectionPromise;
// // }

// // auth.onAuthStateChanged(user => {
// //   if (user) {
// //     getSocket();
// //   } else if (_socket) {
// //     _socket.disconnect();
// //     _socket = null;
// //     _connectionPromise = null;
// //     notifyListeners(false);
// //   }
// // });

// // export function useSocket() {
// //   const [connected, setConnected] = useState(_socket?.connected || false);

// //   useEffect(() => {
// //     const listener = (state) => setConnected(state);
// //     _listeners.add(listener);

// //     if (_socket?.connected) setConnected(true);
// //     else getSocket().then(s => { if (s?.connected) setConnected(true); });

// //     return () => { _listeners.delete(listener); };
// //   }, []);

// //   const subscribeToProfile = useCallback((profile) => {
// //     if (_socket?.connected) {
// //       _socket.emit('subscribe:profile', profile);
// //       console.log(`📡 [Tab:${TAB_ID}] subscribe → ${profile}`);
// //     }
// //   }, []);

// //   const unsubscribeFromProfile = useCallback((profile) => {
// //     if (_socket?.connected) {
// //       _socket.emit('unsubscribe:profile', profile);
// //       console.log(`📡 [Tab:${TAB_ID}] unsubscribe → ${profile}`);
// //     }
// //   }, []);

// //   return { socket: _socket, connected, subscribeToProfile, unsubscribeFromProfile };
// // }

// // /**
// //  * FIXED: useBotEvents properly handles:
// //  * 1. Profile switching — unsubscribes old profile before subscribing new
// //  * 2. Socket reconnects — re-subscribes to the profile room automatically
// //  * 3. Strict event filtering — drops events not belonging to this profile
// //  * 4. Cleanup — always unsubscribes on unmount
// //  */
// // export function useBotEvents(profile, onEvent) {
// //   const onEventRef = useRef(onEvent);
// //   onEventRef.current = onEvent;

// //   const { subscribeToProfile, unsubscribeFromProfile } = useSocket();
// //   const subscribedProfileRef = useRef(null);

// //   useEffect(() => {
// //     if (!profile) return;

// //     const BOT_EVENTS = [
// //       'bot:terminal', 'bot:status', 'bot:progress', 'bot:completed',
// //       'bot:cycleStart', 'bot:cycleComplete', 'bot:cycleProgress', 'bot:cycleUpdate',
// //       'bot:betUpdate', 'bot:betConfigChanged', 'bot:betError',
// //     ];

// //     const handlers = {};
// //     let active = true;

// //     const attach = (sock) => {
// //       BOT_EVENTS.forEach(event => {
// //         if (handlers[event]) sock.off(event, handlers[event]);
// //         handlers[event] = (data) => {
// //           if (!active) return;
// //           // Strict filter: only handle events for THIS profile
// //           if (data._profile && data._profile !== profile) return;
// //           onEventRef.current(event, data);
// //         };
// //         sock.on(event, handlers[event]);
// //       });
// //     };

// //     const detach = (sock) => {
// //       BOT_EVENTS.forEach(event => {
// //         if (handlers[event]) { sock.off(event, handlers[event]); delete handlers[event]; }
// //       });
// //     };

// //     const setup = async () => {
// //       const sock = await getSocket();
// //       if (!sock || !active) return;

// //       // Leave previous profile room if profile changed
// //       if (subscribedProfileRef.current && subscribedProfileRef.current !== profile) {
// //         unsubscribeFromProfile(subscribedProfileRef.current);
// //       }
// //       subscribeToProfile(profile);
// //       subscribedProfileRef.current = profile;
// //       attach(sock);

// //       // Re-subscribe automatically on socket reconnect
// //       const onReconnect = () => {
// //         if (!active) return;
// //         subscribeToProfile(profile);
// //         attach(sock);
// //       };
// //       sock.on('connect', onReconnect);
// //       handlers['_reconnect_handler'] = onReconnect;
// //     };

// //     setup();

// //     return () => {
// //       active = false;
// //       if (subscribedProfileRef.current) {
// //         unsubscribeFromProfile(subscribedProfileRef.current);
// //         subscribedProfileRef.current = null;
// //       }
// //       if (_socket) {
// //         if (handlers['_reconnect_handler']) {
// //           _socket.off('connect', handlers['_reconnect_handler']);
// //         }
// //         detach(_socket);
// //       }
// //     };
// //   }, [profile, subscribeToProfile, unsubscribeFromProfile]);
// // }



// import { useEffect, useRef, useState, useCallback } from 'react';
// import { io } from 'socket.io-client';
// import { auth } from '../firebase';

// /**
//  * useSocket — fully isolated per browser tab, per profile.
//  *
//  * FIXED issues from original:
//  *
//  * 1. HANDLER LEAK in useBotEvents attach():
//  *    Original overwrote handlers[event] then called sock.off(oldRef) where
//  *    oldRef was already the NEW function — so the old listener was never
//  *    removed. Fix: capture the old ref before overwriting, then remove it.
//  *
//  * 2. STALE LISTENERS on profile navigation (within same tab):
//  *    attach() was called again on reconnect without first detaching the
//  *    previous set. Fix: always detach before attach inside the reconnect handler.
//  *
//  * 3. MISSING CLEANUP on fast profile switches:
//  *    The cleanup returned by useEffect didn't cover the async setup() path
//  *    correctly when `active` was set false before setup() resolved. Fix:
//  *    guard every async step with the `active` flag.
//  *
//  * TAB ISOLATION:
//  *    sessionStorage is per-tab (not shared like localStorage), so TAB_ID is
//  *    unique per browser tab. Module-level _socket is also per-tab because
//  *    each tab has its own JS module context.
//  */

// const TAB_ID = (() => {
//   let id = sessionStorage.getItem('_mw_tab_id');
//   if (!id) {
//     id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
//     sessionStorage.setItem('_mw_tab_id', id);
//   }
//   return id;
// })();

// // Module-level — safe because each browser tab has its own module instance.
// let _socket = null;
// let _connectionPromise = null;
// const _listeners = new Set();

// function notifyListeners(connected) {
//   _listeners.forEach(fn => fn(connected));
// }

// async function getSocket() {
//   if (_socket?.connected) return _socket;
//   if (_connectionPromise) return _connectionPromise;

//   _connectionPromise = new Promise(async (resolve) => {
//     try {
//       const user = auth.currentUser;
//       if (!user) { _connectionPromise = null; resolve(null); return; }

//       const token = await user.getIdToken();

//       _socket = io(window.location.origin, {
//         auth: { token },
//         transports: ['websocket', 'polling'],
//         reconnection: true,
//         reconnectionDelay: 1000,
//         reconnectionDelayMax: 5000,
//         reconnectionAttempts: Infinity,
//         query: { tabId: TAB_ID },
//       });

//       _socket.on('connect', () => {
//         console.log(`🔌 [Tab:${TAB_ID}] Socket connected [${_socket.id}]`);
//         notifyListeners(true);
//         _connectionPromise = null;
//         resolve(_socket);
//       });

//       _socket.on('disconnect', (reason) => {
//         console.log(`🔌 [Tab:${TAB_ID}] Socket disconnected: ${reason}`);
//         notifyListeners(false);
//         if (reason === 'io server disconnect') {
//           setTimeout(async () => {
//             try {
//               const freshToken = await auth.currentUser?.getIdToken(true);
//               if (freshToken && _socket) {
//                 _socket.auth.token = freshToken;
//                 _socket.connect();
//               }
//             } catch (_) {}
//           }, 500);
//         }
//       });

//       _socket.on('connect_error', (err) => {
//         console.warn(`[Tab:${TAB_ID}] Socket error:`, err.message);
//         _connectionPromise = null;
//         resolve(_socket);
//       });

//     } catch (err) {
//       console.error(`[Tab:${TAB_ID}] Socket init error:`, err);
//       _connectionPromise = null;
//       resolve(null);
//     }
//   });

//   return _connectionPromise;
// }

// auth.onAuthStateChanged(user => {
//   if (user) {
//     getSocket();
//   } else if (_socket) {
//     _socket.disconnect();
//     _socket = null;
//     _connectionPromise = null;
//     notifyListeners(false);
//   }
// });

// export function useSocket() {
//   const [connected, setConnected] = useState(_socket?.connected || false);

//   useEffect(() => {
//     const listener = (state) => setConnected(state);
//     _listeners.add(listener);

//     if (_socket?.connected) setConnected(true);
//     else getSocket().then(s => { if (s?.connected) setConnected(true); });

//     return () => { _listeners.delete(listener); };
//   }, []);

//   const subscribeToProfile = useCallback((profile) => {
//     if (_socket?.connected) {
//       _socket.emit('subscribe:profile', profile);
//       console.log(`📡 [Tab:${TAB_ID}] subscribe → ${profile}`);
//     }
//   }, []);

//   const unsubscribeFromProfile = useCallback((profile) => {
//     if (_socket?.connected) {
//       _socket.emit('unsubscribe:profile', profile);
//       console.log(`📡 [Tab:${TAB_ID}] unsubscribe → ${profile}`);
//     }
//   }, []);

//   return { socket: _socket, connected, subscribeToProfile, unsubscribeFromProfile };
// }

// const BOT_EVENTS = [
//   'bot:terminal', 'bot:status', 'bot:progress', 'bot:completed',
//   'bot:cycleStart', 'bot:cycleComplete', 'bot:cycleProgress', 'bot:cycleUpdate',
//   'bot:betUpdate', 'bot:betConfigChanged', 'bot:betError',
// ];

// /**
//  * useBotEvents — attaches event listeners for a specific profile room.
//  *
//  * FIXES applied:
//  *  - Captures old handler ref BEFORE overwriting so sock.off() removes the
//  *    correct function (was the #1 cause of listener accumulation).
//  *  - detach() is called inside the reconnect handler before attach() so
//  *    reconnects don't stack duplicate listeners.
//  *  - All async paths check the `active` flag to handle fast unmounts cleanly.
//  */
// export function useBotEvents(profile, onEvent) {
//   const onEventRef = useRef(onEvent);
//   onEventRef.current = onEvent;

//   const { subscribeToProfile, unsubscribeFromProfile } = useSocket();
//   const subscribedProfileRef = useRef(null);

//   useEffect(() => {
//     if (!profile) return;

//     // Map of event name → currently attached handler function.
//     // Keeping stable refs is the key to correct sock.off() calls.
//     const activeHandlers = {};
//     let active = true;

//     const makeHandler = (event) => (data) => {
//       if (!active) return;
//       // Drop events that belong to a different profile in the same room broadcast
//       if (data._profile && data._profile !== profile) return;
//       onEventRef.current(event, data);
//     };

//     const attach = (sock) => {
//       BOT_EVENTS.forEach(event => {
//         // FIX: capture the OLD ref first, then remove it, then add new one.
//         const oldHandler = activeHandlers[event];
//         if (oldHandler) sock.off(event, oldHandler);

//         const newHandler = makeHandler(event);
//         activeHandlers[event] = newHandler;
//         sock.on(event, newHandler);
//       });
//     };

//     const detach = (sock) => {
//       BOT_EVENTS.forEach(event => {
//         if (activeHandlers[event]) {
//           sock.off(event, activeHandlers[event]);
//           delete activeHandlers[event];
//         }
//       });
//     };

//     // Stored so the reconnect listener can be cleaned up properly
//     let reconnectHandler = null;

//     const setup = async () => {
//       const sock = await getSocket();
//       if (!sock || !active) return;

//       // Leave previous profile room if profile changed mid-navigation
//       if (subscribedProfileRef.current && subscribedProfileRef.current !== profile) {
//         unsubscribeFromProfile(subscribedProfileRef.current);
//       }

//       subscribeToProfile(profile);
//       subscribedProfileRef.current = profile;
//       attach(sock);

//       // On reconnect: re-subscribe + re-attach (detach first to prevent duplicates)
//       reconnectHandler = () => {
//         if (!active) return;
//         detach(sock);
//         subscribeToProfile(profile);
//         attach(sock);
//       };
//       sock.on('connect', reconnectHandler);
//     };

//     setup();

//     return () => {
//       active = false;

//       if (subscribedProfileRef.current) {
//         unsubscribeFromProfile(subscribedProfileRef.current);
//         subscribedProfileRef.current = null;
//       }

//       if (_socket) {
//         if (reconnectHandler) _socket.off('connect', reconnectHandler);
//         detach(_socket);
//       }
//     };
//   }, [profile, subscribeToProfile, unsubscribeFromProfile]);
// }




import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { auth } from '../firebase';

/**
 * useSocket — per-tab, per-user socket isolation.
 *
 * SCALE DESIGN for 200 concurrent users:
 *
 * - Each user has ONE socket connection (one browser tab = one socket).
 * - TAB_ID is stored in sessionStorage — unique per tab, not shared across tabs.
 * - Module-level _socket is safe: each browser tab has its own JS module context.
 * - On auth state change (logout), the socket is immediately disconnected so
 *   the server doesn't hold dead connections from logged-out users.
 *
 * FIXES applied from previous review:
 * - Handler leak: capture old ref before overwriting, then sock.off(oldRef).
 * - Reconnect duplicates: detach() before attach() in reconnect handler.
 * - Fast unmount: `active` flag guards all async paths.
 */

const TAB_ID = (() => {
  let id = sessionStorage.getItem('_mw_tab_id');
  if (!id) {
    id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('_mw_tab_id', id);
  }
  return id;
})();

// Module-level — one socket per browser tab (each tab = own JS module context)
let _socket           = null;
let _connectionPromise = null;
const _listeners      = new Set();

function notifyListeners(connected) {
  _listeners.forEach(fn => fn(connected));
}

async function getSocket() {
  if (_socket?.connected) return _socket;
  if (_connectionPromise)  return _connectionPromise;

  _connectionPromise = new Promise(async (resolve) => {
    try {
      const user = auth.currentUser;
      if (!user) { _connectionPromise = null; resolve(null); return; }

      const token = await user.getIdToken();

   const backendUrl = import.meta.env.VITE_API_URL || window.location.origin;
_socket = io(backendUrl, {
        auth:       { token },
        transports: ['websocket', 'polling'],
        query:      { tabId: TAB_ID },
        reconnection:             true,
        reconnectionDelay:        1000,
        reconnectionDelayMax:     5000,
        reconnectionAttempts:     Infinity,
        // Don't send large buffers — terminal logs are streamed in small chunks
        maxHttpBufferSize:        2e6,
      });

      _socket.on('connect', () => {
        console.log(`🔌 [Tab:${TAB_ID}] connected [${_socket.id}]`);
        notifyListeners(true);
        _connectionPromise = null;
        resolve(_socket);
      });

      _socket.on('disconnect', (reason) => {
        console.log(`🔌 [Tab:${TAB_ID}] disconnected: ${reason}`);
        notifyListeners(false);
        // Server-initiated disconnect = token refresh needed
        if (reason === 'io server disconnect') {
          setTimeout(async () => {
            try {
              const fresh = await auth.currentUser?.getIdToken(true);
              if (fresh && _socket) { _socket.auth.token = fresh; _socket.connect(); }
            } catch (_) {}
          }, 500);
        }
      });

      _socket.on('connect_error', (err) => {
        console.warn(`[Tab:${TAB_ID}] connect error:`, err.message);
        _connectionPromise = null;
        resolve(_socket);
      });

    } catch (err) {
      console.error(`[Tab:${TAB_ID}] socket init error:`, err);
      _connectionPromise = null;
      resolve(null);
    }
  });

  return _connectionPromise;
}

// Disconnect when user logs out — frees server socket slot immediately
auth.onAuthStateChanged(user => {
  if (user) {
    getSocket();
  } else if (_socket) {
    _socket.disconnect();
    _socket            = null;
    _connectionPromise = null;
    notifyListeners(false);
  }
});

export function useSocket() {
  const [connected, setConnected] = useState(_socket?.connected || false);

  useEffect(() => {
    const listener = (state) => setConnected(state);
    _listeners.add(listener);
    if (_socket?.connected) setConnected(true);
    else getSocket().then(s => { if (s?.connected) setConnected(true); });
    return () => { _listeners.delete(listener); };
  }, []);

  const subscribeToProfile = useCallback((profile) => {
    if (_socket?.connected) {
      _socket.emit('subscribe:profile', profile);
      console.log(`📡 [Tab:${TAB_ID}] subscribe → ${profile}`);
    }
  }, []);

  const unsubscribeFromProfile = useCallback((profile) => {
    if (_socket?.connected) {
      _socket.emit('unsubscribe:profile', profile);
      console.log(`📡 [Tab:${TAB_ID}] unsubscribe → ${profile}`);
    }
  }, []);

  return { socket: _socket, connected, subscribeToProfile, unsubscribeFromProfile };
}

const BOT_EVENTS = [
  'bot:terminal', 'bot:status', 'bot:progress', 'bot:completed',
  'bot:cycleStart', 'bot:cycleComplete', 'bot:cycleProgress', 'bot:cycleUpdate',
  'bot:betUpdate', 'bot:betConfigChanged', 'bot:betError',
];

/**
 * useBotEvents — subscribe to live bot events for a profile.
 *
 * FIX: Stable handler refs prevent listener accumulation.
 * Each event has exactly one listener at any time, even across
 * profile switches and socket reconnects.
 */
export function useBotEvents(profile, onEvent) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const { subscribeToProfile, unsubscribeFromProfile } = useSocket();
  const subscribedProfileRef = useRef(null);

  useEffect(() => {
    if (!profile) return;

    // Stable map of currently-attached handler refs
    const activeHandlers = {};
    let active = true;
    let reconnectHandler = null;

    const makeHandler = (event) => (data) => {
      if (!active) return;
      // Drop events tagged for a different profile (server-side rooms prevent
      // this in normal operation, but the filter is a safety net)
      if (data._profile && data._profile !== profile) return;
      onEventRef.current(event, data);
    };

    const attach = (sock) => {
      BOT_EVENTS.forEach(event => {
        const old = activeHandlers[event];
        if (old) sock.off(event, old);          // remove OLD ref before overwriting
        const handler = makeHandler(event);
        activeHandlers[event] = handler;
        sock.on(event, handler);
      });
    };

    const detach = (sock) => {
      BOT_EVENTS.forEach(event => {
        if (activeHandlers[event]) {
          sock.off(event, activeHandlers[event]);
          delete activeHandlers[event];
        }
      });
    };

    const setup = async () => {
      const sock = await getSocket();
      if (!sock || !active) return;

      // Leave previous profile room on profile navigation within same tab
      if (subscribedProfileRef.current && subscribedProfileRef.current !== profile) {
        unsubscribeFromProfile(subscribedProfileRef.current);
      }

      subscribeToProfile(profile);
      subscribedProfileRef.current = profile;
      attach(sock);

      // On reconnect: detach stale listeners, re-subscribe, re-attach fresh ones
      reconnectHandler = () => {
        if (!active) return;
        detach(sock);
        subscribeToProfile(profile);
        attach(sock);
      };
      sock.on('connect', reconnectHandler);
    };

    setup();

    return () => {
      active = false;
      if (subscribedProfileRef.current) {
        unsubscribeFromProfile(subscribedProfileRef.current);
        subscribedProfileRef.current = null;
      }
      if (_socket) {
        if (reconnectHandler) _socket.off('connect', reconnectHandler);
        detach(_socket);
      }
    };
  }, [profile, subscribeToProfile, unsubscribeFromProfile]);
}
