"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X } from "lucide-react";
import { cn, generateSlug } from "@/lib/utils";

const CATEGORIES = [
  "politics",
  "crypto",
  "sports",
  "entertainment",
  "science",
  "economics",
  "technology",
  "commodities",
  "business",
  "weather",
  "media",
  "culture",
] as const;

export function CreateConstellationForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [rules, setRules] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSlug(generateSlug(name));
  }, [name]);

  function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setBannerUrl(dataUrl);
      setBannerPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function removeBanner() {
    setBannerUrl("");
    setBannerPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/constellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, categories, isPublic, about, rules, bannerUrl: bannerUrl || undefined }),
      });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return;
      }

      router.push(`/constellations/${json.data.slug}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Banner upload */}
      <div>
        <label className="block text-sm font-medium mb-2">Banner Image</label>
        {bannerPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img src={bannerPreview} alt="Banner preview" className="w-full h-48 object-cover" />
            <button
              type="button"
              onClick={removeBanner}
              className="absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-sm p-1.5 text-foreground hover:bg-background transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm">Click to upload a banner image</span>
            <span className="text-xs">PNG, JPG up to 2MB</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          className="hidden"
        />
      </div>

      {/* Two-column layout for name + slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 2024 Election Watchers"
            required
            maxLength={100}
            className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Slug</label>
          <div className="flex items-center">
            <span className="shrink-0 rounded-l-lg border border-r-0 border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">/c/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated"
              maxLength={100}
              className="flex-1 rounded-r-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short tagline shown on constellation cards"
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* About */}
      <div>
        <label className="block text-sm font-medium mb-2">About</label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Detailed description shown on the constellation page"
          rows={4}
          maxLength={2000}
          className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Rules */}
      <div>
        <label className="block text-sm font-medium mb-2">Rules (one per line)</label>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          placeholder={"Be respectful\nNo spam\nBack up claims with data"}
          rows={4}
          maxLength={2000}
          className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium mb-2">Categories</label>
        <p className="text-xs text-muted-foreground mb-2">
          Select categories to auto-populate matching markets. Leave empty for a general constellation.
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                categories.includes(cat)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Visibility</label>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className="flex items-center gap-3 w-full px-4 py-2.5"
          >
            <div
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                isPublic ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  isPublic && "translate-x-4"
                )}
              />
            </div>
            <span className="text-sm">{isPublic ? "Public — anyone can join" : "Private — invite only"}</span>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Create Constellation
      </button>
    </form>
  );
}
