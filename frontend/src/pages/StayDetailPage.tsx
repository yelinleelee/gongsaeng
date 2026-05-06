import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, MailPlus, MapPin, Star, Users } from "lucide-react";
import { getProperty } from "../lib/properties";
import type { Property } from "../types/property";
import { ApiError } from "../lib/api";
import { BookingWidget } from "../components/BookingWidget";
import { ReviewList } from "../components/ReviewList";
import { useAuth } from "../auth/AuthContext";

export function StayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getProperty(Number(id))
      .then((data) => {
        if (!cancelled) setProperty(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "숙소를 불러오지 못했습니다");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!property) return null;

  return (
    <article className="space-y-6">
      <Link to="/stays" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ChevronLeft className="size-4" />
        Back to stays
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{property.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          {property.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="size-4 fill-amber-400 stroke-amber-400" />
              {property.rating.toFixed(1)} ({property.review_count} reviews)
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="size-4" />
            {property.city}, {property.country}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-4" />
            최대 {property.max_guests}명
          </span>
        </div>
      </header>

      <Gallery images={property.images} title={property.title} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold">소개</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
              {property.description || "소개가 아직 없습니다."}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">상세 정보</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">유형</dt>
              <dd>{property.property_type} · {property.room_type}</dd>
              <dt className="text-slate-500">침실</dt>
              <dd>{property.bedrooms} 침실 · {property.beds} 침대</dd>
              <dt className="text-slate-500">욕실</dt>
              <dd>{property.bathrooms}</dd>
              <dt className="text-slate-500">주소</dt>
              <dd>{property.address}</dd>
            </dl>
          </section>

          {property.amenities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">편의시설</h2>
              <ul className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-slate-700">
                {property.amenities.map((a) => (
                  <li key={a}>· {a}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold">리뷰</h2>
            <div className="mt-3">
              <ReviewList propertyId={property.ID} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h2 className="text-base font-semibold">호스트</h2>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3">
                {property.host.avatar ? (
                  <img
                    src={property.host.avatar}
                    alt=""
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                    {property.host.name?.[0] ?? "?"}
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-900">{property.host.name}</p>
                  <p className="text-xs text-slate-500">{property.host.email}</p>
                </div>
              </div>
              {user && user.id !== property.host.id && (
                <Link
                  to={`/messages?peer=${property.host.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <MailPlus className="size-3.5" />
                  Message host
                </Link>
              )}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BookingWidget property={property} />
        </aside>
      </div>
    </article>
  );
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  if (!images?.length) {
    return (
      <div className="flex aspect-[16/7] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
        No images
      </div>
    );
  }
  const [main, ...rest] = images;
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:grid-rows-2">
      <img
        src={main}
        alt={title}
        className="aspect-[16/9] w-full rounded-xl object-cover sm:col-span-2 sm:row-span-2 sm:aspect-auto"
      />
      {rest.slice(0, 4).map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className="aspect-square w-full rounded-xl object-cover"
        />
      ))}
    </div>
  );
}
