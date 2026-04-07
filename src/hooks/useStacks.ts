import { useQuery } from "@tanstack/react-query";
import { fetchStacks } from "@/services/stackService";

export function useStacks() {
  return useQuery({
    queryKey: ["stacks"],
    queryFn: fetchStacks,
  });
}
