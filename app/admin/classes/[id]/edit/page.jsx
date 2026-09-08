"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { BsArrowLeft, BsArrowUpLeft } from "react-icons/bs";
import { FaPhotoFilm } from "react-icons/fa6";
import { BiUpload } from "react-icons/bi";
import { FiAlertCircle, FiCheck } from "react-icons/fi";

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();

  const classId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [className, setClassName] = useState("");
  const [classDate, setClassDate] = useState("");
  const [classTime, setClassTime] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const [newPhoto, setNewPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState("");

  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    if (!classId) return;

    const loadClass = async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (!session) {
          router.push("/admin/login");
          return;
        }

        const { data, error: fetchError } = await supabaseBrowser
          .from("classes")
          .select("*")
          .eq("id", classId)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (!data) {
          throw new Error("Class not found.");
        }

        setClassName(data.class_name || "");
        setClassDate(data.class_date || "");
        setClassTime(data.class_time || "");
        setAccessCode(data.access_code || "");

        if (data.photo_path) {
          const photoUrl =
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}` +
            `/storage/v1/object/public/class-photos/` +
            data.photo_path;

          setPreviewPhoto(photoUrl);
        }
      } catch (err) {
        console.error("Load class error:", err);
        setError(err.message || "Failed to load class.");
      } finally {
        setLoading(false);
      }
    };

    loadClass();
  }, [classId, router]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setNewPhoto(file);
    setPreviewPhoto(URL.createObjectURL(file));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!className || !classDate || !classTime) {
      setError("Please fill in all required fields.");
      return;
    }

    setShowUpdateModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!classId) {
      setError("Class ID is missing.");
      setShowUpdateModal(false);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setShowUpdateModal(false);

      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        router.push("/admin/login");
        return;
      }

      const formData = new FormData();

      formData.append("className", className);
      formData.append("classDate", classDate);
      formData.append("classTime", classTime);

      if (newPhoto) {
        formData.append("photo", newPhoto);
      }

      const response = await fetch(`/api/admin/classes/${classId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update class.");
      }

      setSuccess("Class updated successfully.");

      setTimeout(() => {
        router.push("/admin/dashboard");
        router.refresh();
      }, 700);
    } catch (err) {
      console.error("Update class error:", err);

      setError(err.message || "Something went wrong while updating the class.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F9FC] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-2 h-7 w-7 animate-spin rounded-full border-2 border-[#415A77] border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] flex justify-center  px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className=" w-[95vw] lg:w-[50vw] ">
        {/* Header */}
        <div>
          <div className="mb-5 flex items-center justify-between gap-4 pt-[10vh]">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
                Edit Class
              </h1>

              <p className="mt-1 text-base text-gray-500">
                Update class details and photo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className=" inline-flex cursor-pointer items-center gap-1.5 text-base mb-4 font-medium rounded-lg border border-black/10 py-2 px-6 text-gray-500 transition hover:text-[#415A77]"
            >
              <BsArrowUpLeft size={15} />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-700">
            <FiCheck className="mt-0.5 shrink-0" size={15} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border w-full border-[#E5EAF0] bg-white shadow-sm">
            {/* Main Content */}
            <div className="grid lg:grid-cols-2 w-full">
              {/* Left - Class Information */}
              <div className="border-b border-[#E5EAF0] p-5 sm:p-6 lg:border-b-0 lg:border-r">
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-[#0B1F3A]">
                    Class Information
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    Basic information about this class.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Class Name */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#0B1F3A]">
                      Class Name
                    </label>

                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      required
                      placeholder="Enter class name"
                      className="h-10 w-full rounded-lg border border-[#E5EAF0] bg-white px-3 text-base outline-none transition text-black/80 focus:border-[#415A77] focus:ring-2 focus:ring-[#415A77]/10"
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#0B1F3A]">
                        Date
                      </label>

                      <input
                        type="date"
                        value={classDate}
                        onChange={(e) => setClassDate(e.target.value)}
                        required
                        className="h-10 w-full rounded-lg border border-[#E5EAF0] px-2.5 text-base outline-none transition text-black/80  focus:border-[#415A77] focus:ring-2 focus:ring-[#415A77]/10"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#0B1F3A]">
                        Time
                      </label>

                      <input
                        type="time"
                        value={classTime}
                        onChange={(e) => setClassTime(e.target.value)}
                        required
                        className="h-10 w-full rounded-lg border border-[#E5EAF0] px-2.5 text-base outline-none transition text-black/80 focus:border-[#415A77] focus:ring-2 focus:ring-[#415A77]/10"
                      />
                    </div>
                  </div>

                  {/* Access Code */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#0B1F3A]">
                      Guest Access Code
                    </label>

                    <input
                      type="text"
                      value={accessCode}
                      disabled
                      className="h-10 w-full cursor-not-allowed rounded-lg border border-[#E5EAF0] bg-gray-50 px-3 text-base font-medium tracking-wider text-gray-500"
                    />

                    <p className="mt-1.5 text-[11px] text-gray-400">
                      This access code cannot be changed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right - Photo */}
              <div className="p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-[#0B1F3A]">
                    Class Photo
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    Replace the current group photo if needed.
                  </p>
                </div>

                {previewPhoto ? (
                  <div className="overflow-hidden rounded-lg border border-[#E5EAF0] bg-gray-50">
                    <img
                      src={previewPhoto}
                      alt="Class photo"
                      className="h-52 w-full object-contain sm:h-56"
                    />
                  </div>
                ) : (
                  <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-[#D8DEE8] bg-gray-50">
                    <div className="text-center text-gray-400">
                      <FaPhotoFilm size={30} className="mx-auto mb-2" />
                      <p className="text-sm">No photo available</p>
                    </div>
                  </div>
                )}

                <label className="mt-3 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#E5EAF0] bg-white text-sm font-semibold text-[#415A77] transition hover:bg-gray-50">
                  <BiUpload size={17} />

                  {newPhoto ? "Choose Another Photo" : "Replace Photo"}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-1.5 text-[11px] text-gray-400">
                  Leave empty to keep the current photo.
                </p>

                {newPhoto && (
                  <div className="mt-2 rounded-md bg-green-50 px-2.5 py-2 text-[11px] font-medium text-green-600">
                    New photo selected. It will replace the current photo after
                    update.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-2 border-t border-[#E5EAF0] p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                type="button"
                onClick={() => router.push("/admin/dashboard")}
                disabled={saving}
                className="h-10 cursor-pointer rounded-lg border border-[#E5EAF0] bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="h-10 cursor-pointer rounded-lg border text-black/80 border-black/10 px-6 text-sm font-medium  transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update Class"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Update Confirmation Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#415A77]/10 text-[#415A77]">
                <FiAlertCircle size={20} />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B1F3A]">
                  Update Class?
                </h3>

                <p className="mt-1.5 text-sm leading-5 text-gray-500">
                  Are you sure you want to update this class?
                  {newPhoto && " The current photo will be replaced."}
                </p>
              </div>
            </div>

            <div className="mt-10 flex gap-2">
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                disabled={saving}
                className="h-10 flex-1 cursor-pointer rounded-lg border border-[#E5EAF0] bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmUpdate}
                disabled={saving}
                className="h-10 flex-1 cursor-pointer rounded-lg bg-[#415A77] text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Updating..." : "Yes, Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
