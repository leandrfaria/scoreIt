"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Member } from "@/types/Member";

interface MemberContextType {
  member: Member | null;
  setMember: (member: Member | null) => void;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export const MemberProvider = ({ children }: { children: ReactNode }) => {
  const [member, setMember] = useState<Member | null>(null);

  return (
    <MemberContext.Provider value={{ member, setMember }}>
      {children}
    </MemberContext.Provider>
  );
};

export const useMember = () => {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error("useMember must be used within a MemberProvider");
  }
  return context;
};
