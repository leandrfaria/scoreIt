"use client";

import { Dialog } from "@headlessui/react";
import { useState } from "react";
import { postReview } from "@/services/review/post_review";
import { useMember } from "@/context/MemberContext";
import toast from "react-hot-toast";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string | number;
  mediaType: "movie" | "series" | "album";
}

export default function RatingModal({
  isOpen,
  onClose,
  mediaId,
  mediaType,
}: RatingModalProps) {
  const [score, setScore] = useState(0);
  const [watchDate, setWatchDate] = useState("");
  const [memberReview, setMemberReview] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const { member } = useMember();

  const handleSubmit = async () => {
    if (!member) {
      toast.error("Você precisa estar logado.");
      return;
    }

    const success = await postReview({
      mediaId,
      mediaType,
      memberId: member.id,
      score,
      watchDate,
      memberReview,
      spoiler,
    });

    if (success) {
      toast.success("Avaliação enviada com sucesso!");
      onClose();
      setScore(0);
      setWatchDate("");
      setMemberReview("");
      setSpoiler(false);
    } else {
      toast.error("Erro ao enviar avaliação.");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded bg-neutral-900 text-white p-6 space-y-4">
          <Dialog.Title className="text-xl font-bold">Avaliar</Dialog.Title>

          <div className="space-y-2">
            <label className="block text-sm">
              Nota (0-10):
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={score}
                onChange={(e) => setScore(parseFloat(e.target.value))}
                className="w-full mt-1 p-2 rounded bg-neutral-800 text-white"
              />
            </label>

            <label className="block text-sm">
              Data em que assistiu:
              <input
                type="date"
                value={watchDate}
                onChange={(e) => setWatchDate(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-neutral-800 text-white"
              />
            </label>

            <label className="block text-sm">
              Comentário:
              <textarea
                value={memberReview}
                onChange={(e) => setMemberReview(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-neutral-800 text-white"
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(e) => setSpoiler(e.target.checked)}
              />
              Contém spoilers
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition"
            >
              Enviar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
