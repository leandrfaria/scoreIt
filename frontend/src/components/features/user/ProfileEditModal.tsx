import { Member } from "@/types/Member";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

const ProfileEditModal = ({
  member,
  onUpdateMember,
  onClose,
}: {
  member: Member | null;
  onUpdateMember: (
    formData: { name: string; bio: string; birthDate: string; gender: string },
    imageFile: File | null
  ) => void;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: member?.name || "",
    bio: member?.bio || "",
    birthDate: member?.birthDate || "",
    gender: member?.gender || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);

  const t = useTranslations("ProfileEditModal");

  const MAX_NAME_LENGTH = 50;
  const MAX_BIO_LENGTH = 200;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {    
    const { name, value } = e.target;

    if(name == "birthDate"){
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const isValidDate = birthDate instanceof Date && !isNaN(birthDate.getTime());
      const isAdult = age > 18 || (age === 18 && today.getMonth() > birthDate.getMonth()) || (age === 18 && today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
      const isUnder120 = age < 120;

      if (!isValidDate || !isAdult || !isUnder120) {
        toast.error(t("invalidBirthDate"));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const isValidDate = birthDate instanceof Date && !isNaN(birthDate.getTime());
      const isAdult = age > 18 || (age === 18 && today.getMonth() > birthDate.getMonth()) || (age === 18 && today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
      const isUnder120 = age < 120;

      if (!isValidDate || !isAdult || !isUnder120) {
        toast.error(t("invalidBirthDate"));
        return;
      }
    e.preventDefault();
    onUpdateMember(formData, imageFile);
  };

  const isNameTooLong = formData.name.length > MAX_NAME_LENGTH;
  const isBioTooLong = formData.bio.length > MAX_BIO_LENGTH;
  const isSaveDisabled = isNameTooLong || isBioTooLong;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-lg font-semibold text-white mb-4">{t("title")}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nome */}
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("namePlaceholder")}
            className={`p-2 rounded bg-zinc-800 text-white ${isNameTooLong ? "border-red-500" : ""}`}
            required
          />
          <div className={`text-gray-400 text-xs -mt-3 ${isNameTooLong ? "text-red-500" : ""}`}>
            {t("maxCharacters", { max: MAX_NAME_LENGTH })}
          </div>

          {/* Biografia */}
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder={t("bioPlaceholder")}
            className={`p-2 rounded bg-zinc-800 text-white resize-none ${isBioTooLong ? "border-red-500" : ""}`}
            rows={3}
          />
          <div className={`text-gray-400 text-xs -mt-3 ${isBioTooLong ? "text-red-500" : ""}`}>
            {t("maxCharacters", { max: MAX_BIO_LENGTH })}
          </div>

          {/* Data de nascimento */}
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className="p-2 rounded bg-zinc-800 text-white appearance-none [&::-webkit-calendar-picker-indicator]:invert"
            placeholder={t("undefined")}
            required
          />

          {/* Gênero */}
          <div className="relative">
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              onClick={() => setSelectOpen((prev) => !prev)}
              onBlur={() => setSelectOpen(false)}
              className="p-2 rounded bg-zinc-800 text-white appearance-none pr-8 w-full"
              required
            >
              {member?.gender === "" && (
                <option value="" disabled>{t("undefined")}</option>
              )}
              <option value="MASC">{t("male")}</option>
              <option value="FEM">{t("female")}</option>
              <option value="OTHER">{t("other")}</option>
            </select>
            <div
              className="pointer-events-none absolute inset-y-0 right-2 flex items-center transition-transform duration-300"
              style={{
                transform: selectOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Upload de imagem */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="text-white bg-darkgreen px-6 py-2 rounded-md hover:brightness-110 transition-all cursor-pointer"
          />

          {/* Botões */}
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
              disabled={isSaveDisabled}
              className={`bg-[var(--color-darkgreen)] hover:brightness-110 text-white px-4 py-1 rounded ${
                isSaveDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
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
