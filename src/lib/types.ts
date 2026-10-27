export type SourceId =
  | "play_store"
  | "app_store"
  | "reddit"
  | "tradingqna"
  | "youtube"
  | "public_forums";

export type JourneyStage =
  | "considering"
  | "started"
  | "months_1_3"
  | "months_4_12"
  | "paused"
  | "stopped"
  | "continuing"
  | "unknown";

export type DocumentRow = {
  id: string;
  source: SourceId;
  source_url: string | null;
  author_handle: string | null;
  posted_at: string | null;
  title: string | null;
  body: string;
  rating: number | null;
  meta: Record<string, unknown>;
  collected_at: string;
};

export type ExtractedAnalysis = {
  is_relevant: boolean;
  relevance_reason: string;
  journey_stage: JourneyStage;
  start_reasons: string[];
  expectations: string[];
  behavior_changes: string[];
  pause_stop_triggers: string[];
  check_frequency: "daily" | "weekly" | "monthly" | "rarely" | "unknown";
  what_they_check: string[];
  in_app_confusion: string[];
  outside_app_actions: string[];
  continuer_signals: string[];
  dropout_signals: string[];
  segment: {
    age_band: "unknown" | "18_25" | "26_35" | "36_45" | "46_plus";
    income_stability:
      | "unknown"
      | "stable_salary"
      | "variable"
      | "student"
      | "family_dependent";
    source_of_money: "unknown" | "salary" | "savings" | "bonus" | "family";
    influencer:
      | "unknown"
      | "youtube"
      | "family"
      | "friends"
      | "app"
      | "advisor"
      | "self";
  };
  sentiment: "hopeful" | "neutral" | "confused" | "anxious" | "frustrated" | "confident";
  retention_risk: number;
  themes: { name: string; quote: string; polarity: "pain" | "need" | "habit" | "motive" }[];
  unmet_needs: string[];
  summary: string;
};

export type Opportunity = {
  id: string;
  title: string;
  user_problem: string;
  hypothesized_need: string;
  why_it_moves_12m_sip: string;
  constraint_fit: string;
  reach_pct: number;
  intensity: number;
  evidence_count: number;
  confidence: number;
  score: number;
  supporting_theme_ids: string[];
  sample_quotes: { quote: string; source: string; document_id: string }[];
  contra_evidence: string[];
  segments_most_affected: string[];
};
