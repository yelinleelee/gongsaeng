import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createProperty } from "../lib/properties";
import { uploadImages } from "../lib/uploads";
import { ApiError } from "../lib/api";
import type { PropertyType } from "../types/property";

export const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: "house", label: "단독주택" },
  { value: "apartment", label: "아파트" },
  { value: "villa", label: "별장/펜션" },
  { value: "unique", label: "한옥" },
  { value: "guesthouse", label: "독채 캐빈" },
  { value: "hotel", label: "부티크 호텔" },
];

export const CONCEPT_OPTIONS = [
  "오션뷰",
  "마운틴뷰",
  "도심",
  "한적한 시골",
  "감성 인테리어",
  "프라이빗 풀",
];

export type RegisterFormData = {
  type: PropertyType | null;
  concept: string | null;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  name: string;
  description: string;
  city: string;
  address: string;
  photos: File[];
  price: string;
};

const initial: RegisterFormData = {
  type: null,
  concept: null,
  guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  name: "",
  description: "",
  city: "",
  address: "",
  photos: [],
  price: "",
};

type Ctx = {
  data: RegisterFormData;
  setField: <K extends keyof RegisterFormData>(key: K, value: RegisterFormData[K]) => void;
  addPhotos: (files: File[]) => void;
  removePhoto: (index: number) => void;
  reset: () => void;
  submitting: boolean;
  submitError: string | null;
  submit: () => Promise<{ ok: boolean; propertyId?: number }>;
};

const RegisterContext = createContext<Ctx | null>(null);

export function RegisterProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RegisterFormData>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const value = useMemo<Ctx>(
    () => ({
      data,
      setField: (key, value) => setData((prev) => ({ ...prev, [key]: value })),
      addPhotos: (files) => setData((prev) => ({ ...prev, photos: [...prev.photos, ...files] })),
      removePhoto: (index) =>
        setData((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) })),
      reset: () => setData(initial),
      submitting,
      submitError,
      submit: async () => {
        setSubmitError(null);

        if (!data.type) {
          setSubmitError("숙소 유형을 선택해주세요.");
          return { ok: false };
        }
        if (!data.name.trim()) {
          setSubmitError("숙소 이름을 입력해주세요.");
          return { ok: false };
        }
        if (!data.city || !data.address.trim()) {
          setSubmitError("숙소 위치를 입력해주세요.");
          return { ok: false };
        }
        const priceNum = Number(data.price);
        if (!priceNum || priceNum <= 0) {
          setSubmitError("가격을 입력해주세요.");
          return { ok: false };
        }
        if (data.photos.length === 0) {
          setSubmitError("사진을 1장 이상 업로드해주세요.");
          return { ok: false };
        }

        setSubmitting(true);
        try {
          const uploaded = await uploadImages(data.photos);
          const property = await createProperty({
            title: data.name.trim(),
            description: data.description.trim(),
            property_type: data.type,
            room_type: "entire",
            max_guests: data.guests,
            bedrooms: data.bedrooms,
            beds: data.beds,
            bathrooms: data.bathrooms,
            price: priceNum,
            currency: "KRW",
            address: data.address.trim(),
            city: data.city,
            country: "한국",
            amenities: data.concept ? [data.concept] : [],
            images: uploaded.map((u) => u.url),
            is_available: true,
          });
          return { ok: true, propertyId: property.ID };
        } catch (err) {
          const msg =
            err instanceof ApiError ? err.message : err instanceof Error ? err.message : "숙소 등록 실패";
          setSubmitError(msg);
          return { ok: false };
        } finally {
          setSubmitting(false);
        }
      },
    }),
    [data, submitting, submitError],
  );

  return <RegisterContext.Provider value={value}>{children}</RegisterContext.Provider>;
}

export function useRegister() {
  const ctx = useContext(RegisterContext);
  if (!ctx) throw new Error("useRegister must be used within RegisterProvider");
  return ctx;
}
