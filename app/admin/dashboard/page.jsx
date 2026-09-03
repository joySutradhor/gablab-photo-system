"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const PAGE_SIZE = 12;

function formatDate(dateStr) {
  if (!dateStr) return "—";

  const date = new Date(`${dateStr}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "";

  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);

  if (Number.isNaN(hour)) return timeStr;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  return `${displayHour}:${minutes || "00"} ${suffix}`;
}

function getPhotoUrl(path) {
  if (!path) return null;

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/class-photos/${path}`;
}

export default function AdminClassesPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  const [classes, setClasses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [photoFilter, setPhotoFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);

  const [previewPhoto, setPreviewPhoto] = useState(null);

  // ---------------------------------------------------------
  // AUTH
  // ---------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!mounted) return;

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      setUser(user);
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ---------------------------------------------------------
  // LOAD CLASSES
  // ---------------------------------------------------------

  useEffect(() => {
    if (!user) return;

    loadClasses();
  }, [user, page, search, photoFilter, sort]);

  async function loadClasses() {
    try {
      setLoading(true);
      setError("");

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabaseBrowser
        .from("classes")
        .select("*", { count: "exact" });

      // -----------------------------------------------------
      // SEARCH
      // -----------------------------------------------------

      if (search.trim()) {
        const value = search.trim().replace(/,/g, "");

        query = query.or(
          `class_name.ilike.%${value}%,access_code.ilike.%${value}%`,
        );
      }

      // -----------------------------------------------------
      // PHOTO FILTER
      // -----------------------------------------------------

      if (photoFilter === "with-photo") {
        query = query.not("photo_path", "is", null);
      }

      if (photoFilter === "without-photo") {
        query = query.is("photo_path", null);
      }

      // -----------------------------------------------------
      // SORT
      // -----------------------------------------------------

      if (sort === "newest") {
        query = query
          .order("class_date", { ascending: false })
          .order("class_time", { ascending: false });
      } else {
        query = query
          .order("class_date", { ascending: true })
          .order("class_time", { ascending: true });
      }

      // -----------------------------------------------------
      // DATABASE PAGINATION
      // -----------------------------------------------------

      const { data, error: queryError, count } = await query.range(from, to);

      if (queryError) {
        console.error(queryError);
        throw queryError;
      }

      setClasses(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error(err);
      setError("We couldn't load the classes. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // RESET PAGE WHEN FILTER CHANGES
  // ---------------------------------------------------------

  useEffect(() => {
    setPage(1);
  }, [search, photoFilter, sort]);

  // ---------------------------------------------------------
  // PAGINATION
  // ---------------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const showingTo = Math.min(currentPage * PAGE_SIZE, totalCount);

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items = [];

    items.push(1);

    if (currentPage > 3) {
      items.push("left-ellipsis");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (currentPage < totalPages - 2) {
      items.push("right-ellipsis");
    }

    items.push(totalPages);

    return items;
  }, [totalPages, currentPage]);

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------

  async function handleLogout() {
    await supabaseBrowser.auth.signOut();
    router.replace("/admin/login");
  }

  // ---------------------------------------------------------
  // CLEAR FILTERS
  // ---------------------------------------------------------

  function clearFilters() {
    setSearch("");
    setPhotoFilter("all");
    setSort("newest");
    setPage(1);
  }

  // ---------------------------------------------------------
  // LOADING SCREEN
  // ---------------------------------------------------------

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f9fb]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
          Loading...
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f8f9fb] text-slate-900">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 sm:px-8">
          {/* Brand */}

          <div className="flex items-center gap-3">
            <div className="flex h-16 w-auto  items-center justify-center overflow-hidden rounded-xl bg-white">
              <img
                src="/logo.png"
                alt="Gablab Kitchen Studio"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">
                Gablab Kitchen Studio
              </h1>

              <p className="hidden text-xs text-slate-400 sm:block">
                Photo management
              </p>
            </div>
          </div>

          {/* Right */}

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push("/admin/classes/new")}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>

              <span>New Class</span>
            </button>

            <button
              onClick={handleLogout}
              className="hidden h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
        {/* Page title */}

        <div className="mb-7">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Photos
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage all class photos in one place.
          </p>
        </div>

        {/* =================================================
            TOOLBAR
        ================================================== */}

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}

            <div className="relative w-full lg:max-w-[380px]">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-4-4" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search class or guest code..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Filters */}

            <div className="flex flex-wrap items-center gap-2">
              {/* Photo filter */}

              <select
                value={photoFilter}
                onChange={(e) => setPhotoFilter(e.target.value)}
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="all">All photos</option>
                <option value="with-photo">With photos</option>
                <option value="without-photo">No photos</option>
              </select>

              {/* Sort */}

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>

              {(search || photoFilter !== "all" || sort !== "newest") && (
                <button
                  onClick={clearFilters}
                  className="h-11 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Result count */}

          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">
              {loading
                ? "Loading..."
                : `${totalCount} ${totalCount === 1 ? "class" : "classes"}`}
            </p>
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button onClick={loadClasses} className="font-medium underline">
              Retry
            </button>
          </div>
        )}

        {/* =================================================
            CONTENT
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* LOADING */}

          {loading && (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-16 w-20 animate-pulse rounded-lg bg-slate-100" />

                  <div className="flex-1">
                    <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />

                    <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
                  </div>

                  <div className="hidden h-3 w-24 animate-pulse rounded bg-slate-100 sm:block" />
                </div>
              ))}
            </div>
          )}

          {/* EMPTY */}

          {!loading && classes.length === 0 && (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <svg
                  className="h-6 w-6 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />

                  <circle cx="8.5" cy="8.5" r="1.5" />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 15-5-5L5 21"
                  />
                </svg>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                No classes found
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                {search || photoFilter !== "all"
                  ? "Try changing your search or filters."
                  : "Create your first class and upload photos."}
              </p>

              {search || photoFilter !== "all" ? (
                <button
                  onClick={clearFilters}
                  className="mt-5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  onClick={() => router.push("/admin/classes/new")}
                  className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Create New Class
                </button>
              )}
            </div>
          )}

          {/* =================================================
              DESKTOP LIST
          ================================================== */}

          {!loading && classes.length > 0 && (
            <>
              <div className="hidden md:block">
                {/* Header */}

                <div className="grid grid-cols-[minmax(0,1fr)_180px_160px_120px] border-b border-slate-200 bg-slate-50/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>Class</span>
                  <span>Date</span>
                  <span>Guest code</span>
                  <span>Status</span>
                </div>

                {/* Rows */}

                <div className="divide-y divide-slate-100">
                  {classes.map((item) => {
                    const photoUrl = getPhotoUrl(item.photo_path);

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-[minmax(0,1fr)_180px_160px_120px] items-center px-5 py-4 transition hover:bg-slate-50"
                      >
                        {/* Class */}

                        <div className="flex min-w-0 items-center gap-4">
                          {photoUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPhoto({
                                  url: photoUrl,
                                  name: item.class_name || "Photo",
                                })
                              }
                              className="group relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100"
                            >
                              <img
                                src={photoUrl}
                                alt={item.class_name || "Class photo"}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />

                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                                <svg
                                  className="h-5 w-5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    d="m15 12-4-3v6l4-3Z"
                                  />
                                </svg>
                              </div>
                            </button>
                          ) : (
                            <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-medium text-slate-400">
                              No photo
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {item.class_name || "Untitled class"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Class ID: {item.id}
                            </p>
                          </div>
                        </div>

                        {/* Date */}

                        <div>
                          <p className="text-sm text-slate-700">
                            {formatDate(item.class_date)}
                          </p>

                          {item.class_time && (
                            <p className="mt-1 text-xs text-slate-400">
                              {formatTime(item.class_time)}
                            </p>
                          )}
                        </div>

                        {/* Access code */}

                        <div>
                          {item.access_code ? (
                            <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wider text-slate-700">
                              {item.access_code}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>

                        {/* Status */}

                        <div>
                          {photoUrl ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Uploaded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              No photo
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* =================================================
                  MOBILE LIST
              ================================================== */}

              <div className="divide-y divide-slate-100 md:hidden">
                {classes.map((item) => {
                  const photoUrl = getPhotoUrl(item.photo_path);

                  return (
                    <div key={item.id} className="p-4">
                      <div className="flex gap-3">
                        {photoUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPhoto({
                                url: photoUrl,
                                name: item.class_name || "Photo",
                              })
                            }
                            className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100"
                          >
                            <img
                              src={photoUrl}
                              alt={item.class_name || "Class photo"}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-medium text-slate-400">
                            No photo
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {item.class_name || "Untitled class"}
                            </p>

                            {photoUrl ? (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                                Uploaded
                              </span>
                            ) : (
                              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                                No photo
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-xs text-slate-500">
                            {formatDate(item.class_date)}
                            {item.class_time
                              ? ` · ${formatTime(item.class_time)}`
                              : ""}
                          </p>

                          {item.access_code && (
                            <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold tracking-wider text-slate-600">
                              {item.access_code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* =================================================
              PAGINATION
          ================================================== */}

          {!loading && totalCount > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">
                  {showingFrom}
                </span>
                {" – "}
                <span className="font-medium text-slate-700">{showingTo}</span>
                {" of "}
                <span className="font-medium text-slate-700">{totalCount}</span>
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* Previous */}

                  <button
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m15 18-6-6 6-6"
                      />
                    </svg>

                    <span className="hidden sm:block">Previous</span>
                  </button>

                  {/* Numbers */}

                  {paginationItems.map((item, index) => {
                    if (typeof item === "string") {
                      return (
                        <span
                          key={`${item}-${index}`}
                          className="flex h-9 w-8 items-center justify-center text-xs text-slate-400"
                        >
                          …
                        </span>
                      );
                    }

                    return (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`h-9 w-9 rounded-lg text-xs font-medium transition ${
                          item === currentPage
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}

                  {/* Next */}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <span className="hidden sm:block">Next</span>

                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m9 18 6-6-6-6"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          PHOTO PREVIEW MODAL
      ====================================================== */}

      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute cursor-pointer -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>

            <img
              src={previewPhoto.url}
              alt={previewPhoto.name}
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}
