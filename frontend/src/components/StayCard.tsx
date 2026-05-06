import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Property } from "../types/property";
import { formatPrice } from "../lib/format";

export function StayCard({ property }: { property: Property }) {
  const cover = property.images?.[0];
  return (
    <Link
      to={`/stays/${property.ID}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {cover ? (
          <img
            src={cover}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="space-y-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{property.title}</h3>
          {property.rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-slate-600">
              <Star className="size-3.5 fill-amber-400 stroke-amber-400" />
              {property.rating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="line-clamp-1 text-xs text-slate-500">
          {property.city} · {property.property_type}
        </p>
        <p className="pt-1 text-sm text-slate-900">
          <span className="font-semibold">{formatPrice(property.price, property.currency)}</span>
          <span className="text-slate-500"> / night</span>
        </p>
      </div>
    </Link>
  );
}
