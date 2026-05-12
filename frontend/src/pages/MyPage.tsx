import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  BellOff,
  Clock,
  Heart,
  LogOut,
  MapPin,
  Pencil,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useFavorites } from "../auth/FavoritesContext";
import type { Favorite } from "../auth/FavoritesContext";
import { getRecentSpaces, type RecentSpace } from "../lib/recentlyViewed";
import { fetchAllSpaces } from "../data/seoul";
import { manualSpaces } from "../data/manualSpaces";
import {
  computeMatches,
  splitCSV,
  joinCSV,
  type MatchableFacility,
} from "../lib/matchSpaces";
import {
  disableNotifications,
  enableNotifications,
  getNotifPermission,
  isNotifEnabled,
} from "../lib/notifications";

/* ───────────────────────────── Constants ───────────────────────────── */

const CREATOR_TYPES: { value: string; label: string }[] = [
  { value: "emerging_artist", label: "🎨 신진 예술가" },
  { value: "small_brand", label: "🏷️ 소규모 브랜드" },
  { value: "performer", label: "🎭 공연·퍼포머" },
  { value: "content_creator", label: "📸 콘텐츠 크리에이터" },
];

const CATEGORY_OPTIONS = [
  "공연장",
  "전시·관람",
  "다목적실",
  "강당·강의실",
  "회의실",
  "광장·야외",
  "녹화·촬영",
];

const CAPACITY_OPTIONS = ["10명 이하", "10~30명", "30~100명", "100명 이상"];

const SEOUL_DISTRICTS = [
  "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구",
  "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구",
  "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구",
  "서초구", "강남구", "송파구", "강동구",
];

/* ───────────────────────────── Types ───────────────────────────── */

type Facility = MatchableFacility & {
  PLACENM: string;
  AREANM: string;
  PAYATNM: string;
};

/* ───────────────────────────── Page ───────────────────────────── */

export function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { favorites, ready: favReady, toggle: toggleFavorite } = useFavorites();
  const [recent, setRecent] = useState<RecentSpace[]>([]);
  const [allFacilities, setAllFacilities] = useState<Facility[]>([]);

  useEffect(() => {
    setRecent(getRecentSpaces().slice(0, 5));
  }, []);

  useEffect(() => {
    fetchAllSpaces()
      .then((rows) => setAllFacilities([...(rows as Facility[]), ...manualSpaces]))
      .catch(() => setAllFacilities([...manualSpaces]));
  }, []);

  // 사용자 선호 기반 추천 — shared computeMatches 사용
  const recommended = useMemo<Facility[]>(() => {
    if (!user) return [];
    return computeMatches(user, allFacilities, 6);
  }, [user, allFacilities]);

  if (!user) return null;

  async function onUnfavorite(fav: Favorite) {
    try {
      await toggleFavorite({ svc_id: fav.svc_id });
    } catch {
      /* Context 자동 복구 */
    }
  }

  return (
    <div className="space-y-10 py-8">
      {/* ── Profile ── */}
      <ProfileCard
        name={user.name}
        email={user.email}
        avatar={user.avatar}
        bio={user.bio}
        onLogout={async () => {
          await logout();
          navigate("/");
        }}
      />

      {/* ── 내 프로필 (관심사) ── */}
      <ProfilePreferences user={user} />

      {/* ── 알림 토글 ── */}
      <NotificationToggle />

      {/* ── 추천 공간 ── */}
      <section>
        <SectionHeader
          icon={<Sparkles className="size-5 text-amber-500" />}
          title="나에게 어울리는 공간"
          count={recommended.length}
          subtitle="내 프로필 기반 맞춤 추천 — 카테고리·지역·인원이 맞을수록 우선"
        />
        {recommended.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="size-8" strokeWidth={1.2} />}
            title="추천을 위한 정보가 더 필요해요"
            sub="위 '내 프로필' 에서 카테고리·지역·인원 중 하나라도 선택해주세요"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((f) => (
              <RecommendedCard
                key={f.SVCID ?? f.SVCNM}
                facility={f}
                onOpen={() =>
                  navigate(`/spaces/${encodeURIComponent(f.SVCID ?? f.SVCNM)}`, {
                    state: { facility: f },
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 찜한 공간 ── */}
      <section>
        <SectionHeader
          icon={<Heart className="size-5 text-rose-500" />}
          title="찜한 공간"
          count={favorites.length}
          subtitle="하트를 누른 공간을 한 곳에 모아 봐요"
        />
        {!favReady ? (
          <SkeletonGrid />
        ) : favorites.length === 0 ? (
          <EmptyState
            icon={<Heart className="size-8" strokeWidth={1.2} />}
            title="아직 찜한 공간이 없어요"
            sub="마음에 드는 공간을 발견하면 하트를 눌러 모아보세요"
            action={
              <Link
                to="/stays"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
              >
                공간 둘러보기
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((f) => (
              <FavoriteCard
                key={f.ID}
                fav={f}
                onUnfavorite={() => onUnfavorite(f)}
                onOpen={() =>
                  navigate(`/spaces/${encodeURIComponent(f.svc_id)}`, {
                    state: { facility: favoriteToFacility(f) },
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 최근 본 공간 ── */}
      <section>
        <SectionHeader
          icon={<Clock className="size-5 text-emerald-600" />}
          title="최근 본 공간"
          count={recent.length}
          subtitle="최근에 확인한 공간 (이 기기 기준)"
        />
        {recent.length === 0 ? (
          <EmptyState
            icon={<Clock className="size-8" strokeWidth={1.2} />}
            title="최근 본 공간이 없어요"
            sub="공간 상세 페이지를 한 번이라도 열면 여기에 쌓입니다"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {recent.map((r) => (
              <RecentCard
                key={r.svc_id}
                space={r}
                onOpen={() =>
                  navigate(`/spaces/${encodeURIComponent(r.svc_id)}`, {
                    state: { facility: recentToFacility(r) },
                  })
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ───────────────────────────── Profile Card ───────────────────────────── */

function ProfileCard({
  name,
  email,
  avatar,
  bio,
  onLogout,
}: {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  onLogout: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={name} src={avatar} />
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-slate-900">{name}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{email}</p>
            {bio && (
              <p className="mt-2 text-sm text-slate-700">{bio}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <LogOut className="size-4" />
          로그아웃
        </button>
      </div>
    </section>
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="size-16 shrink-0 rounded-full border border-slate-200 object-cover"
      />
    );
  }
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-slate-900 text-2xl font-black text-white">
      {initial}
    </div>
  );
}

/* ───────────────────────────── Profile Preferences ───────────────────────────── */

function ProfilePreferences({ user }: { user: import("../auth/AuthContext").CurrentUser }) {
  const { updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [creatorType, setCreatorType] = useState(user.creator_type);
  const [bio, setBio] = useState(user.bio);
  const [categories, setCategories] = useState<string[]>(splitCSV(user.preferred_categories));
  const [capacity, setCapacity] = useState(user.preferred_capacity);
  const [districts, setDistricts] = useState<string[]>(splitCSV(user.preferred_districts));

  const hasAnyPref =
    user.creator_type ||
    user.preferred_categories ||
    user.preferred_capacity ||
    user.preferred_districts ||
    user.bio;

  function toggleArrayItem(list: string[], item: string): string[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        creator_type: creatorType,
        bio,
        preferred_categories: joinCSV(categories),
        preferred_capacity: capacity,
        preferred_districts: joinCSV(districts),
      });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    setCreatorType(user.creator_type);
    setBio(user.bio);
    setCategories(splitCSV(user.preferred_categories));
    setCapacity(user.preferred_capacity);
    setDistricts(splitCSV(user.preferred_districts));
    setError(null);
    setEditing(false);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900">내 프로필</h2>
          <p className="mt-1 text-sm text-slate-500">
            저장하면 위 '나에게 어울리는 공간' 추천이 활성화돼요
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <Pencil className="size-4" />
            {hasAnyPref ? "수정" : "지금 설정하기"}
          </button>
        )}
      </div>

      {!editing ? (
        <PreferencesSummary user={user} />
      ) : (
        <div className="space-y-6">
          {/* Creator type */}
          <Field label="활동 유형">
            <div className="flex flex-wrap gap-2">
              {CREATOR_TYPES.map((t) => (
                <Pill
                  key={t.value}
                  active={creatorType === t.value}
                  onClick={() =>
                    setCreatorType(creatorType === t.value ? "" : t.value)
                  }
                >
                  {t.label}
                </Pill>
              ))}
            </div>
          </Field>

          {/* Bio */}
          <Field label="한 줄 소개">
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={120}
              placeholder="예) 종로구에서 활동하는 일러스트레이터"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </Field>

          {/* Categories */}
          <Field label="관심 공간 카테고리" sub="복수 선택 가능">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((c) => (
                <Pill
                  key={c}
                  active={categories.includes(c)}
                  onClick={() => setCategories(toggleArrayItem(categories, c))}
                >
                  {c}
                </Pill>
              ))}
            </div>
          </Field>

          {/* Capacity */}
          <Field label="선호 인원">
            <div className="flex flex-wrap gap-2">
              <Pill active={capacity === ""} onClick={() => setCapacity("")}>
                상관 없음
              </Pill>
              {CAPACITY_OPTIONS.map((o) => (
                <Pill
                  key={o}
                  active={capacity === o}
                  onClick={() => setCapacity(o)}
                >
                  {o}
                </Pill>
              ))}
            </div>
          </Field>

          {/* Districts */}
          <Field label="관심 지역" sub="복수 선택 가능">
            <div className="flex flex-wrap gap-1.5">
              {SEOUL_DISTRICTS.map((d) => (
                <Pill
                  key={d}
                  active={districts.includes(d)}
                  onClick={() => setDistricts(toggleArrayItem(districts, d))}
                  size="sm"
                >
                  {d}
                </Pill>
              ))}
            </div>
          </Field>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function PreferencesSummary({
  user,
}: {
  user: import("../auth/AuthContext").CurrentUser;
}) {
  const cats = splitCSV(user.preferred_categories);
  const districts = splitCSV(user.preferred_districts);
  const creatorLabel = CREATOR_TYPES.find((t) => t.value === user.creator_type)?.label;

  const empty =
    !user.creator_type &&
    !user.bio &&
    cats.length === 0 &&
    !user.preferred_capacity &&
    districts.length === 0;

  if (empty) {
    return (
      <p className="text-sm text-slate-500">
        아직 입력된 정보가 없어요. 우측 '지금 설정하기' 버튼으로 시작해보세요.
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-[120px_1fr]">
      {creatorLabel && (
        <>
          <dt className="font-semibold text-slate-500">활동 유형</dt>
          <dd className="text-slate-900">{creatorLabel}</dd>
        </>
      )}
      {user.bio && (
        <>
          <dt className="font-semibold text-slate-500">소개</dt>
          <dd className="text-slate-900">{user.bio}</dd>
        </>
      )}
      {cats.length > 0 && (
        <>
          <dt className="font-semibold text-slate-500">관심 카테고리</dt>
          <dd className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <span
                key={c}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
              >
                {c}
              </span>
            ))}
          </dd>
        </>
      )}
      {user.preferred_capacity && (
        <>
          <dt className="font-semibold text-slate-500">선호 인원</dt>
          <dd className="text-slate-900">{user.preferred_capacity}</dd>
        </>
      )}
      {districts.length > 0 && (
        <>
          <dt className="font-semibold text-slate-500">관심 지역</dt>
          <dd className="flex flex-wrap gap-1.5">
            {districts.map((d) => (
              <span
                key={d}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
              >
                {d}
              </span>
            ))}
          </dd>
        </>
      )}
    </dl>
  );
}

function Field({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <p className="text-sm font-bold text-slate-900">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  size = "md",
  children,
}: {
  active: boolean;
  onClick: () => void;
  size?: "sm" | "md";
  children: React.ReactNode;
}) {
  const sizeClass = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border font-semibold transition-colors ${sizeClass} ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
      }`}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────── Notification Toggle ───────────────────────────── */

function NotificationToggle() {
  const [enabled, setEnabled] = useState(() => isNotifEnabled());
  const [error, setError] = useState<string | null>(null);

  async function onToggle(next: boolean) {
    setError(null);
    if (next) {
      const ok = await enableNotifications();
      setEnabled(ok);
      if (!ok) {
        const perm = getNotifPermission();
        if (perm === "denied") {
          setError(
            "브라우저 알림이 차단되어 있어요. 주소창 옆 잠금 아이콘에서 알림을 허용해주세요.",
          );
        } else if (perm === "unsupported") {
          setError("이 브라우저는 알림을 지원하지 않습니다.");
        }
      }
    } else {
      disableNotifications();
      setEnabled(false);
    }
  }

  const supported = getNotifPermission() !== "unsupported";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              enabled ? "bg-emerald-100" : "bg-slate-100"
            }`}
          >
            {enabled ? (
              <Bell className="size-5 text-emerald-600" />
            ) : (
              <BellOff className="size-5 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900">매칭 공간 알림</p>
            <p className="mt-0.5 text-xs text-slate-500">
              내 프로필과 맞는 공간이 새로 뜨면 브라우저 알림으로 알려드려요 (10분 간격 체크)
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onChange={onToggle}
          disabled={!supported}
        />
      </div>
      {error && <p className="mt-3 text-xs text-amber-700">{error}</p>}
    </section>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-emerald-500" : "bg-slate-200"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* ───────────────────────────── Section helpers ───────────────────────────── */

function SectionHeader({
  icon,
  title,
  count,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
          {icon}
          {title}
          {typeof count === "number" && count > 0 && (
            <span className="text-sm font-bold text-slate-400">{count}</span>
          )}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  sub,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
      {action}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/3] animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

/* ───────────────────────────── Recommended Card ───────────────────────────── */

function RecommendedCard({
  facility: f,
  onOpen,
}: {
  facility: Facility;
  onOpen: () => void;
}) {
  const isFree = f.PAYATNM === "무료";
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {f.IMGURL ? (
          <img
            src={f.IMGURL}
            alt={f.SVCNM}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Sparkles className="size-10" strokeWidth={1} />
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-slate-900 shadow-sm">
          추천
        </span>
        {f.MINCLASSNM && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {f.MINCLASSNM}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{f.SVCNM}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="size-3 text-slate-400" />
          {f.AREANM}
          {f.PLACENM ? ` · ${f.PLACENM}` : ""}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-700">
          {isFree ? "무료 대관" : f.PAYATNM || "유료"}
          {f.V_MAX ? ` · 최대 ${f.V_MAX}명` : ""}
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────────── Favorite Card ───────────────────────────── */

function FavoriteCard({
  fav,
  onUnfavorite,
  onOpen,
}: {
  fav: Favorite;
  onUnfavorite: () => void;
  onOpen: () => void;
}) {
  const isFree = fav.pay_at_nm === "무료";
  return (
    <div
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {fav.img_url ? (
          <img
            src={fav.img_url}
            alt={fav.svc_nm}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <UserIcon className="size-10" strokeWidth={1} />
          </div>
        )}
        {isFree && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-900 shadow-sm">
            무료
          </span>
        )}
        {fav.min_class_nm && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {fav.min_class_nm}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnfavorite();
          }}
          aria-label="찜 취소"
          className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <Heart className="size-4 fill-rose-500 text-rose-500" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{fav.svc_nm}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="size-3 text-slate-400" />
          {fav.area_nm}
          {fav.place_nm ? ` · ${fav.place_nm}` : ""}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-700">
          {isFree ? "무료 대관" : fav.pay_at_nm || "유료"}
          {fav.v_max ? ` · 최대 ${fav.v_max}명` : ""}
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────────── Recent Card ───────────────────────────── */

function RecentCard({ space, onOpen }: { space: RecentSpace; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {space.img_url ? (
          <img
            src={space.img_url}
            alt={space.svc_nm}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Clock className="size-8" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-1 text-xs font-bold text-slate-900">{space.svc_nm}</h3>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{space.area_nm}</p>
      </div>
    </div>
  );
}

/* ───────────────────────────── adapters ───────────────────────────── */

function favoriteToFacility(f: Favorite) {
  return {
    SVCID: f.svc_id,
    SVCNM: f.svc_nm,
    PLACENM: f.place_nm,
    AREANM: f.area_nm,
    PAYATNM: f.pay_at_nm,
    IMGURL: f.img_url,
    SVCURL: f.svc_url,
    MINCLASSNM: f.min_class_nm,
    V_MAX: f.v_max,
    X: f.x,
    Y: f.y,
  };
}

function recentToFacility(r: RecentSpace) {
  return {
    SVCID: r.svc_id,
    SVCNM: r.svc_nm,
    PLACENM: r.place_nm ?? "",
    AREANM: r.area_nm ?? "",
    PAYATNM: r.pay_at_nm ?? "",
    IMGURL: r.img_url,
    MINCLASSNM: r.min_class_nm,
    V_MAX: r.v_max,
  };
}
