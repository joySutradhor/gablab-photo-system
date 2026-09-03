
"use client";

import { useState } from "react";

export default function GuestPhotosPage() {
  const [accessCode, setAccessCode] = useState("");
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const SITE_URL = "https://www.gastronomicartsbarcelona.com/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (accessCode.length !== 6) {
      setError("Please enter your 6-digit access code.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/guest/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Invalid access code.");
        return;
      }

      setClassData(result.class);
    } catch (error) {
      console.error("Verification error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTryAnotherCode = () => {
    setClassData(null);
    setAccessCode("");
    setError("");
    setLoading(false);
    setDownloading(false);
  };

  const photoUrl = classData?.photo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/class-photos/${classData.photo_path}`
    : null;

  const handleDownload = async () => {
    if (!photoUrl || downloading) return;

    try {
      setDownloading(true);

      const res = await fetch(photoUrl);

      if (!res.ok) {
        throw new Error("Failed to download photo");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${classData?.class_name || "class-photo"}.jpg`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      window.open(photoUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  // Format date: 2026-09-03 → September 3, 2026
  const formatDate = (date) => {
    if (!date) return "";

    try {
      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return date;
      }

      return parsedDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  // Format time: 18:30 → 6:30 PM
  const formatTime = (time) => {
    if (!time) return "";

    try {
      const [hours, minutes] = time.split(":");

      const date = new Date();
      date.setHours(Number(hours), Number(minutes), 0, 0);

      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return time;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:py-16">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
        <div className="w-full rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          {!classData ? (
            <>
              {/* Header */}
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  📷
                </div>

                <h1 className="text-2xl font-bold text-gray-900">
                  Your Class Photos
                </h1>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Enter the access code provided for your cooking class to view
                  your group photo.
                </p>
              </div>

              {/* Access Code Form */}
              <form onSubmit={handleSubmit} className="mt-8">
                <label
                  htmlFor="accessCode"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Access Code
                </label>

                <input
                  id="accessCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={accessCode}
                  onChange={(e) =>
                    setAccessCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter 6-digit code"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-black/60 outline-none transition placeholder:tracking-normal placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-50"
                />

                {/* Error */}
                {error && (
                  <p className="mt-3 text-center text-sm text-red-500">
                    {error}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || accessCode.length !== 6}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="3"
                        />

                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M21 12a9 9 0 00-9-9v3a6 6 0 016 6h3z"
                        />
                      </svg>

                      Checking...
                    </>
                  ) : (
                    "View My Photo"
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs leading-5 text-gray-400">
                Your access code is unique to your class.
              </p>
            </>
          ) : (
            <>
              {/* Class Information */}
              <div className="text-left">
                <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                  {classData.class_name}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  {classData.class_date && (
                    <span>{formatDate(classData.class_date)}</span>
                  )}

                  {classData.class_date && classData.class_time && (
                    <span className="text-gray-300">·</span>
                  )}

                  {classData.class_time && (
                    <span>{formatTime(classData.class_time)}</span>
                  )}
                </div>
              </div>

              {/* Class Photo */}
              {photoUrl && (
                <div className="mt-6 overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={photoUrl}
                    alt={classData.class_name || "Class Photo"}
                    className="block h-auto w-full object-cover"
                  />
                </div>
              )}

              {/* Download Button */}
              {photoUrl && (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="3"
                        />

                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M21 12a9 9 0 00-9-9v3a6 6 0 016 6h3z"
                        />
                      </svg>

                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                        />
                      </svg>

                      Download Photo
                    </>
                  )}
                </button>
              )}

              {/* Try Another Code */}
              <button
                type="button"
                onClick={handleTryAnotherCode}
                disabled={downloading}
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h5M20 20v-5h-5M5.5 9A7 7 0 0118 6.5M18.5 15A7 7 0 016 17.5"
                  />
                </svg>

                Try Another Code
              </button>

              {/* Website Button */}
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.99]"
              >
                Visit Our Website

                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

