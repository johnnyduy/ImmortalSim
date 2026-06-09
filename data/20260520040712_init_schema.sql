-- Enable UUID generation. Supabase includes pgcrypto by default, and
-- gen_random_uuid() avoids depending on the older uuid-ossp extension.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (Extends Supabase Auth for future online features)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Legacies (Persistent inheritance across reincarnations)
CREATE TABLE IF NOT EXISTS legacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    legacy_power INT DEFAULT 0,
    karma INT DEFAULT 0,
    ancestral_memories JSONB DEFAULT '[]'::jsonb, -- Array of retained skills/memories
    global_flags JSONB DEFAULT '{}'::jsonb,       -- Hidden flags that persist across runs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id)
);

-- 3. Incarnations (Individual simulation runs/lives)
CREATE TABLE IF NOT EXISTS incarnations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_id UUID NOT NULL REFERENCES legacies(id) ON DELETE CASCADE,
    run_number INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'alive',         -- 'alive', 'dead', 'ascended'
    start_age INT DEFAULT 1,
    end_age INT,
    cause_of_death TEXT,
    timeline_corruption INT DEFAULT 0,            -- Timeline corruption systems
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Characters (The stats and state of a specific Incarnation)
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incarnation_id UUID NOT NULL REFERENCES incarnations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    realm TEXT DEFAULT 'Mortal',
    health INT DEFAULT 100,
    cultivation INT DEFAULT 0,
    comprehension INT DEFAULT 0,
    luck INT DEFAULT 0,
    hidden_flags JSONB DEFAULT '{}'::jsonb,       -- Life-specific hidden flags
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(incarnation_id)
);

-- 5. NPCs (Supports future AI-generated content and shared worlds)
CREATE TABLE IF NOT EXISTS npcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Null if system-generated
    name TEXT NOT NULL,
    description TEXT,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_prompt TEXT,                               -- The prompt used to generate the NPC
    base_stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Relationships (Character to NPC interactions)
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    affinity INT DEFAULT 0,
    status TEXT DEFAULT 'neutral',                -- 'ally', 'enemy', 'master', 'disciple'
    memory_tags JSONB DEFAULT '[]'::jsonb,        -- Shared memories between NPC and Player
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(character_id, npc_id)
);

-- 7. Event Logs (Memory systems & Timeline tracking)
CREATE TABLE IF NOT EXISTS event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incarnation_id UUID NOT NULL REFERENCES incarnations(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,                       -- Maps to your events.json IDs
    age INT NOT NULL,
    choice_id TEXT,
    consequences JSONB DEFAULT '{}'::jsonb,
    corruption_delta INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Scalability & Performance Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_legacies_profile ON legacies(profile_id);
CREATE INDEX IF NOT EXISTS idx_incarnations_legacy ON incarnations(legacy_id);
CREATE INDEX IF NOT EXISTS idx_incarnations_status ON incarnations(status);
CREATE INDEX IF NOT EXISTS idx_event_logs_incarnation_age ON event_logs(incarnation_id, age);
CREATE INDEX IF NOT EXISTS idx_relationships_character ON relationships(character_id);
CREATE INDEX IF NOT EXISTS idx_npcs_ai ON npcs(is_ai_generated);
