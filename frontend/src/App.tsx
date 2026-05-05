import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CircleUserRound,
  LogOut,
  Plus,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { AllergyCategory, SafetyPrediction } from "@clearaller/shared";
import { AnalysisResults } from "./components/AnalysisResults";
import { ImageCapturePanel } from "./components/ImageCapturePanel";
import { MobileBottomNav, type AppScreen } from "./components/MobileBottomNav";
import { ProductSearchPanel } from "./components/ProductSearchPanel";
import { SafetyChatWidget } from "./components/SafetyChatWidget";
import { useAuth } from "./context/AuthContext";
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

type AllergySettingForm = {
  category: AllergyCategory;
  severity: (typeof severityOptions)[number];
};

type ProductLens = (typeof productLensOptions)[number];
type GenderOption = (typeof genderOptions)[number];
type SkinType = (typeof skinTypeOptions)[number];
type HairType = (typeof hairTypeOptions)[number];
type CosmeticConcern = (typeof cosmeticConcernOptions)[number];

type MedicalCondition = {
  name: string;
  note?: string;
};

type Profile = {
  id: string;
  name: string;
  age: number;
  medicalConditions?: MedicalCondition[];
  allergySettings: Array<{ category: string; severity: string }>;
};

type DashboardData = {
  profiles: Profile[];
  recentAnalyses: Array<{
    id: string;
    productQuery?: string | null;
    createdAt: string;
    profileHits: Array<{ rating: string }>;
  }>;
  knowledgeCount: number;
};

type AuthMode = "welcome" | "login" | "signup";

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

function AuthView({
  mode,
  isBusy,
  onModeChange,
  onLogin,
  onSignup,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginError,
  signupName,
  setSignupName,
  signupEmail,
  setSignupEmail,
  signupPassword,
  setSignupPassword,
  signupConfirmPassword,
  setSignupConfirmPassword,
  signupError
}: {
  mode: AuthMode;
  isBusy: boolean;
  onModeChange: (mode: AuthMode) => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onSignup: (event: FormEvent<HTMLFormElement>) => void;
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  loginError: string | null;
  signupName: string;
  setSignupName: (value: string) => void;
  signupEmail: string;
  setSignupEmail: (value: string) => void;
  signupPassword: string;
  setSignupPassword: (value: string) => void;
  signupConfirmPassword: string;
  setSignupConfirmPassword: (value: string) => void;
  signupError: string | null;
}) {
  const signupFields: Array<{
    label: string;
    value: string;
    setter: (value: string) => void;
    type: "text" | "email" | "password";
  }> = [
    { label: "Name :", value: signupName, setter: setSignupName, type: "text" },
    { label: "Email :", value: signupEmail, setter: setSignupEmail, type: "email" },
    { label: "Password :", value: signupPassword, setter: setSignupPassword, type: "password" },
    { label: "Re-Password :", value: signupConfirmPassword, setter: setSignupConfirmPassword, type: "password" }
  ];

  if (mode === "welcome") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#57bfd0] px-4 py-6">
        <div className="flex min-h-[min(92vh,760px)] w-full max-w-[400px] flex-col overflow-hidden rounded-[30px] bg-[#0d53a9] px-6 pb-8 pt-8 text-white shadow-[0_26px_70px_rgba(13,83,169,0.38)]">
          <h1 className="text-center font-display text-[2.6rem] font-semibold leading-none">Welcome to</h1>
          <div className="mt-6 flex justify-center">
            <div className="grid h-[270px] w-[270px] place-items-center rounded-[40px] bg-white/8 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              <div className="grid place-items-center gap-5">
                <div className="grid h-28 w-28 place-items-center rounded-[30px] bg-white text-[#0d53a9] shadow-[0_14px_28px_rgba(0,0,0,0.14)]">
                  <ShieldCheck size={58} strokeWidth={2.2} />
                </div>
                <div className="text-center">
                  <p className="font-display text-5xl font-semibold tracking-tight">ClearAller</p>
                  <p className="mt-1 text-lg font-semibold tracking-[0.42em] text-white/85">vission</p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onModeChange("login")}
            className="mx-auto mt-8 rounded-full border border-black/40 bg-white px-10 py-3 text-xl font-semibold text-black"
          >
            Start
          </button>

          <p className="mt-8 text-center text-[1.05rem] leading-8 text-white/92">
            It is a <span className="font-semibold">personalized allergen safety platform</span> that helps people check
            whether a food or cosmetic product is safe for them based on their specific allergies.
          </p>
        </div>
      </div>
    );
  }

  if (mode === "login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#57bfd0] px-4 py-6">
        <div className="w-full max-w-[400px] rounded-[30px] bg-[#0d53a9] px-6 py-8 shadow-[0_26px_70px_rgba(13,83,169,0.38)]">
          <form onSubmit={onLogin} className="relative rounded-[28px] bg-white px-6 pb-8 pt-6 shadow-[0_16px_30px_rgba(0,0,0,0.22)]">
            <button
              type="button"
              onClick={() => onModeChange("welcome")}
              className="absolute right-[-10px] top-[-10px] grid h-8 w-8 place-items-center rounded-full bg-[#ff4f3f] text-white"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-center font-display text-[2.1rem] font-semibold leading-tight text-black">Login to your Account</h2>

            <label className="mt-8 block text-base font-semibold text-black">
              Email :
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="mt-2 h-12 w-full rounded-none border-0 bg-[#d9d9d9] px-4 text-black outline-none"
              />
            </label>

            <label className="mt-5 block text-base font-semibold text-black">
              Password :
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="mt-2 h-12 w-full rounded-none border-0 bg-[#d9d9d9] px-4 text-black outline-none"
              />
            </label>

            {loginError ? <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{loginError}</div> : null}

            <button
              type="submit"
              disabled={isBusy}
              className="mx-auto mt-6 block min-w-[132px] rounded-[10px] bg-[#0d53a9] px-8 py-3 text-xl font-semibold text-white shadow-[0_5px_12px_rgba(13,83,169,0.42)] disabled:opacity-50"
            >
              {isBusy ? "..." : "Login"}
            </button>

            <button
              type="button"
              onClick={() => onModeChange("signup")}
              className="mx-auto mt-3 block text-[1.35rem] text-black"
            >
              create
            </button>

            <p className="mt-6 text-center text-sm leading-6 text-[#45627e]">
              Demo access boots the app against the current project backend account.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#57bfd0] px-4 py-6">
        <div className="w-full max-w-[400px] rounded-[30px] bg-[#0d53a9] px-6 py-8 shadow-[0_26px_70px_rgba(13,83,169,0.38)]">
        <form onSubmit={onSignup} className="relative rounded-[28px] bg-white px-6 pb-8 pt-6 shadow-[0_16px_30px_rgba(0,0,0,0.22)]">
          <button
            type="button"
            onClick={() => onModeChange("login")}
            className="absolute right-[-10px] top-[-10px] grid h-8 w-8 place-items-center rounded-full bg-[#ff4f3f] text-white"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-center font-display text-[2rem] font-semibold leading-tight text-black">Create an Account</h2>

          {signupFields.map(({ label, value, setter, type }, index) => (
            <label key={label} className={`block text-base font-semibold text-black ${index === 0 ? "mt-5" : "mt-4"}`}>
              {label}
              <input
                type={type}
                value={value}
                onChange={(event) => setter(event.target.value)}
                className="mt-2 h-12 w-full rounded-none border-0 bg-[#d9d9d9] px-4 text-black outline-none"
              />
            </label>
          ))}

          {signupError ? <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{signupError}</div> : null}

          <button
            type="submit"
            disabled={isBusy}
            className="mx-auto mt-6 block min-w-[132px] rounded-[10px] bg-[#0d53a9] px-8 py-3 text-xl font-semibold text-white shadow-[0_5px_12px_rgba(13,83,169,0.42)] disabled:opacity-50"
          >
            {isBusy ? "..." : "Create"}
          </button>

          <button type="button" onClick={() => onModeChange("login")} className="mx-auto mt-3 block text-[1.35rem] text-black">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const { account, isAuthenticated, isBusy, login, signup, logout } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>("welcome");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);

  const [activeScreen, setActiveScreen] = useState<AppScreen>("home");
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

  const userId = account?.id;

  const profilesQuery = useQuery({
    queryKey: ["profiles", userId],
    enabled: Boolean(userId),
    queryFn: async () => (await api.get<Profile[]>("/api/profiles", { params: { userId } })).data
  });

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", userId],
    enabled: Boolean(userId),
    queryFn: async () => (await api.get<DashboardData>("/api/dashboard", { params: { userId } })).data
  });

  useEffect(() => {
    if (profilesQuery.data?.length && selectedProfileIds.length === 0) {
      setSelectedProfileIds([profilesQuery.data[0].id]);
    }
  }, [profilesQuery.data, selectedProfileIds.length]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("Account is still loading.");
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
          ...profileForm.cosmeticConcerns
            .filter((concern) => concern !== "none")
            .map((concern) => ({ name: concern, note: "cosmeticConcern" as const }))
        ]
      };

      if (editingProfileId) {
        await api.put(`/api/profiles/${editingProfileId}`, payload);
      } else {
        await api.post("/api/profiles", payload);
      }
    },
    onSuccess: async () => {
      setProfileForm(createInitialProfile());
      setEditingProfileId(null);
      setProfileMessageType("success");
      setProfileMessage(editingProfileId ? "Profile updated." : "Profile created.");
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
        throw new Error("Account is still loading.");
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
      setProfileMessage("Profile deleted.");
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
      setActiveScreen("results");
      await queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
    },
    onError: (error) => {
      setAnalysisMessage(getErrorMessage(error));
    }
  });

  const heroStats = useMemo(
    () => [
      { label: "Profiles", value: String(dashboardQuery.data?.profiles.length ?? profilesQuery.data?.length ?? 0) },
      { label: "Knowledge", value: String(dashboardQuery.data?.knowledgeCount ?? 0) },
      { label: "Results", value: String(analysisResults.length) }
    ],
    [analysisResults.length, dashboardQuery.data?.knowledgeCount, dashboardQuery.data?.profiles.length, profilesQuery.data?.length]
  );

  function resetProfileForm() {
    setProfileForm(createInitialProfile());
    setEditingProfileId(null);
    setProfileMessage(null);
    setProfileMessageType(null);
  }

  function updateAllergyEntry(index: number, key: keyof AllergySettingForm, value: string) {
    setProfileForm((current) => ({
      ...current,
      allergySettings: current.allergySettings.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [key]: value } : entry
      )
    }));
  }

  function addAllergyEntry() {
    setProfileForm((current) => ({
      ...current,
      allergySettings: [...current.allergySettings, createBlankAllergy()]
    }));
  }

  function removeAllergyEntry(index: number) {
    setProfileForm((current) => ({
      ...current,
      allergySettings: current.allergySettings.filter((_, entryIndex) => entryIndex !== index)
    }));
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
    setProfileMessage(`Editing ${profile.name}.`);
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
      setAnalysisMessage("Choose at least one profile for selected analysis.");
      return;
    }

    setAnalysisMessage(null);
    analyzeMutation.mutate();
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);

    try {
      await login({ email: loginEmail, password: loginPassword });
      setActiveScreen("home");
    } catch (error) {
      setLoginError(getErrorMessage(error));
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupError(null);

    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }

    try {
      await signup({
        displayName: signupName,
        email: signupEmail,
        password: signupPassword
      });
      setActiveScreen("home");
    } catch (error) {
      setSignupError(getErrorMessage(error));
    }
  }

  function handleLogout() {
    logout();
    setActiveScreen("home");
    setAuthMode("welcome");
    setIngredientText("");
    setProductQuery("");
    setAnalysisResults([]);
    resetProfileForm();
  }

  const screenTitle =
    activeScreen === "home"
      ? "Clearaller vission"
      : activeScreen === "camera"
        ? "Upload & Detect"
        : activeScreen === "search"
          ? "Search products"
          : activeScreen === "chat"
            ? "Chat Bot"
            : activeScreen === "results"
              ? "Profile Result"
              : "My profile";

  if (!isAuthenticated) {
    return (
      <AuthView
        mode={authMode}
        isBusy={isBusy}
        onModeChange={setAuthMode}
        onLogin={handleLogin}
        onSignup={handleSignup}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        signupName={signupName}
        setSignupName={setSignupName}
        signupEmail={signupEmail}
        setSignupEmail={setSignupEmail}
        signupPassword={signupPassword}
        setSignupPassword={setSignupPassword}
        signupConfirmPassword={signupConfirmPassword}
        setSignupConfirmPassword={setSignupConfirmPassword}
        signupError={signupError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#57bfd0] px-3 py-4 text-[#10243b]">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-[400px] flex-col overflow-hidden rounded-[28px] bg-[#0d53a9] shadow-[0_26px_70px_rgba(13,83,169,0.38)]">
        <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 text-white">
          <div className="flex items-center gap-3">
            {activeScreen === "results" ? (
              <button type="button" onClick={() => setActiveScreen("camera")} className="grid h-10 w-10 place-items-center rounded-full bg-white/14">
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white/14">
                <ShieldCheck size={20} />
              </div>
            )}
            <div>
              <h1 className="font-display text-[1.45rem] font-semibold leading-tight">{screenTitle}</h1>
              <p className="mt-1 text-xs text-white/80">{account?.displayName ?? account?.email}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="grid h-10 w-10 place-items-center rounded-full bg-white/14">
            <LogOut size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto rounded-t-[24px] bg-[#f4f7fb] px-3 pb-4 pt-3">
          {activeScreen === "home" ? (
            <div className="space-y-4">
              <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                <div className="bg-[#0d53a9] px-5 pb-6 pt-5 text-white">
                  <p className="text-sm font-semibold tracking-[0.18em] text-white/75">ClearAller Vision</p>
                  <h2 className="mt-3 font-display text-[1.8rem] font-semibold leading-[1.08]">Scan ingredients. Choose safer products.</h2>
                  <p className="mt-3 text-sm leading-6 text-white/82">
                    Upload a product label, compare the ingredients with saved allergy and beauty profiles, then see safer food or cosmetic choices.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveScreen("profile")}
                    className="mt-5 rounded-[14px] bg-white px-5 py-3 text-sm font-semibold text-[#0d53a9]"
                  >
                    create profile
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 px-4 pb-4 pt-4">
                  {heroStats.map((item) => (
                    <div key={item.label} className="rounded-[16px] bg-[#edf3fb] px-2 py-4 text-center">
                      <p className="text-xl font-semibold text-[#0d53a9]">{item.value}</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5b7592]">{item.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-3">
                <div className="rounded-[24px] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#edf3fb] text-[#0d53a9]">
                      <ScanSearch size={24} />
                    </div>
                    <div>
                      <p className="font-semibold">Start with a scan</p>
                      <p className="text-sm text-[#607992]">Upload a food or cosmetic label and run profile-aware checks.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveScreen("camera")}
                    className="mt-4 inline-flex items-center gap-2 rounded-[14px] bg-[#0d53a9] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Open detector
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="rounded-[24px] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Recent activity</p>
                      <p className="text-sm text-[#607992]">Latest analyses from the current account.</p>
                    </div>
                    <Sparkles size={18} className="text-[#0d53a9]" />
                  </div>
                  <div className="mt-4 grid gap-3">
                    {dashboardQuery.data?.recentAnalyses.length ? (
                      dashboardQuery.data.recentAnalyses.map((entry) => (
                        <div key={entry.id} className="rounded-[18px] bg-[#f5f8fd] px-3 py-3">
                          <p className="text-sm font-semibold text-[#173251]">{entry.productQuery || "Ingredient scan"}</p>
                          <p className="mt-1 text-xs text-[#607992]">
                            {entry.profileHits.map((hit) => hit.rating).join(", ") || "No profile hits"} ·{" "}
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-[18px] bg-[#f5f8fd] px-3 py-4 text-sm text-[#607992]">No analyses yet. Run your first scan from Upload & Detect.</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {activeScreen === "camera" ? (
            <div className="space-y-4">
              <section className="rounded-[24px] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                <p className="text-sm font-semibold text-[#173251]">Select Profiles</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAnalysisScope("selected")}
                    className={`rounded-[14px] px-3 py-3 text-sm font-semibold ${
                      analysisScope === "selected" ? "bg-[#0d53a9] text-white" : "bg-[#edf3fb] text-[#0d53a9]"
                    }`}
                  >
                    Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalysisScope("all")}
                    className={`rounded-[14px] px-3 py-3 text-sm font-semibold ${
                      analysisScope === "all" ? "bg-[#0d53a9] text-white" : "bg-[#edf3fb] text-[#0d53a9]"
                    }`}
                  >
                    All
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(profilesQuery.data ?? []).map((profile) => {
                    const selected = selectedProfileIds.includes(profile.id);
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() =>
                          setSelectedProfileIds((current) =>
                            selected ? current.filter((item) => item !== profile.id) : [...current, profile.id]
                          )
                        }
                        className={`rounded-full px-4 py-2 text-xs font-semibold ${
                          selected ? "bg-[#0d53a9] text-white" : "bg-[#edf3fb] text-[#4f6986]"
                        }`}
                      >
                        {profile.name}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {productLensOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setProductLens(option)}
                      className={`rounded-[14px] px-3 py-2 text-sm font-semibold ${
                        productLens === option ? "bg-[#0d53a9] text-white" : "bg-[#edf3fb] text-[#0d53a9]"
                      }`}
                    >
                      {option === "packaged-food" ? "Food" : "cosmetics"}
                    </button>
                  ))}
                </div>
              </section>

              <ImageCapturePanel ingredientText={ingredientText} setIngredientText={setIngredientText} />

              <section className="rounded-[24px] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                <label className="block text-sm font-semibold text-[#173251]">
                  Extracted ingredient text
                  <textarea
                    value={ingredientText}
                    onChange={(event) => setIngredientText(event.target.value)}
                    rows={6}
                    className="mt-2 w-full rounded-[18px] border border-[#d8e3f0] bg-[#f8fbff] px-4 py-3 text-sm outline-none"
                  />
                </label>

                <label className="mt-4 block text-sm font-semibold text-[#173251]">
                  Product query
                  <input
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    placeholder="Milkmaid, gentle cleanser, sunscreen..."
                    className="mt-2 h-12 w-full rounded-[18px] border border-[#d8e3f0] bg-[#f8fbff] px-4 text-sm outline-none"
                  />
                </label>

                {analysisMessage ? <div className="mt-4 rounded-[18px] bg-red-50 px-4 py-3 text-sm text-red-600">{analysisMessage}</div> : null}

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={runAnalysis}
                    disabled={analyzeMutation.isPending}
                    className="flex-1 rounded-[16px] bg-[#0d53a9] px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
                  >
                    {analyzeMutation.isPending ? "Analyzing..." : "Analyze"}
                  </button>
                  {analysisResults.length ? (
                    <button
                      type="button"
                      onClick={() => setActiveScreen("results")}
                      className="rounded-[16px] bg-[#edf3fb] px-4 py-3 text-sm font-semibold text-[#0d53a9]"
                    >
                      Results
                    </button>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}

          {activeScreen === "results" ? (
            <div className="space-y-4">
              <AnalysisResults predictions={analysisResults} loading={analyzeMutation.isPending} />
            </div>
          ) : null}

          {activeScreen === "search" ? (
            <ProductSearchPanel
              userId={userId}
              profileIds={selectedProfileIds}
              profiles={(profilesQuery.data ?? []).map((profile) => ({ id: profile.id, name: profile.name }))}
              initialQuery={productQuery}
              lens={productLens}
              setLens={setProductLens}
            />
          ) : null}

          {activeScreen === "chat" ? <SafetyChatWidget userId={userId} profileIds={selectedProfileIds} lens={productLens} setLens={setProductLens} embedded /> : null}

          {activeScreen === "profile" ? (
            <div className="space-y-4">
              <section className="rounded-[24px] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#173251]">{editingProfileId ? "Edit profile" : "Add profile"}</p>
                    <p className="text-sm text-[#607992]">Store allergies plus skin and hair preferences.</p>
                  </div>
                  {editingProfileId ? (
                    <button type="button" onClick={resetProfileForm} className="rounded-[14px] bg-[#edf3fb] px-3 py-2 text-xs font-semibold text-[#0d53a9]">
                      Cancel
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3">
                  <input
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Profile name"
                    className="h-12 rounded-[16px] border border-[#d8e3f0] bg-[#f8fbff] px-4 text-sm outline-none"
                  />
                  <input
                    type="number"
                    min={4}
                    value={profileForm.age}
                    onChange={(event) => setProfileForm((current) => ({ ...current, age: Number(event.target.value) }))}
                    placeholder="Age"
                    className="h-12 rounded-[16px] border border-[#d8e3f0] bg-[#f8fbff] px-4 text-sm outline-none"
                  />

                  {profileForm.allergySettings.map((entry, index) => (
                    <div key={`allergy-${index}`} className="rounded-[18px] bg-[#f5f8fd] p-3">
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <select
                          value={entry.category}
                          onChange={(event) => updateAllergyEntry(index, "category", event.target.value)}
                          className="h-11 rounded-[14px] border border-[#d8e3f0] bg-white px-3 text-sm outline-none"
                        >
                          {allergyOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <select
                          value={entry.severity}
                          onChange={(event) => updateAllergyEntry(index, "severity", event.target.value)}
                          className="h-11 rounded-[14px] border border-[#d8e3f0] bg-white px-3 text-sm outline-none"
                        >
                          {severityOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeAllergyEntry(index)}
                          disabled={profileForm.allergySettings.length === 1}
                          className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#ffe9ea] text-[#c53c47] disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addAllergyEntry}
                    className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#edf3fb] px-4 py-3 text-sm font-semibold text-[#0d53a9]"
                  >
                    <Plus size={16} />
                    Add allergy
                  </button>

                  <select
                    value={profileForm.gender}
                    onChange={(event) => setProfileForm((current) => ({ ...current, gender: event.target.value as GenderOption }))}
                    className="h-12 rounded-[16px] border border-[#d8e3f0] bg-[#f8fbff] px-4 text-sm outline-none"
                  >
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>
                        Gender: {option}
                      </option>
                    ))}
                  </select>

                  <select
                    value={profileForm.skinType}
                    onChange={(event) => setProfileForm((current) => ({ ...current, skinType: event.target.value as SkinType }))}
                    className="h-12 rounded-[16px] border border-[#d8e3f0] bg-[#f8fbff] px-4 text-sm outline-none"
                  >
                    {skinTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        Skin type: {option}
                      </option>
                    ))}
                  </select>

                  <select
                    value={profileForm.hairType}
                    onChange={(event) => setProfileForm((current) => ({ ...current, hairType: event.target.value as HairType }))}
                    className="h-12 rounded-[16px] border border-[#d8e3f0] bg-[#f8fbff] px-4 text-sm outline-none"
                  >
                    {hairTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        Hair type: {option}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={profileForm.medicalCondition}
                    onChange={(event) => setProfileForm((current) => ({ ...current, medicalCondition: event.target.value }))}
                    rows={3}
                    placeholder="Extra medical or sensitivity note"
                    className="rounded-[16px] border border-[#d8e3f0] bg-[#f8fbff] px-4 py-3 text-sm outline-none"
                  />

                  <div className="rounded-[18px] bg-[#f5f8fd] p-3">
                    <p className="text-sm font-semibold text-[#173251]">Cosmetic concerns</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cosmeticConcernOptions.map((concern) => {
                        const active = profileForm.cosmeticConcerns.includes(concern);
                        return (
                          <button
                            key={concern}
                            type="button"
                            onClick={() =>
                              setProfileForm((current) => ({
                                ...current,
                                cosmeticConcerns: active
                                  ? current.cosmeticConcerns.filter((item) => item !== concern)
                                  : [...current.cosmeticConcerns, concern]
                              }))
                            }
                            className={`rounded-full px-3 py-2 text-xs font-semibold ${
                              active ? "bg-[#0d53a9] text-white" : "bg-white text-[#536d89]"
                            }`}
                          >
                            {concern}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {profileMessage ? (
                    <div className={`rounded-[16px] px-4 py-3 text-sm ${profileMessageType === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                      {profileMessage}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => saveProfile.mutate()}
                    disabled={saveProfile.isPending}
                    className="rounded-[16px] bg-[#0d53a9] px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
                  >
                    {saveProfile.isPending ? "Saving..." : editingProfileId ? "Update profile" : "Add profile"}
                  </button>
                </div>
              </section>

              <section className="space-y-3">
                {(profilesQuery.data ?? []).map((profile) => (
                  <article key={profile.id} className="rounded-[24px] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#edf3fb] text-[#0d53a9]">
                          <CircleUserRound size={24} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#173251]">{profile.name}</p>
                          <p className="text-sm text-[#607992]">Age {profile.age}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingProfile(profile)}
                          className="rounded-[12px] bg-[#edf3fb] px-3 py-2 text-xs font-semibold text-[#0d53a9]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete ${profile.name}?`)) {
                              deleteProfile.mutate(profile.id);
                            }
                          }}
                          className="rounded-[12px] bg-[#ffe9ea] px-3 py-2 text-xs font-semibold text-[#c53c47]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.allergySettings.map((setting) => (
                        <span key={`${profile.id}-${setting.category}`} className="rounded-full bg-[#f5f8fd] px-3 py-2 text-xs font-semibold text-[#516b86]">
                          {setting.category} · {setting.severity}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </section>
            </div>
          ) : null}
        </main>

        <MobileBottomNav
          activeScreen={activeScreen}
          onChange={(screen) => {
            setActiveScreen(screen);
          }}
        />
      </div>
    </div>
  );
}
