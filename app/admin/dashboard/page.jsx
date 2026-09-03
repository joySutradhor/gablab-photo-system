"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const PAGE_SIZE = 8;

// ---- date helpers -----------------------------------------------------

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function endOfWeek(date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeLabel(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  if (Number.isNaN(hour)) return timeStr;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m || "00"} ${suffix}`;
}

function initials(name) {
  if (!name) return "CL";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function isUpcoming(dateStr, timeStr) {
  if (!dateStr) return false;
  const dt = new Date(`${dateStr}T${timeStr || "00:00"}`);
  return dt.getTime() >= Date.now();
}

// ---- component ---------------------------------------------------------

export default function AdminDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState("");
  const [rangeMode, setRangeMode] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [singleDay, setSingleDay] = useState("");
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabaseBrowser
        .from("classes")
        .select("*")
        .order("class_date", { ascending: false })
        .order("class_time", { ascending: false });

      if (error) {
        console.error("Failed to load classes:", error);
        setLoadError("We couldn't load your classes. Try refreshing the page.");
      } else {
        setClasses(data || []);
      }

      setClassesLoading(false);
      setLoading(false);
    };

    loadDashboard();
  }, [router]);

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    router.replace("/admin/login");
  };

  useEffect(() => {
    setPage(1);
  }, [search, rangeMode, customStart, customEnd, singleDay]);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return classes.filter((item) => {
      if (query) {
        const haystack =
          `${item.class_name || ""} ${item.access_code || ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (rangeMode === "all") return true;
      if (!item.class_date) return false;

      const classDate = new Date(`${item.class_date}T00:00:00`);
      if (Number.isNaN(classDate.getTime())) return false;

      const now = new Date();

      if (rangeMode === "day") {
        if (!singleDay) return true;
        return item.class_date === singleDay;
      }
      if (rangeMode === "week") {
        return classDate >= startOfWeek(now) && classDate <= endOfWeek(now);
      }
      if (rangeMode === "month") {
        return classDate >= startOfMonth(now) && classDate <= endOfMonth(now);
      }
      if (rangeMode === "custom") {
        if (customStart && classDate < new Date(`${customStart}T00:00:00`))
          return false;
        if (customEnd && classDate > new Date(`${customEnd}T23:59:59`))
          return false;
        return true;
      }
      return true;
    });
  }, [classes, search, rangeMode, singleDay, customStart, customEnd]);

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedClasses = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredClasses.slice(start, start + PAGE_SIZE);
  }, [filteredClasses, currentPage]);

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = classes.filter((c) =>
      isUpcoming(c.class_date, c.class_time),
    );
    const thisMonth = classes.filter((c) => {
      if (!c.class_date) return false;
      const d = new Date(`${c.class_date}T00:00:00`);
      return d >= startOfMonth(now) && d <= endOfMonth(now);
    });
    const withPhoto = classes.filter((c) => c.photo_path);
    return {
      total: classes.length,
      upcoming: upcoming.length,
      thisMonth: thisMonth.length,
      withPhoto: withPhoto.length,
    };
  }, [classes]);

  const rangeOptions = [
    { key: "all", label: "All" },
    { key: "day", label: "Day" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "custom", label: "Custom" },
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0D12]">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <p className="text-sm">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-slate-900">
      <div className="flex">
        {/* ---------------- Sidebar ---------------- */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-[#0B0D12] transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
                CK
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white">
                Kitchen Studio
              </span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-5">
              <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium text-white">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Dashboard
              </div>
              <button
                onClick={() => router.push("/admin/classes/new")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Class
              </button>
              <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Guests
                <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">
                  Soon
                </span>
              </div>
              <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
                <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">
                  Soon
                </span>
              </div>
            </nav>

            <div className="border-t border-white/10 p-4">
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                  {initials(user?.email?.split("@")[0])}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {user?.email}
                  </p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Log out
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ---------------- Main ---------------- */}
        <div className="flex-1 lg:pl-0">
          {/* Topbar */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                  Classes
                </h1>
                <p className="text-xs text-slate-500">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/admin/classes/new")}
              className="hidden items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 sm:flex"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Class
            </button>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                {
                  label: "Total classes",
                  value: stats.total,
                  accent: "bg-slate-900",
                },
                {
                  label: "Upcoming",
                  value: stats.upcoming,
                  accent: "bg-emerald-600",
                },
                {
                  label: "This month",
                  value: stats.thisMonth,
                  accent: "bg-blue-600",
                },
                {
                  label: "With photos",
                  value: stats.withPhoto,
                  accent: "bg-amber-500",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div
                    className={`absolute left-0 top-0 h-full w-1 ${s.accent}`}
                  />
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {s.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
                    {classesLoading ? "—" : s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Panel */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-white">
              {/* Filter bar */}
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-sm">
                    <svg
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.35 4.35a7.5 7.5 0 0012.3 12.3z"
                      />
                    </svg>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search class name or guest code"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                    {rangeOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setRangeMode(opt.key)}
                        className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                          rangeMode === opt.key
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {rangeMode === "day" && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-600">
                      Date
                    </label>
                    <input
                      type="date"
                      value={singleDay}
                      onChange={(e) => setSingleDay(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                )}

                {rangeMode === "custom" && (
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm font-medium text-slate-600">
                      From
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                    <label className="text-sm font-medium text-slate-600">
                      To
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* Error */}
              {loadError && (
                <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {loadError}
                </div>
              )}

              {/* Loading */}
              {classesLoading && (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg bg-slate-100"
                    />
                  ))}
                </div>
              )}

              {/* Empty: no classes */}
              {!classesLoading && classes.length === 0 && (
                <div className="p-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg
                      className="h-6 w-6 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">
                    No classes yet
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Create your first class to get started.
                  </p>
                  <button
                    onClick={() => router.push("/admin/classes/new")}
                    className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    + Create New Class
                  </button>
                </div>
              )}

              {/* Empty: filters matched nothing */}
              {!classesLoading &&
                classes.length > 0 &&
                filteredClasses.length === 0 && (
                  <div className="p-14 text-center">
                    <h3 className="font-semibold text-slate-900">
                      No matching classes
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Try a different search term or date range.
                    </p>
                    <button
                      onClick={() => {
                        setSearch("");
                        setRangeMode("all");
                        setSingleDay("");
                        setCustomStart("");
                        setCustomEnd("");
                      }}
                      className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Clear filters
                    </button>
                  </div>
                )}

              {/* Table */}
              {!classesLoading && paginatedClasses.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3 font-medium">Class</th>
                        <th className="px-5 py-3 font-medium">
                          Date &amp; time
                        </th>
                        <th className="px-5 py-3 font-medium">Guest code</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedClasses.map((item) => {
                        const upcoming = isUpcoming(
                          item.class_date,
                          item.class_time,
                        );
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {item.photo_path ? (
                                  <img
                                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/class-photos/${item.photo_path}`}
                                    alt={item.class_name}
                                    className="h-11 w-14 shrink-0 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-medium text-slate-400">
                                    No photo
                                  </div>
                                )}
                                <span className="font-medium text-slate-900">
                                  {item.class_name}
                                </span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                              {formatDateLabel(item.class_date)}
                              {item.class_time && (
                                <span className="text-slate-400">
                                  {" "}
                                  · {formatTimeLabel(item.class_time)}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-sm font-semibold tracking-widest text-slate-800">
                                {item.access_code}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                  upcoming
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    upcoming ? "bg-emerald-500" : "bg-slate-400"
                                  }`}
                                />
                                {upcoming ? "Upcoming" : "Past"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!classesLoading && filteredClasses.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}
                    {"–"}
                    {Math.min(
                      currentPage * PAGE_SIZE,
                      filteredClasses.length,
                    )}{" "}
                    of {filteredClasses.length}{" "}
                    {filteredClasses.length === 1 ? "class" : "classes"}
                  </p>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (n) =>
                            n === 1 ||
                            n === totalPages ||
                            Math.abs(n - currentPage) <= 1,
                        )
                        .reduce((acc, n, idx, arr) => {
                          if (idx > 0 && n - arr[idx - 1] > 1)
                            acc.push("ellipsis-" + n);
                          acc.push(n);
                          return acc;
                        }, [])
                        .map((n) =>
                          typeof n === "string" ? (
                            <span
                              key={n}
                              className="px-1.5 text-sm text-slate-400"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={n}
                              onClick={() => setPage(n)}
                              className={`h-8 w-8 rounded-lg text-sm font-medium ${
                                n === currentPage
                                  ? "bg-slate-900 text-white"
                                  : "text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {n}
                            </button>
                          ),
                        )}

                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
