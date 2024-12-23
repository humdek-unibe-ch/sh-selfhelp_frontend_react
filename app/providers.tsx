'use client';

import { MantineProvider } from '@mantine/core';
import { Refine } from '@refinedev/core';
import { theme } from '../theme';
import appRouter from '@refinedev/nextjs-router';
import dataProvider from '@refinedev/simple-rest';
import { API_CONFIG } from './config/api.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { LoadingScreen } from './components/common/LoadingScreen';
import { useAppNavigation } from './hooks/useAppNavigation';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authProvider } from './providers/auth.provider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client with optimized settings
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000, // 1 second
            gcTime: 24 * 60 * 60 * 1000, // 24 hours
        },
    },
});

// Initialize persistence
if (typeof window !== 'undefined') {
    const persister = createSyncStoragePersister({
        storage: window.localStorage,
        key: 'app-cache', // Unique key for your app
    });

    persistQueryClient({
        queryClient,
        persister
    });
}

function RefineWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const { resources, navItems, isLoading } = useAppNavigation({ isAdmin });

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Refine
            routerProvider={appRouter}
            dataProvider={dataProvider(API_CONFIG.BASE_URL)}
            authProvider={authProvider}
            resources={resources}
            options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                disableTelemetry: true,
            }}
        >
            {children}
        </Refine>
    );
}

function Providers({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    if (!isReady) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme}>
                <RefineWrapper>
                    {children}
                </RefineWrapper>
            </MantineProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

export { Providers };
