import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useSession } from "./useSession";

vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe("useSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session when getSession resolves with one", async () => {
    const { supabase } = await import("./supabase");
    const session = { user: { email: "test@example.com" } };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session },
    } as never);
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as never);

    const { result } = renderHook(() => useSession());

    expect(result.current.loading).toBe(true);
    expect(result.current.session).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.session).toEqual(session);
    });
  });

  it("returns null session when getSession resolves with none", async () => {
    const { supabase } = await import("./supabase");

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as never);
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as never);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.session).toBeNull();
    });
  });

  it("unsubscribes from auth changes on unmount", async () => {
    const { supabase } = await import("./supabase");
    const unsubscribe = vi.fn();

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as never);
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe } },
    } as never);

    const { unmount } = renderHook(() => useSession());
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
