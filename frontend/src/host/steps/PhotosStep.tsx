import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { useRegister } from "../RegisterContext";
import { StepNav } from "../StepNav";

export function PhotosStep() {
  const { data, addPhotos, removePhoto } = useRegister();
  const inputRef = useRef<HTMLInputElement | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    addPhotos(files);
    e.target.value = "";
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">사진</h1>
        <p className="mt-1 text-sm text-slate-500">최대 10장까지 업로드할 수 있어요.</p>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPick}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {data.photos.map((file, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-md bg-slate-100">
            <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="remove"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {data.photos.length < 10 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700"
          >
            <ImagePlus className="size-6" />
          </button>
        )}
      </div>

      <StepNav back="../location" next="../price" disabled={data.photos.length === 0} />
    </section>
  );
}
