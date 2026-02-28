/**
 * PrivateLayout - Wrapper de PrivateLayout para Pages Router
 * Mantiene compatibilidad con todas las páginas existentes en pages/
 */

import React from 'react';
import { useRouter } from 'next/router';
import PrivateLayoutBase from './PrivateLayoutBase';

const PrivateLayout = (props) => {
  const router = useRouter();

  return <PrivateLayoutBase {...props} router={router} pathname={router.pathname} />;
};

export default PrivateLayout;
