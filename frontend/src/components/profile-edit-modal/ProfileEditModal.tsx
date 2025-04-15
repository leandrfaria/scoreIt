import { Member } from "@/types/Member";
import { useState } from "react";
import { createPortal } from "react-dom";

const ProfileEditModal = ({ member, onUpdateMember, onClose }: { member: Member | null; onUpdateMember: (formData: { name: string; bio: string }, imageFile: File | null) => void; onClose: () => void; }) => {
  const [formData, setFormData] = useState({ name: member?.name || "", bio: member?.bio || "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const MAX_NAME_LENGTH = 50;
  const MAX_BIO_LENGTH = 200;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
        <h2 className="text-lg font-semibold text-white mb-4">Editar Perfil</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nome"
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
              placeholder="Bio"
              className={`p-2 rounded bg-zinc-800 text-white resize-none ${isBioTooLong ? 'border-red-500' : ''}`}
              rows={3}
            />
            <div className={`text-gray-400 text-xs -mt-3 ${isBioTooLong ? 'text-red-500' : ''}`}>
              Máximo de {MAX_BIO_LENGTH} caracteres
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaveDisabled}
              className={`bg-[var(--color-darkgreen)] hover:brightness-110 text-white px-4 py-1 rounded ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ProfileEditModal;