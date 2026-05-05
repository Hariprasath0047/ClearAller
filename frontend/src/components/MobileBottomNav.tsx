import { Camera, House, MessageCircleMore, Search, UserRound } from "lucide-react";

export type AppScreen = "home" | "camera" | "search" | "chat" | "profile" | "results";

const navItems: Array<{
  id: Exclude<AppScreen, "results">;
  label: string;
  icon: typeof House;
}> = [
  { id: "home", label: "Home", icon: House },
  { id: "camera", label: "Detect", icon: Camera },
  { id: "search", label: "Search", icon: Search },
  { id: "chat", label: "Chat", icon: MessageCircleMore },
  { id: "profile", label: "Profile", icon: UserRound }
];

export function MobileBottomNav({
  activeScreen,
  onChange
}: {
  activeScreen: AppScreen;
  onChange: (screen: Exclude<AppScreen, "results">) => void;
}) {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-white/20 bg-[#f3f6fb]/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-2 backdrop-blur">
      <div className="grid grid-cols-5 gap-2 rounded-[26px] bg-white p-2 shadow-[0_12px_30px_rgba(13,83,169,0.18)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-semibold ${
                active ? "bg-[#0d53a9] text-white" : "bg-[#eff3fa] text-[#45627e]"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
