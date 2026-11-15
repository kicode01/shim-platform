import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      avatarIcon?: string | null;
      canEditProfile?: boolean;
    };
  }

  interface User {
    id: string;
    role?: string;
  }
}
