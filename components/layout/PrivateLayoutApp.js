'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import PrivateLayoutBase from './PrivateLayoutBase';

/**
 * PrivateLayoutApp - Wrapper de PrivateLayout para App Router
 */
const PrivateLayoutApp = (props) => {
    const router = useRouter();
    const pathname = usePathname();

    return <PrivateLayoutBase {...props} router={router} pathname={pathname} />;
};

export default PrivateLayoutApp;
