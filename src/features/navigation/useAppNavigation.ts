
import React from 'react';

export type AppRoute =
  | 'dashboard'
  | 'clients'
  | 'client-profile'
  | 'menu'
  | 'labs'
  | 'events'
  | 'billing'
  | 'telegram';

type NavigationState = {
  activeRoute: AppRoute;
  activeClientId: string | null;
};

export const useAppNavigation = () => {
  const [state, setState] = React.useState<NavigationState>({
    activeRoute: 'dashboard',
    activeClientId: 'c1',
  });

  const setRoute = (route: AppRoute) => {
    setState((prev) => ({
      ...prev,
      activeRoute: route,
    }));
  };

  const setClient = (clientId: string | null) => {
    setState((prev) => ({
      ...prev,
      activeClientId: clientId,
    }));
    if (clientId) {
      setState((prev) => ({
        ...prev,
        activeRoute: 'client-profile',
      }));
    }
  };

  return {
    activeRoute: state.activeRoute,
    activeClientId: state.activeClientId,
    setRoute,
    setClient,
  };
};
