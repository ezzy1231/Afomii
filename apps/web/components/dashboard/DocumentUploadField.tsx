"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VerificationDocument } from "@/lib/dashboard/verification-data";

/**
 * Uploads the documents a partner submits to prove legitimacy.
 *
 * Writes to the private `verification-docs` bucket, not `banners`: a licence is
 * personal data, `banners` is world-readable, and its mime allowlist rejects
 * PDFs outright. Only the storage object *path* is handed onward — the admin
 * review screen mints a short-lived signed URL from it.
 *
 * The selected documents are mirrored into a hidden input as JSON so they ride
 * along with the form submission, matching how BannerUploadField passes its URL.
 */

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 5;


function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "document"
  );
}

function readableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUploadField({
  fieldName = "documents",
  label = "Supporting documents",
  hint = "Business licence or registration certificate. PDF, JPG, PNG or WEBP up to 10 MB.",
  initial = [],
}: {
  fieldName?: string;
  label?: string;
  hint?: string;
  initial?: VerificationDocument[];
}) {
  const [documents, setDocuments] = useState<VerificationDocument[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const room = MAX_FILES - documents.length;
    if (room <= 0) {
      setError(`You can attach at most ${MAX_FILES} documents.`);
      return;
    }

    const rejected = [...files].find((f) => !ACCEPTED.includes(f.type));
    if (rejected) {
      setError(`"${rejected.name}" is not a PDF or image.`);
      return;
    }
    const tooBig = [...files].find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" is over the 10 MB limit.`);
      return;
    }

    const batch = [...files].slice(0, room);
    setUploading(true);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const ownerId = userData.user?.id;
    if (!ownerId) {
      setError("You are signed out. Sign in again to attach documents.");
      setUploading(false);
      return;
    }

    const added: VerificationDocument[] = [];

    for (const file of batch) {
      // Owner-scoped first path segment: matches the storage RLS policies, so an
      // upload outside this folder is rejected by the bucket, not just here.
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${ownerId}/${Date.now()}-${slugify(file.name)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("verification-docs")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError(
          `Could not upload "${file.name}". Document storage is set up by migration 0022_verification_docs_storage.sql — apply it, then retry.`,
        );
        setUploading(false);
        return;
      }

      added.push({
        label: file.name,
        path,
        contentType: file.type,
        sizeBytes: file.size,
      });
    }

    setDocuments((prev) => [...prev, ...added]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <span className="text-xs font-semibold text-console-muted">{label}</span>
      <p className="mt-1 text-xs text-console-muted">{hint}</p>

      <input type="hidden" name={fieldName} value={JSON.stringify(documents)} />

      <div className="mt-3 space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.path}
            className="flex items-center justify-between gap-3 rounded-xl border border-console-border bg-white px-3 py-2.5"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-console-ink">
                {doc.label}
              </span>
              <span className="text-xs text-console-muted">
                {readableSize(doc.sizeBytes)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => removeAt(documents.indexOf(doc))}
              className="shrink-0 text-xs font-semibold text-console-muted underline underline-offset-2 transition-colors hover:text-console-blush-ink"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-console-border px-4 text-sm font-semibold text-console-ink transition-colors hover:border-console-indigo/40 hover:bg-console-indigo/5">
        {uploading ? "Uploading…" : "Choose documents"}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple
          accept=".pdf,image/jpeg,image/png,image/webp"
          disabled={uploading || documents.length >= MAX_FILES}
          onChange={(e) => void addFiles(e.target.files)}
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-console-blush-ink">
          {error}
        </p>
      )}
    </div>
  );
}