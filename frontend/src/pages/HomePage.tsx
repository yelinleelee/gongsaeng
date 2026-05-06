import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProperties } from "../lib/properties";
import type { Property } from "../types/property";
import { StayCard } from "../components/StayCard";

export function HomePage() {
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProperties()
      .then((items) => setFeatured(items.slice(0, 6)))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          오늘 어디로 떠나볼까요?
        </h1>
        <p className="max-w-2xl text-slate-600">
          gongsaeng는 호스트가 정성껏 가꾼 공간을 소개합니다. 도시, 가격, 인원으로 좁혀
          취향에 맞는 숙소를 찾아보세요.
        </p>
        <div className="flex gap-3">
          <Link
            to="/stays"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Browse stays
          </Link>
          <Link
            to="/brand-story"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Brand story
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Featured stays</h2>
          <Link to="/stays" className="text-sm text-slate-600 hover:text-slate-900">
            See all →
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : featured.length === 0 ? (
          <p className="text-sm text-slate-500">아직 등록된 숙소가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <StayCard key={p.ID} property={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
