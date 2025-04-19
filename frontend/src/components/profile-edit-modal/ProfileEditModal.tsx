import { Member } from "@/types/Member";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

const ProfileEditModal = ({ member, onUpdateMember, onClose }: { member: Member | null; onUpdateMember: (formData: { name: string; bio: string }, imageFile: File | null) => void; onClose: () => void; }) => {
  const [formData, setFormData] = useState({ name: member?.name || "", bio: member?.bio || "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const t = useTranslations("ProfileEditModal");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMember(formData, imageFile);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-lg font-semibold text-white mb-4">{t("title")}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("namePlaceholder")}
            className="p-2 rounded bg-zinc-800 text-white"
            required
          />
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder={t("bioPlaceholder")}
            className="p-2 rounded bg-zinc-800 text-white resize-none"
            rows={3}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="text-white"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-500 text-gray-300 px-4 py-1 rounded"
            >
              {t("cancelButton")}
            </button>
            <button
              type="submit"
              className="bg-[var(--color-darkgreen)] hover:brightness-110 text-white px-4 py-1 rounded"
            >
              {t("saveButton")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ProfileEditModal;