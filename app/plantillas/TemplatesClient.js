'use client';

import React from 'react';
import ProtectedRoute from '../../lib/auth/ProtectedRoute';
import PrivateLayout from '../../components/layout/PrivateLayout';
import { TemplateSelector } from '../../components/ProjectTracking';

/**
 * Templates Client Component
 * Migration of the templates page to App Router.
 * Handles the interactive part of the plantillas section.
 */
export default function TemplatesClient() {
    return (
        <ProtectedRoute>
            <PrivateLayout
                title="Plantillas Educativas - AI Code Mentor"
                description="Centro de plantillas educativas del Ecosistema 360"
            >
                <div className="space-y-8">
                    {/* Centro de Plantillas Educativas - Sistema Completo */}
                    <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 rounded-lg p-6 border border-purple-200 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    📋 Centro de Plantillas Educativas
                                </h1>
                                <p className="text-gray-600">
                                    Sistema completo de plantillas metodológicas para documentación educativa estructurada
                                </p>
                            </div>
                            <div className="text-4xl">📋</div>
                        </div>

                        <div className="mt-4 flex items-center space-x-6 text-sm text-purple-600">
                            <span>✅ 10 Plantillas Disponibles</span>
                            <span>📋 Metodología Ecosistema 360</span>
                            <span>🎓 Andamiaje Decreciente</span>
                        </div>
                    </div>

                    {/* Template Selector Component */}
                    <TemplateSelector className="" />
                </div>
            </PrivateLayout>
        </ProtectedRoute>
    );
}
