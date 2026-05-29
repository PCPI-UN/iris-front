import { api } from "@/lib/api-client";
import { Input } from "@heroui/input";
import { SearchIcon } from "lucide-react";

export const SearchProjects = ({eventId, 
  state, 
  categoryId, 
  setSearchResults, 
  setIsSearching, 
  setFilterValue, 
  filterValue}: {
  eventId: number, 
  state: string, 
  categoryId?: number | undefined, 
  setSearchResults: (results: any[]) => void, 
  setIsSearching: (isSearching: boolean) => void, 
  setFilterValue: (filterValue: string) => void, 
  filterValue: string}) => {

  const fetchAllProjects = async () => {
    if (!eventId) return [];
  
    let currentPage = 1;
    let totalPages = 1;
    let allProjects: any[] = [];
  
    while (currentPage <= totalPages) {
      const response: { items: any[]; limit: number; page: number; totalPages: number } =
        await api.get(
          `/projects/by-event/${eventId}/with-jurors`,
          {
            params: {
              currentPage: currentPage,
              state: state,
              courseId: categoryId,
            },
          }
        );
  
      allProjects = [
        ...allProjects,
        ...(response.items ?? []),
      ];
  
      totalPages = response.totalPages ?? 1;
      currentPage++;
    }
    const uniqueProjects = Array.from(
      new Map(allProjects.map((item) => [item.id, item])).values()
    );
    return uniqueProjects;
  };
  
  const onSearchChange = async (value?: string) => {
    setFilterValue(value || "");
    if (!value) {
      setSearchResults([]);
      return;
    }
  
    setIsSearching(true);
    try {
      const allProjects = await fetchAllProjects();
      const filtered = allProjects.filter((project) =>
        project.name
          ?.toLowerCase()
          .includes(value.toLowerCase())
      );
  
      setSearchResults(filtered);
    } finally {
      setIsSearching(false);
    }
  };
  return (
    <Input
      isClearable      
      startContent={<SearchIcon />}
      placeholder="Buscar proyecto..."
      value={filterValue}
      onClear={() => {
        setFilterValue("");
        setSearchResults([]);
      }}
      onValueChange={onSearchChange}
    />
  );
};