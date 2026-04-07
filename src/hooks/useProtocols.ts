import { useQuery } from "@tanstack/react-query";
import { fetchUserProtocols, fetchUserProtocolCount } from "@/services/protocolService";
import { useAuth } from "@/hooks/useAuth";

export function useUserProtocols() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["protocols", user?.id],
    queryFn: () => fetchUserProtocols(user!.id),
    enabled: !!user,
  });
}

export function useUserProtocolCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["protocols-count", user?.id],
    queryFn: () => fetchUserProtocolCount(user!.id),
    enabled: !!user,
  });
}
