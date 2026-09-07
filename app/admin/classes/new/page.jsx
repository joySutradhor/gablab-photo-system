
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { BsArrowLeft } from "react-icons/bs";
import { FaPhotoFilm } from "react-icons/fa6";
import { BiUpload } from "react-icons/bi";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";

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
  const [photoPreview, setPhotoPreview] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [createdAccessCode, setCreatedAccessCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!photo) {
      alert("Please select a photo.");
      return;
    }

    if (!className || !classDate || !classTime) {
      alert("Please fill in all required fields.");
      return;
    }

    setShowCreateModal(true);
  };

  const handleConfirmCreate = async () => {
    try {
      setCreating(true);
      setShowCreateModal(false);

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
          result.details ||
            result.error ||
            "Failed to create class",
        );
      }

      console.log("Created class:", result);

      setCreatedAccessCode(result.class.access_code);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Create class error:", error);

      alert(error.message);
    } finally {
      setCreating(false);
    }
  };

  const regenerateCode = () => {
    setAccessCode(generateAccessCode());
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview("");
  };

  const handleSuccessOkay = () => {
    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 flex justify-center">
      <div className="mx-auto w-[95vw] lg:w-[55vw] pt-[10vh]">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0B1F3A]">
              Create New Class
            </h1>

            <p className="mt-1.5 text-base text-gray-500">
              Add a new class and upload its group photo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="mb-3 inline-flex cursor-pointer rounded-lg border border-black/10 px-6 py-2 items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#415A77]"
          >
            <BsArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>

        {/* Main Card */}
        <div className="rounded-xl border border-[#E5EAF0] bg-white shadow-sm">
          <form onSubmit={handleSubmit}>

            <div className="grid lg:grid-cols-2">

              {/* Left - Class Information */}
              <div className="border-b border-[#E5EAF0] p-5 sm:p-6 lg:border-b-0 lg:border-r">

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-[#0B1F3A]">
                    Class Information
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    Enter the basic information for this class.
                  </p>
                </div>

                <div className="space-y-5">

                  {/* Class Name */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#0B1F3A]">
                      Class Name
                    </label>

                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="Paella Cooking Class"
                      required
                      className="h-11 w-full rounded-lg border border-[#E5EAF0] px-3.5 text-base text-black/60 outline-none transition placeholder:text-gray-400 focus:border-[#415A77] focus:ring-2 focus:ring-[#415A77]/10"
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#0B1F3A]">
                        Class Date
                      </label>

                      <input
                        type="date"
                        value={classDate}
                        onChange={(e) => setClassDate(e.target.value)}
                        required
                        className="h-11 w-full rounded-lg border border-[#E5EAF0] px-3 text-base text-black/60 outline-none transition focus:border-[#415A77] focus:ring-2 focus:ring-[#415A77]/10"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#0B1F3A]">
                        Class Time
                      </label>

                      <input
                        type="time"
                        value={classTime}
                        onChange={(e) => setClassTime(e.target.value)}
                        required
                        className="h-11 w-full rounded-lg border border-[#E5EAF0] px-3 text-base text-black/60 outline-none transition focus:border-[#415A77] focus:ring-2 focus:ring-[#415A77]/10"
                      />
                    </div>

                  </div>

                  {/* Access Code */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#0B1F3A]">
                      Guest Access Code
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={accessCode}
                        readOnly
                        className="h-11 flex-1 rounded-lg border border-[#E5EAF0] bg-gray-50 px-3.5 font-mono text-lg tracking-[0.2em] text-black/60 outline-none"
                      />

                      <button
                        type="button"
                        onClick={regenerateCode}
                        className="h-11 cursor-pointer rounded-lg border border-[#E5EAF0] bg-white px-4 text-sm font-semibold text-[#415A77] transition hover:bg-gray-50"
                      >
                        Regenerate
                      </button>
                    </div>

                    <p className="mt-2 text-sm text-gray-400">
                      Give this code to the guests after their class.
                    </p>
                  </div>

                </div>
              </div>

              {/* Right - Photo */}
              <div className="p-5 sm:p-6">

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-[#0B1F3A]">
                    Group Photo
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    Upload the group photo for this class.
                  </p>
                </div>

                {/* Photo Preview */}
                {photoPreview ? (
                  <div className="relative overflow-hidden rounded-lg border border-[#E5EAF0] bg-gray-50">
                    <img
                      src={photoPreview}
                      alt="Selected group photo"
                      className="h-56 w-full object-contain sm:h-60"
                    />

                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute right-3 top-3 cursor-pointer rounded-lg bg-black/70 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-black"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-[#D8DEE8] bg-gray-50">
                    <div className="text-center text-gray-400">
                      <FaPhotoFilm
                        size={34}
                        className="mx-auto mb-2"
                      />

                      <p className="text-sm">
                        No photo selected
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload */}
                <label className="mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#E5EAF0] bg-white text-sm font-semibold text-[#415A77] transition hover:bg-gray-50">
                  <BiUpload size={19} />

                  {photo
                    ? "Choose Another Photo"
                    : "Choose Photo"}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    required={!photo}
                    className="hidden"
                  />
                </label>

                {photo && (
                  <p className="mt-2 truncate text-sm text-green-600">
                    Selected: {photo.name}
                  </p>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-2 border-t border-[#E5EAF0] p-4 sm:flex-row sm:justify-end sm:p-5">

              <button
                type="button"
                onClick={() => router.push("/admin/dashboard")}
                disabled={creating}
                className="h-11 cursor-pointer rounded-lg border border-[#E5EAF0] bg-white px-6 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating}
                className="h-11 cursor-pointer rounded-lg bg-[#415A77] px-7 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Class"}
              </button>

            </div>
          </form>
        </div>
      </div>

      {/* Create Confirmation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#415A77]/10 text-[#415A77]">
                <FiAlertCircle size={23} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0B1F3A]">
                  Create New Class?
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Are you sure you want to create this class?
                  The class information and uploaded photo will
                  be saved.
                </p>
              </div>

            </div>

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="h-11 flex-1 cursor-pointer rounded-lg border border-[#E5EAF0] bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={creating}
                className="h-11 flex-1 cursor-pointer rounded-lg bg-[#415A77] text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Yes, Create Class"}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">

          <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-xl">

            {/* Success Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <FiCheckCircle size={30} />
            </div>

            {/* Title */}
            <h3 className="mt-4 text-xl font-bold text-[#0B1F3A]">
              Class Created Successfully
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              The class and group photo have been successfully
              added to the system.
            </p>

            {/* Access Code */}
            <div className="mt-5 rounded-lg border border-[#E5EAF0] bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-500">
                Guest Access Code
              </p>

              <p className="mt-1 font-mono text-xl font-bold tracking-[0.25em] text-[#415A77]">
                {createdAccessCode}
              </p>
            </div>

            {/* Okay */}
            <button
              type="button"
              onClick={handleSuccessOkay}
              className="mt-5 h-11 w-full cursor-pointer rounded-lg bg-[#415A77] px-6 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Okay
            </button>

          </div>
        </div>
      )}
    </main>
  );
}

