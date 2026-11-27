import { Input } from "@heroui/input";
import { SearchIcon } from "lucide-react";

/** Project-name search of Asignaciones; the backend filters with `q` */
export const ProjectSearchInput = ({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) => (
  <Input
    isClearable
    aria-label="Buscar proyecto"
    placeholder="Buscar proyecto..."
    startContent={<SearchIcon />}
    value={value}
    onClear={() => onValueChange("")}
    onValueChange={onValueChange}
  />
);
