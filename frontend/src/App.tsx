
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Camera,
  Menu,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { AllergyCategory, SafetyPrediction } from "@clearaller/shared";
import { api } from "./lib/api";
import {
  allergyOptions,
  cosmeticConcernOptions,
  genderOptions,
  hairTypeOptions,
  productLensOptions,
  severityOptions,
  skinTypeOptions
} from "./lib/constants";
import { AnalysisResults } from "./components/AnalysisResults";
import { ImageCapturePanel } from "./components/ImageCapturePanel";
import { ProductSearchPanel } from "./components/ProductSearchPanel";
import { SafetyChatWidget } from "./components/SafetyChatWidget";

type Account = {
  id: string;
  email: string;
  displayName: string;
};

type AllergySettingForm = {
  category: AllergyCategory;
  severity: (typeof severityOptions)[number];
};

type Profile = {
  id: string;
  name: string;
  age: number;
  medicalConditions?: Array<{ name: string; note?: string }>;
  allergySettings: Array<{ category: string; severity: string }>;
};

type ProductLens = (typeof productLensOptions)[number];
type GenderOption = (typeof genderOptions)[number];
type SkinType = (typeof skinTypeOptions)[number];
type HairType = (typeof hairTypeOptions)[number];
type CosmeticConcern = (typeof cosmeticConcernOptions)[number];

const createBlankAllergy = (): AllergySettingForm => ({
  category: "dairy",
  severity: "medium"
});

const createInitialProfile = () => ({
  name: "",
  age: 18,
  allergySettings: [createBlankAllergy()],
  medicalCondition: "",
  gender: "female" as GenderOption,
  skinType: "normal" as SkinType,
  hairType: "straight" as HairType,
  cosmeticConcerns: [] as CosmeticConcern[]
});

function readProfileNote(conditions: Profile["medicalConditions"], note: string) {
  return conditions?.find((entry) => entry.note === note)?.name ?? "";
}

function readProfileNotes(conditions: Profile["medicalConditions"], note: string) {
  return conditions?.filter((entry) => entry.note === note).map((entry) => entry.name) ?? [];
}

function normalizeGender(value: string): GenderOption {
  return value === "male" ? "male" : "female";
}

function getErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? "Something went wrong.";
}

export default function App() {
  const queryClient = useQueryClient();
  const [productLens, setProductLens] = useState<ProductLens>("packaged-food");
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [analysisScope, setAnalysisScope] = useState<"selected" | "all">("all");
  const [ingredientText, setIngredientText] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [analysisResults, setAnalysisResults] = useState<SafetyPrediction[]>([]);
  const [profileForm, setProfileForm] = useState(createInitialProfile());
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileMessageType, setProfileMessageType] = useState<"success" | "error" | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [pendingDeleteProfile, setPendingDeleteProfile] = useState<Profile | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const accountQuery = useQuery({
    queryKey: ["account"],
    queryFn: async () => (await api.get<Account>("/api/account/demo")).data
  });

  const userId = accountQuery.data?.id;

  const profilesQuery = useQuery({
    queryKey: ["profiles", userId],
    enabled: Boolean(userId),
    queryFn: async () => (await api.get<Profile[]>("/api/profiles", { params: { userId } })).data
  });

  useEffect(() => {
    if (profilesQuery.data?.length && selectedProfileIds.length === 0) {
      setSelectedProfileIds([profilesQuery.data[0].id]);
    }
  }, [profilesQuery.data, selectedProfileIds.length]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("Account is still loading. Please wait a moment and try again.");
      }

      if (!profileForm.name.trim()) {
        throw new Error("Please enter a profile name.");
      }

      if (!Number.isInteger(profileForm.age) || profileForm.age <= 3) {
        throw new Error("Please enter an age above 3.");
      }

      const cleanedAllergies = profileForm.allergySettings.map((entry) => ({
        category: entry.category,
        severity: entry.severity
      }));
      const uniqueCategories = new Set(cleanedAllergies.map((entry) => entry.category));
      if (cleanedAllergies.length === 0) {
        throw new Error("Add at least one allergy before saving the profile.");
      }
      if (uniqueCategories.size !== cleanedAllergies.length) {
        throw new Error("Each allergy category can be added only once per profile.");
      }

      const payload = {
        userId,
        name: profileForm.name.trim(),
        age: profileForm.age,
        allergySettings: cleanedAllergies,
        medicalConditions: [
          ...(profileForm.medicalCondition.trim() ? [{ name: profileForm.medicalCondition.trim() }] : []),
          ...(profileForm.gender ? [{ name: profileForm.gender, note: "gender" }] : []),
          ...(profileForm.skinType ? [{ name: profileForm.skinType, note: "skinType" }] : []),
          ...(profileForm.hairType ? [{ name: profileForm.hairType, note: "hairType" }] : []),
          ...profileForm.cosmeticConcerns.map((concern) => ({ name: concern, note: "cosmeticConcern" as const }))
        ]
      };

      if (editingProfileId) {
        await api.put(`/api/profiles/${editingProfileId}`, payload);
      } else {
        await api.post("/api/profiles", payload);
      }
    },
    onSuccess: async () => {
      const wasEditing = Boolean(editingProfileId);
      setProfileForm(createInitialProfile());
      setEditingProfileId(null);
      setProfileMessageType("success");
      setProfileMessage(wasEditing ? "Profile updated successfully." : "Profile saved successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profiles", userId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", userId] })
      ]);
    },
    onError: (error) => {
      setProfileMessageType("error");
      setProfileMessage(getErrorMessage(error));
    }
  });

  const deleteProfile = useMutation({
    mutationFn: async (profileId: string) => {
      if (!userId) {
        throw new Error("Account is still loading. Please wait a moment and try again.");
      }
      await api.delete(`/api/profiles/${profileId}`, { params: { userId } });
      return profileId;
    },
    onSuccess: async (profileId) => {
      setSelectedProfileIds((current) => current.filter((item) => item !== profileId));
      if (editingProfileId === profileId) {
        setEditingProfileId(null);
        setProfileForm(createInitialProfile());
      }
      setProfileMessageType("success");
      setProfileMessage("Profile deleted successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profiles", userId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", userId] })
      ]);
    },
    onError: (error) => {
      setProfileMessageType("error");
      setProfileMessage(getErrorMessage(error));
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        return [] as SafetyPrediction[];
      }

      const response = await api.post<{ predictions: SafetyPrediction[] }>("/api/analyze", {
        userId,
        extractedText: ingredientText,
        productQuery,
        scope: analysisScope,
        profileIds: analysisScope === "selected" ? selectedProfileIds : undefined
      });

      return response.data.predictions;
    },
    onSuccess: async (predictions) => {
      setAnalysisResults(predictions);
      setAnalysisMessage(null);
      await queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
    },
    onError: (error) => {
      setAnalysisMessage(getErrorMessage(error));
    }
  });

  const canSaveProfile =
    profileForm.name.trim().length >= 2 &&
    Number.isInteger(profileForm.age) &&
    profileForm.age > 3 &&
    profileForm.allergySettings.length > 0 &&
    !saveProfile.isPending;
  const canRunAnalysis = ingredientText.trim().length > 0 && profilesQuery.data && profilesQuery.data.length > 0;

  function resetProfileForm() {
    setProfileForm(createInitialProfile());
    setEditingProfileId(null);
    setProfileMessage(null);
    setProfileMessageType(null);
  }

  function startEditingProfile(profile: Profile) {
    setEditingProfileId(profile.id);
    setProfileForm({
      name: profile.name,
      age: profile.age,
      allergySettings: profile.allergySettings.map((setting) => ({
        category: setting.category as AllergyCategory,
        severity: setting.severity as (typeof severityOptions)[number]
      })),
      medicalCondition: profile.medicalConditions?.find((entry) => !entry.note)?.name ?? "",
      gender: normalizeGender(readProfileNote(profile.medicalConditions, "gender")),
      skinType: (readProfileNote(profile.medicalConditions, "skinType") || "normal") as SkinType,
      hairType: (readProfileNote(profile.medicalConditions, "hairType") || "straight") as HairType,
      cosmeticConcerns: readProfileNotes(profile.medicalConditions, "cosmeticConcern") as CosmeticConcern[]
    });
    setProfileMessageType(null);
    setProfileMessage(`Editing ${profile.name}. Update the form and save.`);
  }

  function runAnalysis() {
    if (!ingredientText.trim()) {
      setAnalysisMessage("Scan or paste ingredient text before analyzing.");
      return;
    }

    if (!profilesQuery.data?.length) {
      setAnalysisMessage("Save at least one profile before running analysis.");
      return;
    }
    
    if (analysisScope === "selected" && selectedProfileIds.length === 0) {
      setAnalysisMessage("Choose at least one profile for selected-profile analysis.");
      return;
    }

    setAnalysisMessage(null);
    analyzeMutation.mutate();
  }

  function updateAllergyEntry(index: number, key: keyof AllergySettingForm, value: string) {
    setProfileForm((current) => ({
      ...current,
      allergySettings: current.allergySettings.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [key]: value } : entry
      )
    }));
    setProfileMessage(null);
    setProfileMessageType(null);
  }

  function addAllergyEntry() {
    setProfileForm((current) => ({
      ...current,
      allergySettings: [...current.allergySettings, createBlankAllergy()]
    }));
    setProfileMessage(null);
    setProfileMessageType(null);
  }

  function removeAllergyEntry(index: number) {
    setProfileForm((current) => ({
      ...current,
      allergySettings: current.allergySettings.filter((_, entryIndex) => entryIndex !== index)
    }));
    setProfileMessage(null);
    setProfileMessageType(null);
  }

  return (
    <div className="ambient-scroll min-h-screen px-4 pb-16 pt-4 text-ink md:px-8 xl:px-10">
      <div className="floating-orb left-[-5rem] top-24 h-40 w-40 bg-blue-200/45" />
      <div className="floating-orb right-[8%] top-[24rem] h-52 w-52 bg-sea/20" style={{ animationDelay: "-4s" }} />
      <div className="floating-orb bottom-12 left-[35%] h-36 w-36 bg-sky-200/30" style={{ animationDelay: "-7s" }} />

      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border border-[#d7e2eb] bg-white/95 px-4 py-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl md:rounded-full md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0f172a] text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="font-display text-xl font-semibold">ClearAller Vision</p>
            <p className="text-sm text-ink/55">Personalized allergen transparency for packaged food and cosmetics</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {[
            ["Overview", "#overview"],
            ["Profiles", "#profiles"],
            ["Analyze", "#analysis"],
            ["Search", "#search"]
          ].map(([label, href]) => (
            <a key={href} href={href} className="rounded-full px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-[#dbeafe] hover:text-[#1d4ed8]">
              {label}
            </a>
          ))}
        </div>
        <button
          onClick={() => setMobileNavOpen((current) => !current)}
          className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dbeafe] text-[#1d4ed8] md:hidden"
          aria-label="Toggle navigation"
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {mobileNavOpen ? (
        <div className="mx-auto mt-3 max-w-7xl rounded-[28px] border border-[#d7e2eb] bg-white/95 p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
          <div className="grid gap-2">
            {[
              ["Overview", "#overview"],
              ["Profiles", "#profiles"],
              ["Analyze", "#analysis"],
              ["Search", "#search"]
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className="rounded-2xl bg-[#dbeafe] px-4 py-3 text-sm font-medium text-[#1d4ed8]"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <main className="mx-auto mt-6 flex max-w-7xl flex-col gap-6 lg:mt-8">
        <section id="overview" className="glass-card hero-clean relative overflow-hidden p-6 md:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0f172a] via-[#2563eb] to-[#0f766e]" />
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                <span className="rounded-full bg-[#0f172a] px-4 py-2 text-white">ClearAller Vision</span>
                <span className="rounded-full bg-white px-4 py-2 text-[#334155] shadow-sm">Food + cosmetic screening</span>
              </div>
              <p className="section-title mt-6 text-sm font-semibold uppercase text-[#466277]">Product safety assistant</p>
              <h1 className="mt-4 max-w-[12ch] font-display text-4xl font-semibold leading-tight sm:text-5xl xl:text-[4.55rem]">
                Scan ingredients. Choose safer products.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#3c566a] md:text-lg">
                Upload a product label, compare the ingredients with saved allergy and beauty profiles, then see safer food or cosmetic choices.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="overview-step rounded-[24px] p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dbeafe] text-[#1d4ed8]">
                    <Camera size={22} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">1. Capture label</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/60">Read ingredients from food or cosmetic packs.</p>
                </div>
                <div className="overview-step rounded-[24px] p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e4f3f1] text-[#0f766e]">
                    <ShieldCheck size={22} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">2. Check profile</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/60">Match allergies, skin type, hair type, and gender.</p>
                </div>
                <div className="overview-step rounded-[24px] p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e0f2fe] text-[#0369a1]">
                    <Search size={22} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">3. Pick product</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/60">Get top safe options from the curated catalog.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="product-showcase rounded-[34px] border border-[#d9e3ee] p-5 shadow-[0_18px_42px_rgba(19,34,56,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="section-title text-xs font-semibold uppercase text-[#527089]">How the product works</p>
                  <span className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">Live workflow</span>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="mock-phone rounded-[30px] p-4">
                    <div className="flex items-center justify-between">
                      <div className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        OCR scan
                      </div>
                      <Camera size={18} className="text-white/75" />
                    </div>
                    <div className="mock-label mt-5 rounded-[24px] bg-white p-4">
                      <div className="mock-package mx-auto">
                        <span>Milkmaid</span>
                      </div>
                      <div className="mt-5 space-y-2">
                        <div className="h-2.5 w-full rounded-full bg-slate-200" />
                        <div className="h-2.5 w-5/6 rounded-full bg-slate-100" />
                        <div className="h-2.5 w-4/6 rounded-full bg-slate-100" />
                      </div>
                      <div className="scan-line" />
                    </div>
                    <div className="mt-4 rounded-[22px] bg-white/12 p-4 text-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/55">Extracted ingredients</p>
                      <p className="mt-2 text-sm leading-6 text-white/82">Milk solids, sugar, lactose, emulsifier</p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="mock-product-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#678095]">Food package</p>
                          <h3 className="mt-2 text-xl font-semibold text-[#132238]">Milkmaid label</h3>
                          <p className="mt-1 text-sm text-[#617789]">Dairy ingredient detected</p>
                        </div>
                        <span className="mock-risk-badge danger">High risk</span>
                      </div>
                      <p className="mt-4 rounded-2xl bg-[#f7fafc] px-4 py-3 text-sm text-[#4e6478]">Blocked for profiles with critical milk or dairy allergy.</p>
                    </div>

                    <div className="mock-product-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#678095]">Cosmetic</p>
                          <h3 className="mt-2 text-xl font-semibold text-[#132238]">Gentle face wash</h3>
                          <p className="mt-1 text-sm text-[#617789]">Sensitive-skin friendly option</p>
                        </div>
                        <span className="mock-risk-badge safe">Safe pick</span>
                      </div>
                    </div>

                    <div className="mock-product-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#678095]">Recommendation</p>
                          <h3 className="mt-2 text-xl font-semibold text-[#132238]">Top 3 safer products</h3>
                          <p className="mt-1 text-sm text-[#617789]">Filtered by selected profile data</p>
                        </div>
                        <span className="mock-risk-badge neutral">Curated</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="profiles" className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="glass-card p-6 md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="section-title text-sm font-semibold uppercase text-ink/45">Multi-profile manager</p>
                <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold">Create, edit, and tune allergy profiles with cosmetic preferences built in.</h2>
              </div>
              {editingProfileId ? (
                <button onClick={resetProfileForm} type="button" className="rounded-full bg-[#edf4f8] px-4 py-2 text-sm font-medium text-ink/70">
                  Cancel edit
                </button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-ink/70">
                  Profile name
                  <input
                    value={profileForm.name}
                    onChange={(event) => {
                      setProfileForm((current) => ({ ...current, name: event.target.value }));
                      setProfileMessage(null);
                      setProfileMessageType(null);
                    }}
                    placeholder="Aanya, Patient 02, Family child"
                    className="panel-outline rounded-2xl bg-white px-4 py-3"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-ink/70">
                Age
                <input
                  type="number"
                  min={4}
                    value={profileForm.age}
                    onChange={(event) => {
                      setProfileForm((current) => ({ ...current, age: Number(event.target.value) }));
                      setProfileMessage(null);
                      setProfileMessageType(null);
                    }}
                    placeholder="Age"
                    className="panel-outline rounded-2xl bg-white px-4 py-3"
                  />
                  <span className="text-xs font-medium text-[#2563eb]">Note: only ages above 3 are allowed.</span>
                </label>
              </div>

              <div className="rounded-[28px] border border-ink/8 bg-gradient-to-br from-[#f7efe5] to-[#fdfaf4] p-4 md:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-ink">Allergy matrix</p>
                    <p className="mt-1 text-sm text-ink/60">Add multiple allergies, assign severity, and remove rows you no longer need.</p>
                  </div>
                  <button
                    onClick={addAllergyEntry}
                    type="button"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white"
                  >
                    <Plus size={16} />
                    Add allergy
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  {profileForm.allergySettings.map((entry, index) => (
                    <div key={`allergy-${index}`} className="rounded-[24px] bg-white p-4 shadow-sm shadow-ink/5 panel-outline">
                      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                        <label className="grid gap-2 text-sm font-medium text-ink/65">
                          Allergy type
                          <select
                            value={entry.category}
                            onChange={(event) => updateAllergyEntry(index, "category", event.target.value)}
                            className="panel-outline rounded-2xl bg-white px-4 py-3"
                          >
                            {allergyOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-ink/65">
                          Severity level
                          <select
                            value={entry.severity}
                            onChange={(event) => updateAllergyEntry(index, "severity", event.target.value)}
                            className="panel-outline rounded-2xl bg-white px-4 py-3"
                          >
                            {severityOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeAllergyEntry(index)}
                            disabled={profileForm.allergySettings.length === 1}
                          className="inline-flex w-full items-center justify-center rounded-2xl bg-red-50 px-4 py-3 text-red-600 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <label className="grid gap-2 text-sm font-medium text-ink/70">
                Optional medical condition
                <input
                  value={profileForm.medicalCondition}
                  onChange={(event) => {
                    setProfileForm((current) => ({ ...current, medicalCondition: event.target.value }));
                    setProfileMessage(null);
                    setProfileMessageType(null);
                  }}
                  placeholder="Asthma, eczema, dermatitis, or treatment note"
                  className="panel-outline rounded-2xl bg-white px-4 py-3"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-ink/70">
                Gender
                <select
                  value={profileForm.gender}
                  onChange={(event) => {
                    setProfileForm((current) => ({ ...current, gender: event.target.value as GenderOption }));
                    setProfileMessage(null);
                    setProfileMessageType(null);
                  }}
                  className="panel-outline rounded-2xl bg-white px-4 py-3"
                >
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-[28px] border border-ink/8 bg-gradient-to-br from-[#eef7ff] via-white to-[#f3fff8] p-4 md:p-5">
                <div>
                  <p className="font-semibold text-ink">Cosmetic preference profile</p>
                  <p className="mt-1 text-sm text-ink/60">These fields help cosmetic recommendations focus on usable, safe products for the right skin and hair needs.</p>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2 text-sm font-medium text-ink/65">
                    Skin type
                    <select
                      value={profileForm.skinType}
                      onChange={(event) => {
                        setProfileForm((current) => ({ ...current, skinType: event.target.value as SkinType }));
                        setProfileMessage(null);
                        setProfileMessageType(null);
                      }}
                      className="panel-outline rounded-xl bg-white px-3 py-2.5 text-sm"
                    >
                      {skinTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-ink/65">
                    Hair type
                    <select
                      value={profileForm.hairType}
                      onChange={(event) => {
                        setProfileForm((current) => ({ ...current, hairType: event.target.value as HairType }));
                        setProfileMessage(null);
                        setProfileMessageType(null);
                      }}
                      className="panel-outline rounded-xl bg-white px-3 py-2.5 text-sm"
                    >
                      {hairTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-ink/65">
                    Cosmetic concern
                    <div className="rounded-[22px] bg-white p-3 panel-outline">
                      <div className="flex flex-wrap gap-2">
                        {cosmeticConcernOptions
                          .filter((option) => option !== "none")
                          .map((option) => {
                            const active = profileForm.cosmeticConcerns.includes(option);
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setProfileForm((current) => ({
                                    ...current,
                                    cosmeticConcerns: current.cosmeticConcerns.includes(option)
                                      ? current.cosmeticConcerns.filter((item) => item !== option)
                                      : [...current.cosmeticConcerns, option]
                                  }));
                                  setProfileMessage(null);
                                  setProfileMessageType(null);
                                }}
                                className={`rounded-full px-3 py-2 text-sm font-medium ${
                                  active ? "bg-[#2563eb] text-white" : "bg-[#edf4f8] text-ink/70"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {profileMessage ? (
                <div className={`rounded-2xl px-4 py-3 text-sm ${profileMessageType === "success" ? "bg-sea/10 text-sea" : "bg-red-50 text-red-600"}`}>
                  {profileMessage}
                </div>
              ) : null}

              <button
                onClick={() => saveProfile.mutate()}
                disabled={!canSaveProfile}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveProfile.isPending ? (editingProfileId ? "Updating..." : "Saving...") : editingProfileId ? "Update profile" : "Save profile"}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="glass-card p-6 md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-title text-sm font-semibold uppercase text-ink/45">Saved profiles</p>
                <h2 className="mt-3 font-display text-3xl font-semibold">Ready-to-analyze people and their active allergy sets.</h2>
              </div>
              <div className="hidden rounded-full bg-ink px-4 py-2 text-sm font-medium text-white md:flex">{profilesQuery.data?.length ?? 0} active</div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {profilesQuery.data?.length ? (
                profilesQuery.data.map((profile) => {
                  const selected = selectedProfileIds.includes(profile.id);
                  return (
                    <article key={profile.id} className="spotlight-card rounded-[30px] border border-ink/8 p-5 shadow-sm shadow-ink/5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                            {selected ? "Selected" : "Saved profile"}
                          </div>
                          <h3 className="mt-3 font-display text-[2rem] font-semibold leading-none">{profile.name}</h3>
                          <p className="mt-2 text-sm text-ink/55">Age {profile.age}</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => startEditingProfile(profile)}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70 shadow-sm"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteProfile(profile)}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-600"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {profile.allergySettings.map((setting) => (
                          <span key={`${profile.id}-${setting.category}`} className="rounded-full bg-white px-3 py-2 text-sm text-ink/75 shadow-sm">
                            {setting.category} • {setting.severity}
                          </span>
                        ))}
                      </div>

                      {profile.medicalConditions?.length ? (
                        <div className="mt-5 grid gap-3">
                          {profile.medicalConditions.find((entry) => !entry.note)?.name ? (
                            <div className="rounded-[20px] bg-white/80 px-4 py-3 text-sm text-ink/65 panel-outline">
                              Medical note: {profile.medicalConditions.find((entry) => !entry.note)?.name}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                              Gender: {normalizeGender(readProfileNote(profile.medicalConditions, "gender"))}
                            </span>
                            <span className="rounded-full bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
                              Skin: {readProfileNote(profile.medicalConditions, "skinType") || "normal"}
                            </span>
                            <span className="rounded-full bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700">
                              Hair: {readProfileNote(profile.medicalConditions, "hairType") || "straight"}
                            </span>
                            {readProfileNotes(profile.medicalConditions, "cosmeticConcern").map((concern) => (
                              <span key={`${profile.id}-${concern}`} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                                Focus: {concern}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[28px] bg-[#edf4f8] p-6 text-sm text-ink/60">No profiles yet. Create your first allergy profile to unlock analysis and live product filtering.</div>
              )}
            </div>
          </div>
        </section>

        <section id="analysis" className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <ImageCapturePanel ingredientText={ingredientText} setIngredientText={setIngredientText} />
          <div className="glass-card p-6 md:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="section-title text-sm font-semibold uppercase text-ink/45">Allergen analysis</p>
                <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold">Review extracted ingredient text, then run predictions for one profile or the whole account.</h2>
              </div>
              <button
                onClick={runAnalysis}
                disabled={!canRunAnalysis}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2563eb] px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Analyze now
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="mt-5 rounded-[28px] border border-[#d7e2eb] bg-white p-4 panel-outline">
              <p className="text-sm font-medium text-ink/60">Run analysis for</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {productLensOptions.map((option) => {
                  const active = productLens === option;
                  const title = option === "cosmetic" ? "Cosmetic" : "Packaged food";
                  const description =
                    option === "cosmetic" ? "Analyze personal care, hair care, and skin care ingredients." : "Analyze pantry, snack, and ready-made food labels.";

                  return (
                    <button
                      key={`analysis-lens-${option}`}
                      onClick={() => setProductLens(option)}
                      className={`rounded-[20px] px-4 py-3 text-left ${active ? "bg-[#0f172a] text-white" : "bg-[#edf4f8] text-[#334155]"}`}
                    >
                      <p className="font-semibold">{title}</p>
                      <p className={`mt-1 text-sm ${active ? "text-white/75" : "text-ink/55"}`}>{description}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => setAnalysisScope("selected")}
                  className={`rounded-[20px] px-4 py-3 text-left ${analysisScope === "selected" ? "bg-[#0f172a] text-white" : "bg-[#edf4f8] text-[#334155]"}`}
                >
                  <p className="font-semibold">Selected profiles</p>
                  <p className={`mt-1 text-sm ${analysisScope === "selected" ? "text-white/75" : "text-ink/55"}`}>Analyze only the profiles you choose below.</p>
                </button>
                <button
                  onClick={() => setAnalysisScope("all")}
                  className={`rounded-[20px] px-4 py-3 text-left ${analysisScope === "all" ? "bg-[#2563eb] text-white" : "bg-[#edf4f8] text-[#334155]"}`}
                >
                  <p className="font-semibold">All profiles</p>
                  <p className={`mt-1 text-sm ${analysisScope === "all" ? "text-white/80" : "text-ink/55"}`}>Run separate predictions for every saved profile at once.</p>
                </button>
              </div>
              {analysisScope === "selected" ? (
                <div className="mt-3 rounded-2xl bg-[#f1f7fb] px-4 py-3 text-sm text-ink/60">
                  <p className="font-medium text-ink/65">Choose one or more profiles before analyzing</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profilesQuery.data?.length ? (
                      profilesQuery.data.map((profile) => {
                        const active = selectedProfileIds.includes(profile.id);
                        return (
                          <button
                            key={`analysis-profile-${profile.id}`}
                            onClick={() =>
                              setSelectedProfileIds((current) =>
                                active ? current.filter((item) => item !== profile.id) : [...current, profile.id]
                              )
                            }
                            className={`rounded-full px-4 py-2 text-sm font-medium ${active ? "bg-[#0f172a] text-white" : "bg-white text-[#334155]"}`}
                          >
                            {profile.name}
                          </button>
                        );
                      })
                    ) : (
                      <span className="rounded-full bg-white px-4 py-2 text-sm text-ink/60">No profiles available yet.</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-ink/55">
                    {selectedProfileIds.length
                      ? `Using ${selectedProfileIds.length} chosen profile${selectedProfileIds.length > 1 ? "s" : ""} for this analysis.`
                      : "Select at least one profile or switch to all profiles."}
                  </p>
                </div>
              ) : null}
            </div>
            {analysisMessage ? <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{analysisMessage}</div> : null}
            <div className="mt-5 rounded-[30px] border border-ink/8 bg-gradient-to-br from-white to-[#f7fafc] p-4 shadow-sm shadow-ink/5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink/60">Normalized ingredient input</p>
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  {ingredientText.trim() ? "Ready" : "Waiting"}
                </span>
              </div>
              <textarea
                value={ingredientText}
                onChange={(event) => setIngredientText(event.target.value)}
                placeholder="OCR text appears here, or paste packed food / cosmetic ingredients manually"
                className="panel-outline mt-4 min-h-56 w-full rounded-[24px] bg-white px-4 py-4"
              />
            </div>
            <AnalysisResults predictions={analysisResults} loading={analyzeMutation.isPending} />
          </div>
        </section>

        <section id="search">
          <ProductSearchPanel
            userId={userId}
            profileIds={selectedProfileIds}
            profiles={(profilesQuery.data ?? []).map((profile) => ({ id: profile.id, name: profile.name }))}
            initialQuery={productQuery}
            lens={productLens}
            setLens={setProductLens}
          />
        </section>
      </main>

      <SafetyChatWidget userId={userId} profileIds={selectedProfileIds} lens={productLens} setLens={setProductLens} />

      {pendingDeleteProfile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4">
          <div className="w-full max-w-md rounded-[30px] border border-white/70 bg-white/92 p-6 shadow-panel backdrop-blur-xl">
            <p className="section-title text-sm font-semibold uppercase text-ink/45">Delete profile</p>
            <h3 className="mt-2 font-display text-2xl font-semibold">Remove {pendingDeleteProfile.name}?</h3>
            <p className="mt-3 text-sm text-ink/65">This removes the profile and its linked allergy settings from your account history.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setPendingDeleteProfile(null)} className="rounded-2xl bg-[#edf4f8] px-5 py-3 font-medium text-ink">
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProfile.mutate(pendingDeleteProfile.id);
                  setPendingDeleteProfile(null);
                }}
                className="rounded-2xl bg-red-600 px-5 py-3 font-medium text-white"
              >
                Delete profile
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

