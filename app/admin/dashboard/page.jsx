"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const PAGE_SIZE = 12;

export default function AdminDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);

  const [previewPhoto, setPreviewPhoto] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // --------------------------------------------------
  // AUTH CHECK
  // --------------------------------------------------

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      setUser(user);
    }

    checkUser();
  }, [router]);

  // --------------------------------------------------
  // LOAD CLASSES
  // --------------------------------------------------

  useEffect(() => {
    if (!user) return;

    loadClasses();
  }, [user, page, search, sort]);

  async function loadClasses() {
    try {
      setLoading(true);
      setError("");

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabaseBrowser
        .from("classes")
        .select("*", { count: "exact" });

      // SEARCH
      if (search.trim()) {
        const value = search.trim();

        query = query.or(
          `class_name.ilike.%${value}%,access_code.ilike.%${value}%`,
        );
      }

      // SORT
      if (sort === "newest") {
        query = query
          .order("class_date", { ascending: false })
          .order("class_time", { ascending: false });
      } else {
        query = query
          .order("class_date", { ascending: true })
          .order("class_time", { ascending: true });
      }

      // PAGINATION
      query = query.range(from, to);

      const { data, count, error: fetchError } = await query;

      if (fetchError) {
        console.error("Load classes error:", fetchError);
        throw fetchError;
      }

      setClasses(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Load classes error:", err);

      setError(
        err.message ||
          "We couldn't load the classes. Please refresh and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // RESET PAGE WHEN SEARCH / SORT CHANGES
  // --------------------------------------------------

  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  async function handleLogout() {
    await supabaseBrowser.auth.signOut();
    router.replace("/admin/login");
  }

  // --------------------------------------------------
  // CLEAR FILTERS
  // --------------------------------------------------

  function clearFilters() {
    setSearch("");
    setSort("newest");
    setPage(1);
  }

  // --------------------------------------------------
  // DELETE CLASS
  // --------------------------------------------------

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      setDeletingId(deleteTarget.id);
      setError("");

      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session?.access_token) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch(`/api/admin/classes/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete class.");
      }

      setDeleteTarget(null);
      setPreviewPhoto(null);

      await loadClasses();
    } catch (err) {
      console.error("Delete error:", err);

      setError(
        err.message || "We couldn't delete the class. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const pageNumbers = useMemo(() => {
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return pages;
  }, [totalPages]);

  // --------------------------------------------------
  // PHOTO URL
  // --------------------------------------------------

  function getPhotoUrl(photoPath) {
    if (!photoPath) return null;

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/class-photos/${photoPath}`;
  }

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  function formatDate(date) {
    if (!date) return "-";

    try {
      return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return date;
    }
  }

  // --------------------------------------------------
  // FORMAT TIME
  // --------------------------------------------------

  function formatTime(time) {
    if (!time) return "-";

    try {
      const [hours, minutes] = time.split(":");

      const date = new Date();

      date.setHours(Number(hours), Number(minutes), 0, 0);

      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return time;
    }
  }

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------

  if (!user && loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
          Loading dashboard...
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ================================================
          HEADER
      ================================================= */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          {/* LOGO / TITLE */}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img
                src="/logo.png"
                alt="Gastronomic Arts Barcelona"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
                Admin Dashboard
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your cooking class photos
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-slate-700">
                {user?.email}
              </p>

              <p className="text-[11px] text-slate-400">Administrator</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 17l5-5-5-5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12H3"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 19V5a2 2 0 0 0-2-2h-4"
                />
              </svg>

              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================================================
          CONTENT
      ================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        {/* TOP TITLE */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Classes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage all your cooking classes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin/classes/new")}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14" />

              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
            New Class
          </button>
        </div>

        {/* ================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ================================================
            TOOLBAR
        ================================================= */}

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* SEARCH */}

            <div className="relative w-full lg:max-w-md">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m20 20-4-4"
                />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search class or guest code..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* SORT + CLEAR */}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                <option value="newest">Newest first</option>

                <option value="oldest">Oldest first</option>
              </select>

              {(search || sort !== "newest") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================================================
            TABLE / LIST
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* DESKTOP TABLE */}

          <div className="hidden md:block">
            <div className="grid grid-cols-[minmax(260px,1fr)_150px_150px_120px_100px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div>Class</div>
              <div>Date</div>
              <div>Guest Code</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {loading ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
                  Loading classes...
                </div>
              </div>
            ) : classes.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {classes.map((item) => {
                  const photoUrl = getPhotoUrl(item.photo_path);

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[minmax(260px,1fr)_150px_150px_120px_100px] items-center px-5 py-4 transition hover:bg-slate-50/70"
                    >
                      {/* CLASS */}

                      <div className="flex min-w-0 items-center gap-3">
                        {photoUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPhoto({
                                url: photoUrl,
                                name: item.class_name || "Class photo",
                              })
                            }
                            className="h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                          >
                            <img
                              src={photoUrl}
                              alt={item.class_name || "Class photo"}
                              className="h-full w-full object-cover transition hover:scale-105"
                            />
                          </button>
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                            <svg
                              className="h-5 w-5 text-slate-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                            >
                              <rect x="3" y="3" width="18" height="18" rx="2" />

                              <circle cx="8.5" cy="8.5" r="1.5" />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m21 15-5-5L5 21"
                              />
                            </svg>
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {item.class_name || "Untitled class"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {formatTime(item.class_time)}
                          </p>
                        </div>
                      </div>

                      {/* DATE */}

                      <div className="text-sm text-slate-600">
                        {formatDate(item.class_date)}
                      </div>

                      {/* CODE */}

                      <div>
                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-slate-700">
                          {item.access_code || "-"}
                        </span>
                      </div>

                      {/* STATUS */}

                      <div>
                        {photoUrl ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Photo ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            No photo
                          </span>
                        )}
                      </div>

                      {/* ACTIONS */}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          disabled={deletingId === item.id}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50"
                          title="Delete class"
                        >
                          {deletingId === item.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                          ) : (
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 6h18"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 6V4h8v2"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m19 6-1 14H6L5 6"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10 11v5M14 11v5"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* DESKTOP EMPTY */

              <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <svg
                    className="h-6 w-6 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />

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

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  {search
                    ? "Try changing your search or filters."
                    : "Create your first class and upload photos."}
                </p>

                {search ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 h-9 cursor-pointer rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/admin/classes/new")}
                    className="mt-4 h-9 cursor-pointer rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Create Class
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ================================================
              MOBILE LIST
          ================================================= */}

          <div className="md:hidden">
            {loading ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
                  Loading classes...
                </div>
              </div>
            ) : classes.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {classes.map((item) => {
                  const photoUrl = getPhotoUrl(item.photo_path);

                  return (
                    <div key={item.id} className="p-4">
                      <div className="flex items-start gap-3">
                        {/* PHOTO */}

                        {photoUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPhoto({
                                url: photoUrl,
                                name: item.class_name || "Class photo",
                              })
                            }
                            className="h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                          >
                            <img
                              src={photoUrl}
                              alt={item.class_name || "Class photo"}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                            <svg
                              className="h-6 w-6 text-slate-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                            >
                              <rect x="3" y="3" width="18" height="18" rx="2" />

                              <circle cx="8.5" cy="8.5" r="1.5" />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m21 15-5-5L5 21"
                              />
                            </svg>
                          </div>
                        )}

                        {/* DETAILS */}

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-slate-900">
                            {item.class_name || "Untitled class"}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>{formatDate(item.class_date)}</span>

                            <span>{formatTime(item.class_time)}</span>
                          </div>

                          <div className="mt-2">
                            <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold tracking-wider text-slate-700">
                              {item.access_code || "-"}
                            </span>
                          </div>

                          <div className="mt-2">
                            {photoUrl ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Photo ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                No photo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          disabled={deletingId === item.id}
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50"
                          title="Delete class"
                        >
                          {deletingId === item.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                          ) : (
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 6h18"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 6V4h8v2"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m19 6-1 14H6L5 6"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10 11v5M14 11v5"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MOBILE EMPTY */

              <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <svg
                    className="h-6 w-6 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />

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

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  {search
                    ? "Try changing your search or filters."
                    : "Create your first class and upload photos."}
                </p>

                {search ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 h-9 cursor-pointer rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/admin/classes/new")}
                    className="mt-4 h-9 cursor-pointer rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Create Class
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================================================
            PAGINATION
        ================================================= */}

        {!loading && classes.length > 0 && totalPages > 1 && (
          <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {(page - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700">
                {Math.min(page * PAGE_SIZE, totalCount)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-700">{totalCount}</span>{" "}
              classes
            </p>

            <div className="flex items-center gap-1">
              {/* PREVIOUS */}

              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <svg
                  className="h-4 w-4"
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
              </button>

              {/* PAGE NUMBERS */}

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium transition ${
                    page === pageNumber
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              {/* NEXT */}

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <svg
                  className="h-4 w-4"
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
          </div>
        )}
      </section>

      {/* ================================================
          DELETE CONFIRMATION MODAL
      ================================================= */}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-5 backdrop-blur-sm"
          onClick={() => {
            if (!deletingId) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* WARNING ICON */}

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg
                className="h-6 w-6 text-red-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 17h.01"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                />
              </svg>
            </div>

            {/* CONTENT */}

            <div className="mt-5">
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                Delete this class?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-700">
                  "{deleteTarget.class_name || "this class"}"
                </span>
                ?
              </p>

              <p className="mt-2 text-sm leading-6 text-red-600">
                This action cannot be undone. The class and its uploaded photo
                will be permanently deleted.
              </p>
            </div>

            {/* BUTTONS */}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deletingId === deleteTarget.id}
                onClick={() => setDeleteTarget(null)}
                className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingId === deleteTarget.id}
                onClick={handleDelete}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:pointer-events-none disabled:opacity-70"
              >
                {deletingId === deleteTarget.id ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 6h18"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 6V4h8v2"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19 6-1 14H6L5 6"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 11v5M14 11v5"
                      />
                    </svg>
                    Delete Class
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================
          PHOTO PREVIEW MODAL
      ================================================= */}

      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}

            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -right-2 -top-2 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
              title="Close"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l12 12"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 6 6 18"
                />
              </svg>
            </button>

            {/* IMAGE */}

            <img
              src={previewPhoto.url}
              alt={previewPhoto.name}
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />

            {/* PHOTO NAME */}

            {previewPhoto.name && (
              <div className="mt-3 text-center text-sm font-medium text-white">
                {previewPhoto.name}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
