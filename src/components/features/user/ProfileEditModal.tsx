"use client";

import { Member } from "@/types/Member";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

/** Normaliza o handle removendo '@', deixando minúsculo e permitindo apenas a-z 0-9 . _ */
function normalizeHandleInput(v: string) {
  return v.replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
}

/** Sugere um handle quando o usuário ainda não tem */
function suggestHandle(member?: Member | null): string {
  if (!member) return "usuario";
  const fromHandle = normalizeHandleInput(member.handle || "");
  if (fromHandle) return fromHandle;

  const emailLeft = (member.email || "").split("@")[0] || "";
  const fromEmail = normalizeHandleInput(emailLeft);
  if (fromEmail) return fromEmail;

  const fromName = normalizeHandleInput((member.name || "").replace(/\s+/g, "."));
  if (fromName) return fromName;

  return `user${member.id || ""}`;
}

type Props = {
  member: Member | null;
  onUpdateMember: (
    formData: {
      name: string;
      bio: string;
      birthDate: string;
      gender: string;
      handle: string;
    },
    imageFile: File | null
  ) => void;
  onClose: () => void;
};

const ProfileEditModal = ({ member, onUpdateMember, onClose }: Props) => {
  const t = useTranslations("ProfileEditModal");

  // controla montagem para evitar portal antes do DOM existir
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // handle inicial sempre preenchido (normalizado ou sugerido)
  const initialSuggested = useMemo(() => suggestHandle(member), [member]);
  const [formData, setFormData] = useState({
    name: member?.name || "",
    bio: member?.bio || "",
    birthDate: member?.birthDate || "",
    gender: member?.gender || "",
    handle: normalizeHandleInput(member?.handle || "") || initialSuggested,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);

  const MAX_NAME_LENGTH = 50;
  const MAX_BIO_LENGTH = 200;
  const MAX_HANDLE_LENGTH = 20;
  const MIN_HANDLE_LENGTH = 3;

  // Sincroniza quando o modal abre ou quando o member atualiza
  useEffect(() => {
    const newSuggested = suggestHandle(member);
    setFormData({
      name: member?.name || "",
      bio: member?.bio || "",
      birthDate: member?.birthDate || "",
      gender: member?.gender || "",
      handle: normalizeHandleInput(member?.handle || "") || newSuggested,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id, member?.name, member?.email, member?.handle, member?.bio, member?.birthDate, member?.gender]);

  const isNameTooLong = formData.name.length > MAX_NAME_LENGTH;
  const isBioTooLong = formData.bio.length > MAX_BIO_LENGTH;

  const isHandleValid = useMemo(() => {
    const h = formData.handle || initialSuggested;
    return (
      h.length >= MIN_HANDLE_LENGTH &&
      h.length <= MAX_HANDLE_LENGTH &&
      /^[a-z0-9._]+$/.test(h)
    );
  }, [formData.handle, initialSuggested]);

  const isSaveDisabled = isNameTooLong || isBioTooLong || !isHandleValid;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "birthDate") {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const isValidDate = birthDate instanceof Date && !isNaN(birthDate.getTime());
      const isAdult =
        age > 18 ||
        (age === 18 && today.getMonth() > birthDate.getMonth()) ||
        (age === 18 &&
          today.getMonth() === birthDate.getMonth() &&
          today.getDate() >= birthDate.getDate());
      const isUnder120 = age < 120;

      if (!isValidDate || !isAdult || !isUnder120) {
        toast.error(t("invalidBirthDate"));
        return;
      }
    }

    if (name === "handle") {
      const normalized = normalizeHandleInput(value);
      setFormData((prev) => ({ ...prev, handle: normalized }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const isValidDate = birthDate instanceof Date && !isNaN(birthDate.getTime());
    const isAdult =
      age > 18 ||
      (age === 18 && today.getMonth() > birthDate.getMonth()) ||
      (age === 18 &&
        today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());
    const isUnder120 = age < 120;

    if (!isValidDate || !isAdult || !isUnder120) {
      toast.error(t("invalidBirthDate"));
      return;
    }

    // garante um handle válido mesmo se o campo ficar vazio
    const finalHandle = normalizeHandleInput(formData.handle) || initialSuggested;

    if (
      finalHandle.length < MIN_HANDLE_LENGTH ||
      finalHandle.length > MAX_HANDLE_LENGTH ||
      !/^[a-z0-9._]+$/.test(finalHandle)
    ) {
      toast.error("Handle inválido. Use 3–20 caracteres: letras, números, ponto ou underline.");
      return;
    }

    onUpdateMember(
      {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        birthDate: formData.birthDate,
        gender: formData.gender,
        handle: finalHandle,
      },
      imageFile
    );
  };

  const previewHandle = formData.handle || initialSuggested;

  if (!mounted) return null; // evita portal antes do DOM

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-zinc-900 p-6 rounded-xl w-full max-w-lg shadow-2xl ring-1 ring-white/10"
      >
        <h2 className="text-xl font-semibold text-white mb-4">{t("title")}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nome */}
          <div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t("namePlaceholder")}
              className={`w-full p-3 rounded-lg bg-zinc-800 text-white outline-none ring-1 ring-transparent focus:ring-darkgreen/60 transition ${
                isNameTooLong ? "ring-red-500" : ""
              }`}
              required
            />
            <div className={`text-gray-400 text-xs mt-1 ${isNameTooLong ? "text-red-500" : ""}`}>
              {t("maxCharacters", { max: MAX_NAME_LENGTH })}
            </div>
          </div>

          {/* Handle (@) */}
          <div>
            <label className="sr-only" htmlFor="handle-input">Handle</label>
            <div className="flex items-center rounded-lg bg-zinc-800 ring-1 ring-transparent focus-within:ring-darkgreen/60">
              <span className="pl-3 pr-1 text-gray-400 select-none">@</span>
              <input
                id="handle-input"
                type="text"
                name="handle"
                value={formData.handle}
                onChange={handleChange}
                placeholder="seuusuario"
                className="w-full p-3 rounded-r-lg bg-zinc-800 text-white outline-none"
                maxLength={MAX_HANDLE_LENGTH}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="text"
              />
            </div>
            <div className={`text-xs mt-1 ${isHandleValid ? "text-gray-400" : "text-red-400"}`}>
              {`Seu @ ficará assim: @${previewHandle} (3–20, letras/números/._)`}
            </div>
          </div>

          {/* Biografia */}
          <div>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder={t("bioPlaceholder")}
              className={`w-full p-3 rounded-lg bg-zinc-800 text-white resize-none outline-none ring-1 ring-transparent focus:ring-darkgreen/60 ${
                isBioTooLong ? "ring-red-500" : ""
              }`}
              rows={3}
            />
            <div className={`text-gray-400 text-xs mt-1 ${isBioTooLong ? "text-red-500" : ""}`}>
              {t("maxCharacters", { max: MAX_BIO_LENGTH })}
            </div>
          </div>

          {/* Data de nascimento */}
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className="p-3 rounded-lg bg-zinc-800 text-white appearance-none outline-none ring-1 ring-transparent focus:ring-darkgreen/60 [&::-webkit-calendar-picker-indicator]:invert"
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
              className="p-3 rounded-lg bg-zinc-800 text-white appearance-none pr-8 w-full outline-none ring-1 ring-transparent focus:ring-darkgreen/60"
              required
            >
              {member?.gender === "" && <option value="" disabled>{t("undefined")}</option>}
              <option value="MASC">{t("male")}</option>
              <option value="FEM">{t("female")}</option>
              <option value="OTHER">{t("other")}</option>
            </select>
            <div
              className="pointer-events-none absolute inset-y-0 right-2 flex items-center transition-transform duration-300"
              style={{ transform: selectOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Upload de imagem */}
          <label className="block">
            <span className="text-sm text-gray-300 mb-1 block">{t("profileImageAlt")}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="text-white bg-darkgreen/90 px-6 py-2 rounded-md hover:brightness-110 transition-all cursor-pointer"
            />
          </label>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-600 text-gray-200 px-4 py-2 rounded-lg hover:bg-white/5"
            >
              {t("cancelButton")}
            </button>
            <button
              type="submit"
              disabled={isSaveDisabled}
              className={`bg-[var(--color-darkgreen)] hover:brightness-110 text-white px-4 py-2 rounded-lg transition ${
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
