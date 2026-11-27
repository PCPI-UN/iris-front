import { Input } from "@heroui/input";
import { UserSearch } from "lucide-react";

export const JurorSearchInput = ({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) => (
  <Input
    isClearable
    aria-label="Buscar por jurado"
    placeholder="Buscar por jurado..."
    startContent={<UserSearch />}
    value={value}
    onClear={() => onValueChange("")}
    onValueChange={onValueChange}
  />
);
