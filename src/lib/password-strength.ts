export type PasswordStrength = "Lemah" | "Sedang" | "Kuat";

export type PasswordRequirementGroup = "wajib" | "disarankan";
export type PasswordRequirement = {
  id:
    | "minimum-length"
    | "different-from-username"
    | "multiple-character-types"
    | "recommended-length"
    | "recommended-types";
  label: string;
  group: PasswordRequirementGroup;
  met: boolean;
};
export type PasswordCharacterKind = {
  id: "lowercase" | "uppercase" | "number" | "symbol";
  label: string;
  present: boolean;
};
export type PasswordAssessment = {
  strength: PasswordStrength;
  requirements: PasswordRequirement[];
  characterKinds: PasswordCharacterKind[];
  valid: boolean;
};

export function getPasswordAssessment(password: string, username = ""): PasswordAssessment {
  const characterKinds: PasswordCharacterKind[] = [
    { id: "lowercase", label: "Huruf kecil", present: /[a-z]/.test(password) },
    { id: "uppercase", label: "Huruf besar", present: /[A-Z]/.test(password) },
    { id: "number", label: "Angka", present: /[0-9]/.test(password) },
    { id: "symbol", label: "Simbol", present: /[^a-zA-Z0-9]/.test(password) },
  ];
  const kindCount = characterKinds.filter((kind) => kind.present).length;
  const requirements: PasswordRequirement[] = [
    {
      id: "minimum-length",
      label: "Minimal 8 karakter",
      group: "wajib",
      met: password.length >= 8,
    },
    {
      id: "different-from-username",
      label: "Tidak sama dengan username",
      group: "wajib",
      met: username === "" || password.toLocaleLowerCase() !== username.toLocaleLowerCase(),
    },
    {
      id: "multiple-character-types",
      label: "Memuat minimal 2 jenis karakter",
      group: "wajib",
      met: kindCount >= 2,
    },
    {
      id: "recommended-length",
      label: "Minimal 12 karakter",
      group: "disarankan",
      met: password.length >= 12,
    },
    {
      id: "recommended-types",
      label: "Memuat minimal 3 jenis karakter",
      group: "disarankan",
      met: kindCount >= 3,
    },
  ];
  const valid = requirements
    .filter((requirement) => requirement.group === "wajib")
    .every((requirement) => requirement.met);
  const strength: PasswordStrength = !valid
    ? "Lemah"
    : requirements
          .filter((requirement) => requirement.group === "disarankan")
          .every((requirement) => requirement.met)
      ? "Kuat"
      : "Sedang";
  return { strength, requirements, characterKinds, valid };
}

export function getPasswordStrength(password: string, username = ""): PasswordStrength {
  return getPasswordAssessment(password, username).strength;
}

export function getPasswordSuggestion(strength: PasswordStrength): string {
  if (strength === "Lemah") return "Tambahkan huruf besar, angka, atau simbol.";
  if (strength === "Sedang")
    return "Untuk lebih kuat, gunakan minimal 12 karakter dan 3 jenis karakter.";
  return "Password sudah kuat.";
}
