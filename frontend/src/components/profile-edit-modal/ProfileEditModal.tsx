import { Member } from "@/types/Member";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

const ProfileEditModal = ({ member, onUpdateMember, onClose }: { member: Member | null; onUpdateMember: (formData: { name: string; bio: string; birthDate: string; gender: string }, imageFile: File | null) => void; onClose: () => void; }) => {
  const [formData, setFormData] = useState({
    name: member?.name || "",
    bio: member?.bio || "",
    birthDate: member?.birthDate || "",
    gender: member?.gender || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const t = useTranslations("ProfileEditModal");

  const MAX_NAME_LENGTH = 50;
  const MAX_BIO_LENGTH = 200;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [selectOpen, setSelectOpen] = useState(false); // Controle explícito para a rotação da seta


  const handleSubmit = (e: React.FormEvent) => {
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
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("namePlaceholder")}
            className={`p-2 rounded bg-zinc-800 text-white ${isNameTooLong ? 'border-red-500' : ''}`}
            required
          />
          <div className={`text-gray-400 text-xs -mt-3 ${isNameTooLong ? 'text-red-500' : ''}`}>
            Máximo de {MAX_NAME_LENGTH} caracteres
          </div>

          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder={t("bioPlaceholder")}
            className={`p-2 rounded bg-zinc-800 text-white resize-none ${isBioTooLong ? 'border-red-500' : ''}`}
            rows={3}
          />
          <div className={`text-gray-400 text-xs -mt-3 ${isBioTooLong ? 'text-red-500' : ''}`}>
            Máximo de {MAX_BIO_LENGTH} caracteres
          </div>

          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className="p-2 rounded bg-zinc-800 text-white appearance-none [&::-webkit-calendar-picker-indicator]:invert"
            placeholder={member?.birthDate ? member.birthDate : "Indefinido"}
            required
          />

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
                <option value="" disabled>Indefinido</option>
              )}
              <option value="MASC">Masculino</option>
              <option value="FEM">Feminino</option>
              <option value="OTHER">Outro</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center transition-transform duration-300"
              style={{
                transform: selectOpen ? 'rotate(180deg)' : 'rotate(0deg)' // Gira a seta quando o select está aberto
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

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="text-white bg-darkgreen px-6 py-2 rounded-md hover:brightness-110 transition-all cursor-pointer"
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
              disabled={isSaveDisabled}
              className={`bg-[var(--color-darkgreen)] hover:brightness-110 text-white px-4 py-1 rounded ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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