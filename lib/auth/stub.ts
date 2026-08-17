// Stub authentication configuration - used when NextAuth is not available

export const stubAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/error",
  },
};

export async function stubAuthHandler(req: any, res: any) {
  // Return 501 Not Implemented for auth endpoints when not configured
  return new Response(
    JSON.stringify({
      error: "Authentication not configured",
      message: "NextAuth is not installed. Please configure NEXTAUTH environment variables.",
    }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    }
  );
}
