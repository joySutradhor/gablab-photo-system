"use client";

import { useState } from "react";
import {
  FiCamera,
  FiDownload,
  FiRefreshCw,
  FiExternalLink,
  FiInstagram,
  FiFacebook,
  FiLinkedin,
  FiCheck,
  FiArrowRight,
  FiCopy,
} from "react-icons/fi";

const SITE_URL = "https://www.gastronomicartsbarcelona.com/";

const REFERRAL_LINK =
  "https://widgets.bokun.io/online-sales/ea8ee2e2-2c4f-46e7-b6f8-7dc5ed908938/experience/720922";

const REFERRAL_CODE = "SEPTEMBER10";

const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/gablabbcn/",
  facebook: "https://www.facebook.com/gablabbcn/",
  linkedin: "https://www.linkedin.com/company/gablabbcn/",
};

export default function GuestPhotosPage() {
  const [accessCode, setAccessCode] = useState("");
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [referralCopied, setReferralCopied] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();

    setError("");

    if (!/^\d{6}$/.test(accessCode)) {
      setError("Please enter a valid 6-digit access code.");
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
        throw new Error(
          result.error || "Unable to find your class. Please check your code.",
        );
      }

      setClassData(result.class);
    } catch (error) {
      console.error("Verification error:", error);

      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTryAnother = () => {
    setClassData(null);
    setAccessCode("");
    setError("");
    setReferralCopied("");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_LINK);

      setReferralCopied("link");

      setTimeout(() => {
        setReferralCopied("");
      }, 2000);
    } catch (error) {
      console.error("Copy link error:", error);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    try {
      return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  const formatTime = (time) => {
    if (!time) return "—";

    try {
      const [hours, minutes] = time.split(":");
      const date = new Date();

      date.setHours(Number(hours), Number(minutes), 0, 0);

      return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return time;
    }
  };

  const photoUrl = classData?.photo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/class-photos/${classData.photo_path}`
    : null;

  const handleDownload = async () => {
    if (!photoUrl) return;

    try {
      setDownloading(true);

      const response = await fetch(photoUrl);

      if (!response.ok) {
        throw new Error("Unable to download the photo.");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = `gab-lab-${classData?.class_name || "class-photo"}.jpg`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download error:", error);

      window.open(photoUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-[#e7e3da] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          {/* =========================
              HEADER
          ========================= */}
          <header className="border-b border-[#eeeae2] px-5 py-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Brand */}
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl">
                  <img
                    src="/logo.png"
                    alt="Gastronomic Arts Barcelona"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-lg font-bold tracking-tight text-[#182433]">
                    GAB LAB
                  </p>

                  <p className="text-xs font-medium text-[#7a8088]">
                    Gastronomic Arts Barcelona
                  </p>
                </div>
              </a>

              {/* Social Icons */}
              <div className="flex items-center gap-2">
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5eaf0] text-[#415a77] transition hover:bg-[#f5f6f8]"
                >
                  <FiInstagram size={17} />
                </a>

                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5eaf0] text-[#415a77] transition hover:bg-[#f5f6f8]"
                >
                  <FiFacebook size={17} />
                </a>

                <a
                  href={SOCIAL_LINKS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5eaf0] text-[#415a77] transition hover:bg-[#f5f6f8]"
                >
                  <FiLinkedin size={17} />
                </a>
              </div>
            </div>
          </header>

          {/* =========================
              ACCESS CODE VIEW
          ========================= */}
          {!classData ? (
            <div className="grid md:grid-cols-2">
              {/* Left */}
              <section className="flex flex-col justify-center border-b border-[#eeeae2] p-6 sm:p-8 md:border-b-0 md:border-r lg:p-10">
                <div className="max-w-md">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1f3f5] text-[#415a77]">
                    <FiCamera size={22} />
                  </div>

                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#8a9098]">
                    Guest Photo Access
                  </p>

                  <h1 className="text-3xl font-bold tracking-tight text-[#182433] sm:text-4xl">
                    Find your class photo
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-[#667085] sm:text-base">
                    Enter the unique 6-digit access code provided after your
                    cooking experience to view and download your class photo.
                  </p>
                </div>
              </section>

              {/* Right */}
              <section className="p-6 sm:p-8 lg:p-10">
                <form onSubmit={handleVerify} className="mx-auto max-w-md">
                  <label
                    htmlFor="accessCode"
                    className="mb-2 block text-sm font-semibold text-[#182433]"
                  >
                    Access Code
                  </label>

                  <input
                    id="accessCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={accessCode}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                      setAccessCode(value);
                      setError("");
                    }}
                    placeholder="Enter 6-digit code"
                    className="h-12 w-full rounded-xl border border-[#dfe4ea] bg-white px-4 text-center text-lg font-semibold tracking-[0.25em] text-[#182433] outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-[#a0a6ad] focus:border-[#415a77] focus:ring-4 focus:ring-[#415a77]/10"
                  />

                  {error && (
                    <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || accessCode.length !== 6}
                    className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#182433] px-5 text-sm font-semibold text-white transition hover:bg-[#243447] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Checking...
                      </>
                    ) : (
                      <>
                        View My Photo
                        <FiArrowRight size={17} />
                      </>
                    )}
                  </button>

                  <p className="mt-4 text-center text-xs leading-5 text-[#8a9098]">
                    Your access code is unique to your cooking class.
                  </p>
                </form>
              </section>
            </div>
          ) : (
            <div>
              {/* =========================
                  PHOTO RESULT
              ========================= */}
              <div className="grid md:grid-cols-2">
                {/* Class Info */}
                <section className="border-b border-[#eeeae2] p-6 sm:p-8 md:border-b-0 md:border-r lg:p-10">
                  <div className="flex h-full flex-col">
                    {/* Verified */}
                    <div className="mb-6 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <FiCheck size={16} />
                      </div>

                      <span className="text-sm font-semibold text-green-700">
                        Access verified
                      </span>
                    </div>

                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#8a9098]">
                      Your Cooking Class
                    </p>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#182433] sm:text-3xl">
                      {classData.class_name || "Cooking Class"}
                    </h1>

                    {/* Class Details */}
                    <div className="mt-7 space-y-3">
                      <div className="rounded-xl border border-[#e8ebef] bg-[#fafbfc] p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-[#8a9098]">
                          Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#182433]">
                          {formatDate(classData.class_date)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#e8ebef] bg-[#fafbfc] p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-[#8a9098]">
                          Time
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#182433]">
                          {formatTime(classData.class_time)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#e8ebef] bg-[#fafbfc] p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-[#8a9098]">
                          Access Code
                        </p>

                        <p className="mt-1 font-mono text-sm font-semibold tracking-widest text-[#415a77]">
                          {classData.access_code || accessCode}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* Try Another */}
                    <button
                      type="button"
                      onClick={handleTryAnother}
                      className="mt-6 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dfe4ea] bg-white px-5 text-sm font-semibold text-[#415a77] transition hover:bg-[#f7f8fa]"
                    >
                      <FiRefreshCw size={16} />
                      Try Another Code
                    </button>
                  </div>
                </section>

                {/* Photo */}
                <section className="p-6 sm:p-8 lg:p-10">
                  <div className="flex h-full flex-col">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#182433]">
                          Your Class Photo
                        </p>

                        <p className="mt-0.5 text-xs text-[#8a9098]">
                          Ready to view and download
                        </p>
                      </div>

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f3f5] text-[#415a77]">
                        <FiCamera size={17} />
                      </div>
                    </div>

                    {/* Photo */}
                    {photoUrl ? (
                      <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#f3f4f6]">
                        <img
                          src={photoUrl}
                          alt={`${classData.class_name || "Cooking class"} group photo`}
                          className="block h-auto max-h-[480px] w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-2xl border border-dashed border-[#d9dde3] bg-[#fafbfc]">
                        <div className="text-center">
                          <FiCamera
                            size={30}
                            className="mx-auto text-[#a0a6ad]"
                          />

                          <p className="mt-3 text-sm font-medium text-[#667085]">
                            No photo available
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={!photoUrl || downloading}
                        className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#182433] px-5 text-sm font-semibold text-white transition hover:bg-[#243447] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {downloading ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <FiDownload size={17} />
                            Download Photo
                          </>
                        )}
                      </button>

                      <a
                        href={SITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe4ea] bg-white px-5 text-sm font-semibold text-[#415a77] transition hover:bg-[#f7f8fa]"
                      >
                        Visit Website
                        <FiExternalLink size={15} />
                      </a>
                    </div>
                  </div>
                </section>
              </div>

              {/* =========================
    CLEAN OFFER SECTION
========================= */}
              <section className="border-t border-[#eeeae2] bg-[#fafaf9] px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
                <div className="mx-auto w-full max-w-3xl">
                  {/* Referral Text */}
                  <p className="mb-5 text-center text-sm font-semibold italic leading-6 text-[#182433] sm:text-base">
                    Invite a friend to join Barcelona’s No. 1 Paella Cooking
                    Class and enjoy 10% off.
                  </p>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {/* Booking Link */}
                    <div className="min-w-0 rounded-xl border border-[#e2e5e9] bg-white p-4">
                      <p className="text-xs font-medium text-[#8a9098]">
                        Booking Link
                      </p>

                      <div className="mt-2 min-w-0">
                        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-[#182433]">
                          {REFERRAL_LINK}
                        </p>

                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#182433] px-3 text-[11px] font-semibold text-white transition hover:bg-[#243447] md:w-auto md:px-4"
                        >
                          {referralCopied === "link" ? (
                            <>
                              <FiCheck size={13} />
                              Copied
                            </>
                          ) : (
                            <>
                              <FiCopy size={13} />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Coupon Code */}
                    <div className="min-w-0 rounded-xl border border-[#e2e5e9] bg-white p-4">
                      <p className="text-xs font-medium text-[#8a9098]">
                        Coupon Code
                      </p>

                      <p className="mt-2 break-words font-mono text-sm font-bold tracking-wider text-[#806b35]">
                        {REFERRAL_CODE}
                      </p>
                    </div>

                    {/* Valid Until */}
                    <div className="min-w-0 rounded-xl border border-[#e2e5e9] bg-white p-4">
                      <p className="text-xs font-medium text-[#8a9098]">
                        Valid Until
                      </p>

                      <p className="mt-2 text-sm font-semibold text-[#182433]">
                        September 30
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* =========================
              FOOTER
          ========================= */}
          <footer className="border-t border-[#eeeae2] bg-[#fafaf9] px-5 py-5 sm:px-8">
            <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
              <p className="text-xs text-[#8a9098]">
                © {new Date().getFullYear()} Gastronomic Arts Barcelona
              </p>

              <div className="flex items-center gap-4">
                <a
                  href={SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[#415a77] transition hover:text-[#182433]"
                >
                  Gastronomic Arts Barcelona
                </a>

                <span className="text-[#d0d3d6]">•</span>

                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[#415a77] transition hover:text-[#182433]"
                >
                  @gablabbcn
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
