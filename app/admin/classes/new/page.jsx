"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function generateAccessCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function NewClassPage() {
  const router = useRouter();

  const [className, setClassName] = useState("");
  const [classDate, setClassDate] = useState("");
  const [classTime, setClassTime] = useState("");
  const [accessCode, setAccessCode] = useState(generateAccessCode());
  const [photo, setPhoto] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!photo) {
      alert("Please select a photo.");
      return;
    }

    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        alert("Your session has expired. Please login again.");
        router.push("/admin/login");
        return;
      }

      const formData = new FormData();

      formData.append("className", className);
      formData.append("classDate", classDate);
      formData.append("classTime", classTime);
      formData.append("photo", photo);

      const response = await fetch("/api/admin/classes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.details || result.error || "Failed to create class",
        );
      }

      console.log("Created class:", result);

      alert(
        `Class created successfully!\n\nAccess Code: ${result.class.access_code}`,
      );

      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Create class error:", error);

      alert(error.message);
    }
  };

  const regenerateCode = () => {
    setAccessCode(generateAccessCode());
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-8">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="mb-4 text-sm text-gray-500 hover:text-black"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Create New Class
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Add a class and upload its group photo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Class Name
              </label>

              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Paella Cooking Class"
                required
                className="w-full rounded-lg border text-black/60 border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Class Date
              </label>

              <input
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                required
                className="w-full rounded-lg text-black/60 border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Time */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Class Time
              </label>

              <input
                type="time"
                value={classTime}
                onChange={(e) => setClassTime(e.target.value)}
                required
                className="w-full rounded-lg text-black/60 border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Access Code */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Guest Access Code
              </label>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={accessCode}
                  readOnly
                  className="flex-1 rounded-lg text-black/60 border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-lg tracking-widest outline-none"
                />

                <button
                  type="button"
                  onClick={regenerateCode}
                  className="rounded-lg border text-black/60 border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Regenerate
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Give this code to the guests after their class.
              </p>
            </div>

            {/* Photo */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Group Photo
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                required
                className="block w-full rounded-lg border border-gray-300 p-3 text-sm"
              />

              {photo && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {photo.name}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-lg text-black/60 bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
            >
              Create Class
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
