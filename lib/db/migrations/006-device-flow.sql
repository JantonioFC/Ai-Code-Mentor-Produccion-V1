-- ==========================================
-- 8. DEVICE FLOW AUTH (VS Code Extension)
-- ==========================================

CREATE TABLE IF NOT EXISTS device_codes (
    code TEXT PRIMARY KEY, -- El código corto que ve el usuario (ej: ABCD-1234)
    device_code TEXT NOT NULL UNIQUE, -- El secreto que guarda la extensión
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'authorized', 'expired', 'denied')),
    user_id TEXT REFERENCES user_profiles(id) ON DELETE CASCADE, -- ID del usuario que autorizó (NULL al inicio)
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE, -- Hash del token para verificación segura
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    label TEXT, -- Nombre descriptivo (ej: "VS Code @ Laptop Juan")
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME -- Opcional, por si queremos tokens con caducidad
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_device_codes_device_code ON device_codes(device_code);
CREATE INDEX IF NOT EXISTS idx_pats_user_id ON personal_access_tokens(user_id);
