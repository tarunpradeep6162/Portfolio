// NextAuth configuration - Stub for build

// Stub types when NextAuth is not installed
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async authorized({ auth, request }: any) {
      return !!auth;
    },
  },
};

export default authConfig;
